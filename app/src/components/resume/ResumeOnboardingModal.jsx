/**
 * ResumeOnboardingModal.jsx
 * Two-path onboarding: "Build from Scratch" (9-step wizard) or "Upload Resume"
 * Shown when a user has no resume yet.
 */

import React, { useState, useRef, useCallback } from 'react';
import { normalizeResume, createEmptyResume } from '../../utils/resumeNormalizer';
import { markOnboardingDone } from '../../hooks/useResume';

const DEGREE_OPTIONS = [
  'Bachelor of Technology (B.Tech)', 'Bachelor of Engineering (B.E)',
  'Bachelor of Science (B.Sc)', 'Bachelor of Computer Applications (BCA)',
  'Master of Technology (M.Tech)', 'Master of Science (M.Sc)',
  'Master of Computer Applications (MCA)', 'MBA', 'PhD', 'Diploma', 'Other',
];
const FIELD_OPTIONS = [
  'Computer Science', 'Artificial Intelligence', 'Machine Learning', 'Data Science',
  'Information Technology', 'Software Engineering', 'Cyber Security', 'Electronics',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Finance', 'Marketing', 'Other',
];
const EMPLOYMENT_TYPES = ['Full Time', 'Internship', 'Contract', 'Part Time', 'Freelance'];
const LOCATION_TYPES   = ['Onsite', 'Remote', 'Hybrid'];
const PROF_LEVELS      = ['Beginner', 'Intermediate', 'Advanced', 'Native'];

import { API_BASE as API } from '../../config/api';

const SKILL_CATEGORIES = ['programming', 'frameworks', 'databases', 'cloud', 'devops', 'tools', 'softSkills'];
const SKILL_LABELS = {
  programming: 'Programming Languages', frameworks: 'Frameworks & Libraries',
  databases: 'Databases', cloud: 'Cloud Platforms', devops: 'DevOps & Tools',
  tools: 'Other Tools', softSkills: 'Soft Skills',
};

export default function ResumeOnboardingModal({ onComplete, onClose, token }) {
  const [path, setPath] = useState(null); // null | 'scratch' | 'upload'
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(createEmptyResume());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ── Upload path ──────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(ext)) {
      setUploadError(`Unsupported file type ".${ext}". Please upload a PDF, DOC, or DOCX file.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size/(1024*1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await fetch(`${API}/resume/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.resume?.resumeData) {
        markOnboardingDone();
        onComplete(normalizeResume(data.resume.resumeData));
      } else {
        setUploadError(data.message || 'Upload failed. Please try again.');
      }
    } catch (e) {
      setUploadError('Network error during upload. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  }, [token, onComplete]);

  // ── Scratch wizard steps ─────────────────────────────────────────────────
  const STEPS = [
    { id: 'personal',   label: 'Personal Info'    },
    { id: 'summary',    label: 'Summary'           },
    { id: 'education',  label: 'Education'         },
    { id: 'experience', label: 'Experience'        },
    { id: 'projects',   label: 'Projects'          },
    { id: 'skills',     label: 'Skills'            },
    { id: 'certs',      label: 'Certifications'    },
    { id: 'languages',  label: 'Languages'         },
    { id: 'review',     label: 'Review & Finish'   },
  ];

  const handleFinish = () => onComplete(form);

  const updatePi   = (k, v) => setForm(f => ({ ...f, personalInfo: { ...f.personalInfo, [k]: v } }));
  const updateField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addExp    = () => setForm(f => ({ ...f, experience: [...f.experience, { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', isCurrent: false, responsibilities: [''] }] }));
  const rmExp     = (i) => setForm(f => ({ ...f, experience: f.experience.filter((_, k) => k !== i) }));
  const updExp    = (i, k, v) => setForm(f => { const a = [...f.experience]; a[i] = { ...a[i], [k]: v }; return { ...f, experience: a }; });
  const addProj   = () => setForm(f => ({ ...f, projects: [...f.projects, { id: Date.now().toString(), name: '', description: '', technologies: [], github: '' }] }));
  const rmProj    = (i) => setForm(f => ({ ...f, projects: f.projects.filter((_, k) => k !== i) }));
  const updProj   = (i, k, v) => setForm(f => { const a = [...f.projects]; a[i] = { ...a[i], [k]: v }; return { ...f, projects: a }; });
  const addEdu    = () => setForm(f => ({ ...f, education: [...f.education, { id: Date.now().toString(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }] }));
  const rmEdu     = (i) => setForm(f => ({ ...f, education: f.education.filter((_, k) => k !== i) }));
  const updEdu    = (i, k, v) => setForm(f => { const a = [...f.education]; a[i] = { ...a[i], [k]: v }; return { ...f, education: a }; });

  // ── Styles ────────────────────────────────────────────────────────────────
  const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,30,35,.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const modal   = { background: 'var(--bg-card)', borderRadius: 18, boxShadow: '0 24px 64px rgba(0,0,0,.18)', width: '92%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeUp .3s ease both' };
  const inp     = { display: 'block', width: '100%', fontFamily: 'inherit', fontSize: 13, padding: '9px 12px', borderRadius: 8, outline: 'none', border: '1.5px solid var(--border-md)', background: '#fff', color: 'var(--text-h)', marginBottom: 10, boxSizing: 'border-box' };
  const lbl     = { fontSize: 11, fontWeight: 600, color: 'var(--text-m)', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: .5 };

  // ── Path selection screen ─────────────────────────────────────────────────
  if (!path) {
    return (
      <div style={overlay}>
        <div style={modal}>
          {/* X Close button */}
          <button onClick={() => { markOnboardingDone(); onClose(); }}
            style={{ position:'absolute', top:16, right:16, background:'none', border:'none',
              cursor:'pointer', fontSize:22, color:'var(--text-m)', lineHeight:1, zIndex:10 }}>×</button>

          <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: 'var(--text-h)' }}>Get started with your resume</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--text-m)', fontSize: 14 }}>How would you like to create your resume?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Upload */}
              <button
                onClick={() => setPath('upload')}
                style={{ padding: 20, borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>⬆️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)', marginBottom: 4 }}>Upload Resume</div>
                <div style={{ fontSize: 12, color: 'var(--text-m)' }}>Upload PDF/DOCX and we'll auto-populate your resume</div>
              </button>
              {/* Scratch */}
              <button
                onClick={() => setPath('scratch')}
                style={{ padding: 20, borderRadius: 12, border: '1.5px solid var(--primary)', background: 'var(--primary-lt)', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}
              >
                <div style={{ fontSize: 26, marginBottom: 8 }}>✏️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>Build from Scratch</div>
                <div style={{ fontSize: 12, color: 'var(--primary)' }}>Step-by-step guided builder</div>
              </button>
            </div>
          </div>
          <div style={{ padding: '0 28px 20px', textAlign: 'center' }}>
            <button onClick={() => { markOnboardingDone(); onClose(); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-m)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Upload path ───────────────────────────────────────────────────────────
  if (path === 'upload') {
    return (
      <div style={overlay}>
        <div style={{ ...modal, position:'relative' }}>
          {/* X button */}
          <button onClick={() => { markOnboardingDone(); onClose(); }}
            style={{ position:'absolute', top:14, right:16, background:'none', border:'none',
              cursor:'pointer', fontSize:22, color:'var(--text-m)', lineHeight:1, zIndex:10 }}>×</button>

          <div style={{ padding: '24px 28px 20px' }}>
            <button onClick={() => setPath(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-m)', marginBottom: 16 }}>← Back</button>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: 'var(--text-h)' }}>Upload your resume</h2>
            <p style={{ margin: '0 0 20px', color: 'var(--text-m)', fontSize: 13 }}>We'll parse it and auto-fill all sections. PDF, DOC, or DOCX · Max 10 MB</p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border-md)'}`,
                borderRadius: 12, padding: 36, textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'var(--primary-lt)' : 'var(--bg-subtle)',
                transition: 'all .2s', marginBottom: 16,
              }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFileUpload(e.target.files[0])} />
              {uploading ? (
                <div>
                  <div className="spinner" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 12px', animation:'spin 1s linear infinite' }} />
                  <div style={{ fontSize: 14, color: 'var(--text-m)' }}>Parsing your resume... this may take up to 30 seconds</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-h)', marginBottom: 4 }}>Drop your resume here</div>
                  <div style={{ fontSize: 12, color: 'var(--text-m)' }}>or click to browse · PDF, DOC, DOCX · Max 10 MB</div>
                </>
              )}
            </div>
            {uploadError && (
              <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, padding: '10px 14px',
                background: '#fef2f2', border:'1px solid #fecaca', borderRadius: 8, lineHeight:1.5 }}>
                ⚠ {uploadError}
              </div>
            )}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Scratch wizard ────────────────────────────────────────────────────────
  const pi      = form.personalInfo || {};
  const curStep = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  const renderStep = () => {
    switch (curStep.id) {
      case 'personal': return (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            {[['firstName','First Name'],['lastName','Last Name'],['email','Email'],['phone','Phone'],['location','City, State / Country']].map(([k, l]) => (
              <div key={k} style={{ gridColumn: k === 'location' ? '1/-1' : '' }}>
                <label style={lbl}>{l}</label>
                <input style={inp} value={pi[k] || ''} onChange={e => updatePi(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            {[['linkedin','LinkedIn URL'],['github','GitHub URL'],['portfolio','Portfolio URL']].map(([k,l]) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input style={inp} value={pi[k] || ''} onChange={e => updatePi(k, e.target.value)} placeholder={k === 'linkedin' ? 'linkedin.com/in/...' : ''} />
              </div>
            ))}
          </div>
        </div>
      );

      case 'summary': return (
        <div>
          <label style={lbl}>Professional Summary</label>
          <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.summary || ''} onChange={e => updateField('summary', e.target.value)} placeholder="3-4 sentences highlighting your expertise, top skills, and career goals..." />
          <div style={{ fontSize: 11, color: 'var(--text-m)' }}>{(form.summary || '').split(/\s+/).filter(Boolean).length} words · Aim for 40–80</div>
        </div>
      );

      case 'education': return (
        <div>
          {form.education.map((edu, i) => (
            <div key={edu.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>#{i+1}</span>
                <button onClick={() => rmEdu(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-m)', fontSize: 18 }}>×</button>
              </div>
              <label style={lbl}>Institution / University</label>
              <input style={inp} value={edu.institution || ''} onChange={e => updEdu(i, 'institution', e.target.value)} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <div>
                  <label style={lbl}>Degree</label>
                  <select style={inp} value={edu.degree || ''} onChange={e => updEdu(i, 'degree', e.target.value)}>
                    <option value="">Select degree…</option>
                    {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Field of Study</label>
                  <select style={inp} value={edu.field || ''} onChange={e => updEdu(i, 'field', e.target.value)}>
                    <option value="">Select field…</option>
                    {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Start Year</label>
                  <input style={inp} value={edu.startDate || ''} onChange={e => updEdu(i, 'startDate', e.target.value)} placeholder="2020" />
                </div>
                <div>
                  <label style={lbl}>Graduation Year</label>
                  <input style={inp} value={edu.endDate || ''} onChange={e => updEdu(i, 'endDate', e.target.value)} placeholder="2024" />
                </div>
              </div>
              <label style={lbl}>GPA / CGPA (optional)</label>
              <input style={inp} value={edu.gpa || ''} onChange={e => updEdu(i, 'gpa', e.target.value)} />
            </div>
          ))}
          <button onClick={addEdu} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed var(--border-md)', background: 'transparent', cursor: 'pointer', color: 'var(--text-m)', fontSize: 13 }}>
            + Add Education
          </button>
        </div>
      );

      case 'experience': return (
        <div>
          {form.experience.map((exp, i) => (
            <div key={exp.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>#{i+1}</span>
                <button onClick={() => rmExp(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-m)', fontSize: 18 }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <div>
                  <label style={lbl}>Job Title / Role</label>
                  <input style={inp} value={exp.role || ''} onChange={e => updExp(i, 'role', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Company</label>
                  <input style={inp} value={exp.company || ''} onChange={e => updExp(i, 'company', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>Employment Type</label>
                  <select style={inp} value={exp.employmentType || 'Full Time'} onChange={e => updExp(i, 'employmentType', e.target.value)}>
                    {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Location Type</label>
                  <select style={inp} value={exp.locationType || 'Onsite'} onChange={e => updExp(i, 'locationType', e.target.value)}>
                    {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Start Date</label>
                  <input style={inp} value={exp.startDate || ''} onChange={e => updExp(i, 'startDate', e.target.value)} placeholder="e.g. Jan 2022 or 2022" />
                </div>
                <div>
                  <label style={lbl}>End Date</label>
                  <input style={inp} value={exp.isCurrent ? 'Present' : (exp.endDate || '')} placeholder="e.g. Dec 2023" onChange={e => updExp(i, 'endDate', e.target.value)} disabled={exp.isCurrent} />
                </div>
              </div>
              <div>
                <label style={lbl}>Location</label>
                <input style={inp} value={exp.location || ''} onChange={e => updExp(i, 'location', e.target.value)} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, cursor: 'pointer', fontSize: 12 }}>
                <input type="checkbox" checked={exp.isCurrent} onChange={e => updExp(i, 'isCurrent', e.target.checked)} />
                Currently working here
              </label>
            </div>
          ))}
          <button onClick={addExp} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed var(--border-md)', background: 'transparent', cursor: 'pointer', color: 'var(--text-m)', fontSize: 13 }}>
            + Add Experience
          </button>
        </div>
      );

      case 'projects': return (
        <div>
          {form.projects.map((proj, i) => (
            <div key={proj.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>#{i+1}</span>
                <button onClick={() => rmProj(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-m)', fontSize: 18 }}>×</button>
              </div>
              {[['name','Project Name'],['description','Brief Description'],['github','GitHub URL'],['liveLink','Live Link (optional)']].map(([k,l]) => (
                <div key={k}>
                  <label style={lbl}>{l}</label>
                  {k === 'description'
                    ? <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={proj[k] || ''} onChange={e => updProj(i, k, e.target.value)} />
                    : <input style={inp} value={proj[k] || ''} onChange={e => updProj(i, k, e.target.value)} />
                  }
                </div>
              ))}
              <label style={lbl}>Technologies (comma-separated)</label>
              <input style={inp} value={(proj.technologies || []).join(', ')} onChange={e => updProj(i, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </div>
          ))}
          <button onClick={addProj} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed var(--border-md)', background: 'transparent', cursor: 'pointer', color: 'var(--text-m)', fontSize: 13 }}>
            + Add Project
          </button>
        </div>
      );

      case 'skills': return (
        <div>
          {SKILL_CATEGORIES.map(cat => (
            <div key={cat}>
              <label style={lbl}>{SKILL_LABELS[cat]}</label>
              <input style={inp} placeholder="Comma separated" value={(form.skills[cat] || []).join(', ')}
                onChange={e => setForm(f => ({ ...f, skills: { ...f.skills, [cat]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} />
            </div>
          ))}
        </div>
      );

      case 'certs': return (
        <div>
          <label style={lbl}>Certifications (one per line)</label>
          <textarea
            style={{ ...inp, minHeight: 120, resize: 'vertical' }}
            placeholder={'AWS Certified Solutions Architect\nGoogle Professional Data Engineer\n...'}
            value={form.certifications.map(c => typeof c === 'string' ? c : c.name).join('\n')}
            onChange={e => setForm(f => ({ ...f, certifications: e.target.value.split('\n').filter(Boolean).map((n, i) => ({ id: `cert-${i}`, name: n, issuer: '', date: '', url: '' })) }))}
          />
        </div>
      );

      case 'languages': return (
        <div>
          <label style={lbl}>Languages</label>
          {form.languages.map((lang, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'0 8px', marginBottom:8, alignItems:'center' }}>
              <input style={{ ...inp, marginBottom:0 }} placeholder="e.g. English"
                value={typeof lang === 'string' ? lang : (lang.language || '')}
                onChange={e => {
                  const arr = [...form.languages];
                  arr[i] = { ...arr[i], language: e.target.value };
                  setForm(f => ({ ...f, languages: arr }));
                }} />
              <select style={{ ...inp, marginBottom:0 }}
                value={typeof lang === 'string' ? '' : (lang.proficiency || '')}
                onChange={e => {
                  const arr = [...form.languages];
                  arr[i] = { ...arr[i], proficiency: e.target.value };
                  setForm(f => ({ ...f, languages: arr }));
                }}>
                <option value="">Proficiency…</option>
                {['Beginner','Intermediate','Advanced','Native'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => setForm(f => ({ ...f, languages: f.languages.filter((_,k) => k !== i) }))}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-m)', fontSize:18, padding:'0 4px' }}>×</button>
            </div>
          ))}
          <button onClick={() => setForm(f => ({ ...f, languages: [...f.languages, { language:'', proficiency:'' }] }))}
            style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px dashed var(--border-md)',
              background:'transparent', cursor:'pointer', color:'var(--text-m)', fontSize:13 }}>
            + Add Language
          </button>
        </div>
      );

      case 'review': return (
        <div>
          <div style={{ background: 'var(--primary-lt)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>✅ Resume Summary</div>
            {[
              ['Name', [pi.firstName, pi.lastName].filter(Boolean).join(' ') || '—'],
              ['Email', pi.email || '—'],
              ['Experience', `${form.experience.length} entries`],
              ['Education', `${form.education.length} entries`],
              ['Projects', `${form.projects.length} entries`],
              ['Total Skills', `${Object.values(form.skills).flat().filter(Boolean).length} skills`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-m)' }}>{k}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-m)' }}>
            Your resume is ready. You can continue editing any section after setup. The AI optimizer will help you tailor it to specific jobs.
          </p>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={overlay}>
      <div style={{ ...modal, position:'relative' }}>
        {/* X Close button */}
        <button onClick={() => { markOnboardingDone(); onClose(); }}
          style={{ position:'absolute', top:14, right:16, background:'none', border:'none',
            cursor:'pointer', fontSize:22, color:'var(--text-m)', lineHeight:1, zIndex:10 }}>×</button>

        {/* Header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button onClick={() => setPath(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-m)' }}>←</button>
            <span style={{ fontSize: 12, color: 'var(--text-m)' }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          {/* Progress bar */}
          <div className="progress-track" style={{ height: 6 }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-h)', marginTop: 12 }}>{curStep.label}</div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {renderStep()}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <button
            className="btn btn-ghost btn-md"
            onClick={() => step > 0 ? setStep(s => s - 1) : setPath(null)}
          >
            {step === 0 ? 'Back' : '← Previous'}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-md" onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary btn-md" onClick={handleFinish} style={{ minWidth: 140 }}>
              🎉 Create Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
