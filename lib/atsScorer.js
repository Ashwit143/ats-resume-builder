/**
 * atsScorer.js — Deterministic ATS scoring engine (CommonJS)
 *
 * Scoring weights:
 *   Keyword Match     60%  — word-boundary regex against role keyword list
 *   Structure Score   20%  — detects 5 standard resume sections
 *   Content Score     20%  — word count, action verbs, project depth, tech mentions
 *
 * Returns the exact JSON shape the API sends to the client:
 * {
 *   score, grade, keywordMatch, structureScore, contentScore,
 *   keywordsFound, missingKeywords, sectionsDetected, suggestions
 * }
 */

const { getRoleConfig } = require('./keywords');

// ─── Constants ────────────────────────────────────────────────────────────────

const SCORE_WEIGHTS = { keyword: 0.60, structure: 0.20, content: 0.20 };

// Sections to detect and their heading patterns
const SECTION_PATTERNS = {
  skills:           /\b(technical\s+skills?|skills?|core\s+competencies?|competencies|technologies|tech\s+stack)\b/i,
  experience:       /\b(work\s+experience|professional\s+experience|employment|work\s+history|experience)\b/i,
  education:        /\b(education|academic\s+background|qualifications?|degree|university|college)\b/i,
  projects:         /\b(projects?|personal\s+projects?|academic\s+projects?|side\s+projects?|portfolio)\b/i,
  certifications:   /\b(certifications?|certificates?|licenses?|credentials?|professional\s+development)\b/i
};

// Generic strong action verbs
const ACTION_VERBS = [
  'led', 'built', 'designed', 'developed', 'created', 'implemented', 'delivered',
  'optimized', 'improved', 'launched', 'managed', 'increased', 'reduced', 'automated',
  'collaborated', 'architected', 'deployed', 'maintained', 'streamlined', 'generated',
  'established', 'analyzed', 'scaled', 'mentored', 'drove', 'engineered',
  'coordinated', 'executed', 'achieved', 'transformed', 'accelerated', 'spearheaded'
];

// Regex to detect quantified metrics
const METRIC_REGEX = /(\d+\s*%|\$\s*[\d,]+|\d+\s*(million|thousand|k\b|users?|clients?|team|month|year|day|hour|x\s+faster|x\s+improvement|projects?))/gi;

// Grade bands
const GRADE_BANDS = [
  { min: 81, label: 'Excellent' },
  { min: 61, label: 'Good' },
  { min: 41, label: 'Average' },
  { min: 0,  label: 'Poor' }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getGrade(score) {
  return (GRADE_BANDS.find(b => score >= b.min) || GRADE_BANDS[GRADE_BANDS.length - 1]).label;
}

// ─── Component 1: Keyword Match (returns 0–100) ────────────────────────────

function computeKeywordMatch(text, keywords) {
  const found = [];
  const missing = [];
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    const escaped = escapeRegex(keyword);
    const pattern = keyword.includes(' ')
      ? new RegExp(escaped.replace(/\s+/g, '\\s+'), 'i')
      : new RegExp(`\\b${escaped}\\b`, 'i');

    if (pattern.test(lower)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const score = Math.round((found.length / keywords.length) * 100);
  return { score, found: found.sort(), missing: missing.sort() };
}

// ─── Component 2: Structure Score (returns 0–100) ─────────────────────────

function computeStructureScore(text) {
  const sectionsDetected = {};
  let detected = 0;
  const total = Object.keys(SECTION_PATTERNS).length;

  for (const [section, pattern] of Object.entries(SECTION_PATTERNS)) {
    sectionsDetected[section] = pattern.test(text);
    if (sectionsDetected[section]) detected++;
  }

  const score = Math.round((detected / total) * 100);
  return { score, sectionsDetected };
}

// ─── Component 3: Content Score (returns 0–100) ───────────────────────────

function computeContentScore(text, roleActionVerbs) {
  let score = 0;
  const suggestions = [];

  // (a) Word count — 25 pts
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  if (wordCount >= 400)      score += 25;
  else if (wordCount >= 250) score += 18;
  else if (wordCount >= 150) score += 10;
  else                       score += 0;

  if (wordCount < 250) {
    suggestions.push(`Your resume appears short (${wordCount} words). Aim for 300–600 words to provide enough detail for ATS systems.`);
  }

  // (b) Action verbs — 25 pts
  const allVerbs = [...new Set([...ACTION_VERBS, ...(roleActionVerbs || [])])];
  const verbsFound = allVerbs.filter(v =>
    new RegExp(`\\b${escapeRegex(v)}\\b`, 'i').test(text)
  );
  if (verbsFound.length >= 8)      score += 25;
  else if (verbsFound.length >= 5) score += 18;
  else if (verbsFound.length >= 3) score += 12;
  else if (verbsFound.length >= 1) score += 6;

  if (verbsFound.length < 5) {
    suggestions.push('Use more strong action verbs (e.g., "Led", "Built", "Optimized", "Automated") to start your bullet points.');
  }

  // (c) Project descriptions — 25 pts
  const hasProjectContent = /\b(project|built|developed|created|designed)\b/i.test(text);
  const metricMatches = text.match(METRIC_REGEX) || [];
  if (metricMatches.length >= 3)       score += 25;
  else if (metricMatches.length >= 1)  score += 15;
  else if (hasProjectContent)          score += 8;

  if (metricMatches.length < 2) {
    suggestions.push('Add measurable achievements to your project descriptions (e.g., "Improved performance by 40%", "Served 10,000+ users").');
  }

  // (d) Technology mentions — 25 pts
  const techPattern = /\b(react|angular|vue|node|python|java|sql|docker|aws|git|linux|kubernetes|typescript|javascript|mongodb|postgresql|redis|graphql|rest)\b/gi;
  const techMentions = (text.match(techPattern) || []).length;
  const uniqueTech = new Set((text.match(techPattern) || []).map(t => t.toLowerCase())).size;
  if (uniqueTech >= 8)      score += 25;
  else if (uniqueTech >= 5) score += 18;
  else if (uniqueTech >= 3) score += 10;
  else if (uniqueTech >= 1) score += 5;

  if (uniqueTech < 5) {
    suggestions.push('Mention more specific technologies, tools, and frameworks you have worked with throughout your resume.');
  }

  return { score: Math.min(score, 100), verbsFound: verbsFound.length, wordCount, metricMatches: metricMatches.length, uniqueTech, contentSuggestions: suggestions };
}

// ─── Suggestion Generator ─────────────────────────────────────────────────────

function buildSuggestions(missingKeywords, sectionsDetected, contentData, keywordMatchPct, roleLabel) {
  const suggestions = [];

  if (missingKeywords.length > 0) {
    suggestions.push(`Add these missing keywords to your Skills section: ${missingKeywords.slice(0, 6).join(', ')}.`);
  }

  if (keywordMatchPct < 50) {
    suggestions.push(`Tailor your resume specifically for the ${roleLabel} role by incorporating more relevant keywords in your experience and project descriptions.`);
  }

  if (!sectionsDetected.skills) {
    suggestions.push('Add a dedicated "Technical Skills" section so ATS systems can quickly identify your competencies.');
  }
  if (!sectionsDetected.experience) {
    suggestions.push('Add a clearly labeled "Work Experience" or "Professional Experience" section.');
  }
  if (!sectionsDetected.projects) {
    suggestions.push('Add a "Projects" section to showcase your practical experience with relevant technologies.');
  }
  if (!sectionsDetected.certifications) {
    suggestions.push('Consider adding relevant certifications to strengthen your profile (e.g., AWS Certified, Google Cloud, etc.).');
  }
  if (!sectionsDetected.education) {
    suggestions.push('Include an "Education" section with your degree, institution, and graduation year.');
  }

  suggestions.push(...contentData.contentSuggestions);

  suggestions.push('Mirror exact keywords from the job description in your resume — especially in the Summary and Experience sections.');

  return suggestions.slice(0, 8);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * @param {string} text   Plain text extracted from the resume PDF
 * @param {string} role   Role slug (e.g. 'frontend-developer')
 * @returns {object}      Full analysis result in the standard JSON shape
 */
function scoreResume(text, role) {
  const roleConfig = getRoleConfig(role);
  if (!roleConfig) {
    throw Object.assign(
      new Error(`Unknown role: "${role}".`),
      { code: 'INVALID_ROLE' }
    );
  }

  const { keywords, actionVerbs, label } = roleConfig;

  // Run the three scoring components
  const kw        = computeKeywordMatch(text, keywords);
  const structure = computeStructureScore(text);
  const content   = computeContentScore(text, actionVerbs);

  // Weighted final score (0–100)
  const score = Math.min(
    100,
    Math.max(0, Math.round(
      kw.score        * SCORE_WEIGHTS.keyword   +
      structure.score * SCORE_WEIGHTS.structure +
      content.score   * SCORE_WEIGHTS.content
    ))
  );

  const grade = getGrade(score);

  const suggestions = buildSuggestions(
    kw.missing,
    structure.sectionsDetected,
    content,
    kw.score,
    label
  );

  return {
    score,
    grade,
    keywordMatch:     kw.score,
    structureScore:   structure.score,
    contentScore:     content.score,
    keywordsFound:    kw.found,
    missingKeywords:  kw.missing,
    sectionsDetected: structure.sectionsDetected,
    suggestions
  };
}

module.exports = { scoreResume };
