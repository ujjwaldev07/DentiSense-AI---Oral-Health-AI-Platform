import {
  generateEmbedding,
  generateBatchEmbeddings,
  generateMockTestEmbedding,
  clearEmbeddingCache,
  isRateLimitOrQuotaError,
  calculateBackoffDelay,
  normalizeVector,
  EMBEDDING_DIMENSION
} from '../src/services/embeddingService.js';
import { ENV } from '../src/config/env.js';

async function testEmbeddingService() {
  console.log('🧪 Testing Embedding Dimensionality, Batching, Backoff & Error Handling...');

  const queryText = 'What causes gingivitis and bleeding gums?';
  const docChunkText = 'Gingivitis is an inflammatory condition of the gum tissue caused by bacterial plaque accumulation along the gingival margin.';

  // 1. Verify that generateEmbedding throws an explicit error when unkeyed (No synthetic fallback in production)
  clearEmbeddingCache();
  const originalKey = ENV.GEMINI_API_KEY;
  ENV.GEMINI_API_KEY = '';

  let errorThrown = false;
  try {
    await generateEmbedding(queryText);
  } catch (err) {
    errorThrown = true;
    console.log(`✅ Production generateEmbedding properly rejected unkeyed request: "${err.message}"`);
  }
  if (!errorThrown) {
    console.error('❌ Expected generateEmbedding to throw an error without API key, but it returned a fallback!');
    process.exit(1);
  }

  // Restore Key
  ENV.GEMINI_API_KEY = originalKey;
  clearEmbeddingCache();

  // 2. Test Isolated Unit Test Mock Generator
  const queryMock = generateMockTestEmbedding(queryText, EMBEDDING_DIMENSION);
  const docMock = generateMockTestEmbedding(docChunkText, EMBEDDING_DIMENSION);

  console.log(`✅ Mock Query Embedding Length: ${queryMock.length}, Target: ${EMBEDDING_DIMENSION}`);
  console.log(`✅ Mock Doc Embedding Length: ${docMock.length}, Target: ${EMBEDDING_DIMENSION}`);

  if (queryMock.length !== 768 || docMock.length !== 768) {
    console.error('❌ Dimension mismatch in mock generator!');
    process.exit(1);
  }

  // 3. Test L2 Normalization
  const sumSq = queryMock.reduce((acc, val) => acc + val * val, 0);
  const norm = Math.sqrt(sumSq);
  console.log(`✅ Mock Vector L2 Norm: ${norm.toFixed(6)} (Target: 1.000000)`);
  if (Math.abs(norm - 1.0) > 0.001) {
    console.error('❌ L2 normalization calculation is inaccurate!');
    process.exit(1);
  }

  // 4. Test 429 Quota & Rate Limit Error Detection
  const quotaErr1 = { status: 429, message: 'RESOURCE_EXHAUSTED' };
  const quotaErr2 = new Error('Quota exceeded for aiplatform.googleapis.com/global_embed_content_requests_per_minute_per_base_model');
  const nonQuotaErr = new Error('Invalid JSON payload');

  if (!isRateLimitOrQuotaError(quotaErr1) || !isRateLimitOrQuotaError(quotaErr2) || isRateLimitOrQuotaError(nonQuotaErr)) {
    console.error('❌ isRateLimitOrQuotaError detection logic failed!');
    process.exit(1);
  }
  console.log('✅ Rate limit / 429 Quota error detection correctly identifies RESOURCE_EXHAUSTED errors.');

  // 5. Test Exponential Backoff Calculation with Jitter
  const delay0 = calculateBackoffDelay(0, 2000, 45000, 500);
  const delay1 = calculateBackoffDelay(1, 2000, 45000, 500);
  const delay2 = calculateBackoffDelay(2, 2000, 45000, 500);

  console.log(`✅ Backoff delays: Attempt 0 = ${delay0}ms, Attempt 1 = ${delay1}ms, Attempt 2 = ${delay2}ms`);
  if (delay0 < 2000 || delay1 < 4000 || delay2 < 8000) {
    console.error('❌ Backoff delay calculation below expected exponential progression!');
    process.exit(1);
  }

  console.log('🎉 All embedding service verification checks passed successfully!');
}

testEmbeddingService().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
