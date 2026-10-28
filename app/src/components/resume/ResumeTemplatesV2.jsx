/**
 * ResumeTemplatesV2.jsx
 * 5 High-Quality ATS-safe resume templates with dynamic rendering.
 * Supports comprehensive data model including Research, Publications, Awards, etc.
 * Typography meticulously crafted using pt units, antialiasing, and precise spacing for print-perfect clarity.
 */

import React, { forwardRef } from 'react';
import { flattenSkills } from '../../utils/resumeNormalizer';

// ── Shared Helpers ─────────────────────────────────────────────────────────────
function pInfo(pi) {
  const name = [pi?.firstName, pi?.lastName].filter(Boolean).join(' ');
  return name || 'Your Name';
}
function fmtDate(d) {
  if (!d) return '';
  if (/present|current|now/i.test(d)) return 'Present';
  return d;
}
function dateRange(start, end, isCurrent) {
  const s = fmtDate(start);
  const e = isCurrent ? 'Present' : fmtDate(end);
  return [s, e].filter(Boolean).join(' - ');
}

// ── Shared Typography ────────────────────────────────────────────────────────
// Using 'pt' units ensures true-to-print scale matching the PDF exactly.
const T_FONT = "'Times New Roman', Times, serif";
const T_COLOR = '#000000';

const typo = {
  container: { 
    fontFamily: T_FONT, 
    color: T_COLOR, 
    fontSize: '11pt', 
    lineHeight: 1.35, 
    background: '#fff',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    boxSizing: 'border-box'
  },
  name: { fontSize: '24pt', fontWeight: 'bold', color: T_COLOR, margin: 0, lineHeight: 1.1, letterSpacing: '0.5pt' },
  contact: { fontSize: '10pt', color: T_COLOR, marginTop: '4pt' },
  sectionTitle: { 
    fontSize: '12pt', 
    fontWeight: 'bold', 
    color: T_COLOR, 
    margin: '0 0 6pt', 
    textTransform: 'uppercase', 
    borderBottom: '1pt solid #000', 
    paddingBottom: '2pt',
    letterSpacing: '0.5pt'
  },
  company: { fontSize: '11pt', fontWeight: 'bold', color: T_COLOR },
  date: { fontSize: '11pt', fontWeight: 'bold', color: T_COLOR },
  role: { fontSize: '11pt', fontStyle: 'italic', color: T_COLOR },
  bullet: { fontSize: '11pt', color: T_COLOR, lineHeight: 1.4, textAlign: 'justify' },
};

// ── Render Utilities ─────────────────────────────────────────────────────────

function RenderBullets({ items, style = {} }) {
  if (!items) return null;
  const list = Array.isArray(items) 
    ? items 
    : typeof items === 'string' ? items.split('\n') : [];
  const filtered = list.filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <ul style={{ margin: '2pt 0 0', paddingLeft: '14pt', ...style }}>
      {filtered.map((b, i) => (
        <li key={i} style={{ marginBottom: '2pt', ...typo.bullet }}>{b}</li>
      ))}
    </ul>
  );
}

function CategorizedSkills({ skills, style = {} }) {
  if (!skills) return null;
  const categories = [
    { key: 'programming', label: 'Programming Languages' },
    { key: 'frameworks', label: 'Frameworks & Libraries' },
    { key: 'tools', label: 'Tools & Technologies' },
    { key: 'databases', label: 'Databases' },
    { key: 'cloud', label: 'Cloud Platforms' },
    { key: 'devops', label: 'DevOps' },
    { key: 'platforms', label: 'Platforms' },
    { key: 'softSkills', label: 'Soft Skills' },
    { key: 'extracurricular', label: 'Other Skills' }
  ];

  const renderedCats = categories.map(cat => {
    const list = skills[cat.key];
    if (!list || list.length === 0) return null;
    return (
      <li key={cat.key} style={{ marginBottom: '2pt', ...typo.bullet }}>
        <strong style={{ fontWeight: 'bold' }}>{cat.label}:</strong> {list.join(', ')}
      </li>
    );
  }).filter(Boolean);

  if (renderedCats.length === 0) return null;

  return (
    <ul style={{ margin: '2pt 0 0', paddingLeft: '14pt', listStyleType: 'disc', ...style }}>
      {renderedCats}
    </ul>
  );
}

function DynamicSection({ title, items, condition, children, style = {}, titleStyle = {} }) {
  const hasItems = Array.isArray(items) ? items.length > 0 : !!condition;
  if (!hasItems) return null;
  return (
    <div style={{ marginBottom: '12pt', ...style }}>
      <h2 style={{ ...typo.sectionTitle, ...titleStyle }}>{title}</h2>
      {children}
    </div>
  );
}

// ── Template Implementations ─────────────────────────────────────────────────

// ── 1. Standard Template (Clean, single column, traditional) ──
function StandardTemplate({ r }) {
  const pi = r.personalInfo || {};
  const contactParts = [pi.phone, pi.email, pi.linkedin, pi.github, pi.portfolio, pi.website, pi.location].filter(Boolean);
  const cp = r.codingProfiles || {};
  const profiles = [cp.leetcode && `LeetCode: ${cp.leetcode}`, cp.codeforces && `Codeforces: ${cp.codeforces}`, cp.codechef && `CodeChef: ${cp.codechef}`, cp.hackerrank && `HackerRank: ${cp.hackerrank}`, cp.geeksforgeeks && `GFG: ${cp.geeksforgeeks}`].filter(Boolean);

  return (
    <div style={{ ...typo.container, padding: '24pt 36pt' }}>
      
      <div style={{ marginBottom: '16pt', textAlign: 'center' }}>
        <h1 style={{ ...typo.name }}>{pInfo(pi)}</h1>
        <p style={{ ...typo.contact, marginTop: '4pt' }}>{contactParts.join(' | ')}</p>
      </div>

      <DynamicSection title="Professional Summary" condition={r.summary}>
        <p style={{ margin: 0, ...typo.bullet }}>{r.summary}</p>
      </DynamicSection>

      <DynamicSection title="Experience" items={r.experience}>
        {r.experience?.map((exp, i) => (
          <div key={i} style={{ marginBottom: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{exp.company}</span>
              <span style={typo.date}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
              <span style={typo.role}>{exp.role}</span>
              <span style={typo.role}>{exp.location}</span>
            </div>
            <RenderBullets items={exp.responsibilities} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Internships" items={r.internships}>
        {r.internships?.map((intern, i) => (
          <div key={i} style={{ marginBottom: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{intern.company}</span>
              <span style={typo.date}>{dateRange(intern.startDate, intern.endDate, false)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
              <span style={typo.role}>{intern.role}</span>
              <span style={typo.role}>{intern.location}</span>
            </div>
            <RenderBullets items={intern.responsibilities} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Education" items={r.education}>
        {r.education?.map((edu, i) => (
          <div key={i} style={{ marginBottom: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{edu.institution}</span>
              <span style={typo.date}>{dateRange(edu.startDate, edu.endDate, false)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.role}>
                {[edu.degree, edu.branch, edu.field].filter(Boolean).join(', ')} {edu.gpa ? `(GPA: ${edu.gpa})` : ''}
              </span>
              <span style={typo.role}>{edu.location}</span>
            </div>
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Projects" items={r.projects}>
        {r.projects?.map((proj, i) => (
          <div key={i} style={{ marginBottom: '8pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{proj.name}</span>
              <span style={typo.date}>{proj.dates}</span>
            </div>
            <RenderBullets items={proj.description} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Skills" condition={Object.keys(r.skills || {}).length > 0}>
        <CategorizedSkills skills={r.skills} />
      </DynamicSection>

      <DynamicSection title="Research & Publications" condition={r.research?.length > 0 || r.publications?.length > 0}>
        {r.research?.map((res, i) => (
          <div key={`res-${i}`} style={{ marginBottom: '6pt' }}>
            <span style={typo.company}>{res.title}</span> {res.institution && <span style={typo.role}> — {res.institution}</span>} {res.date && <span style={typo.date}> ({res.date})</span>}
            {res.description && <div style={{ marginTop: '2pt', ...typo.bullet }}>{res.description}</div>}
          </div>
        ))}
        {r.publications?.map((pub, i) => (
          <div key={`pub-${i}`} style={{ marginBottom: '6pt' }}>
            <span style={typo.company}>{pub.title}</span> {pub.publisher && <span style={typo.role}> — {pub.publisher}</span>} {pub.date && <span style={typo.date}> ({pub.date})</span>}
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Certifications & Awards" condition={r.certifications?.length > 0 || r.awards?.length > 0 || r.achievements?.length > 0}>
        {r.certifications?.map((c, i) => (
          <div key={`cert-${i}`} style={{ marginBottom: '4pt' }}>
            <span style={typo.company}>{c.name}</span>{c.issuer ? <span style={typo.role}> — {c.issuer}</span> : ''}{c.date ? <span style={typo.date}> ({c.date})</span> : ''}
          </div>
        ))}
        {r.awards?.map((a, i) => (
          <div key={`aw-${i}`} style={{ marginBottom: '4pt' }}>
            <span style={typo.company}>{a.title}</span>{a.issuer ? <span style={typo.role}> — {a.issuer}</span> : ''}{a.date ? <span style={typo.date}> ({a.date})</span> : ''}
          </div>
        ))}
        {r.achievements?.map((ach, i) => (
          <div key={`ach-${i}`} style={{ marginBottom: '4pt', ...typo.bullet }}>• {typeof ach === 'string' ? ach : ach.title}</div>
        ))}
      </DynamicSection>

      <DynamicSection title="Hackathons & Competitions" items={r.hackathons}>
        {r.hackathons?.map((h, i) => (
          <div key={i} style={{ marginBottom: '6pt' }}>
            <span style={typo.company}>{h.name}</span> {h.project && <span style={typo.role}> — {h.project}</span>} {h.date && <span style={typo.date}> ({h.date})</span>}
            {h.description && <div style={{ marginTop: '2pt', ...typo.bullet }}>{h.description}</div>}
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Extracurricular & Volunteering" condition={r.extracurricular?.length > 0 || r.volunteering?.length > 0}>
        {r.extracurricular?.map((ex, i) => (
          <div key={`ex-${i}`} style={{ marginBottom: '4pt' }}>
            <span style={typo.company}>{ex.activity}</span> {ex.role && <span style={typo.role}> — {ex.role}</span>}
            {ex.description && <div style={{ ...typo.bullet }}>{ex.description}</div>}
          </div>
        ))}
        {r.volunteering?.map((vol, i) => (
          <div key={`vol-${i}`} style={{ marginBottom: '4pt' }}>
            <span style={typo.company}>{vol.organization}</span> {vol.role && <span style={typo.role}> — {vol.role}</span>} <span style={typo.date}> {dateRange(vol.startDate, vol.endDate, false)}</span>
            {vol.description && <div style={{ ...typo.bullet }}>{vol.description}</div>}
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Coding Profiles" condition={profiles.length > 0}>
        <p style={{ margin: 0, ...typo.bullet }}>{profiles.join(' | ')}</p>
      </DynamicSection>

    </div>
  );
}

// ── 2. Compact Template (Max information, minimal spacing) ──
function CompactTemplate({ r }) {
  const pi = r.personalInfo || {};
  const contactParts = [pi.phone, pi.email, pi.location, pi.linkedin, pi.github].filter(Boolean);
  const cp = r.codingProfiles || {};
  const profiles = [cp.leetcode && `LeetCode: ${cp.leetcode}`, cp.codeforces && `Codeforces: ${cp.codeforces}`].filter(Boolean);

  const sectionStyle = { marginBottom: '8pt' };
  const titleStyle = { ...typo.sectionTitle, fontSize: '11pt', marginBottom: '4pt', paddingBottom: '2pt' };

  return (
    <div style={{ ...typo.container, fontSize: '10pt', padding: '18pt 28pt' }}>
      <div style={{ marginBottom: '10pt', textAlign: 'left', borderBottom: '1.5pt solid #000', paddingBottom: '6pt' }}>
        <h1 style={{ ...typo.name, fontSize: '20pt' }}>{pInfo(pi)} {pi.professionalTitle && <span style={{ ...typo.role, fontSize: '12pt' }}>| {pi.professionalTitle}</span>}</h1>
        <p style={{ ...typo.contact, fontSize: '9.5pt', margin: '4pt 0 0' }}>{contactParts.join(' | ')}</p>
      </div>

      <DynamicSection title="Summary" condition={r.summary} style={sectionStyle} titleStyle={titleStyle}>
        <p style={{ margin: 0, ...typo.bullet, fontSize: '10pt' }}>{r.summary}</p>
      </DynamicSection>

      <DynamicSection title="Experience" items={r.experience} style={sectionStyle} titleStyle={titleStyle}>
        {r.experience?.map((exp, i) => (
          <div key={i} style={{ marginBottom: '6pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ ...typo.company, fontSize: '10pt' }}>{exp.company} — <span style={{ ...typo.role, fontSize: '10pt' }}>{exp.role}</span></span>
              <span style={{ ...typo.date, fontSize: '10pt' }}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
            </div>
            <RenderBullets items={exp.responsibilities} style={{ marginTop: '2pt', paddingLeft: '12pt' }} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Internships" items={r.internships} style={sectionStyle} titleStyle={titleStyle}>
        {r.internships?.map((intern, i) => (
          <div key={i} style={{ marginBottom: '6pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ ...typo.company, fontSize: '10pt' }}>{intern.company} — <span style={{ ...typo.role, fontSize: '10pt' }}>{intern.role}</span></span>
              <span style={{ ...typo.date, fontSize: '10pt' }}>{dateRange(intern.startDate, intern.endDate, false)}</span>
            </div>
            <RenderBullets items={intern.responsibilities} style={{ marginTop: '2pt', paddingLeft: '12pt' }} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Projects" items={r.projects} style={sectionStyle} titleStyle={titleStyle}>
        {r.projects?.map((proj, i) => (
          <div key={i} style={{ marginBottom: '6pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ ...typo.company, fontSize: '10pt' }}>{proj.name}</span>
              <span style={{ ...typo.date, fontSize: '9pt' }}>{[proj.dates, proj.github, proj.liveLink].filter(Boolean).join(' | ')}</span>
            </div>
            {proj.technologies?.length > 0 && <div style={{ ...typo.role, fontSize: '9pt' }}>Tech: {proj.technologies.join(', ')}</div>}
            <RenderBullets items={proj.description} style={{ marginTop: '2pt', paddingLeft: '12pt' }} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Education" items={r.education} style={sectionStyle} titleStyle={titleStyle}>
        {r.education?.map((edu, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4pt' }}>
            <div>
              <span style={{ ...typo.company, fontSize: '10pt' }}>{edu.institution}</span> — <span style={{ ...typo.role, fontSize: '10pt' }}>{[edu.degree, edu.branch].filter(Boolean).join(' ')} {edu.gpa && `(GPA: ${edu.gpa})`}</span>
            </div>
            <span style={{ ...typo.date, fontSize: '10pt' }}>{dateRange(edu.startDate, edu.endDate, false)}</span>
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Skills" condition={Object.keys(r.skills || {}).length > 0} style={sectionStyle} titleStyle={titleStyle}>
        <CategorizedSkills skills={r.skills} style={{ paddingLeft: '12pt' }} />
      </DynamicSection>

      <DynamicSection title="Research & Publications" condition={r.research?.length > 0 || r.publications?.length > 0} style={sectionStyle} titleStyle={titleStyle}>
        <ul style={{ margin: 0, paddingLeft: '12pt', listStyleType: 'disc' }}>
          {r.research?.map((res, i) => <li key={`res-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{res.title}</span> {res.institution && <span style={{ ...typo.role, fontSize: '10pt' }}>({res.institution})</span>}</li>)}
          {r.publications?.map((pub, i) => <li key={`pub-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{pub.title}</span> {pub.publisher && <span style={{ ...typo.role, fontSize: '10pt' }}>({pub.publisher})</span>}</li>)}
        </ul>
      </DynamicSection>

      <DynamicSection title="Awards & Extracurriculars" condition={r.awards?.length > 0 || r.certifications?.length > 0 || r.extracurricular?.length > 0 || r.volunteering?.length > 0 || r.achievements?.length > 0} style={sectionStyle} titleStyle={titleStyle}>
        <ul style={{ margin: 0, paddingLeft: '12pt', listStyleType: 'disc' }}>
          {r.awards?.map((a, i) => <li key={`a-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{a.title}</span> {a.issuer && <span style={{ ...typo.role, fontSize: '10pt' }}>({a.issuer})</span>}</li>)}
          {r.certifications?.map((c, i) => <li key={`c-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{c.name}</span> {c.issuer && <span style={{ ...typo.role, fontSize: '10pt' }}>({c.issuer})</span>}</li>)}
          {r.extracurricular?.map((ex, i) => <li key={`ex-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{ex.activity}</span> {ex.role && <span style={{ ...typo.role, fontSize: '10pt' }}>({ex.role})</span>}</li>)}
          {r.volunteering?.map((vol, i) => <li key={`vol-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{vol.organization}</span> {vol.role && <span style={{ ...typo.role, fontSize: '10pt' }}>({vol.role})</span>}</li>)}
          {r.achievements?.map((ach, i) => <li key={`ach-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}>{typeof ach === 'string' ? ach : ach.title}</li>)}
        </ul>
      </DynamicSection>

      <DynamicSection title="Hackathons & Profiles" condition={r.hackathons?.length > 0 || profiles.length > 0} style={sectionStyle} titleStyle={titleStyle}>
        <ul style={{ margin: 0, paddingLeft: '12pt', listStyleType: 'disc' }}>
          {r.hackathons?.map((h, i) => <li key={`h-${i}`} style={{ ...typo.bullet, fontSize: '10pt' }}><span style={{ ...typo.company, fontSize: '10pt' }}>{h.name}</span> {h.project && <span style={{ ...typo.role, fontSize: '10pt' }}>({h.project})</span>}</li>)}
        </ul>
        {profiles.length > 0 && <div style={{ marginTop: '4pt', ...typo.bullet, fontSize: '10pt' }}><strong>Profiles:</strong> {profiles.join(' | ')}</div>}
      </DynamicSection>
    </div>
  );
}

// ── 3. Centered Template (Name and contact centered) ──
function CenteredTemplate({ r }) {
  const pi = r.personalInfo || {};
  const contactParts = [pi.phone, pi.email, pi.location, pi.linkedin, pi.github].filter(Boolean);
  const cp = r.codingProfiles || {};
  const profiles = [cp.leetcode && `LeetCode: ${cp.leetcode}`, cp.codeforces && `Codeforces: ${cp.codeforces}`].filter(Boolean);

  return (
    <div style={{ ...typo.container, padding: '24pt 36pt' }}>
      <div style={{ textAlign: 'center', marginBottom: '18pt' }}>
        <h1 style={{ ...typo.name, fontSize: '24pt', textTransform: 'uppercase', letterSpacing: '1.5pt' }}>{pInfo(pi)}</h1>
        {pi.professionalTitle && <div style={{ ...typo.role, fontSize: '13pt', margin: '4pt 0' }}>{pi.professionalTitle}</div>}
        <p style={{ ...typo.contact, margin: '6pt 0 0', fontSize: '10pt' }}>
          {contactParts.join(' | ')}
        </p>
      </div>

      <DynamicSection title="Professional Summary" condition={r.summary} titleStyle={{ textAlign: 'center' }}>
        <p style={{ margin: 0, textAlign: 'center', ...typo.role }}>{r.summary}</p>
      </DynamicSection>

      <DynamicSection title="Experience" items={r.experience}>
        {r.experience?.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{exp.company}</span>
              <span style={typo.role}>{exp.location}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4pt' }}>
              <span style={typo.role}>{exp.role}</span>
              <span style={typo.date}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
            </div>
            <RenderBullets items={exp.responsibilities} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Internships" items={r.internships}>
        {r.internships?.map((intern, i) => (
          <div key={i} style={{ marginBottom: '12pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{intern.company}</span>
              <span style={typo.role}>{intern.location}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4pt' }}>
              <span style={typo.role}>{intern.role}</span>
              <span style={typo.date}>{dateRange(intern.startDate, intern.endDate, false)}</span>
            </div>
            <RenderBullets items={intern.responsibilities} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Education" items={r.education}>
        {r.education?.map((edu, i) => (
          <div key={i} style={{ marginBottom: '10pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={typo.company}>{edu.institution}</span>
              <span style={typo.date}>{dateRange(edu.startDate, edu.endDate, false)}</span>
            </div>
            <div style={{ ...typo.role }}>{[edu.degree, edu.branch].filter(Boolean).join(', ')}{edu.gpa ? `, GPA: ${edu.gpa}` : ''}</div>
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Projects" items={r.projects}>
        {r.projects?.map((proj, i) => (
          <div key={`p-${i}`} style={{ marginBottom: '10pt' }}>
            <span style={typo.company}>{proj.name}</span>
            {proj.technologies?.length > 0 && <span style={typo.role}> ({proj.technologies.join(', ')})</span>}
            <RenderBullets items={proj.description} />
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Skills" condition={Object.keys(r.skills || {}).length > 0}>
        <CategorizedSkills skills={r.skills} />
      </DynamicSection>

      <DynamicSection title="Research & Publications" condition={r.research?.length > 0 || r.publications?.length > 0}>
        {r.research?.map((res, i) => (
          <div key={`r-${i}`} style={{ marginBottom: '10pt' }}>
            <span style={typo.company}>{res.title}</span> — <span style={typo.role}>{res.institution}</span>
            <p style={{ margin: '4pt 0 0', ...typo.bullet }}>{res.description}</p>
          </div>
        ))}
        {r.publications?.map((pub, i) => (
          <div key={`p-${i}`} style={{ marginBottom: '10pt' }}>
            <span style={typo.company}>{pub.title}</span> — <span style={typo.role}>{pub.publisher}</span>
          </div>
        ))}
      </DynamicSection>

      <DynamicSection title="Awards & Extracurriculars" condition={r.awards?.length > 0 || r.certifications?.length > 0 || r.extracurricular?.length > 0 || r.volunteering?.length > 0 || r.achievements?.length > 0}>
        <ul style={{ margin: '4pt 0 0', paddingLeft: '16pt', listStyleType: 'disc' }}>
          {r.awards?.map((a, i) => <li key={`a-${i}`} style={typo.bullet}><span style={typo.company}>{a.title}</span> {a.issuer && <span style={typo.role}>({a.issuer})</span>}</li>)}
          {r.certifications?.map((c, i) => <li key={`c-${i}`} style={typo.bullet}><span style={typo.company}>{c.name}</span> {c.issuer && <span style={typo.role}>({c.issuer})</span>}</li>)}
          {r.extracurricular?.map((ex, i) => <li key={`ex-${i}`} style={typo.bullet}><span style={typo.company}>{ex.activity}</span> {ex.role && <span style={typo.role}>({ex.role})</span>}</li>)}
          {r.volunteering?.map((vol, i) => <li key={`vol-${i}`} style={typo.bullet}><span style={typo.company}>{vol.organization}</span> {vol.role && <span style={typo.role}>({vol.role})</span>}</li>)}
          {r.achievements?.map((ach, i) => <li key={`ach-${i}`} style={typo.bullet}>{typeof ach === 'string' ? ach : ach.title}</li>)}
        </ul>
      </DynamicSection>

      <DynamicSection title="Hackathons & Competitions" items={r.hackathons}>
        <ul style={{ margin: '4pt 0 0', paddingLeft: '16pt', listStyleType: 'disc' }}>
          {r.hackathons?.map((h, i) => <li key={`h-${i}`} style={typo.bullet}><span style={typo.company}>{h.name}</span> {h.project && <span style={typo.role}>({h.project})</span>}</li>)}
        </ul>
      </DynamicSection>

      <DynamicSection title="Languages & Profiles" condition={r.languages?.length > 0 || profiles.length > 0}>
        {r.languages?.length > 0 && <p style={{ margin: '0 0 6pt', ...typo.bullet }}><strong>Languages:</strong> {r.languages.map(l => l.language).join(', ')}</p>}
        {profiles.length > 0 && <p style={{ margin: 0, ...typo.bullet }}><strong>Profiles:</strong> {profiles.join(' | ')}</p>}
      </DynamicSection>
    </div>
  );
}

// ── 4. Structured Template (Academic, deep hierarchy, bold headers) ──
function StructuredTemplate({ r }) {
  const pi = r.personalInfo || {};
  const contactParts = [pi.phone, pi.email, pi.location, pi.linkedin, pi.github].filter(Boolean);
  const cp = r.codingProfiles || {};
  const profiles = [cp.leetcode && `LeetCode: ${cp.leetcode}`, cp.codeforces && `Codeforces: ${cp.codeforces}`].filter(Boolean);

  const titleStyle = { backgroundColor: 'transparent', padding: '0 0 2pt 0', borderBottom: '2pt solid #000' };

  return (
    <div style={{ ...typo.container, padding: '24pt 36pt' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16pt', borderBottom: '1pt solid #000', paddingBottom: '8pt' }}>
        <div>
          <h1 style={{ ...typo.name, fontSize: '28pt', letterSpacing: '-0.5pt' }}>{pInfo(pi)}</h1>
          {pi.professionalTitle && <div style={{ ...typo.role, fontSize: '14pt' }}>{pi.professionalTitle}</div>}
        </div>
        <div style={{ textAlign: 'right', ...typo.contact, fontSize: '10pt', marginTop: 0 }}>
          {contactParts.map((t, i) => <div key={i}>{t}</div>)}
        </div>
      </div>

      <DynamicSection title="Executive Summary" condition={r.summary} titleStyle={titleStyle}>
        <p style={{ margin: '6pt 0 0', ...typo.bullet }}>{r.summary}</p>
      </DynamicSection>

      <DynamicSection title="Professional Experience" items={r.experience} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
          {r.experience?.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                <span style={{ ...typo.company, fontSize: '12pt' }}>{exp.company}</span>
                <span style={typo.date}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
              </div>
              <div style={{ ...typo.role, marginBottom: '4pt' }}>{exp.role}{exp.location ? ` | ${exp.location}` : ''}</div>
              <RenderBullets items={exp.responsibilities} />
            </div>
          ))}
        </div>
      </DynamicSection>

      <DynamicSection title="Internships" items={r.internships} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
          {r.internships?.map((intern, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                <span style={{ ...typo.company, fontSize: '12pt' }}>{intern.company}</span>
                <span style={typo.date}>{dateRange(intern.startDate, intern.endDate, false)}</span>
              </div>
              <div style={{ ...typo.role, marginBottom: '4pt' }}>{intern.role}{intern.location ? ` | ${intern.location}` : ''}</div>
              <RenderBullets items={intern.responsibilities} />
            </div>
          ))}
        </div>
      </DynamicSection>

      <DynamicSection title="Academic Background" items={r.education} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
          {r.education?.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8pt' }}>
              <div>
                <span style={{ ...typo.company, fontSize: '11pt' }}>{edu.institution}</span>
                <div style={{ ...typo.role }}>{[edu.degree, edu.branch].filter(Boolean).join(', ')}{edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</div>
              </div>
              <span style={typo.date}>{dateRange(edu.startDate, edu.endDate, false)}</span>
            </div>
          ))}
        </div>
      </DynamicSection>

      <DynamicSection title="Key Projects & Research" condition={r.projects?.length > 0 || r.research?.length > 0 || r.publications?.length > 0} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
          {r.projects?.map((proj, i) => (
            <div key={i} style={{ marginBottom: '10pt' }}>
              <span style={{ ...typo.company, fontSize: '11pt' }}>{proj.name}</span>
              {proj.technologies?.length > 0 && <span style={typo.role}> — {proj.technologies.join(', ')}</span>}
              <RenderBullets items={proj.description} />
            </div>
          ))}
          {r.research?.map((res, i) => (
            <div key={`r-${i}`} style={{ marginBottom: '10pt' }}>
              <span style={{ ...typo.company, fontSize: '11pt' }}>{res.title}</span> <span style={typo.role}> — {res.institution}</span>
              <p style={{ margin: '4pt 0 0', ...typo.bullet }}>{res.description}</p>
            </div>
          ))}
          {r.publications?.map((pub, i) => (
            <div key={`p-${i}`} style={{ marginBottom: '10pt' }}>
              <span style={{ ...typo.company, fontSize: '11pt' }}>{pub.title}</span> <span style={typo.role}> — {pub.publisher}</span>
            </div>
          ))}
        </div>
      </DynamicSection>

      <DynamicSection title="Core Competencies" condition={Object.keys(r.skills || {}).length > 0} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
          <CategorizedSkills skills={r.skills} />
        </div>
      </DynamicSection>
      
      <DynamicSection title="Honors, Activities & Languages" condition={r.awards?.length > 0 || r.certifications?.length > 0 || r.extracurricular?.length > 0 || r.volunteering?.length > 0 || r.hackathons?.length > 0 || r.languages?.length > 0 || profiles.length > 0 || r.achievements?.length > 0} titleStyle={titleStyle}>
        <div style={{ padding: '6pt 0 0' }}>
           <ul style={{ margin: 0, paddingLeft: '14pt', listStyleType: 'disc' }}>
             {r.awards?.map((a, i) => <li key={`a-${i}`} style={typo.bullet}><span style={typo.company}>{a.title}</span> {a.issuer && <span style={typo.role}>({a.issuer})</span>}</li>)}
             {r.certifications?.map((c, i) => <li key={`c-${i}`} style={typo.bullet}><span style={typo.company}>{c.name}</span> {c.issuer && <span style={typo.role}>({c.issuer})</span>}</li>)}
             {r.extracurricular?.map((ex, i) => <li key={`e-${i}`} style={typo.bullet}><span style={typo.company}>{ex.activity}</span> {ex.role && <span style={typo.role}>— {ex.role}</span>}</li>)}
             {r.volunteering?.map((vol, i) => <li key={`vol-${i}`} style={typo.bullet}><span style={typo.company}>{vol.organization}</span> {vol.role && <span style={typo.role}>— {vol.role}</span>}</li>)}
             {r.hackathons?.map((h, i) => <li key={`h-${i}`} style={typo.bullet}><span style={typo.company}>{h.name}</span> {h.project && <span style={typo.role}>— {h.project}</span>}</li>)}
             {r.achievements?.map((ach, i) => <li key={`ach-${i}`} style={typo.bullet}>{typeof ach === 'string' ? ach : ach.title}</li>)}
           </ul>
           {r.languages?.length > 0 && <div style={{ marginTop: '6pt', ...typo.bullet }}><strong>Languages:</strong> {r.languages.map(l => l.language).join(', ')}</div>}
           {profiles.length > 0 && <div style={{ marginTop: '2pt', ...typo.bullet }}><strong>Profiles:</strong> {profiles.join(' | ')}</div>}
        </div>
      </DynamicSection>
    </div>
  );
}

// ── 5. Split Template (Two-column layout) ──
function SplitTemplate({ r }) {
  const pi = r.personalInfo || {};
  const cp = r.codingProfiles || {};
  const profiles = [cp.leetcode && `LeetCode: ${cp.leetcode}`, cp.codeforces && `Codeforces: ${cp.codeforces}`, cp.github && `GitHub: ${cp.github}`].filter(Boolean);

  const Title = ({ children }) => (
    <h2 style={{ ...typo.sectionTitle, fontSize: '12pt', borderBottom: '1.5pt solid #000', marginBottom: '8pt' }}>{children}</h2>
  );

  return (
    <div style={{ ...typo.container, display: 'flex', minHeight: '100%' }}>
      
      {/* LEFT SIDEBAR (33%) */}
      <div style={{ width: '33%', background: '#fafafa', padding: '24pt 16pt', borderRight: '1pt solid #ccc' }}>
        
        {/* Contact */}
        <div style={{ marginBottom: '20pt' }}>
          <Title>Contact</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4pt', ...typo.bullet }}>
            {pi.email && <div>✉ {pi.email}</div>}
            {pi.phone && <div>☎ {pi.phone}</div>}
            {pi.location && <div>📍 {pi.location}</div>}
            {pi.linkedin && <div>🔗 {pi.linkedin}</div>}
            {pi.github && <div>💻 {pi.github}</div>}
            {pi.portfolio && <div>🌍 {pi.portfolio}</div>}
          </div>
        </div>

        {/* Skills */}
        {r.skills && (
          <div style={{ marginBottom: '20pt' }}>
            <Title>Skills</Title>
            {Object.entries(r.skills).map(([cat, skls]) => {
              if (!skls || skls.length === 0) return null;
              const formattedCat = cat === 'softSkills' ? 'Soft Skills' : cat === 'extracurricular' ? 'Other Skills' : cat.replace(/([A-Z])/g, ' $1').trim();
              return (
                <div key={cat} style={{ marginBottom: '6pt' }}>
                  <strong style={{ ...typo.company, textTransform: 'capitalize', fontSize: '10pt' }}>{formattedCat}</strong>
                  <div style={{ ...typo.bullet }}>{skls.join(', ')}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Education (Sidebar) */}
        {r.education?.length > 0 && (
          <div style={{ marginBottom: '20pt' }}>
            <Title>Education</Title>
            {r.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '8pt' }}>
                <strong style={{ ...typo.company, display: 'block' }}>{[edu.degree, edu.branch].filter(Boolean).join(', ')}</strong>
                <div style={{ ...typo.role }}>{edu.institution}</div>
                <div style={{ ...typo.date, fontSize: '9pt' }}>{dateRange(edu.startDate, edu.endDate, false)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Coding Profiles */}
        {profiles.length > 0 && (
          <div style={{ marginBottom: '20pt' }}>
            <Title>Profiles</Title>
            {profiles.map((p, i) => <div key={i} style={{ marginBottom: '4pt', ...typo.bullet }}>{p}</div>)}
          </div>
        )}

        {/* Languages */}
        {r.languages?.length > 0 && (
          <div style={{ marginBottom: '20pt' }}>
            <Title>Languages</Title>
            {r.languages.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2pt', ...typo.bullet }}>
                <span>{l.language}</span>
                <span style={typo.role}>{l.proficiency}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT MAIN (67%) */}
      <div style={{ width: '67%', padding: '24pt 24pt 24pt 20pt' }}>
        
        {/* Name Header */}
        <div style={{ marginBottom: '20pt' }}>
          <h1 style={{ ...typo.name, fontSize: '28pt', lineHeight: 1.1 }}>{pInfo(pi)}</h1>
          {pi.professionalTitle && <div style={{ ...typo.role, fontSize: '14pt', fontWeight: 'bold', marginTop: '4pt' }}>{pi.professionalTitle}</div>}
        </div>

        <DynamicSection title="Profile" condition={r.summary}>
          <p style={{ margin: 0, ...typo.bullet }}>{r.summary}</p>
        </DynamicSection>

        <DynamicSection title="Experience" items={r.experience}>
          {r.experience?.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...typo.company, fontSize: '12pt' }}>{exp.company}</span>
                <span style={typo.date}>{dateRange(exp.startDate, exp.endDate, exp.isCurrent)}</span>
              </div>
              <div style={{ ...typo.role, marginBottom: '4pt' }}>
                {[exp.role, exp.location].filter(Boolean).join(' | ')}
              </div>
              <RenderBullets items={exp.responsibilities} />
            </div>
          ))}
        </DynamicSection>

        <DynamicSection title="Internships" items={r.internships}>
          {r.internships?.map((intern, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...typo.company, fontSize: '12pt' }}>{intern.company}</span>
                <span style={typo.date}>{dateRange(intern.startDate, intern.endDate, false)}</span>
              </div>
              <div style={{ ...typo.role, marginBottom: '4pt' }}>
                {[intern.role, intern.location].filter(Boolean).join(' | ')}
              </div>
              <RenderBullets items={intern.responsibilities} />
            </div>
          ))}
        </DynamicSection>

        <DynamicSection title="Projects & Research" condition={r.projects?.length > 0 || r.research?.length > 0 || r.publications?.length > 0}>
          {r.projects?.map((proj, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ ...typo.company, fontSize: '12pt' }}>{proj.name}</span>
                {proj.dates && <span style={typo.date}>{proj.dates}</span>}
              </div>
              {proj.technologies?.length > 0 && <div style={{ ...typo.role, marginBottom: '4pt' }}>{proj.technologies.join(', ')}</div>}
              <RenderBullets items={proj.description} />
            </div>
          ))}
          {r.research?.map((res, i) => (
            <div key={`r-${i}`} style={{ marginBottom: '10pt' }}>
              <span style={{ ...typo.company, fontSize: '12pt' }}>{res.title}</span> <span style={typo.role}> — {res.institution}</span>
              <p style={{ margin: 0, ...typo.bullet }}>{res.description}</p>
            </div>
          ))}
          {r.publications?.map((pub, i) => (
            <div key={`p-${i}`} style={{ marginBottom: '10pt' }}>
              <span style={{ ...typo.company, fontSize: '12pt' }}>{pub.title}</span> <span style={typo.role}> — {pub.publisher}</span>
            </div>
          ))}
        </DynamicSection>

        <DynamicSection title="Activities, Awards & More" condition={r.certifications?.length > 0 || r.awards?.length > 0 || r.extracurricular?.length > 0 || r.volunteering?.length > 0 || r.hackathons?.length > 0 || r.achievements?.length > 0}>
           <ul style={{ margin: 0, paddingLeft: '14pt', listStyleType: 'disc' }}>
             {r.certifications?.map((c, i) => <li key={`c-${i}`} style={typo.bullet}><span style={typo.company}>{c.name}</span> {c.issuer && <span style={typo.role}>— {c.issuer}</span>}</li>)}
             {r.awards?.map((a, i) => <li key={`a-${i}`} style={typo.bullet}><span style={typo.company}>{a.title}</span> {a.issuer && <span style={typo.role}>— {a.issuer}</span>}</li>)}
             {r.extracurricular?.map((ex, i) => <li key={`e-${i}`} style={typo.bullet}><span style={typo.company}>{ex.activity}</span> {ex.role && <span style={typo.role}>— {ex.role}</span>}</li>)}
             {r.volunteering?.map((vol, i) => <li key={`vol-${i}`} style={typo.bullet}><span style={typo.company}>{vol.organization}</span> {vol.role && <span style={typo.role}>— {vol.role}</span>}</li>)}
             {r.hackathons?.map((h, i) => <li key={`h-${i}`} style={typo.bullet}><span style={typo.company}>{h.name}</span> {h.project && <span style={typo.role}>— {h.project}</span>}</li>)}
             {r.achievements?.map((ach, i) => <li key={`ach-${i}`} style={typo.bullet}>{typeof ach === 'string' ? ach : ach.title}</li>)}
           </ul>
        </DynamicSection>

      </div>
    </div>
  );
}

// ── Export Dictionary ────────────────────────────────────────────────────────

export const TEMPLATES = [
  { id: 'standard', name: 'Standard (Clean)', label: 'Standard (Clean)', render: StandardTemplate },
  { id: 'compact', name: 'Compact (Dense)', label: 'Compact (Dense)', render: CompactTemplate },
  { id: 'centered', name: 'Centered (Modern)', label: 'Centered (Modern)', render: CenteredTemplate },
  { id: 'structured', name: 'Structured (Academic)', label: 'Structured (Academic)', render: StructuredTemplate },
  { id: 'split', name: 'Split (Two Column)', label: 'Split (Two Column)', render: SplitTemplate },
];

const ResumeTemplatesV2 = forwardRef(({ resumeData, templateId }, ref) => {
  const T = TEMPLATES.find(t => t.id === templateId)?.render || TEMPLATES[0].render;
  return (
    <div ref={ref} id="resume-preview-v2" className="resume-preview-v2" style={{ width: '210mm', minHeight: '297mm', background: '#fff', margin: '0 auto', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
      <T r={resumeData || {}} />
    </div>
  );
});

export default ResumeTemplatesV2;
