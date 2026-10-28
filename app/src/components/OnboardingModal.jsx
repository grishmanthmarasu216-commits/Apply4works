import { useState, useRef } from 'react'
import { DOMAINS, DOMAIN_ROLES } from '../data/jobs'
import { useAuth } from '../context/AuthContext'
import GlobalLogo from './GlobalLogo'

const WORK_PREFS  = ['Remote', 'Hybrid', 'On-site', 'Flexible']
const EXP_LEVELS  = ['Entry-Level (0–2 yrs)', 'Mid-Level (2–5 yrs)', 'Senior (5+ yrs)', 'Lead / Manager']
const SPONSOR_OPT = ['Yes', 'No', 'Not sure']
const STEPS = [
  { label: 'Domain & Role', emoji: '🏢' },
  { label: 'Resume', emoji: '📄' },
  { label: 'Prefs',  emoji: '⚙️' }
]

export default function OnboardingModal({ onClose, onComplete, inline = false }) {
  const { savePreferences, uploadResume, storedPrefs, currentUser } = useAuth()
  const [step, setStep]         = useState(0)
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState('')
  const [form, setForm]         = useState({
    domains: storedPrefs?.domains || [], 
    roles: storedPrefs?.roles || [], 
    location: storedPrefs?.location || '', 
    workPreference: storedPrefs?.workPreference || 'Remote',
    experienceLevel: storedPrefs?.experienceLevel || 'Mid-Level (2–5 yrs)', 
    salaryExpectation: storedPrefs?.salaryExpectation || '',
    sponsorshipRequired: storedPrefs?.sponsorshipRequired || 'No', 
    skills: storedPrefs?.skills?.join(', ') || '',
    preferredCountry: storedPrefs?.preferredCountry || ''
  })

  // Resume step state
  const [resumeFile, setResumeFile]       = useState(null)
  const [resumeError, setResumeError]     = useState('')
  const [uploadState, setUploadState]     = useState('idle') // idle | uploading | done | error
  const [parsedData, setParsedData]       = useState(null)
  const [isDragging, setIsDragging]       = useState(false)
  const fileInputRef = useRef(null)

  function toggleRole(r) {
    setForm(f => {
      const isSelected = f.roles.includes(r);
      const newRoles = isSelected ? f.roles.filter(x => x !== r) : [...f.roles, r];
      
      const newDomains = [...new Set(newRoles.map(role => {
        return Object.keys(DOMAIN_ROLES).find(dom => DOMAIN_ROLES[dom].includes(role));
      }).filter(Boolean))];

      return { ...f, roles: newRoles, domains: newDomains };
    });
  }
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleFile(file) {
    setResumeError('')
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    setResumeFile(file)
    setUploadState('idle')
    setParsedData(null)
  }

  async function handleUpload() {
    if (!resumeFile) return
    setUploadState('uploading')
    setResumeError('')
    const res = await uploadResume(resumeFile)
    if (!res.ok) {
      setUploadState('error')
      setResumeError('Unable to parse resume. Please try another file.')
      return
    }
    setUploadState('done')
    const p = res.parsed || {}
    setParsedData(p)
    // Auto-fill prefs from parsed data
    setForm(f => ({
      ...f,
      skills: p.skills?.join(', ') || f.skills,
      experienceLevel: p.experienceLevel || f.experienceLevel,
      roles: p.preferredRoles?.length > 0
        ? [...new Set([...f.roles, ...p.preferredRoles.filter(r => {
            const allRoles = f.domains.flatMap(d => DOMAIN_ROLES[d] || [])
            return allRoles.includes(r)
          })])]
        : f.roles,
    }))
  }

  async function finish() {
    setIsLoading(true)
    setError('')
    const prefs = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }
    try {
      if (onComplete) {
        await onComplete(prefs)
      } else {
        const res = await savePreferences(prefs)
        if (res && !res.ok) setError(res.error)
        else if (onClose) onClose()
      }
    } finally {
      setIsLoading(false)
    }
  }

  const inner = (
    <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-2xl shadow-2xl"
      style={{ background: '#fff', border: '1px solid var(--border)' }}>

      {/* Header */}
      <div className="px-7 py-6 border-b sticky top-0 z-10"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-subtle)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <GlobalLogo size="md" />
            </div>
            <h2 className="font-extrabold text-xl" style={{ color: 'var(--text-h)' }}>Set Your Career Preferences</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-m)' }}>
              Help us personalize your job feed, resume generation, and smart applications.
            </p>
          </div>
          {onClose && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-700" title="Skip Onboarding">
              ✕
            </button>
          )}
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-3 mt-5">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: i <= step ? 'var(--primary)' : '#fff', color: i <= step ? '#fff' : 'var(--text-m)', border: i > step ? '1.5px solid var(--border-md)' : 'none' }}>
                {i < step ? '✓' : s.emoji}
              </div>
              <span className="text-xs font-bold hidden sm:block"
                style={{ color: i === step ? 'var(--primary)' : i < step ? 'var(--text-b)' : 'var(--text-m)' }}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="h-px w-8" style={{ background: i < step ? 'var(--primary)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 0 — Domains & Roles Split Panel */}
      {step === 0 && (
        <div className="flex flex-col h-[60vh] max-h-[600px]">
          <div className="px-7 pt-4 pb-2">
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-h)' }}>Select Your Industry & Roles</h3>
            <p className="text-sm" style={{ color: 'var(--text-m)' }}>Choose your target roles from the categories below.</p>
          </div>
          
          <div className="flex flex-1 overflow-hidden border-t border-b" style={{ borderColor: 'var(--border)' }}>
            {/* Left Panel: Domains */}
            <div className="w-2/5 overflow-y-auto bg-slate-50 border-r" style={{ borderColor: 'var(--border)' }}>
              {DOMAINS.map(d => {
                const isActive = activeDomain === d;
                const selectedCount = form.roles.filter(r => (DOMAIN_ROLES[d] || []).includes(r)).length;
                return (
                  <button key={d} onClick={() => setActiveDomain(d)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold text-left transition-colors border-b last:border-b-0"
                    style={{ 
                      background: isActive ? '#fff' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-b)',
                      borderLeft: isActive ? '4px solid var(--primary)' : '4px solid transparent',
                      borderColor: 'var(--border)'
                    }}>
                    <span className="truncate pr-2">{d}</span>
                    {selectedCount > 0 && (
                      <span className="flex-shrink-0 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {selectedCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right Panel: Roles */}
            <div className="w-3/5 overflow-y-auto p-5 bg-white">
              <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b">{activeDomain} Roles</h4>
              <div className="flex flex-col gap-2">
                {(DOMAIN_ROLES[activeDomain] || []).map(r => {
                  const sel = form.roles.includes(r);
                  return (
                    <button key={r} onClick={() => toggleRole(r)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
                      style={{ 
                        background: sel ? 'var(--primary-lt)' : 'var(--bg-subtle)', 
                        border: `1px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                        color: sel ? 'var(--primary)' : 'var(--text-b)' 
                      }}>
                      <div className="w-4 h-4 rounded-[4px] flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{ 
                          background: sel ? 'var(--primary)' : '#fff', 
                          border: sel ? 'none' : '1.5px solid var(--border-md)' 
                        }}>
                        {sel && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center px-7 py-4">
            <div className="text-sm font-bold text-slate-600">
              {form.roles.length} role(s) selected
            </div>
            <button onClick={() => setStep(1)} disabled={form.roles.length === 0}
              className="btn btn-primary btn-lg px-8"
              style={{ opacity: form.roles.length === 0 ? 0.4 : 1, cursor: form.roles.length === 0 ? 'not-allowed' : 'pointer' }}>
              Next Step →
            </button>
          </div>
        </div>
      )}

      {/* STEP 1 — Resume Upload */}
      {step === 1 && (
        <div className="p-7 flex flex-col gap-5">
          <div>
            <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-h)' }}>Upload Your Resume (Optional)</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-m)' }}>
              Upload resume to improve job matching (optional)
            </p>

            {/* Drop Zone */}
            {!resumeFile ? (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
                style={{
                  border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border-md)'}`,
                  background: isDragging ? 'var(--primary-lt)' : 'var(--bg-subtle)',
                  padding: '3rem 2rem',
                  minHeight: '180px',
                }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--primary-lt)' }}>
                  <svg className="w-7 h-7" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>
                    {isDragging ? 'Drop your resume here' : 'Drag & drop your resume'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>or click to browse — PDF, DOC, DOCX · Max 5 MB</p>
                </div>
                <button className="btn btn-primary btn-md" onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}>
                  Browse File
                </button>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="rounded-2xl p-4 flex flex-col gap-4" style={{ border: '1.5px solid var(--border)', background: 'var(--bg-subtle)' }}>
                {/* File card */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--primary-lt)' }}>
                    <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-h)' }}>{resumeFile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-m)' }}>{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  {uploadState !== 'uploading' && (
                    <button onClick={() => { setResumeFile(null); setUploadState('idle'); setParsedData(null) }}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
                      style={{ color: '#dc2626' }}>✕</button>
                  )}
                </div>

                {/* Upload button / status */}
                {uploadState === 'idle' && (
                  <button onClick={handleUpload} className="btn btn-primary btn-md w-full">
                    🔍 Parse My Resume
                  </button>
                )}
                {uploadState === 'uploading' && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Parsing resume…</span>
                  </div>
                )}
                {uploadState === 'done' && parsedData && (
                  <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#16a34a' }}>✅ Resume Parsed — Preferences Auto-Filled</p>
                    {parsedData.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {parsedData.skills.slice(0, 10).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {parsedData.preferredRoles?.length > 0 && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>
                        Suggested roles: <strong>{parsedData.preferredRoles.slice(0, 3).join(', ')}</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {resumeError && (
              <div className="rounded-xl px-4 py-3 text-sm font-semibold mt-2"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                {resumeError}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button className="btn btn-ghost btn-md" onClick={() => setStep(0)}>← Back</button>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => setStep(2)} 
              disabled={uploadState === 'uploading' || (resumeFile && uploadState !== 'done')}
            >
              {uploadState === 'done' ? '✅ Next: Preferences →' : 'Skip & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Preferences */}
      {step === 2 && (
        <div className="p-7 flex flex-col gap-5">
          <h3 className="font-bold text-base" style={{ color: 'var(--text-h)' }}>
            Additional Preferences
            {uploadState === 'done' && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full" style={{ background: '#f0fdf4', color: '#16a34a' }}>✅ Auto-filled from resume</span>}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Preferred Country</label>
              <input className="input" placeholder="e.g. USA, UK, Canada, India" value={form.preferredCountry} onChange={e => set('preferredCountry', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Preferred Location</label>
              <input className="input" placeholder="e.g. San Francisco, CA or Any" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Salary Expectation</label>
              <input className="input" placeholder="e.g. $90K – $120K" value={form.salaryExpectation} onChange={e => set('salaryExpectation', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--text-m)' }}>Work Type</label>
            <div className="flex gap-2 flex-wrap">
              {WORK_PREFS.map(w => (
                <button key={w} onClick={() => set('workPreference', w)} className="btn btn-sm"
                  style={{ background: form.workPreference === w ? 'var(--primary)' : 'var(--bg-subtle)', color: form.workPreference === w ? '#fff' : 'var(--text-b)', border: form.workPreference === w ? 'none' : '1px solid var(--border)' }}>{w}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Experience Level</label>
            <div className="grid grid-cols-2 gap-2">
              {EXP_LEVELS.map(l => (
                <button key={l} onClick={() => set('experienceLevel', l)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all"
                  style={{ background: form.experienceLevel === l ? 'var(--primary-lt)' : 'var(--bg-subtle)', border: `1.5px solid ${form.experienceLevel === l ? 'var(--primary)' : 'var(--border)'}`, color: form.experienceLevel === l ? 'var(--primary)' : 'var(--text-b)' }}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-2" style={{ color: 'var(--text-m)' }}>Sponsorship Required?</label>
            <div className="flex gap-3">
              {SPONSOR_OPT.map(o => (
                <button key={o} onClick={() => set('sponsorshipRequired', o)} className="btn btn-sm"
                  style={{ background: form.sponsorshipRequired === o ? 'var(--primary)' : 'var(--bg-subtle)', color: form.sponsorshipRequired === o ? '#fff' : 'var(--text-b)', border: form.sponsorshipRequired === o ? 'none' : '1px solid var(--border)' }}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Key Skills (comma-separated)</label>
            <input className="input" placeholder="e.g. Python, SQL, React, Tableau" value={form.skills} onChange={e => set('skills', e.target.value)} />
            {form.skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => <span key={s} className="badge badge-green">{s}</span>)}
              </div>
            )}
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-m)' }}>Your Profile Summary</p>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <div><span className="font-semibold" style={{ color: 'var(--text-m)' }}>Domains: </span><span style={{ color: 'var(--text-b)' }}>{form.domains.join(', ')}</span></div>
              <div><span className="font-semibold" style={{ color: 'var(--text-m)' }}>Roles: </span><span style={{ color: 'var(--text-b)' }}>{form.roles.join(', ')}</span></div>
              <div><span className="font-semibold" style={{ color: 'var(--text-m)' }}>Work: </span><span style={{ color: 'var(--text-b)' }}>{form.workPreference}</span></div>
              <div><span className="font-semibold" style={{ color: 'var(--text-m)' }}>Experience: </span><span style={{ color: 'var(--text-b)' }}>{form.experienceLevel}</span></div>
            </div>
          </div>
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-semibold mt-2"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          <div className="flex justify-between pt-2 border-t mt-2" style={{ borderColor: 'var(--border)' }}>
            <button className="btn btn-ghost btn-md" onClick={() => setStep(1)}>← Back</button>
            <div className="flex gap-2">
              {onClose && (
                <button className="btn btn-ghost btn-md" onClick={onClose} style={{ color: 'var(--text-m)' }}>
                  Skip
                </button>
              )}
              <button className="btn btn-primary btn-lg" onClick={finish} disabled={isLoading}>
                {isLoading ? 'Saving…' : '💾 Save & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (inline) return inner
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      {inner}
    </div>
  )
}
