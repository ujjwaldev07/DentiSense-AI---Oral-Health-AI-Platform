export const calculateCosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  const length = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const rankBySimilarity = (queryEmbedding, documentsWithChunks, topK = 4) => {
  const scoredChunks = [];
  const seenTexts = new Set();

  for (const doc of documentsWithChunks) {
    if (!doc.chunks || !Array.isArray(doc.chunks)) continue;

    for (const chunk of doc.chunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) continue;

      const score = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
      if (score > 0.28) {
        // Quick deduplication signature
        const textKey = (chunk.chunkText || '').trim().substring(0, 80).toLowerCase();
        if (!seenTexts.has(textKey)) {
          seenTexts.add(textKey);
          scoredChunks.push({
            documentId: doc._id,
            title: doc.title,
            category: doc.category,
            slug: doc.slug,
            sourceUrl: doc.sourceReference?.url || '',
            organization: doc.sourceReference?.organization || 'Dental Health Institute',
            chunkText: chunk.chunkText,
            relevanceScore: Number(score.toFixed(4))
          });
        }
      }
    }
  }

  // Sort descending by score
  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return unique topK best matching chunks
  return scoredChunks.slice(0, topK);
};
