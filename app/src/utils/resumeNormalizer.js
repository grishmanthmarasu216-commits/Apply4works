/**
 * resumeNormalizer.js
 * Normalizes any resume shape (V2 or legacy flat) into a consistent V2 resumeData.
 * Used across all resume components to ensure consistent data structure.
 */

// nanoid not needed — id() below uses Math.random()

function id() {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Creates a blank V2 resumeData object
 */
export function createEmptyResume() {
  return {
    personalInfo: {
      firstName: '', lastName: '', email: '', phone: '',
      location: '', linkedin: '', github: '', portfolio: '', website: '',
    },
    summary: '',
    experience: [],
    projects: [],
    education: [],
    skills: {
      programming: [], frameworks: [], databases: [],
      cloud: [], devops: [], tools: [], softSkills: [],
    },
    certifications: [],
    languages: [],
    achievements: [],
  };
}

/**
 * Returns a display name from any resume shape
 */
export function getDisplayName(resumeData) {
  if (!resumeData) return '';
  const pi = resumeData.personalInfo;
  if (pi) {
    const full = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
    if (full.trim()) return full.trim();
  }
  return resumeData.name || resumeData.fullName || '';
}

/**
 * Normalizes any resume data into V2 format.
 * Handles:
 *   - V2 format (resumeData.personalInfo exists)
 *   - Legacy flat format (name, email at top level)
 *   - Partial/null data
 */
export function normalizeResume(raw) {
  if (!raw) return createEmptyResume();

  // Already V2 — validate and fill gaps
  if (raw.personalInfo && typeof raw.personalInfo === 'object') {
    const base = createEmptyResume();
    return {
      personalInfo: { ...base.personalInfo, ...raw.personalInfo },
      summary:        raw.summary || '',
      experience:     normalizeExperience(raw.experience),
      projects:       normalizeProjects(raw.projects),
      education:      normalizeEducation(raw.education),
      skills:         normalizeSkills(raw.skills),
      certifications: normalizeCertifications(raw.certifications),
      languages:      normalizeLanguages(raw.languages),
      achievements:   normalizeAchievements(raw.achievements),
    };
  }

  // Legacy flat format
  const fullName = raw.name || raw.fullName || '';
  const nameParts = fullName.trim().split(/\s+/);

  return {
    personalInfo: {
      firstName:  raw.firstName || nameParts[0] || '',
      lastName:   raw.lastName  || nameParts.slice(1).join(' ') || '',
      email:      raw.email || '',
      phone:      raw.phone || '',
      location:   raw.location || '',
      linkedin:   raw.linkedin || '',
      github:     raw.github   || '',
      portfolio:  raw.portfolio || '',
      website:    raw.website  || '',
    },
    summary:        raw.summary || '',
    experience:     normalizeExperience(raw.experience),
    projects:       normalizeProjects(raw.projects),
    education:      normalizeEducation(raw.education),
    skills:         normalizeSkills(raw.skills, raw),
    certifications: normalizeCertifications(raw.certifications),
    languages:      normalizeLanguages(raw.languages),
    achievements:   normalizeAchievements(raw.achievements),
  };
}

function normalizeExperience(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((exp, i) => ({
    id:              exp.id || id(),
    company:         exp.company   || exp.organization || '',
    role:            exp.role      || exp.title || exp.position || '',
    location:        exp.location  || '',
    startDate:       exp.startDate || exp.start_date || '',
    endDate:         exp.isCurrent ? '' : (exp.endDate || exp.end_date || ''),
    isCurrent:       exp.isCurrent || exp.current || false,
    responsibilities: Array.isArray(exp.responsibilities)
      ? exp.responsibilities.filter(Boolean)
      : typeof exp.responsibilities === 'string'
        ? exp.responsibilities.split('\n').map(s => s.replace(/^[-•*]\s*/, '')).filter(Boolean)
        : (exp.achievements || []),
  }));
}

function normalizeProjects(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((proj) => ({
    id:           proj.id || id(),
    name:         proj.name || proj.title || '',
    description:  proj.description || '',
    technologies: Array.isArray(proj.technologies) ? proj.technologies
      : typeof proj.techStack === 'string' ? proj.techStack.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    github:   proj.github   || proj.githubLink || '',
    liveLink: proj.liveLink || proj.link || proj.url || '',
  }));
}

function normalizeEducation(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((edu) => ({
    id:          edu.id || id(),
    institution: edu.institution || edu.school || edu.university || '',
    degree:      edu.degree || '',
    field:       edu.field  || edu.major  || '',
    startDate:   edu.startDate || edu.start_year || '',
    endDate:     edu.endDate   || edu.end_year  || edu.year || edu.duration || '',
    gpa:         edu.gpa || edu.cgpa || '',
  }));
}

function normalizeSkills(skills, legacy = {}) {
  const base = { programming: [], frameworks: [], databases: [], cloud: [], devops: [], tools: [], softSkills: [] };

  if (!skills) {
    // Pull from flat legacy fields
    if (Array.isArray(legacy.skills)) base.tools = legacy.skills;
    if (Array.isArray(legacy.frameworks)) base.frameworks = legacy.frameworks;
    if (Array.isArray(legacy.tools)) base.tools = [...new Set([...base.tools, ...legacy.tools])];
    if (Array.isArray(legacy.softSkills)) base.softSkills = legacy.softSkills;
    return base;
  }

  if (Array.isArray(skills)) {
    base.tools = skills.filter(Boolean);
    return base;
  }

  if (typeof skills === 'object') {
    return {
      programming: skills.programming || skills.Programming || [],
      frameworks:  skills.frameworks  || skills.Frameworks  || [],
      databases:   skills.databases   || skills.Databases   || [],
      cloud:       skills.cloud       || skills.Cloud       || [],
      devops:      skills.devops      || skills.DevOps      || [],
      tools:       skills.tools       || skills.Tools       || [],
      softSkills:  skills.softSkills  || skills.SoftSkills  || [],
    };
  }

  return base;
}

function normalizeCertifications(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((cert, i) => {
    if (typeof cert === 'string') return { id: id(), name: cert, issuer: '', date: '', url: '' };
    return { id: cert.id || id(), name: cert.name || '', issuer: cert.issuer || '', date: cert.date || '', url: cert.url || '' };
  });
}

function normalizeLanguages(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map(lang => {
    if (typeof lang === 'string') return { language: lang, proficiency: '' };
    return { language: lang.language || lang.name || '', proficiency: lang.proficiency || lang.level || '' };
  });
}

function normalizeAchievements(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter(a => typeof a === 'string' && a.trim());
}

/**
 * Flatten all skills from V2 skills object into a single display array
 */
export function flattenSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'object') return Object.values(skills).flat().filter(Boolean);
  return [];
}

/**
 * Get a summary of resume completeness as an object
 */
export function getCompleteness(resumeData) {
  if (!resumeData) return {};
  const pi = resumeData.personalInfo || {};
  return {
    personalInfo:  !!(pi.firstName && pi.email),
    summary:       !!(resumeData.summary && resumeData.summary.length > 20),
    experience:    (resumeData.experience || []).length > 0,
    projects:      (resumeData.projects   || []).length > 0,
    education:     (resumeData.education  || []).length > 0,
    skills:        flattenSkills(resumeData.skills).length > 0,
    certifications:(resumeData.certifications || []).length > 0,
    languages:     (resumeData.languages  || []).length > 0,
    achievements:  (resumeData.achievements || []).filter(Boolean).length > 0,
  };
}
