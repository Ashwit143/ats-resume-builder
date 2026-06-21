/**
 * server.js — Local development Express server (CommonJS)
 * Mirrors Vercel serverless behavior for local testing.
 * Usage: npm run dev → http://localhost:3000
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const analyzeHandler = require('./api/analyze');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API route — same handler as Vercel serverless function
app.post('/api/analyze', analyzeHandler);

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀  ATS Resume Analyzer  →  http://localhost:${PORT}\n`);
});
