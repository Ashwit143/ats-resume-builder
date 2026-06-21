/**
 * api/analyze.js — Vercel Serverless Function (CommonJS)
 * POST /api/analyze
 *
 * Accepts: multipart/form-data
 *   resume  — PDF file, max 5 MB
 *   role    — job role slug string
 *
 * Success response (200):
 *   { success: true, data: { score, grade, keywordMatch, structureScore, contentScore,
 *                             keywordsFound, missingKeywords, sectionsDetected, suggestions } }
 *
 * Error response (4xx/5xx):
 *   { success: false, error: { code, message } }
 */

const multer  = require('multer');
const { extractText } = require('../lib/pdfParser');
const { scoreResume } = require('../lib/atsScorer');
const { getRoles }    = require('../lib/keywords');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only PDF files are accepted.'), { code: 'INVALID_TYPE' }), false);
    }
  }
});

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendError(res, code, message, status) {
  const httpStatus = status || { INVALID_TYPE: 400, MISSING_FIELDS: 400, INVALID_ROLE: 400,
    INVALID_INPUT: 400, EMPTY_FILE: 400, NO_TEXT: 422, PARSE_ERROR: 422,
    INSUFFICIENT_TEXT: 422, FILE_TOO_LARGE: 413 }[code] || 500;
  return res.status(httpStatus).json({ success: false, error: { code, message } });
}

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('resume')(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return sendError(res, 'METHOD_NOT_ALLOWED', 'Only POST requests are accepted.', 405);
  }

  // Parse multipart upload
  try {
    await runMulter(req, res);
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'FILE_TOO_LARGE', 'File exceeds the 5 MB limit. Please upload a smaller PDF.');
    }
    if (err.code === 'INVALID_TYPE') {
      return sendError(res, 'INVALID_TYPE', err.message);
    }
    return sendError(res, 'UPLOAD_ERROR', `Upload failed: ${err.message}`, 500);
  }

  // Validate: file present
  if (!req.file) {
    return sendError(res, 'MISSING_FIELDS', 'No resume file provided. Please upload a PDF.');
  }

  // Validate: role present and valid
  const role = (req.body && req.body.role) ? req.body.role.trim().toLowerCase() : null;
  if (!role) {
    return sendError(res, 'MISSING_FIELDS', 'No role selected. Please choose a target job role.');
  }
  if (!getRoles().includes(role)) {
    return sendError(res, 'INVALID_ROLE', `"${role}" is not a supported role. Valid roles: ${getRoles().join(', ')}.`);
  }

  // Extract text from PDF
  let resumeText;
  try {
    resumeText = await extractText(req.file.buffer);
  } catch (err) {
    return sendError(res, err.code || 'PARSE_ERROR', err.message);
  }

  // Run ATS scoring
  let result;
  try {
    result = scoreResume(resumeText, role);
  } catch (err) {
    return sendError(res, err.code || 'SCORING_ERROR', err.message, 500);
  }

  return res.status(200).json({ success: true, data: result });
};
