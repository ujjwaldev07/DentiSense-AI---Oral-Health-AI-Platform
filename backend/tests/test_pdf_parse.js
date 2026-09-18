import { extractTextFromPdf } from '../src/services/pdfService.js';

// Minimal valid single-page PDF containing dental caries text
function createMinimalPdfBuffer(text) {
  const contentStream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000343 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
424
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

async function testPdf() {
  const sampleText = 'Dental Caries and Cavity Prevention Guidelines 2026';
  const buf = createMinimalPdfBuffer(sampleText);
  console.log('Testing PDF Extraction...');
  const result = await extractTextFromPdf(buf);
  console.log('Extracted Text:', result.text);
  console.log('Num pages:', result.numPages);
}

testPdf().catch(console.error);
