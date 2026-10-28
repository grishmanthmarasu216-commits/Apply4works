import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import html2pdf from 'html2pdf.js'
import { enhanceResume } from '../utils/aiEnhancer'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ResumeWorkspace from '../components/ResumeWorkspace'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api'

const STEPS = ['Profile', 'Select Job', 'Workspace']

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ResumeBuilder ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <Sidebar />
          <div className="flex-1 p-10 flex items-center justify-center" style={{ marginLeft: 240 }}>
            <div className="card p-10 text-center text-red-600 font-bold max-w-lg shadow-sm">
              <h2 className="text-xl mb-4">Something went wrong</h2>
              <p className="text-sm text-gray-700">We caught an error while rendering your resume to prevent the app from crashing. Please check your data or try refreshing the page.</p>
              <button className="btn btn-primary mt-6" onClick={() => window.location.reload()}>Reload Page</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ResumeBuilderContent() {
  const { jobs, applyToJob, toast } = useApp()
  const { currentUser, storedPrefs } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedId = searchParams.get('job')

  const user = currentUser || {}
  const preferences = storedPrefs || { roles: [], domains: [], skills: [], location: '', experienceLevel: '', salaryExpectation: '' }

  const [step, setStep]       = useState(0)
  const [selJob, setSelJob]   = useState(null)
  const [dbJobs, setDbJobs]   = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingResume, setLoadingResume] = useState(true)
  const [zoom, setZoom]       = useState(0.9)
  const [viewMode, setViewMode] = useState('resume') // 'resume' | 'coverLetter'
  const [fullScreen, setFullScreen] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const [copied, setCopied]   = useState(false)
  const [form, setForm]       = useState({
    name:        user.name || '',
    email:       user.email || '',
    phone:       user.phone || '',
    location:    preferences.location || '',
    github:      '',
    linkedin:    '',
    portfolio:   '',
    leetcode:    '',
    hackerrank:  '',
    summary:     '',
    experience:  [],
    projects:    [],
    education:   [],
    skills:      [...new Set([...(preferences.skills || [])])].join(', '),
    tools:       '',
    certifications: '',
    achievements: [],
    languages: [],
    publications: []
  })

  // Safe normalize functions to avoid .split crashes
  const getArrayFromField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') return field.split(',').map(s => s.trim()).filter(Boolean);
    if (typeof field === 'object') {
      let arr = [];
      for (const val of Object.values(field)) {
        if (Array.isArray(val)) arr.push(...val);
        else if (typeof val === 'string') arr.push(...val.split(',').map(s => s.trim()));
      }
      return arr.filter(Boolean);
    }
    return [];
  };

  const getStringFromField = (field, separator = ', ') => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field.join(separator);
    return '';
  };

  useEffect(() => {
    async function fetchResume() {

      const token = localStorage.getItem('authToken')
      if (!token) {
        setLoadingResume(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE}/resume/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.resume && (data.resume.optimized || data.resume.parsed)) {
            const p = data.resume.optimized || data.resume.parsed
            setForm(f => {
              const prevSkills = getArrayFromField(f.skills);
              const pSkills = getArrayFromField(p.skills);
              return {
                ...f,
                name: f.name || p.fullName || '',
                email: f.email || p.email || '',
                phone: f.phone || p.phone || '',
                linkedin: p.linkedin || f.linkedin,
                github: p.github || f.github,
                portfolio: p.portfolio || f.portfolio,
                leetcode: p.leetcode || f.leetcode,
                hackerrank: p.hackerrank || f.hackerrank,
                summary: f.summary || p.summary || '',
                tools: p.tools?.length > 0 ? getStringFromField(p.tools) : f.tools,
                certifications: p.certifications?.length > 0 ? getStringFromField(p.certifications, '\n') : f.certifications,
                achievements: p.achievements?.length > 0 ? getArrayFromField(p.achievements) : f.achievements,
                languages: p.languages?.length > 0 ? getArrayFromField(p.languages) : f.languages,
                publications: p.publications?.length > 0 ? getArrayFromField(p.publications) : f.publications,
                skills: pSkills.length > 0 ? [...new Set([...pSkills, ...prevSkills])].join(', ') : f.skills,
                experience: p.experience || [],
                projects: p.projects || [],
                education: p.education?.length > 0 ? p.education.map(e => typeof e === 'string' ? { institution: e, degree: '', duration: '', cgpa: '' } : e) : [],
              }
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch resume', err)
      } finally {
        setLoadingResume(false)
      }
    }
    fetchResume()
  }, [])

  useEffect(() => {
    if (step === 1) {
      setLoadingJobs(true)

      const token = localStorage.getItem('authToken');
      fetch(`${API_BASE}/jobs`, { 
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          const fetchedJobs = Array.isArray(data) ? data : (data.jobs || [])
          setDbJobs(fetchedJobs)
          setLoadingJobs(false)
        })
        .catch(err => {
          console.error('[ResumeBuilder] Failed to fetch jobs', err)
          setDbJobs([])
          setLoadingJobs(false)
        })
    }
  }, [step])

  // Removed unused useEffect for loadingMsgIdx

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  
  function updateArrayItem(key, index, field, value) {
    setForm(f => {
      const arr = Array.isArray(f[key]) ? [...f[key]] : [];
      if (!arr[index]) arr[index] = {};
      arr[index] = { ...arr[index], [field]: value }
      return { ...f, [key]: arr }
    })
  }

  function addArrayItem(key, emptyObj) {
    setForm(f => {
      const arr = Array.isArray(f[key]) ? f[key] : [];
      return { ...f, [key]: [...arr, emptyObj] };
    })
  }

  function removeArrayItem(key, index) {
    setForm(f => {
      const arr = Array.isArray(f[key]) ? [...f[key]] : [];
      arr.splice(index, 1);
      return { ...f, [key]: arr };
    })
  }

  // Show all jobs, sorted by match score
  const sortedJobs = [...dbJobs].sort((a, b) => (b.prefMatchScore ?? b.matchScore ?? 0) - (a.prefMatchScore ?? a.matchScore ?? 0))

  function generate(job) {
    setSelJob(job)
    setStep(2) // Jump directly to Workspace
  }

  async function handleOptimize() {
    setIsOptimizing(true);
    toast('Optimizing with AI...');
    try {
      const enhancedData = await enhanceResume(form, selJob);
      setForm(enhancedData);
      toast('Resume Optimized! ✨');
    } catch (err) {
      console.error('[ResumeBuilder] Optimization failed:', err);
      toast('Optimization encountered an error.', 'error');
    } finally {
      setIsOptimizing(false);
    }
  }

  // Auto-trigger generation if opened from a job card (Direct to Generating)
  useEffect(() => {
    if (preselectedId && !loadingResume && step === 0) {
      async function autoTailor() {
        setStep(2); // Generating
        try {

          const token = localStorage.getItem('authToken');
          const res = await fetch(`${API_BASE}/jobs/${preselectedId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          const data = await res.json();
          const targetJob = data.job || data.data || data;
          if (targetJob && targetJob.title) {
            generate(targetJob);
          } else {
            setStep(1);
          }
        } catch (err) {
          setStep(1);
        }
      }
      autoTailor();
    }
  }, [preselectedId, loadingResume, step]);


  function handleDownload() { 
    toast('Generating A4 PDF…')
    const element = document.getElementById(viewMode === 'resume' ? 'resume-pdf-container' : 'coverletter-pdf-container')
    if (element) {
      const originalTransform = element.style.transform;
      element.style.transform = 'scale(1)';
      
      const opt = {
        margin:       0,
        filename:     `${form.name ? form.name.replace(/\s+/g, '_') : 'My'}_${viewMode === 'resume' ? 'Resume' : 'CoverLetter'}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 3, useCORS: true, logging: false }, // high quality
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      }
      
      html2pdf().set(opt).from(element).save().then(() => {
        element.style.transform = originalTransform;
        toast('Downloaded ✓')
      })
    }
  }

  function handleImprove() { toast('Click "Add Recommended Keywords" in the workspace to improve.') }

  const job = selJob || dbJobs[0] || {}

  const getFontFamily = () => 'Inter, system-ui, sans-serif';

  const renderTextWithHighlights = (text) => {
    if (typeof text !== 'string') return text || '';
    const regex = /(\$?\d+(?:\.\d+)?[%MKB+]*)/g;
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <strong key={i} style={{ color: '#111827' }}>{part}</strong> : part
    );
  };

  const safeExperience = Array.isArray(form.experience) ? form.experience : [];
  const safeProjects = Array.isArray(form.projects) ? form.projects : [];
  const safeEducation = Array.isArray(form.education) ? form.education : [];
  
  const displaySkills = getStringFromField(form.skills);
  const displayCertifications = getStringFromField(form.certifications, '\n');

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {!fullScreen && <Sidebar />}
      <div className="flex-1" style={{ marginLeft: fullScreen ? 0 : 240, transition: 'margin 0.3s' }}>
        {!fullScreen && (
          <TopBar title="AI Resume Builder" subtitle="Create tailored ATS-friendly resumes" />
        )}
        <main className={`${fullScreen ? 'p-0 h-screen' : 'p-7'} flex flex-col gap-6`} style={{ height: fullScreen ? '100vh' : 'auto' }}>
          
          {!fullScreen && (
            <div className="card p-4 flex items-center gap-2 overflow-x-auto">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: i <= step ? 'var(--primary)' : 'var(--bg-subtle)', color: i <= step ? '#fff' : 'var(--text-m)', border: i > step ? '1.5px solid var(--border-md)' : 'none' }}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    <span className="text-xs font-semibold hidden sm:block"
                      style={{ color: i === step ? 'var(--primary)' : i < step ? 'var(--text-b)' : 'var(--text-m)' }}>{s}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="h-px w-6" style={{ background: i < step ? 'var(--primary)' : 'var(--border)' }} />}
                </div>
              ))}
            </div>
          )}

          {step === 0 && (
            loadingResume ? (
              <div className="card p-16 flex items-center justify-center" style={{ minHeight: 400 }}>
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)' }} />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto w-full">
                <div className="card p-8 flex flex-col gap-4 shadow-sm border border-gray-100">
                  <h2 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Your Profile Details</h2>
                  <p className="text-xs text-gray-500 mb-2">Review your parsed profile before generating a customized resume.</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[['Full Name','name'],['Email','email'],['Phone','phone'],['Location','location'],['GitHub Link','github'],['LinkedIn','linkedin'],['LeetCode','leetcode'],['HackerRank','hackerrank']].map(([lbl, k]) => (
                      <div key={k}>
                        <label className="text-xs font-bold uppercase tracking-wide block mb-1" style={{ color: 'var(--text-m)' }}>{lbl}</label>
                        <input className="input" value={form[k] || ''} onChange={e => set(k, e.target.value)} />
                      </div>
                    ))}
                  </div>

                    {/* Removed duplicated experience array here, it is now in ResumeWorkspace / ResumeEditor */}

                    {/* Removed duplicated projects array here */}

                  {/* Skills */}
                  <div className="mt-2">
                    <label className="text-xs font-bold uppercase block mb-1" style={{ color: 'var(--text-m)' }}>Skills</label>
                    <input className="input" value={displaySkills} onChange={e => set('skills', e.target.value)} />
                  </div>

                  {/* Certifications */}
                  <div className="mt-2">
                    <label className="text-xs font-bold uppercase block mb-1" style={{ color: 'var(--text-m)' }}>Certifications</label>
                    <textarea className="input" rows={3} value={displayCertifications} onChange={e => set('certifications', e.target.value)} />
                  </div>

                  <button className="btn btn-primary btn-md mt-4" onClick={async () => {
                    if (preselectedId) {
                      setStep(2);
                      try {

                        const token = localStorage.getItem('authToken');
                        const res = await fetch(`${API_BASE}/jobs/${preselectedId}`, {
                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                        });
                        const data = await res.json();
                        const targetJob = data.job || data.data || data;
                        if (targetJob && targetJob.title) {
                          generate(targetJob);
                        } else {
                          setStep(1);
                        }
                      } catch (err) {
                        setStep(1);
                      }
                    } else {
                      setStep(1);
                    }
                  }}>
                    {preselectedId ? 'Tailor Resume for Job →' : 'Continue → Target Job'}
                  </button>
                </div>
              </div>
            )
          )}

          {step === 1 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Select Target Job for Tailoring</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(0)}>← Back</button>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loadingJobs ? (
                  <div className="col-span-full py-10 text-center">Loading jobs...</div>
                ) : sortedJobs.map(j => (
                  <div key={j.id || j._id} className="card p-5 flex flex-col gap-4 hover:-translate-y-0.5 transition-transform border border-green-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{j.title}</h3>
                      <span className="badge badge-green">Match</span>
                    </div>
                    <p className="text-xs text-gray-500">{j.company}</p>
                    <button className="btn btn-primary btn-sm mt-auto" onClick={() => generate(j)}>Tailor Resume →</button>
                  </div>
                ))}
                {sortedJobs.length === 0 && !loadingJobs && (
                  <div className="col-span-full py-10 text-center text-sm text-gray-500">
                    No relevant jobs found matching your onboarding preferences.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <ResumeWorkspace 
              form={form} 
              job={selJob} 
              set={set} 
              updateArrayItem={updateArrayItem} 
              addArrayItem={addArrayItem} 
              removeArrayItem={removeArrayItem}
              onOptimize={handleOptimize}
              isOptimizing={isOptimizing}
            >
              {/* Preview Area Component Passed as Children to Workspace */}
              <div className="flex flex-col w-full bg-white rounded-xl overflow-hidden shadow-sm h-full">
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-10 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-gray-700">Document Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('resume')}>Resume</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewMode('coverLetter')}>Cover Letter</button>
                    <button className="btn btn-primary btn-sm ml-2 shadow-sm" onClick={handleDownload}>⬇ Download PDF</button>
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>-</button>
                    <span className="text-xs font-semibold w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto flex justify-center p-8 custom-scrollbar relative w-full h-full bg-gray-100/50">
                  <div 
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {/* --- THE A4 PAPER --- */}
                    <div 
                      id={viewMode === 'resume' ? 'resume-pdf-container' : 'coverletter-pdf-container'}
                      style={{
                        width: '8.27in',       // Strict A4 Width
                        minHeight: '11.69in',  // Strict A4 Height
                        padding: '0.4in 0.5in', // Compact standard margins for 1-page ATS
                        background: '#ffffff',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)', // Subtle modern shadow, no massive gap
                        fontFamily: getFontFamily(),
                        color: '#000000',
                        boxSizing: 'border-box',
                        position: 'relative',
                        lineHeight: '1.35' // Tighter spacing for one page
                      }}
                    >
                      {viewMode === 'coverLetter' ? (
                        /* COVER LETTER VIEW */
                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '11pt', lineHeight: 1.6 }}>
                           <div style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '15px', marginBottom: '30px' }}>
                             <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>{form.name}</h1>
                             <p style={{ margin: '5px 0 0', fontSize: '10pt', color: '#666' }}>{form.email} | {form.phone} | {form.location}</p>
                           </div>
                           {form.coverLetterText || ''}
                        </div>
                      ) : (
                        /* RESUME VIEW - STRICT SECTION ORDER */
                        <>
                          {/* 1. Header */}
                          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 4px 0', color: 'inherit' }}>
                              {form.name}
                            </h1>
                            <div style={{ fontSize: '10pt', color: '#333', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              {[form.phone, form.email, form.location, typeof form.linkedin === 'string' ? form.linkedin.replace('https://', '').replace('www.', '') : '', typeof form.github === 'string' ? form.github.replace('https://', '').replace('www.', '') : '', typeof form.portfolio === 'string' ? form.portfolio.replace('https://', '').replace('www.', '') : ''].filter(Boolean).map((item, i, arr) => (
                                <span key={i}>{item}{i < arr.length - 1 ? ' | ' : ''}</span>
                              ))}
                            </div>
                          </div>

                          {(Array.isArray(form.sectionOrder) ? form.sectionOrder : ['Professional Summary', 'Education', 'Technical Skills', 'Experience', 'Projects', 'Certifications', 'Achievements']).map((sectionName) => {
                            if ((sectionName === 'Summary' || sectionName === 'Professional Summary') && typeof form.summary === 'string' && form.summary) {
                              return (
                                <div key="Summary" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Professional Summary</h2>
                                  <p style={{ fontSize: '10pt', margin: 0, lineHeight: '1.5' }}>{form.summary}</p>
                                </div>
                              )
                            }
                            if (sectionName === 'Education' && safeEducation.length > 0 && safeEducation[0]?.institution) {
                              return (
                                <div key="Education" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Education</h2>
                                  {safeEducation.map((edu, idx) => {
                                    const formatText = (txt) => {
                                      if (!txt) return '';
                                      if (Array.isArray(txt)) return txt.join(', ');
                                      if (typeof txt === 'string') return txt.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([a-zA-Z])([0-9])/g, '$1 $2');
                                      return String(txt);
                                    };
                                    return edu?.institution && (
                                    <div key={idx} style={{ marginBottom: '6px', pageBreakInside: 'avoid' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0px' }}>
                                        <strong style={{ fontSize: '10.5pt', color: '#111827' }}>{formatText(edu.institution)}</strong>
                                        <span style={{ fontSize: '10pt', fontWeight: '500', color: '#111827', whiteSpace: 'nowrap', marginLeft: '12px', textAlign: 'right' }}>
                                          {edu.duration || (edu.start_year ? `${edu.start_year}-${edu.end_year}` : '')}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          {edu.degree && (
                                            <span style={{ fontSize: '10pt', fontStyle: 'italic', color: '#111827', lineHeight: '1.3' }}>
                                              {formatText(edu.degree)}{edu.specialization ? `, ${formatText(edu.specialization)}` : ''}
                                            </span>
                                          )}
                                          {edu.board_or_university && (
                                            <span style={{ fontSize: '10pt', fontStyle: 'italic', color: '#111827', lineHeight: '1.3' }}>
                                              {formatText(edu.board_or_university)}
                                            </span>
                                          )}
                                        </div>
                                        <span style={{ fontSize: '10pt', fontWeight: '500', color: '#111827', textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '12px', lineHeight: '1.3' }}>
                                          {edu.cgpa ? (
                                            String(edu.cgpa).toLowerCase().includes('cgpa') || String(edu.cgpa).includes('%') ? formatText(edu.cgpa) : `CGPA: ${formatText(edu.cgpa)}`
                                          ) : (edu.cgpa_or_percentage && !edu.cgpa) ? (
                                            String(edu.cgpa_or_percentage).toLowerCase().includes('cgpa') || String(edu.cgpa_or_percentage).includes('%') ? formatText(edu.cgpa_or_percentage) : `CGPA: ${formatText(edu.cgpa_or_percentage)}`
                                          ) : null}
                                        </span>
                                      </div>
                                    </div>
                                  )})}
                                </div>
                              )
                            }
                            if ((sectionName === 'Skills' || sectionName === 'Technical Skills') && (form.skills || form.tools)) {
                              return (
                                <div key="Skills" style={{ marginBottom: '12px', pageBreakInside: 'avoid' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Technical Skills</h2>
                                  <div style={{ fontSize: '10pt', lineHeight: '1.5' }}>
                                    {form.groupedSkills && typeof form.groupedSkills === 'object' && Object.keys(form.groupedSkills).length > 0 ? (
                                      Object.entries(form.groupedSkills).map(([cat, skills]) => Array.isArray(skills) && skills.length > 0 && (
                                        <div key={cat} style={{ marginBottom: '4px' }}>
                                          <strong style={{ fontWeight: 'bold', color: '#111827' }}>{cat}:</strong> <span>{skills.join(', ')}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <p style={{ fontSize: '10pt', margin: 0 }}>{displaySkills}</p>
                                    )}
                                  </div>
                                </div>
                              )
                            }
                            if (sectionName === 'Experience' && safeExperience.length > 0 && safeExperience[0]?.company) {
                              return (
                                <div key="Experience" style={{ marginBottom: '12px' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left', pageBreakInside: 'avoid' }}>Professional Experience</h2>
                                  {safeExperience.map((exp, idx) => exp?.company && (
                                    <div key={idx} style={{ marginBottom: '8px', pageBreakInside: 'avoid' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                        <strong style={{ fontSize: '10.5pt', color: '#111827' }}>{exp.company}</strong>
                                        <span style={{ fontSize: '10pt', fontWeight: '500' }}>{exp.duration}</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '10pt', fontStyle: 'italic', color: 'var(--primary)' }}>{exp.title}</span>
                                      </div>
                                      <div style={{ fontSize: '10pt', whiteSpace: 'pre-wrap', paddingLeft: '12px', lineHeight: '1.6' }}>
                                        {renderTextWithHighlights(exp.responsibilities)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                            if (sectionName === 'Projects' && safeProjects.length > 0 && safeProjects[0]?.title) {
                              return (
                                <div key="Projects" style={{ marginBottom: '12px' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left', pageBreakInside: 'avoid' }}>Projects</h2>
                                  {safeProjects.map((proj, idx) => proj?.title && (
                                    <div key={idx} style={{ marginBottom: '8px', fontSize: '10pt', lineHeight: '1.6', pageBreakInside: 'avoid' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                        <strong style={{ fontSize: '10.5pt', color: '#111827' }}>{proj.title}</strong>
                                        <span style={{ fontSize: '10pt', fontWeight: '500' }}>{proj.duration}</span>
                                      </div>
                                      {proj.techStack && (
                                        <div style={{ marginBottom: '4px' }}><strong style={{ color: 'var(--primary)' }}>Tools:</strong> {proj.techStack}</div>
                                      )}
                                      <div style={{ whiteSpace: 'pre-wrap', paddingLeft: '12px' }}>
                                        {renderTextWithHighlights(proj.description)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            }
                            if (sectionName === 'Certifications' && displayCertifications) {
                              return (
                                <div key="Certifications" style={{ marginBottom: '12px' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Certifications</h2>
                                  <div style={{ fontSize: '10pt', whiteSpace: 'pre-wrap', paddingLeft: '12px', lineHeight: '1.4' }}>
                                    {displayCertifications.split('\n').map((cert, i) => {
                                      const text = typeof cert === 'string' ? cert.replace(/^[-•*]\s*/, '').trim() : '';
                                      return text ? <div key={i}>• {text}</div> : null;
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            if (sectionName === 'Achievements' && Array.isArray(form.achievements) && form.achievements.length > 0) {
                              return (
                                <div key="Achievements" style={{ marginBottom: '12px' }}>
                                  <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Achievements</h2>
                                  <div style={{ fontSize: '10pt' }}>{form.achievements.join(', ')}</div>
                                </div>
                              )
                            }
                            return null;
                          })}

                          {/* 8. Additional Information (Languages) */}
                          {Array.isArray(form.languages) && form.languages.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <h2 style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #ccc', marginBottom: '6px', paddingBottom: '2px', color: 'var(--primary)', textAlign: 'left' }}>Additional Information</h2>
                              <div style={{ fontSize: '10pt', marginBottom: '4px' }}><strong>Languages:</strong> {form.languages.join(', ')}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ResumeWorkspace>
          )}
        </main>
      </div>
    </div>
  )
}

export default function ResumeBuilder() {
  return (
    <ErrorBoundary>
      <ResumeBuilderContent />
    </ErrorBoundary>
  )
}
