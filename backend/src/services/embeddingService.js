import { getGeminiClient, hasGeminiApiKey } from '../config/gemini.js';
import { ENV } from '../config/env.js';

// Target embedding dimension (Matryoshka Representation Learning dimension)
export const EMBEDDING_DIMENSION = 768;

// In-Memory LRU-style cache for generated embeddings (Key: trimmed text, Value: embedding vector)
const EMBEDDING_CACHE = new Map();
const MAX_CACHE_SIZE = 2000;

const getCacheKey = (text) => text.toLowerCase().trim();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Checks if an error is an HTTP 429 / RESOURCE_EXHAUSTED / Quota limit or transient 503 error.
 */
export const isRateLimitOrQuotaError = (error) => {
  if (!error) return false;

  const status = error.status || error.statusCode || error.code || error.originalError?.status || error.originalError?.code;
  if (status === 429 || status === 503 || status === 'RESOURCE_EXHAUSTED' || status === 'UNAVAILABLE') {
    return true;
  }

  const message = String(error.message || error.originalError?.message || error).toLowerCase();
  return (
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('rate limit') ||
    message.includes('rate_limit') ||
    message.includes('too many requests') ||
    message.includes('quota_exceeded') ||
    message.includes('econnreset') ||
    message.includes('etimedout')
  );
};

/**
 * Calculates exponential backoff delay with random jitter.
 * Formula: Math.min(maxDelayMs, baseDelayMs * 2^attempt + jitter)
 */
export const calculateBackoffDelay = (attempt, baseDelayMs = 2000, maxDelayMs = 45000, jitterMaxMs = 1500) => {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * jitterMaxMs);
  return Math.min(maxDelayMs, exponential + jitter);
};

/**
 * Vector L2 normalization helper
 */
export const normalizeVector = (vec) => {
  if (!Array.isArray(vec) || vec.length === 0) return [];
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((val) => Number((val / norm).toFixed(6)));
};

/**
 * Isolated deterministic mock vector generator FOR UNIT TESTS ONLY
 * Production RAG retrieval must NOT use this fallback.
 */
export const generateMockTestEmbedding = (text, dim = EMBEDDING_DIMENSION) => {
  const vec = new Array(dim).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return vec;
  }

  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1.0 + (wIdx * 0.01);
  }

  return normalizeVector(vec);
};

/**
 * Helper to execute an async API operation with exponential backoff & jitter on 429 quota errors.
 */
const callWithRetry = async (operationFn, operationName = 'Gemini Embedding API', maxRetries = 5) => {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operationFn();
    } catch (error) {
      lastError = error;

      if (!isRateLimitOrQuotaError(error) || attempt === maxRetries) {
        throw error;
      }

      const delayMs = calculateBackoffDelay(attempt);
      console.warn(
        `⚠️ [EmbeddingService] Rate limit / quota hit (429 RESOURCE_EXHAUSTED) during ${operationName}. ` +
        `Attempt ${attempt + 1}/${maxRetries}. Backing off for ${(delayMs / 1000).toFixed(1)}s before retry...`
      );

      await sleep(delayMs);
      console.log(`🔄 [EmbeddingService] Retrying ${operationName} (Attempt ${attempt + 1}/${maxRetries})...`);
    }
  }

  throw lastError;
};

/**
 * Generate embedding for a single text using Google Gemini API with caching and retry.
 *
 * @param {string} text - Text to embed
 * @param {string|null} taskType - Optional task type (e.g. 'RETRIEVAL_QUERY', 'RETRIEVAL_DOCUMENT')
 * @returns {Promise<number[]>} - 768-dimensional normalized embedding vector
 */
export const generateEmbedding = async (text, taskType = null) => {
  if (!text || typeof text !== 'string') {
    throw new Error('[EmbeddingService] Text input must be a non-empty string');
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    throw new Error('[EmbeddingService] Text input cannot be blank');
  }

  const cacheKey = getCacheKey(cleanText);
  if (EMBEDDING_CACHE.has(cacheKey)) {
    return EMBEDDING_CACHE.get(cacheKey);
  }

  if (!hasGeminiApiKey()) {
    const errMessage = '[EmbeddingService] GEMINI_API_KEY is not configured. Cannot generate vector embeddings in production.';
    console.error(`❌ ${errMessage}`);
    const err = new Error(errMessage);
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const client = getGeminiClient();
  if (!client) {
    const errMessage = '[EmbeddingService] Gemini AI client is unavailable.';
    console.error(`❌ ${errMessage}`);
    const err = new Error(errMessage);
    err.code = 'CLIENT_UNAVAILABLE';
    throw err;
  }

  try {
    const config = {
      outputDimensionality: EMBEDDING_DIMENSION
    };
    if (taskType) {
      config.taskType = taskType;
    }

    const response = await callWithRetry(
      () =>
        client.models.embedContent({
          model: ENV.GEMINI_EMBEDDING_MODEL,
          contents: cleanText,
          config
        }),
      `generateEmbedding("${cleanText.substring(0, 30)}...")`
    );

    let rawValues = null;
    if (response?.embedding?.values) {
      rawValues = response.embedding.values;
    } else if (response?.embeddings?.[0]?.values) {
      rawValues = response.embeddings[0].values;
    }

    if (!rawValues || !Array.isArray(rawValues) || rawValues.length === 0) {
      throw new Error(`Invalid response structure from Gemini Embedding API (${ENV.GEMINI_EMBEDDING_MODEL})`);
    }

    if (rawValues.length > EMBEDDING_DIMENSION) {
      rawValues = rawValues.slice(0, EMBEDDING_DIMENSION);
    }

    const normalizedEmbedding = normalizeVector(rawValues);

    // Save to LRU cache
    if (EMBEDDING_CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = EMBEDDING_CACHE.keys().next().value;
      EMBEDDING_CACHE.delete(firstKey);
    }
    EMBEDDING_CACHE.set(cacheKey, normalizedEmbedding);

    return normalizedEmbedding;
  } catch (error) {
    const errMessage = `[EmbeddingService] Gemini Embedding API failure (${ENV.GEMINI_EMBEDDING_MODEL}): ${error.message}`;
    console.error(`❌ ${errMessage}`);
    const err = new Error(errMessage);
    err.code = 'AI_EMBEDDING_API_ERROR';
    err.originalError = error;
    throw err;
  }
};

/**
 * Batch generate embeddings for multiple text chunks using native SDK batching,
 * rate limiting pacing, LRU cache deduplication, and exponential backoff retry.
 *
 * @param {string[]} textArray - Array of text strings to embed
 * @param {string|null} taskType - Optional task type (e.g. 'RETRIEVAL_DOCUMENT')
 * @param {Object} options - Optional configuration (batchSize, delayBetweenBatchesMs, maxRetries)
 * @returns {Promise<number[][]>} - Array of 768-dimensional normalized embedding vectors
 */
export const generateBatchEmbeddings = async (textArray, taskType = null, options = {}) => {
  if (!Array.isArray(textArray) || textArray.length === 0) {
    return [];
  }

  const {
    batchSize = 16,
    delayBetweenBatchesMs = 1500,
    maxRetries = 5
  } = options;

  if (!hasGeminiApiKey()) {
    const errMessage = '[EmbeddingService] GEMINI_API_KEY is not configured. Cannot generate vector embeddings in production.';
    console.error(`❌ ${errMessage}`);
    const err = new Error(errMessage);
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const client = getGeminiClient();
  if (!client) {
    const errMessage = '[EmbeddingService] Gemini AI client is unavailable.';
    console.error(`❌ ${errMessage}`);
    const err = new Error(errMessage);
    err.code = 'CLIENT_UNAVAILABLE';
    throw err;
  }

  const results = new Array(textArray.length);
  const uncachedItems = [];

  // 1. Check in-memory cache for all input texts
  for (let i = 0; i < textArray.length; i++) {
    const text = typeof textArray[i] === 'string' ? textArray[i].trim() : '';
    if (!text) {
      results[i] = new Array(EMBEDDING_DIMENSION).fill(0);
      continue;
    }

    const cacheKey = getCacheKey(text);
    if (EMBEDDING_CACHE.has(cacheKey)) {
      results[i] = EMBEDDING_CACHE.get(cacheKey);
    } else {
      uncachedItems.push({ originalIndex: i, text, cacheKey });
    }
  }

  // If all items were cached, return immediately with zero API calls
  if (uncachedItems.length === 0) {
    return results;
  }

  const totalBatches = Math.ceil(uncachedItems.length / batchSize);
  console.log(
    `📊 [EmbeddingService] Generating embeddings for ${textArray.length} items ` +
    `(${textArray.length - uncachedItems.length} cached, ${uncachedItems.length} uncached across ${totalBatches} batch(es))...`
  );

  // 2. Process uncached items in batches
  const config = {
    outputDimensionality: EMBEDDING_DIMENSION
  };
  if (taskType) {
    config.taskType = taskType;
  }

  for (let b = 0; b < totalBatches; b++) {
    const batchSlice = uncachedItems.slice(b * batchSize, (b + 1) * batchSize);
    const batchTexts = batchSlice.map((item) => item.text);

    try {
      const response = await callWithRetry(
        () =>
          client.models.embedContent({
            model: ENV.GEMINI_EMBEDDING_MODEL,
            contents: batchTexts,
            config
          }),
        `Batch ${b + 1}/${totalBatches} (${batchTexts.length} chunks)`,
        maxRetries
      );

      let returnedEmbeddings = [];
      if (Array.isArray(response?.embeddings)) {
        returnedEmbeddings = response.embeddings;
      } else if (response?.embedding?.values) {
        returnedEmbeddings = [response.embedding];
      }

      if (returnedEmbeddings.length !== batchTexts.length) {
        throw new Error(
          `Batch count mismatch: sent ${batchTexts.length} chunks, received ${returnedEmbeddings.length} embeddings`
        );
      }

      for (let i = 0; i < batchSlice.length; i++) {
        let rawValues = returnedEmbeddings[i]?.values;
        if (!rawValues || !Array.isArray(rawValues) || rawValues.length === 0) {
          throw new Error(`Invalid embedding values for chunk index ${batchSlice[i].originalIndex}`);
        }

        if (rawValues.length > EMBEDDING_DIMENSION) {
          rawValues = rawValues.slice(0, EMBEDDING_DIMENSION);
        }

        const normalized = normalizeVector(rawValues);

        // Store in cache
        if (EMBEDDING_CACHE.size >= MAX_CACHE_SIZE) {
          const firstKey = EMBEDDING_CACHE.keys().next().value;
          EMBEDDING_CACHE.delete(firstKey);
        }
        EMBEDDING_CACHE.set(batchSlice[i].cacheKey, normalized);

        // Place in results array at exact original index
        results[batchSlice[i].originalIndex] = normalized;
      }

      console.log(`  ✅ [EmbeddingService] Batch ${b + 1}/${totalBatches} processed (${batchTexts.length} chunks embedded).`);

      // Rate limit pacing: delay before next batch request if more remain
      if (b < totalBatches - 1 && delayBetweenBatchesMs > 0) {
        await sleep(delayBetweenBatchesMs);
      }
    } catch (error) {
      const errMessage = `[EmbeddingService] Batch embedding API failure (${ENV.GEMINI_EMBEDDING_MODEL}): ${error.message}`;
      console.error(`❌ ${errMessage}`);
      const err = new Error(errMessage);
      err.code = 'AI_EMBEDDING_API_ERROR';
      err.originalError = error;
      throw err;
    }
  }

  return results;
};

export const clearEmbeddingCache = () => {
  EMBEDDING_CACHE.clear();
};
