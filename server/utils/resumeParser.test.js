const assert = require('node:assert/strict');
const {
  extractTextFromBuffer,
  parseResumeTextRuleBased
} = require('./resumeParser');

const minimalPdf = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
  '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
  '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] ' +
  '/Contents 4 0 R /Resources << >> >>\nendobj\n' +
  '4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 20 100 Td (Jane Doe) Tj ET\nendstream\nendobj\n' +
  'trailer\n<< /Root 1 0 R >>\n%%EOF\n',
  'latin1'
);

async function run() {
  const text = await extractTextFromBuffer(
    minimalPdf,
    'application/pdf'
  );

  assert.match(text, /Jane Doe/);

  const parsed = parseResumeTextRuleBased(
    'Jane Doe\nSoftware Engineer\njane@example.com\nJavaScript'
  );

  assert.equal(parsed.name, 'Jane Doe');
  assert.deepEqual(parsed.skills, ['JavaScript']);

  console.log('Resume parser test passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
