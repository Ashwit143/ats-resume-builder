/**
 * pdfParser.js — PDF text extraction wrapper (CommonJS)
 * Accepts a Buffer from multer memory storage (no disk I/O).
 */

const pdfParse = require('pdf-parse');

const MIN_TEXT_LENGTH = 100;

async function extractText(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw Object.assign(new Error('Invalid input: expected a Buffer.'), { code: 'INVALID_INPUT' });
  }

  if (buffer.length === 0) {
    throw Object.assign(new Error('Uploaded file is empty.'), { code: 'EMPTY_FILE' });
  }

  let data;
  try {
    data = await pdfParse(buffer);
  } catch (err) {
    throw Object.assign(
      new Error('Could not parse PDF. The file may be corrupted or password-protected.'),
      { code: 'PARSE_ERROR' }
    );
  }

  if (!data || !data.text) {
    throw Object.assign(
      new Error('No readable text found. The PDF may be image-based (scanned). Please use a text-based PDF.'),
      { code: 'NO_TEXT' }
    );
  }

  const cleaned = cleanText(data.text);

  if (cleaned.length < MIN_TEXT_LENGTH) {
    throw Object.assign(
      new Error('Extracted text is too short. Please upload a text-based PDF resume.'),
      { code: 'INSUFFICIENT_TEXT' }
    );
  }

  return cleaned;
}

function cleanText(raw) {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .trim();
}

module.exports = { extractText };
