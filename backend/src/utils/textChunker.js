export const chunkText = (text, options = {}) => {
  const {
    maxChunkSize = 600, // characters per chunk
    overlap = 100,      // overlap characters between chunks
    splitOn = ['\n\n', '\n', '. ', '? ', '! ']
  } = options;

  if (!text || typeof text !== 'string') {
    return [];
  }

  const cleanText = text.replace(/\r\n/g, '\n').trim();
  if (cleanText.length <= maxChunkSize) {
    return [{
      chunkIndex: 0,
      chunkText: cleanText,
      tokenCount: Math.ceil(cleanText.length / 4)
    }];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < cleanText.length) {
    let endIndex = startIndex + maxChunkSize;

    if (endIndex >= cleanText.length) {
      const finalChunk = cleanText.substring(startIndex).trim();
      if (finalChunk.length > 20) {
        chunks.push({
          chunkIndex,
          chunkText: finalChunk,
          tokenCount: Math.ceil(finalChunk.length / 4)
        });
      }
      break;
    }

    // Try finding the best boundary split near the end
    let bestSplitIndex = -1;
    const windowSub = cleanText.substring(startIndex, endIndex);

    for (const delimiter of splitOn) {
      const idx = windowSub.lastIndexOf(delimiter);
      if (idx > maxChunkSize * 0.5) {
        bestSplitIndex = startIndex + idx + delimiter.length;
        break;
      }
    }

    if (bestSplitIndex === -1) {
      bestSplitIndex = endIndex;
    }

    const chunkContent = cleanText.substring(startIndex, bestSplitIndex).trim();
    if (chunkContent.length > 20) {
      chunks.push({
        chunkIndex,
        chunkText: chunkContent,
        tokenCount: Math.ceil(chunkContent.length / 4)
      });
      chunkIndex++;
    }

    startIndex = Math.max(bestSplitIndex - overlap, startIndex + 1);
  }

  return chunks;
};
