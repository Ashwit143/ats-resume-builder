/**
 * app.js — ATS Resume Analyzer Frontend Logic
 *
 * Handles:
 *  - Drag & drop and click-to-upload file selection
 *  - File type and size validation (PDF only, max 5 MB)
 *  - Role pill selection
 *  - Analyze button state management
 *  - POST /api/analyze with FormData
 *  - Animated loading steps
 *  - Results rendering (score ring, breakdown bars, chips, sections, suggestions)
 *  - Error toast notifications
 *  - Reset / analyze-again flow
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const RING_CIRCUMFERENCE = 2 * Math.PI * 80; // ≈ 502.65

const ROLE_LABELS = {
  'frontend-developer':  'Frontend Developer',
  'backend-developer':   'Backend Developer',
  'full-stack-developer':'Full Stack Developer',
  'software-engineer':   'Software Engineer',
  'data-analyst':        'Data Analyst'
};

const GRADE_COLORS = {
  'Poor':      { ringStroke: '#ef4444', cssClass: 'poor' },
  'Average':   { ringStroke: '#f59e0b', cssClass: 'average' },
  'Good':      { ringStroke: '#10b981', cssClass: 'good' },
  'Excellent': { ringStroke: '#6366f1', cssClass: 'excellent' }
};

const GRADE_EMOJIS = {
  'Poor': '⚠️', 'Average': '📊', 'Good': '✅', 'Excellent': '🏆'
};

// Loading step animation durations (ms) — steps complete while fetch is in-flight
const STEP_DELAYS = [0, 800, 1600, 2400, 3200];

// ── State ─────────────────────────────────────────────────────────────────────

let selectedFile = null;
let selectedRole = null;

// ── DOM references ─────────────────────────────────────────────────────────────

const dropZone     = document.getElementById('drop-zone');
const dzDefault    = document.getElementById('dz-default');
const dzSelected   = document.getElementById('dz-selected');
const dzFileName   = document.getElementById('dz-file-name');
const dzRemove     = document.getElementById('dz-remove');
const fileInput    = document.getElementById('file-input');

const roleBtns     = document.querySelectorAll('.role-btn');

const analyzeBtn   = document.getElementById('analyze-btn');
const analyzeNote  = document.getElementById('analyze-note');

const loadingEl    = document.getElementById('loading');
const loadingSteps = document.querySelectorAll('.ls');

const resultsEl    = document.getElementById('results');
const resetBtn     = document.getElementById('reset-btn');

const toast        = document.getElementById('toast');
const toastMsg     = document.getElementById('toast-msg');
const toastClose   = document.getElementById('toast-close');

// ── File handling ──────────────────────────────────────────────────────────────

function validateFile(file) {
  if (!file) return 'No file selected.';
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return 'Only PDF files are accepted. Please upload a .pdf file.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`;
  }
  return null;
}

function setFile(file) {
  const error = validateFile(file);
  if (error) { showToast(error); return; }

  selectedFile = file;
  dzFileName.textContent = file.name;
  dzDefault.hidden = true;
  dzSelected.hidden = false;
  dropZone.classList.add('has-file');
  updateAnalyzeButton();
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  dzDefault.hidden = false;
  dzSelected.hidden = true;
  dropZone.classList.remove('has-file');
  updateAnalyzeButton();
}

// Click on drop zone → open file picker
dropZone.addEventListener('click', (e) => {
  if (e.target === dzRemove) return; // handled separately
  fileInput.click();
});

// Keyboard access for drop zone
dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) setFile(fileInput.files[0]);
});

dzRemove.addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

// Drag & drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) setFile(file);
});

// ── Role selection ─────────────────────────────────────────────────────────────

roleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    roleBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    selectedRole = btn.dataset.role;
    updateAnalyzeButton();
  });
});

// ── Analyze button state ───────────────────────────────────────────────────────

function updateAnalyzeButton() {
  const ready = selectedFile !== null && selectedRole !== null;
  analyzeBtn.disabled = !ready;
  analyzeBtn.setAttribute('aria-disabled', String(!ready));

  if (!selectedFile && !selectedRole) {
    analyzeNote.textContent = 'Upload a PDF and select a role to continue.';
  } else if (!selectedFile) {
    analyzeNote.textContent = 'Please upload your resume PDF.';
  } else if (!selectedRole) {
    analyzeNote.textContent = 'Please select a target job role.';
  } else {
    analyzeNote.textContent = 'Ready! Click Analyze to get your ATS score.';
  }
}

// ── Loading animation ──────────────────────────────────────────────────────────

let stepTimers = [];

function startLoadingAnimation() {
  loadingSteps.forEach((s) => { s.className = 'ls'; });

  stepTimers = STEP_DELAYS.map((delay, i) =>
    setTimeout(() => {
      // Mark previous as done
      if (i > 0) loadingSteps[i - 1].className = 'ls done';
      // Mark current as active
      if (loadingSteps[i]) loadingSteps[i].className = 'ls active';
    }, delay)
  );
}

function stopLoadingAnimation() {
  stepTimers.forEach(clearTimeout);
  loadingSteps.forEach((s) => { s.className = 'ls'; });
}

// ── API call ───────────────────────────────────────────────────────────────────

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile || !selectedRole) return;

  // Show loading
  analyzeBtn.disabled = true;
  loadingEl.hidden = false;
  loadingEl.removeAttribute('aria-hidden');
  resultsEl.hidden = true;
  startLoadingAnimation();

  const formData = new FormData();
  formData.append('resume', selectedFile);
  formData.append('role', selectedRole);

  let data;
  try {
    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
    const json = await res.json();

    if (!res.ok || !json.success) {
      const msg = (json.error && json.error.message) || `Server error (${res.status}). Please try again.`;
      throw new Error(msg);
    }
    data = json.data;
  } catch (err) {
    stopLoadingAnimation();
    loadingEl.hidden = true;
    loadingEl.setAttribute('aria-hidden', 'true');
    analyzeBtn.disabled = false;
    showToast(err.message || 'An unexpected error occurred. Please try again.');
    return;
  }

  // Small delay so last step animation is visible
  await wait(500);
  stopLoadingAnimation();
  loadingEl.hidden = true;
  loadingEl.setAttribute('aria-hidden', 'true');

  renderResults(data);
  resultsEl.hidden = false;
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── Results rendering ──────────────────────────────────────────────────────────

function renderResults(data) {
  const {
    score, grade,
    keywordMatch, structureScore, contentScore,
    keywordsFound, missingKeywords,
    sectionsDetected, suggestions
  } = data;

  // ── Score ring ──────────────────────────────────────────────────────────────
  const ringFill = document.getElementById('ring-fill');
  const targetOffset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;

  // Reset to empty first (so animation always plays)
  ringFill.style.transition = 'none';
  ringFill.style.strokeDashoffset = String(RING_CIRCUMFERENCE);
  ringFill.style.stroke = '#6366f1';
  void ringFill.getBoundingClientRect(); // force reflow

  const gradeInfo = GRADE_COLORS[grade] || GRADE_COLORS['Excellent'];

  requestAnimationFrame(() => {
    ringFill.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease';
    ringFill.style.strokeDashoffset = String(targetOffset);
    ringFill.style.stroke = gradeInfo.ringStroke;
  });

  // Animate score number counting up
  animateCount('score-num', 0, score, 1200);

  // Grade badge
  const gradeBadge = document.getElementById('grade-badge');
  gradeBadge.className = `grade-badge ${gradeInfo.cssClass}`;
  gradeBadge.innerHTML = `${GRADE_EMOJIS[grade] || ''} ${grade}`;

  // Role name
  document.getElementById('score-role-name').textContent = ROLE_LABELS[selectedRole] || selectedRole;

  // ── Breakdown bars ──────────────────────────────────────────────────────────
  setBreakdownBar('bd-keyword',   'bar-keyword',   keywordMatch,   `${keywordMatch}%`);
  setBreakdownBar('bd-structure', 'bar-structure', structureScore, `${structureScore}%`);
  setBreakdownBar('bd-content',   'bar-content',   contentScore,   `${contentScore}%`);

  // ── Keywords found ──────────────────────────────────────────────────────────
  document.getElementById('found-count').textContent   = keywordsFound.length;
  document.getElementById('missing-count').textContent = missingKeywords.length;

  renderChips('found-chips',   keywordsFound,   'chip-found');
  renderChips('missing-chips', missingKeywords, 'chip-missing');

  // ── Sections detected ───────────────────────────────────────────────────────
  renderSections('sections-list', sectionsDetected);

  // ── Content quality summary ─────────────────────────────────────────────────
  renderQuality('quality-summary', keywordMatch, structureScore, contentScore, sectionsDetected);

  // ── Suggestions ─────────────────────────────────────────────────────────────
  renderSuggestions('suggestions-list', suggestions);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function setBreakdownBar(valId, barId, pct, displayText) {
  document.getElementById(valId).textContent = displayText;
  // Reset width first for re-analyze animation
  const bar = document.getElementById(barId);
  bar.style.transition = 'none';
  bar.style.width = '0%';
  void bar.getBoundingClientRect();
  bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1) 0.3s';
  bar.style.width = `${pct}%`;
}

function renderChips(containerId, keywords, chipClass) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!keywords || keywords.length === 0) {
    container.innerHTML = '<span style="font-size:0.8rem;color:var(--text-subtle)">None</span>';
    return;
  }
  keywords.forEach((kw) => {
    const span = document.createElement('span');
    span.className = `chip ${chipClass}`;
    span.setAttribute('role', 'listitem');
    span.textContent = kw;
    container.appendChild(span);
  });
}

function renderSections(containerId, sectionsDetected) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const sectionNames = ['skills', 'experience', 'education', 'projects', 'certifications'];
  sectionNames.forEach((name) => {
    const isOk = sectionsDetected[name] === true;
    const item = document.createElement('div');
    item.className = 'sec-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML = `
      <span class="sec-dot ${isOk ? 'ok' : 'no'}"></span>
      <span class="${isOk ? 'sec-ok' : 'sec-no'}">${capitalize(name)}</span>
      <span class="sec-badge ${isOk ? 'ok' : 'no'}">${isOk ? 'Found' : 'Missing'}</span>
    `;
    container.appendChild(item);
  });
}

function renderQuality(containerId, keywordMatch, structureScore, contentScore, sectionsDetected) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const detectedCount = Object.values(sectionsDetected).filter(Boolean).length;
  const totalSections = Object.keys(sectionsDetected).length;

  const items = [
    {
      icon: keywordMatch >= 60 ? '✅' : '⚠️',
      text: `<strong>Keyword Coverage:</strong> ${keywordMatch}% of role-specific keywords found`
    },
    {
      icon: structureScore >= 60 ? '✅' : '⚠️',
      text: `<strong>Section Coverage:</strong> ${detectedCount} of ${totalSections} standard sections detected`
    },
    {
      icon: contentScore >= 60 ? '✅' : '⚠️',
      text: `<strong>Content Quality:</strong> ${contentScore}/100 — based on word count, verbs, metrics & tech mentions`
    },
    {
      icon: keywordMatch >= 80 && structureScore === 100 ? '🏆' : '💡',
      text: `<strong>Overall ATS Readiness:</strong> ${getReadinessText(keywordMatch, structureScore, contentScore)}`
    }
  ];

  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'qi';
    div.setAttribute('role', 'listitem');
    div.innerHTML = `<span class="qi-icon">${item.icon}</span><span class="qi-text">${item.text}</span>`;
    container.appendChild(div);
  });
}

function renderSuggestions(containerId, suggestions) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (!suggestions || suggestions.length === 0) {
    container.innerHTML = '<li style="color:var(--text-muted);font-size:0.88rem">No specific suggestions — great job!</li>';
    return;
  }

  suggestions.forEach((text, i) => {
    const li = document.createElement('li');
    li.className = 'sug-item';
    li.innerHTML = `
      <span class="sug-num">${i + 1}</span>
      <span class="sug-text">${escapeHtml(text)}</span>
    `;
    container.appendChild(li);
  });
}

// ── Score counter animation ────────────────────────────────────────────────────

function animateCount(elementId, from, to, duration) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ── Reset ──────────────────────────────────────────────────────────────────────

resetBtn.addEventListener('click', resetAll);

function resetAll() {
  clearFile();
  roleBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  selectedRole = null;
  resultsEl.hidden = true;
  analyzeBtn.disabled = true;
  updateAnalyzeButton();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Toast notifications ────────────────────────────────────────────────────────

let toastTimer = null;

function showToast(message) {
  toastMsg.textContent = message;
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 6000);
}

function hideToast() {
  toast.hidden = true;
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
}

toastClose.addEventListener('click', hideToast);

// ── Utility ────────────────────────────────────────────────────────────────────

function wait(ms) { return new Promise((res) => setTimeout(res, ms)); }

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getReadinessText(kw, struct, content) {
  const avg = (kw * 0.6 + struct * 0.2 + content * 0.2);
  if (avg >= 80) return 'Strong match — your resume is well-optimized for ATS.';
  if (avg >= 60) return 'Good foundation — a few targeted improvements will boost your score.';
  if (avg >= 40) return 'Moderate match — focus on keywords and adding missing sections.';
  return 'Needs significant improvement — add keywords, sections, and measurable achievements.';
}

// ── Init ───────────────────────────────────────────────────────────────────────

updateAnalyzeButton();
