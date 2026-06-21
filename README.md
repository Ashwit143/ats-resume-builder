# ATS Resume Analyzer

A free, production-ready ATS Resume Analyzer built with Node.js, Express, and vanilla HTML/CSS/JS. **No AI APIs. No paid services. No data stored.** Completely rule-based keyword matching, section detection, and content quality analysis.

## Project Structure

```
ats-resume-analyzer/
├── api/
│   └── analyze.js          # Vercel serverless function (POST /api/analyze)
├── lib/
│   ├── atsScorer.js        # ATS scoring engine (60/20/20 weighted)
│   ├── keywords.js         # Keyword sets for 5 roles (30-40 keywords each)
│   └── pdfParser.js        # PDF text extraction wrapper (pdf-parse)
├── public/
│   ├── index.html          # Single-page frontend
│   ├── css/style.css       # Dark glassmorphism UI
│   └── js/app.js           # Frontend JS (drag-drop, fetch, render)
├── server.js               # Local Express dev server
├── package.json
├── vercel.json             # Vercel deployment config
└── README.md
```

## ATS Scoring Logic

| Component | Weight | Method |
|-----------|--------|--------|
| Keyword Match | **60%** | Word-boundary regex against 30-40 role keywords |
| Resume Structure | **20%** | Detects 5 sections: Skills, Experience, Education, Projects, Certifications |
| Content Quality | **20%** | Word count + action verbs + quantified achievements + tech mentions |

**Score Bands:** 0-40 Poor · 41-60 Average · 61-80 Good · 81-100 Excellent

## API Response Format

```json
{
  "success": true,
  "data": {
    "score": 85,
    "grade": "Excellent",
    "keywordMatch": 80,
    "structureScore": 100,
    "contentScore": 75,
    "keywordsFound": ["react", "typescript", "git"],
    "missingKeywords": ["vue", "webpack", "jest"],
    "sectionsDetected": {
      "skills": true,
      "experience": true,
      "education": true,
      "projects": true,
      "certifications": false
    },
    "suggestions": [
      "Add these missing keywords to your Skills section: vue, webpack, jest.",
      "Quantify your achievements with numbers and percentages."
    ]
  }
}
```

## Supported Roles

- Frontend Developer
- Backend Developer
- Full Stack Developer
- Software Engineer
- Data Analyst

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# http://localhost:3000
```

## Vercel Deployment

```bash
# Install Vercel CLI (one-time)
npm install -g vercel

# Deploy
vercel

# Follow prompts — no environment variables required.
```

The `vercel.json` is pre-configured:
- `api/analyze.js` → Vercel Node.js serverless function (512 MB, 30s timeout)
- `public/` → Served as static files via Vercel CDN

## File Validation

- **Format:** PDF only (`application/pdf`)
- **Max size:** 5 MB
- **Content:** Must be text-based PDF (not scanned/image-only)

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js (local dev) / Vercel Serverless (production)
- **PDF Parsing:** `pdf-parse`
- **File Upload:** `multer` (memory storage — no disk writes)
- **Frontend:** Vanilla HTML, CSS, JavaScript
