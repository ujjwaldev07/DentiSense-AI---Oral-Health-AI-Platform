import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { generateEmbedding, generateBatchEmbeddings, generateMockTestEmbedding, EMBEDDING_DIMENSION } from './embeddingService.js';
import { chunkText } from '../utils/textChunker.js';
import { rankBySimilarity } from '../utils/cosineSimilarity.js';
import { ENV } from '../config/env.js';

export const processAndIndexDocument = async (doc, options = {}) => {
  const { onProgress } = options;
  const fullTextToChunk = `${doc.title}\n\nCategory: ${doc.category}\n\nSummary: ${doc.summary}\n\nContent:\n${doc.content}\n\nPreventive Tips:\n${(doc.preventiveTips || []).join('\n')}\n\nWarning Signs:\n${(doc.warningSigns || []).join('\n')}`;

  const rawChunks = chunkText(fullTextToChunk, { maxChunkSize: 500, overlap: 80 });
  if (onProgress) {
    onProgress({
      step: 'chunking',
      stepLabel: `Created ${rawChunks.length} semantic clinical chunks`,
      chunkCount: rawChunks.length,
      progress: 35
    });
  }

  if (rawChunks.length === 0) {
    doc.chunks = [];
    await doc.save();
    if (onProgress) onProgress({ step: 'completed', stepLabel: 'Indexed successfully', progress: 100, chunkCount: 0 });
    return doc;
  }

  // Check if existing chunks already have valid embeddings that can be reused
  const existingChunks = Array.isArray(doc.chunks) ? doc.chunks : [];
  const existingChunkMap = new Map();
  for (const c of existingChunks) {
    if (c.chunkText && Array.isArray(c.embedding) && c.embedding.length === EMBEDDING_DIMENSION) {
      existingChunkMap.set(c.chunkText.trim(), c.embedding);
    }
  }

  const missingChunkTexts = [];
  const missingIndices = [];
  const embeddings = new Array(rawChunks.length);

  for (let i = 0; i < rawChunks.length; i++) {
    const textKey = rawChunks[i].chunkText.trim();
    if (existingChunkMap.has(textKey) && !options.forceReindex) {
      embeddings[i] = existingChunkMap.get(textKey);
    } else {
      missingIndices.push(i);
      missingChunkTexts.push(rawChunks[i].chunkText);
    }
  }

  if (missingChunkTexts.length === 0) {
    console.log(`⏩ [Document Indexing] Reusing ${rawChunks.length} existing valid embeddings for "${doc.title}"`);
    if (onProgress) {
      onProgress({
        step: 'embedding',
        stepLabel: `Reused ${rawChunks.length} cached vector embeddings`,
        chunkCount: rawChunks.length,
        progress: 75
      });
    }
  } else {
    if (onProgress) {
      onProgress({
        step: 'embedding',
        stepLabel: `Generating 768-dim Gemini vector embeddings for ${missingChunkTexts.length} chunks...`,
        chunkCount: rawChunks.length,
        progress: 60
      });
    }

    let generatedMissing = [];
    try {
      generatedMissing = await generateBatchEmbeddings(missingChunkTexts, 'RETRIEVAL_DOCUMENT');
    } catch (err) {
      console.error(`[Document Indexing] Embedding generation error for "${doc.title}":`, err.message);
      if (process.env.NODE_ENV === 'test' || !process.env.GEMINI_API_KEY) {
        generatedMissing = missingChunkTexts.map(t => generateMockTestEmbedding(t));
      } else {
        throw err;
      }
    }

    for (let m = 0; m < missingIndices.length; m++) {
      embeddings[missingIndices[m]] = generatedMissing[m] || [];
    }
  }

  if (onProgress) {
    onProgress({
      step: 'storing',
      stepLabel: 'Indexing chunks and embeddings into MongoDB Atlas...',
      chunkCount: rawChunks.length,
      progress: 88
    });
  }

  const indexedChunks = rawChunks.map((chunk, idx) => ({
    chunkIndex: chunk.chunkIndex,
    chunkText: chunk.chunkText,
    tokenCount: chunk.tokenCount,
    embedding: embeddings[idx] || []
  }));

  doc.chunks = indexedChunks;
  await doc.save();

  if (onProgress) {
    onProgress({
      step: 'completed',
      stepLabel: 'Knowledge document indexed and live in AI Assistant knowledge base!',
      chunkCount: indexedChunks.length,
      progress: 100
    });
  }

  return doc;
};

export const reindexDocument = async (documentId, options = {}) => {
  const doc = await KnowledgeDocument.findById(documentId);
  if (!doc) throw new Error('Document not found');
  return processAndIndexDocument(doc, { forceReindex: true, ...options });
};

export const reindexAllDocuments = async (options = {}) => {
  const docs = await KnowledgeDocument.find({ isPublished: true });
  let count = 0;
  for (const doc of docs) {
    await processAndIndexDocument(doc, options);
    count++;
  }
  return { totalReindexed: count };
};

/**
 * Retrieve relevant dental knowledge using real vector embeddings or structured fallback.
 * Strictly avoids synthetic vector search if embedding generation fails.
 */
export const retrieveRelevantDentalKnowledge = async (queryText, options = {}) => {
  const { topK = 3, language = 'en', category, skipRAG = false } = options;
  const startTime = Date.now();

  if (skipRAG) {
    return {
      contextText: '',
      sources: [],
      latencyMs: Date.now() - startTime,
      isLowConfidence: false,
      failureType: null,
      searchMethod: 'skipped_by_classifier'
    };
  }

  if (!queryText || queryText.trim().length === 0) {
    return {
      contextText: '',
      sources: [],
      latencyMs: 0,
      isLowConfidence: true,
      failureType: null
    };
  }

  // Safety filter: Only retrieve Oral Cancer documents if query explicitly mentions oral sores, ulcers, cancer, or lesions
  const queryMentionsCancerOrUlcer = /\b(cancer|tumor|malignan|carcinoma|ulcer|lesion|leukoplakia|erythroplakia|biopsy|white\s*patch|red\s*patch|sore|छाला|कर्क|अल्सर)\b/i.test(queryText);

  let queryEmbedding = null;
  let embeddingError = null;

  try {
    queryEmbedding = await generateEmbedding(queryText, 'RETRIEVAL_QUERY');
  } catch (err) {
    embeddingError = err.message;
    console.error(`[RAG Retrieval] Vector retrieval aborted for query: "${queryText.substring(0, 30)}..." | Reason: ${embeddingError}`);
  }

  // 1. If Gemini embedding generation succeeded, perform Vector Search
  if (queryEmbedding && Array.isArray(queryEmbedding) && queryEmbedding.length > 0) {
    // 1A. Try MongoDB Atlas Vector Search
    try {
      if (process.env.USE_ATLAS_VECTOR_SEARCH === 'true') {
        const matchStage = { isPublished: true };
        if (!queryMentionsCancerOrUlcer) {
          matchStage.category = { $ne: 'Oral Cancer Awareness & Red Flags' };
        }
        if (category) {
          matchStage.category = category;
        }

        const pipeline = [
          {
            $vectorSearch: {
              index: ENV.ATLAS_VECTOR_INDEX_NAME,
              path: 'chunks.embedding',
              queryVector: queryEmbedding,
              numCandidates: 20,
              limit: topK
            }
          },
          { $match: matchStage },
          {
            $project: {
              title: 1,
              category: 1,
              slug: 1,
              summary: 1,
              sourceReference: 1,
              chunks: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ];

        const atlasResults = await KnowledgeDocument.aggregate(pipeline);
        if (atlasResults && atlasResults.length > 0) {
          const sources = atlasResults.map(r => ({
            documentId: r._id,
            title: r.title,
            category: r.category,
            sourceUrl: r.sourceReference?.url || '',
            organization: r.sourceReference?.organization || 'Dental Health Institute',
            relevanceScore: Number((r.score || 0.85).toFixed(4))
          }));

          const docIds = atlasResults.map(r => r._id);
          KnowledgeDocument.updateMany({ _id: { $in: docIds } }, { $inc: { retrievalCount: 1 } }).catch(() => {});

          const contextText = `<retrieved_dental_context>\n` + atlasResults.map(r => `[Source: ${r.title} - ${r.category}]\n${r.summary}\n${(r.chunks || []).map(c => c.chunkText).join('\n')}`).join('\n\n---\n\n') + `\n</retrieved_dental_context>`;

          return {
            contextText,
            sources,
            latencyMs: Date.now() - startTime,
            isLowConfidence: false,
            failureType: null,
            searchMethod: 'atlas_vector_search'
          };
        }
      }
    } catch (atlasErr) {
      console.warn('[RAG Retrieval] Atlas vector search fallback to in-memory cosine ranking:', atlasErr.message);
    }

    // 1B. In-Memory Cosine Vector Ranking on existing embedded documents
    const filter = { isPublished: true };
    if (!queryMentionsCancerOrUlcer) {
      filter.category = { $ne: 'Oral Cancer Awareness & Red Flags' };
    }
    if (category) filter.category = category;

    const documents = await KnowledgeDocument.find(filter)
      .select('title category slug summary chunks sourceReference language')
      .lean();

    if (documents && documents.length > 0) {
      const rankedChunks = rankBySimilarity(queryEmbedding, documents, topK);

      // Enforce stricter cosine similarity relevance cutoff (0.42) to avoid irrelevant matches
      if (rankedChunks.length > 0 && rankedChunks[0].relevanceScore >= 0.42) {
        const uniqueSourcesMap = new Map();
        const docIds = [];

        for (const chunk of rankedChunks) {
          if (!uniqueSourcesMap.has(String(chunk.documentId))) {
            uniqueSourcesMap.set(String(chunk.documentId), {
              documentId: chunk.documentId,
              title: chunk.title,
              category: chunk.category,
              sourceUrl: chunk.sourceUrl,
              organization: chunk.organization,
              relevanceScore: chunk.relevanceScore
            });
            docIds.push(chunk.documentId);
          }
        }

        KnowledgeDocument.updateMany({ _id: { $in: docIds } }, { $inc: { retrievalCount: 1 } }).catch(() => {});

        const contextText = `<retrieved_dental_context>\n` + rankedChunks
          .map(c => `[Source: ${c.title} (${c.category})]\n${c.chunkText}`)
          .join('\n\n---\n\n') + `\n</retrieved_dental_context>`;

        return {
          contextText,
          sources: Array.from(uniqueSourcesMap.values()),
          latencyMs: Date.now() - startTime,
          isLowConfidence: false,
          failureType: null,
          searchMethod: 'cosine_vector_search'
        };
      }
    }
  }

  // 2. Keyword fallback search (Used only if vector search yields no matches or embedding failed)
  const filter = { isPublished: true };
  if (!queryMentionsCancerOrUlcer) {
    filter.category = { $ne: 'Oral Cancer Awareness & Red Flags' };
  }
  if (category) filter.category = category;

  const documents = await KnowledgeDocument.find(filter)
    .select('title category slug summary sourceReference language')
    .lean();

  if (documents && documents.length > 0) {
    // Ignore generic query words that would match everything
    const stopWords = new Set(['what', 'exact', 'dental', 'diagnosis', 'condition', 'based', 'only', 'this', 'message', 'have', 'your', 'with', 'from', 'about', 'give', 'tell']);
    const keywords = queryText.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
    const textMatches = (keywords.length > 0)
      ? documents.filter(doc => {
          const docString = `${doc.title} ${doc.summary} ${doc.category}`.toLowerCase();
          return keywords.some(k => docString.includes(k));
        }).slice(0, topK)
      : [];

    if (textMatches.length > 0) {
      const sources = textMatches.map(doc => ({
        documentId: doc._id,
        title: doc.title,
        category: doc.category,
        sourceUrl: doc.sourceReference?.url || '',
        organization: doc.sourceReference?.organization || 'Dental Health Institute',
        relevanceScore: 0.70
      }));

      const docIds = textMatches.map(d => d._id);
      KnowledgeDocument.updateMany({ _id: { $in: docIds } }, { $inc: { retrievalCount: 1 } }).catch(() => {});

      const contextText = `<retrieved_dental_context>\n` + textMatches.map(doc => `[Source: ${doc.title} (${doc.category})]\n${doc.summary}`).join('\n\n---\n\n') + `\n</retrieved_dental_context>`;
      return {
        contextText,
        sources,
        latencyMs: Date.now() - startTime,
        isLowConfidence: false,
        failureType: embeddingError ? 'ai_embedding_failure_with_keyword_fallback' : null,
        embeddingError,
        searchMethod: 'keyword_fallback'
      };
    }
  }

  // 3. Complete retrieval failure or out of scope
  return {
    contextText: '',
    sources: [],
    latencyMs: Date.now() - startTime,
    isLowConfidence: true,
    failureType: embeddingError ? 'ai_embedding_failure' : 'retrieval_no_match',
    embeddingError,
    searchMethod: 'none'
  };
};
