/**
 * frontendAtsEngine.js
 * 
 * Client-side ATS scoring engine — no API calls.
 * Mirrors backend atsScoringEngine.js with V2 weights.
 * 
 * Used by ResumeWorkspace for real-time score updates while editing.
 */

// ── Skill Dictionary (mirrors backend keywordExtractor.js) ─────────────────
const SKILL_DICTIONARY = {
  Programming: ['javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript', 'php', 'swift', 'kotlin', 'bash', 'scala', 'dart', 'html', 'css', 'r', 'matlab', 'perl'],
  Databases:   ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'elasticsearch', 'oracle', 'dynamodb', 'mariadb', 'neo4j', 'couchbase', 'firebase', 'sqlite', 'prisma'],
  Cloud:       ['aws', 'azure', 'gcp', 'google cloud', 'ibm cloud', 'heroku', 'digitalocean', 'snowflake', 'databricks', 'vercel', 'netlify'],
  DevOps:      ['docker', 'kubernetes', 'jenkins', 'ansible', 'terraform', 'ci/cd', 'github actions', 'gitlab ci', 'circleci', 'puppet', 'chef', 'vagrant', 'nginx', 'apache', 'linux'],
  Frameworks:  ['react', 'angular', 'vue', 'spring', 'django', 'flask', 'express', 'node.js', 'next.js', 'nest', 'laravel', 'ruby on rails', 'asp.net', '.net', 'flutter', 'react native', 'fastapi', 'langchain', 'tailwind'],
  Testing:     ['jest', 'mocha', 'cypress', 'selenium', 'junit', 'pytest', 'cucumber', 'playwright', 'puppeteer', 'unit testing', 'integration testing', 'tdd', 'bdd'],
  Analytics:   ['pandas', 'numpy', 'scipy', 'tableau', 'power bi', 'looker', 'google analytics', 'hadoop', 'spark', 'kafka', 'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch'],
  Tools:       ['git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana', 'slack', 'postman', 'swagger', 'figma', 'webpack', 'babel', 'vite'],
  SoftSkills:  ['leadership', 'communication', 'teamwork', 'problem solving', 'agile', 'scrum', 'kanban', 'time management', 'mentoring', 'collaboration'],
};

const SKILL_ALIASES = {
  'javascript': ['js'],
  'node.js': ['node', 'nodejs'],
  'ci/cd': ['continuous integration', 'continuous deployment'],
  'react': ['reactjs', 'react.js'],
  'vue': ['vuejs', 'vue.js'],
  'next.js': ['nextjs', 'next'],
  'amazon web services': ['aws'],
  'google cloud platform': ['gcp']
};

/**
 * Extract keywords from text based on the dictionary
 */
export function extractKeywordsFromText(text) {
  if (!text) return {};
  const searchSpace = text.toLowerCase();
  const extracted = {};

  for (const [category, skills] of Object.entries(SKILL_DICTIONARY)) {
    const found = [];
    for (const skill of skills) {
      const aliases = SKILL_ALIASES[skill] || [];
      const termsToSearch = [skill, ...aliases];
      let hasMatch = false;

      for (const term of termsToSearch) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|[^a-zA-Z0-9])(${escaped})(?:[^a-zA-Z0-9]|$)`, 'i');
        if (regex.test(searchSpace)) {
          hasMatch = true;
          break;
        }
      }

      if (hasMatch) {
        found.push(formatSkill(skill));
      }
    }
    if (found.length > 0) extracted[category] = found;
  }

  return extracted;
}

function formatSkill(skill) {
  const map = {
    'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python',
    'java': 'Java', 'c++': 'C++', 'c#': 'C#', 'html': 'HTML', 'css': 'CSS',
    'sql': 'SQL', 'mongodb': 'MongoDB', 'aws': 'AWS', 'gcp': 'GCP',
    'ci/cd': 'CI/CD', 'node.js': 'Node.js', 'next.js': 'Next.js', '.net': '.NET',
    'asp.net': 'ASP.NET', 'api': 'API', 'tdd': 'TDD', 'bdd': 'BDD', 'nlp': 'NLP',
    'react': 'React', 'vue': 'Vue', 'angular': 'Angular', 'docker': 'Docker',
    'kubernetes': 'Kubernetes', 'github': 'GitHub', 'gitlab': 'GitLab',
  };
  if (map[skill]) return map[skill];
  return skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function flattenKeywords(extracted) {
  return [...new Set(Object.values(extracted).flat())];
}

/**
 * Get all text from a V2 resumeData object for keyword matching
 */
function getResumeText(resumeData) {
  if (!resumeData) return '';
  return JSON.stringify(resumeData).toLowerCase();
}

/**
 * Get flat skills array from V2 or legacy resume
 */
function getFlatSkills(resumeData) {
  if (!resumeData) return [];
  const s = resumeData.skills;
  if (!s) return [];
  if (Array.isArray(s)) return s;
  if (typeof s === 'object') return Object.values(s).flat().filter(Boolean);
  return [];
}

/**
 * Estimate years of experience from experience array
 */
function estimateYearsExp(experience = []) {
  if (!experience.length) return 0;
  let months = 0;
  const now = new Date().getFullYear();
  for (const exp of experience) {
    const startYear = parseInt((exp.startDate || '').match(/\d{4}/)?.[0] || '0');
    const isCurrentRole = exp.isCurrent || exp.current || /present|current/i.test(exp.endDate || '');
    const endYear = isCurrentRole ? now : parseInt((exp.endDate || '').match(/\d{4}/)?.[0] || String(now));
    if (startYear > 0 && endYear >= startYear) {
      months += (endYear - startYear) * 12;
    }
  }
  return Math.round(months / 12 * 10) / 10;
}

/**
 * Main real-time ATS scoring function.
 * Call this on every resume edit — runs in < 10ms.
 */
export function calculateRealTimeAts(resumeData, jobData) {
  if (!resumeData) {
    return { atsScore: 0, matchScore: 0, scoreBreakdown: {}, matchedSkills: [], missingSkills: [], suggestions: [] };
  }

  const resumeText = getResumeText(resumeData);
  const experience = resumeData.experience || [];
  const projects   = resumeData.projects   || [];
  const education  = resumeData.education  || [];
  const summary    = resumeData.summary    || '';
  const yearsExp   = estimateYearsExp(experience);

  // Extract job keywords
  const jdText = (jobData?.description || '') + ' ' + (jobData?.title || '');
  const extractedCategories = extractKeywordsFromText(jdText);
  const jobSkills = flattenKeywords(extractedCategories);

  // ── 1. Skills Match (35%) ──────────────────────────────────────────────────
  let skillMatchScore = 0;
  const matchedSkills = [];
  const missingSkills = [];

  if (jobSkills.length > 0) {
    for (const skill of jobSkills) {
      const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9])(${escaped})(?:[^a-zA-Z0-9]|$)`, 'i');
      if (regex.test(resumeText)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
    skillMatchScore = Math.round((matchedSkills.length / jobSkills.length) * 35);
  } else {
    skillMatchScore = 25;
  }

  // ── 2. Experience Match (25%) ──────────────────────────────────────────────
  let experienceScore = 0;
  const reqLevel = (jobData?.experienceLevel || '').toLowerCase();
  if (reqLevel.includes('senior') || reqLevel.includes('lead')) {
    experienceScore = yearsExp >= 5 ? 25 : yearsExp >= 3 ? 15 : experience.length > 0 ? 8 : 0;
  } else if (reqLevel.includes('mid') || reqLevel.includes('intermediate')) {
    experienceScore = yearsExp >= 2 ? 25 : experience.length > 0 ? 15 : 8;
  } else if (/junior|entry|intern|graduate/.test(reqLevel)) {
    experienceScore = experience.length > 0 ? 25 : 18;
  } else {
    experienceScore = experience.length >= 3 ? 25 : experience.length >= 1 ? 18 : 8;
  }

  // ── 3. Projects Match (15%) ────────────────────────────────────────────────
  let projectsScore = 0;
  if (projects.length > 0) {
    projectsScore = 10;
    const projText = JSON.stringify(projects).toLowerCase();
    if (matchedSkills.some(s => projText.includes(s.toLowerCase()))) projectsScore = 15;
  }

  // ── 4. Title Alignment (10%) ───────────────────────────────────────────────
  let titleScore = 0;
  const target = (jobData?.title || '').toLowerCase();
  if (target) {
    const expTitles = experience.map(e => (e.role || e.title || '').toLowerCase());
    if (expTitles.some(t => t.includes(target) || target.includes(t))) titleScore = 10;
    else if (resumeText.includes(target)) titleScore = 6;
    else if (target.split(' ').some(w => w.length > 3 && resumeText.includes(w))) titleScore = 3;
  } else {
    titleScore = 10;
  }

  // ── 5. Education (5%) ──────────────────────────────────────────────────────
  const educationScore = education.length > 0 ? 5 : 0;

  // ── 6. Keyword Coverage / Soft Skills (10%) ────────────────────────────────
  let keywordCovScore = 5; // default partial
  const softSkills = (extractedCategories.SoftSkills || []).concat(extractedCategories.Tools || []);
  if (softSkills.length > 0) {
    const matched = softSkills.filter(s => resumeText.includes(s.toLowerCase()));
    keywordCovScore = Math.round((matched.length / softSkills.length) * 10);
  }

  // ── Total ──────────────────────────────────────────────────────────────────
  const raw = skillMatchScore + experienceScore + projectsScore + titleScore + educationScore + keywordCovScore;
  const atsScore = Math.min(100, Math.max(0, raw));
  const matchScore = parseFloat((atsScore / 10).toFixed(1));

  // ── Suggestions ────────────────────────────────────────────────────────────
  const suggestions = [];
  if (missingSkills.length > 0) suggestions.push(`Add missing keywords: ${missingSkills.slice(0, 3).join(', ')}`);
  if (!summary || summary.length < 50) suggestions.push('Add a professional summary mentioning your target role');
  if (projects.length === 0) suggestions.push('Add relevant projects to demonstrate your skills');
  if (experience.length === 0) suggestions.push('Add work experience entries');
  if (titleScore < 6 && target) suggestions.push(`Align your role titles with "${jobData?.title}"`);

  return {
    atsScore,
    matchScore,
    scoreBreakdown: {
      skills:          skillMatchScore,
      experience:      experienceScore,
      projects:        projectsScore,
      titleAlignment:  titleScore,
      education:       educationScore,
      keywordCoverage: keywordCovScore,
    },
    matchedSkills,
    missingSkills,
    suggestions,
    extractedCategories,
  };
}

// ── Resume Health Score ────────────────────────────────────────────────────────
// A completeness-based holistic score (0-100) not tied to any job description.

/**
 * Calculate an overall "Resume Health" score (0–100) based on depth & quality.
 * Returns { healthScore, grade, breakdown, actionItems }
 */
export function calculateHealthScore(resumeData) {
  if (!resumeData) return { healthScore: 0, grade: 'F', breakdown: {}, actionItems: [] };

  const pi          = resumeData.personalInfo || {};
  const summary     = resumeData.summary || '';
  const experience  = resumeData.experience || [];
  const projects    = resumeData.projects || [];
  const education   = resumeData.education || [];
  const allSkills   = getFlatSkills(resumeData);
  const certs       = resumeData.certifications || [];
  const languages   = resumeData.languages || [];
  const achievements = resumeData.achievements || [];
  const actionItems = [];
  const breakdown   = {};

  // 1. Contact Info (15 pts)
  let contact = 0;
  if (pi.firstName && pi.lastName) contact += 3;
  if (pi.email)     contact += 4;
  if (pi.phone)     contact += 2;
  if (pi.location)  contact += 2;
  if (pi.linkedin)  contact += 2;
  if (pi.github || pi.portfolio) contact += 2;
  breakdown.contact = { score: contact, max: 15, label: 'Contact Info' };
  if (!pi.email)    actionItems.push({ priority: 'high',   text: 'Add your email address' });
  if (!pi.linkedin) actionItems.push({ priority: 'medium', text: 'Add your LinkedIn URL' });
  if (!pi.github && !pi.portfolio) actionItems.push({ priority: 'low', text: 'Add GitHub or portfolio link' });

  // 2. Professional Summary (10 pts)
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  let summaryScore = 0;
  if (wordCount >= 10) summaryScore = 4;
  if (wordCount >= 30) summaryScore = 7;
  if (wordCount >= 40) summaryScore = 10;
  breakdown.summary = { score: summaryScore, max: 10, label: 'Summary' };
  if (wordCount < 10) actionItems.push({ priority: 'high', text: 'Write a professional summary (aim for 40–80 words)' });
  else if (wordCount < 40) actionItems.push({ priority: 'medium', text: `Expand your summary (${wordCount} words, aim for 40+)` });

  // 3. Experience (25 pts)
  let expScore = 0;
  if (experience.length >= 1) expScore += 10;
  if (experience.length >= 2) expScore += 5;
  if (experience.length >= 3) expScore += 5;
  const goodEntries = experience.filter(e => (e.responsibilities || []).filter(Boolean).length >= 3).length;
  expScore += Math.min(5, goodEntries * 2);
  breakdown.experience = { score: Math.min(25, expScore), max: 25, label: 'Experience' };
  if (!experience.length) actionItems.push({ priority: 'high', text: 'Add at least one work experience entry' });
  else if (goodEntries < experience.length) actionItems.push({ priority: 'medium', text: 'Add 3+ bullet points to each experience entry' });

  // 4. Projects (10 pts)
  let projScore = 0;
  if (projects.length >= 1) projScore += 5;
  if (projects.length >= 2) projScore += 3;
  const projWithTech = projects.filter(p => (p.technologies || []).length >= 2).length;
  if (projWithTech > 0) projScore += 2;
  breakdown.projects = { score: Math.min(10, projScore), max: 10, label: 'Projects' };
  if (!projects.length) actionItems.push({ priority: 'medium', text: 'Add 2–3 relevant projects to showcase your skills' });

  // 5. Education (10 pts)
  let eduScore = 0;
  if (education.length >= 1) eduScore += 8;
  if (education[0]?.field)   eduScore += 1;
  if (education[0]?.gpa)     eduScore += 1;
  breakdown.education = { score: Math.min(10, eduScore), max: 10, label: 'Education' };
  if (!education.length) actionItems.push({ priority: 'medium', text: 'Add your educational background' });

  // 6. Skills (20 pts)
  let skillScore = 0;
  if (allSkills.length >= 5)  skillScore = 8;
  if (allSkills.length >= 10) skillScore = 13;
  if (allSkills.length >= 15) skillScore = 17;
  if (allSkills.length >= 20) skillScore = 20;
  breakdown.skills = { score: Math.min(20, skillScore), max: 20, label: 'Skills' };
  if (allSkills.length < 10) actionItems.push({ priority: 'high', text: `Add more skills (${allSkills.length}/15 minimum)` });
  else if (allSkills.length < 15) actionItems.push({ priority: 'medium', text: `Add ${15 - allSkills.length} more skills to reach 15+` });

  // 7. Extras: certs, languages, achievements (10 pts)
  let bonusScore = 0;
  if (certs.length >= 1)        bonusScore += 4;
  if (languages.length >= 1)    bonusScore += 2;
  if (achievements.length >= 1) bonusScore += 4;
  breakdown.extras = { score: Math.min(10, bonusScore), max: 10, label: 'Extras' };
  if (!certs.length)        actionItems.push({ priority: 'low', text: 'Add any relevant certifications' });
  if (!achievements.length) actionItems.push({ priority: 'low', text: 'Add notable achievements or awards' });

  const raw = Object.values(breakdown).reduce((s, v) => s + v.score, 0);
  const healthScore = Math.min(100, Math.max(0, raw));
  const grade = healthScore >= 85 ? 'A' : healthScore >= 70 ? 'B' : healthScore >= 55 ? 'C' : healthScore >= 40 ? 'D' : 'F';
  const priority = { high: 0, medium: 1, low: 2 };
  actionItems.sort((a, b) => priority[a.priority] - priority[b.priority]);

  return { healthScore, grade, breakdown, actionItems: actionItems.slice(0, 5) };
}
