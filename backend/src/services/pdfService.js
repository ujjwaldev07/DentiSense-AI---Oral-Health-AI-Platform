import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Extract clean text content from a PDF Buffer using pdf-parse.
 * @param {Buffer|Uint8Array} pdfBuffer - Raw PDF file buffer
 * @returns {Promise<{text: string, numPages: number}>}
 */
export const extractTextFromPdf = async (pdfBuffer) => {
  if (!pdfBuffer || (!Buffer.isBuffer(pdfBuffer) && !(pdfBuffer instanceof Uint8Array))) {
    throw new Error('[PDFService] Invalid PDF buffer provided');
  }

  try {
    const pdfModule = require('pdf-parse');
    let rawText = '';
    let numPages = 1;

    // Convert Buffer to pure Uint8Array for pdf-parse v2 compatibility
    const uint8 = Buffer.isBuffer(pdfBuffer)
      ? new Uint8Array(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength))
      : pdfBuffer;

    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse(uint8);
      await parser.load();
      const result = await parser.getText();
      rawText = result?.text || (Array.isArray(result?.pages) ? result.pages.map(p => p.text).join('\n\n') : '');
      numPages = result?.total || result?.pages?.length || 1;
    } else if (typeof pdfModule === 'function') {
      const result = await pdfModule(uint8);
      rawText = result.text || '';
      numPages = result.numpages || 1;
    } else {
      throw new Error('Unsupported pdf-parse library structure');
    }

    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/-- \d+ of \d+ --/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText || cleanText.length < 20) {
      throw new Error('No readable text found in PDF. The document may be an image-only scan or encrypted. Please upload a searchable PDF.');
    }

    return {
      text: cleanText,
      numPages: Math.max(1, numPages)
    };
  } catch (error) {
    if (error.message.includes('Password') || error.message.includes('encrypted')) {
      throw new Error('This PDF is password protected or encrypted. Please remove password protection before uploading.');
    }
    throw new Error(`[PDFService] ${error.message}`);
  }
};
