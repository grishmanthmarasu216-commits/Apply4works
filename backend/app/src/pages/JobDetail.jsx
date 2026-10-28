import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ApplyModal from '../components/ApplyModal'
import CompanyLogo from '../components/CompanyLogo'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { calculateJobMatch, extractSalary } from '../utils/MatchEngine'
import { extractLogoUrl, extractCompanyName, extractMatchScore } from '../utils/jobHelpers'
import { API_BASE } from '../config/api'

export default function JobDetail() {
  const { id } = useParams()
  const { applications, savedJobs, saveJob, applyToJob, updateJobStatus } = useApp()
  const { storedPrefs } = useAuth()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [resumeForm, setResumeForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyingJob, setApplyingJob] = useState(null)

  useEffect(() => {

    const token = localStorage.getItem('authToken');
    const fetchJob = fetch(`${API_BASE}/jobs/${id}`, { 
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => res.json());

    const fetchResume = token ? fetch(`${API_BASE}/resume/me`, { 
      headers: { Authorization: `Bearer ${token}` } 
    }).then(res => res.json()).catch(() => ({})) : Promise.resolve({});

    Promise.all([fetchJob, fetchResume])
      .then(([jData, rData]) => {
        setJob(jData);
        
        if (rData?.resume?.parsed) {
          const p = rData.resume.parsed;
          setResumeForm({
            summary: p.basics?.summary || '',
            experience: p.work || [],
            projects: p.projects || [],
            education: p.education || [],
            skills: p.skills?.map(s => s.name).join(', ') || ''
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend JobDetail] Failed to fetch data', err);
        setLoading(false);
      });
  }, [id])

  useEffect(() => {
    const handleFocus = () => {
      const pendingStr = localStorage.getItem('pendingApplyJob');
      if (pendingStr) {
        try {
          const pJob = JSON.parse(pendingStr);
          if (pJob.id === id || pJob._id === id) {
            setApplyingJob(pJob);
            setShowApplyModal(true);
          }
        } catch(e) {}
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible') handleFocus();
    });
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [id]);

  const handleConfirmApply = async (didApply) => {
    if (!applyingJob) return;
    
    if (didApply) {
      await updateJobStatus(applyingJob.id || applyingJob._id, 'APPLIED');
      setJob(prev => ({ ...prev, status: 'APPLIED' }));
    }
    
    localStorage.removeItem('pendingApplyJob');
    setShowApplyModal(false);
    setApplyingJob(null);
  };

  if (loading) {
    return (
      <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: 240 }}>
          <p>Loading job details...</p>
        </div>
      </div>
    )
  }

  if (!job || job.message === 'Job not found' || job.message === 'Server Error') {
    return (
      <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4" style={{ marginLeft: 240 }}>
          <p>Job not found</p>
          <Link to="/jobs" className="btn btn-primary btn-sm">Return to Jobs</Link>
        </div>
      </div>
    )
  }

  const prefs = {
    roles: storedPrefs?.roles || [],
    skills: storedPrefs?.skills || [],
    workPreference: storedPrefs?.workPreference || '',
    experienceLevel: storedPrefs?.experienceLevel || '',
    location: storedPrefs?.location || ''
  }

  let finalMatchDetails = calculateJobMatch(job, prefs);
  
  const enriched = { ...job, matchDetails: finalMatchDetails }
  const status = job.status
  const score = extractMatchScore(job, enriched.matchDetails)
  const scoreColor = 'var(--primary-dk)'
  const scoreBg = 'var(--primary-lt)'

  const appState = applications?.find(a => a.jobId?._id === job.id || a.jobId === job.id);
  const currentStatus = appState ? appState.status : status;

  const isApplied = currentStatus === 'Applied' || currentStatus === 'Interview' || currentStatus === 'APPLIED' || currentStatus === 'INTERVIEW'
  const isSaved   = currentStatus === 'Saved' || currentStatus === 'SAVED' || (savedJobs && savedJobs.some(s => s.jobId?._id === job.id || s.jobId === job.id));

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
        <TopBar title="Job Details" subtitle={`${job.title} · ${extractCompanyName(job)}`}
          actions={<Link to="/jobs" className="btn btn-ghost btn-sm">← Back to Jobs</Link>} />

        <main className="p-7">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Header card */}
              <div className="card p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="flex-shrink-0 mt-1">
                    <CompanyLogo 
                      logoUrl={extractLogoUrl(job)} 
                      companyName={extractCompanyName(job)} 
                      logoColor={job.logoColor} 
                      size="large" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-extrabold text-xl leading-tight" style={{ color: 'var(--text-h)' }}>{job.title}</h1>
                    <p className="font-semibold mt-1" style={{ color: 'var(--text-b)' }}>{extractCompanyName(job)}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[job.workType, job.jobType, job.experienceLevel].filter(Boolean).map(t => (
                        <span key={t} className="badge badge-slate">{t}</span>
                      ))}
                      {currentStatus && currentStatus !== 'New' && <span className={`badge ${isApplied ? 'badge-green' : isSaved ? 'badge-sage' : 'badge-blue'}`}>{currentStatus}</span>}
                    </div>
                  </div>
                  <div className="match-ring" style={{ width: 56, height: 56, background: scoreBg, color: scoreColor, fontSize: '.9rem', fontWeight: 800 }}>{score}%</div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  {[['Salary', extractSalary(job)],['Location', job.location],['Deadline', job.deadline],['Source', job.source]].map(([l,v]) => (
                    <div key={l}>
                      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-m)' }}>{l}</p>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-h)' }}>{v || 'Not Disclosed'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="card p-6">
                <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-h)' }}>Job Description</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-b)', whiteSpace: 'pre-wrap' }}>{job.description}</p>
              </div>

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-h)' }}>Responsibilities</h2>
                  <ul className="flex flex-col gap-2.5">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-b)' }}>
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tools */}
              {job.tools && job.tools.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-h)' }}>Tools & Technologies</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.tools.map(t => (
                      <span key={t} className="text-sm px-3 py-1.5 rounded-lg font-medium"
                        style={{ background: 'var(--bg-subtle)', color: 'var(--sec-mid)', border: '1px solid var(--border)' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Company */}
              <div className="card p-6">
                <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-h)' }}>Company Overview</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-b)' }}>{job.companyOverview}</p>
              </div>
            </div>

            {/* RIGHT sidebar */}
            <div className="flex flex-col gap-5">

              {/* Resume CTA */}
              {!isApplied && (
                <div className="card p-5" style={{ background: 'var(--primary-lt)', border: '1px solid rgba(31,122,108,.2)' }}>
                  <h3 className="font-bold text-sm mb-1.5" style={{ color: 'var(--primary-dk)' }}>Optimize Resume For This Job</h3>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--sec-dk)' }}>Tailor your resume to maximize your match rate for this specific role before you apply.</p>
                  <Link to={`/jobs/${job.id}/resume-optimizer`} className="btn btn-sm w-full justify-center shadow-sm hover:opacity-90 transition-opacity" style={{ background: 'var(--primary)', color: '#fff' }}>
                    Start Optimization
                  </Link>
                </div>
              )}

              {/* Apply CTA */}
              <div className="card p-6 flex flex-col gap-3">
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>Apply for this Role</h3>

                {isApplied ? (
                  <div className="rounded-xl p-4 text-center" style={{ background: 'var(--primary-lt)' }}>
                    <p className="text-2xl mb-1">✓</p>
                    <p className="font-bold text-sm" style={{ color: 'var(--primary)' }}>Application Submitted!</p>
                    <p className="text-xs mt-1 mb-3" style={{ color: 'var(--sec-mid)' }}>Status: {currentStatus}</p>
                    <button 
                      onClick={async () => {
                        withdrawApplication(job.id)
                        try {

                          const token = localStorage.getItem('authToken');
                          const res = await fetch(`${API_BASE}/jobs/${job.id}/status`, {
                            method: 'PUT',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ status: 'New' })
                          });
                          if (res.ok) setJob(prev => ({ ...prev, status: 'New' }));
                        } catch (e) {}
                      }}
                      className="btn btn-sm hover:opacity-80 transition-opacity mx-auto" 
                      style={{ background: '#fff', color: 'var(--primary)', border: '1px solid rgba(31,122,108,.2)' }} 
                      title="Undo Application">
                      ΓÄî Undo
                    </button>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={async () => {
                        const url = job.apply_link || job.applyUrl || job.url;
                        if (url) window.open(url, '_blank', 'noopener,noreferrer');
                        if (!isApplied) {
                           await applyToJob(job, 'Manual');
                        }
                        localStorage.setItem('pendingApplyJob', JSON.stringify(job));
                      }}
                      className="btn btn-primary btn-md justify-center w-full flex items-center gap-2">
                      Apply Externally <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </button>
                    
                    <button
                      onClick={async () => {
                        try {
                          await applyToJob(job, 'Manual');
                          await updateJobStatus(job.id, 'APPLIED');
                          setJob(prev => ({ ...prev, status: 'Applied' }));
                          navigate('/applications');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="btn btn-ghost btn-md justify-center w-full"
                      style={{ border: '1px solid var(--border)' }}>
                      ✓ Mark as Applied
                    </button>

                    <button
                      onClick={async () => {
                        await saveJob(job.id);
                        setJob(prev => ({ ...prev, status: 'Saved' }));
                      }}
                      className="btn btn-md justify-center w-full"
                      style={{
                        background: isSaved ? 'var(--sage-lt)' : 'transparent',
                        color: isSaved ? 'var(--sage-dk)' : 'var(--text-b)',
                        border: '1.5px solid var(--border-md)',
                      }}>
                      {isSaved ? '✓ Saved' : '+ Save Job'}
                    </button>
                  </>
                )}
                <p className="text-xs text-center" style={{ color: 'var(--text-m)' }}>Deadline: {job.deadline}</p>
              </div>
              
              {/* Match breakdown */}
              <div className="card p-5">
                <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-h)' }}>Match Analysis</h3>
                
                <div className="flex items-center gap-3 mb-5 p-3 rounded-lg border" style={{ background: 'var(--primary-lt)', borderColor: 'var(--border)' }}>
                   <div className="relative flex items-center justify-center w-12 h-12 flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                        <circle cx="24" cy="24" r="20" stroke="var(--primary)" strokeWidth="3" fill="transparent" strokeDasharray="125" strokeDashoffset={125 - (score / 100) * 125} strokeLinecap="round" />
                      </svg>
                      <span className="absolute font-bold text-sm" style={{ color: 'var(--primary-dk)' }}>{score}</span>
                   </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--primary)' }}>Overall Match</p>
                    <p className="text-sm font-extrabold mt-0.5" style={{ color: 'var(--text-h)' }}>{enriched.matchDetails?.category || 'Fair Match'}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    ['Skills Match', enriched.matchDetails?.skillMatchPct ?? 0],
                    ['Experience', enriched.matchDetails?.experienceMatchPct ?? 0],
                    ['Location', enriched.matchDetails?.locationMatchPct ?? 0],
                    ['Role Pref', enriched.matchDetails?.roleMatchPct ?? 0]
                  ].map(([l, v]) => (
                    <div key={l} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span style={{ color: 'var(--text-m)' }}>{l}</span>
                        <span style={{ color: 'var(--text-h)' }}>{v}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${v}%`, background: 'var(--primary)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Skills */}
              {(job.matchDetails?.missingSkills?.length > 0 || job.skills?.length > 0) && (
                <div className="card p-5">
                  <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-h)' }}>Missing Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(job.matchDetails?.missingSkills || []).length > 0 ? (
                      job.matchDetails.missingSkills.map(s => <span key={s} className="badge badge-red">{s}</span>)
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--text-m)' }}>No missing skills detected!</span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Required skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-h)' }}>Required Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills.map(s => <span key={s} className="badge badge-green">{s}</span>)}
                  </div>
                </div>
              )}

              {/* Resume keywords */}
              {job.suggestedKeywords && job.suggestedKeywords.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-h)' }}>Suggested Resume Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.suggestedKeywords.map(k => (
                      <span key={k} className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'var(--accent-lt)', color: 'var(--accent-dk)', border: '1px solid rgba(244,162,97,.2)' }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showApplyModal && applyingJob && (
        <ApplyModal 
          job={applyingJob} 
          onConfirm={handleConfirmApply}
          onClose={() => handleConfirmApply(false)} 
        />
      )}
    </div>
  )
}
