import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import ApplyModal from '../components/ApplyModal'
import CompanyLogo from '../components/CompanyLogo'
import { useApp } from '../context/AppContext'
import { extractLogoUrl, extractCompanyName, extractMatchScore } from '../utils/jobHelpers'

import { API_BASE } from '../config/api';

const COLS = [
  { key: 'APPLIED',   label: 'Applied',   color: 'var(--primary)', bg: 'var(--primary-lt)' },
  { key: 'INTERVIEW', label: 'Interview', color: '#7c3aed',         bg: '#f5f3ff' },
  { key: 'OFFER',     label: 'Offer',     color: '#16a34a',         bg: '#f0fdf4' },
  { key: 'REJECTED',  label: 'Rejected',  color: '#dc2626',         bg: '#fef2f2' },
]

const appliedByBadge = {
  Manual:     { bg: 'var(--accent-lt)',  color: 'var(--accent-dk)', label: '👤 Manual' },
  Auto:       { bg: 'var(--primary-lt)', color: 'var(--primary)',   label: '⚡ Auto Apply' },
  undefined:  { bg: 'var(--bg-subtle)',  color: 'var(--text-m)',    label: '—' },
}

export default function Applications() {
  const { applications, savedJobs, likedJobs, followUpsList, updateJobStatus, saveJob, likeJob, applyToJob, globalStats } = useApp()
  const [tab, setTab]           = useState('history')
  const [applyJob, setApplyJob] = useState(null)
  
  // Apply Modal States
  const [applyingJob, setApplyingJob] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)

  const handleSaveToggle = async (jobId, isSaved) => {
    await saveJob(jobId, isSaved)
  };

  const handleApplyClick = async (job) => {
    window.open(job.apply_link || job.applyUrl, '_blank', 'noopener,noreferrer');
    await applyToJob(job, 'Manual');
    setApplyingJob(job);
    setShowApplyModal(true);
  };

  const handleConfirmApply = async (confirmed) => {
    if (!applyingJob) return;
    if (confirmed) {
      await updateJobStatus(applyingJob.id || applyingJob._id, 'APPLIED');
    }
    setShowApplyModal(false);
    setApplyingJob(null);
  };


  const myJobs = applications.map(a => ({
    ...(a.jobId || {}),
    id: a.jobId?._id || a.jobId,
    status: a.status,
    appId: a._id,
    appliedDate: a.appliedDate,
    matchScore: extractMatchScore(a.jobId, a),
    extractedLogo: extractLogoUrl(a.jobId || a),
    extractedCompany: extractCompanyName(a.jobId || a),
    source: a.source,
    resumeUsed: a.resumeUsed || 'Default Resume'
  })).filter(j => j.id && j.title); // Filter out any null jobIds

  const saved = savedJobs.map(s => ({
    ...(s.jobId || {}),
    id: s.jobId?._id,
    status: 'Saved',
    savedId: s._id,
    matchScore: extractMatchScore(s.jobId, s),
    extractedLogo: extractLogoUrl(s.jobId || s),
    extractedCompany: extractCompanyName(s.jobId || s)
  })).filter(j => j.id);

  const liked = likedJobs.map(l => ({
    ...(l.jobId || {}),
    id: l.jobId?._id,
    status: 'Liked',
    likedId: l._id,
    matchScore: extractMatchScore(l.jobId, l),
    extractedLogo: extractLogoUrl(l.jobId || l),
    extractedCompany: extractCompanyName(l.jobId || l)
  })).filter(j => j.id);

  const followups = followUpsList.map(a => ({
    ...(a.jobId || {}),
    id: a.jobId?._id,
    status: a.status,
    appId: a._id,
    appliedDate: a.appliedDate,
    matchScore: extractMatchScore(a.jobId, a),
    extractedLogo: extractLogoUrl(a.jobId || a),
    extractedCompany: extractCompanyName(a.jobId || a)
  })).filter(j => j.id);

  const applied   = myJobs.filter(j => j.status === 'APPLIED')
  const interview = myJobs.filter(j => j.status === 'INTERVIEW')
  const rejected  = myJobs.filter(j => j.status === 'REJECTED')
  const offer     = myJobs.filter(j => j.status === 'OFFER')

  const autoCount   = applications.filter(a => a.source === 'Auto').length
  const manualCount = applications.filter(a => a.source !== 'Auto' && a.status !== 'PENDING_SUBMISSION').length

  const tabs = [
    { key: 'history',   label: `All Applications (${applications.length})` },
    { key: 'kanban',    label: 'Kanban Board' },
    { key: 'saved',     label: `Saved (${saved.length})` },
    { key: 'liked',     label: `Liked (${liked.length})` },
    { key: 'followups', label: `Follow-ups (${followups.length})` },
  ]

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
        <TopBar title="Applications" subtitle="Track every application — manual and auto" />
        <main className="p-7 flex flex-col gap-6">

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Applied',  count: globalStats.appliedCount || 0,  color: 'var(--primary)', bg: 'var(--primary-lt)' },
              { label: '👤 Manual',      count: globalStats.manualCount || 0,         color: 'var(--accent-dk)', bg: 'var(--accent-lt)' },
              { label: 'Interview',      count: globalStats.interviewCount || 0,    color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Saved',          count: globalStats.savedCount || 0,        color: '#16a34a', bg: '#f0fdf4' },
              { label: 'Follow Ups',     count: globalStats.followUpCount || 0,     color: '#dc2626', bg: '#fef2f2' },
            ].map(c => (
              <div key={c.label} className="card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: c.bg, color: c.color }}>{c.count}</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>{c.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-m)' }}>{c.count} job{c.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-xl w-fit overflow-x-auto"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className="btn btn-sm whitespace-nowrap"
                style={{ background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? 'var(--primary)' : 'var(--text-m)', boxShadow: tab === t.key ? 'var(--sh-sm)' : 'none', border: 'none' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── HISTORY (All Applications) ── */}
          {tab === 'history' && (
            myJobs.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">📋</span>
                <p className="font-bold" style={{ color: 'var(--text-h)' }}>No applications yet</p>
                <p className="text-sm" style={{ color: 'var(--text-m)' }}>Apply to jobs manually or start an Auto Apply session.</p>
                <div className="flex gap-3 mt-2">
                  <Link to="/jobs" className="btn btn-primary btn-md">Browse Jobs</Link>
                </div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        {['Job Title', 'Company', 'Date', 'Status', 'Match Score', 'Resume Used', 'Applied By', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--text-m)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myJobs.map((job, i) => {
                        const badge = appliedByBadge[job.source || 'Manual'] || appliedByBadge['Manual'];
                        return (
                          <tr key={job.id} className="border-b" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.012)' }}>
                            <td className="px-4 py-3">
                              <Link to={`/jobs/${job.id}`} className="font-semibold hover:underline" style={{ color: 'var(--text-h)', textDecoration: 'none' }}>{job.title}</Link>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <CompanyLogo logoUrl={job.extractedLogo} companyName={job.extractedCompany} textLogo={job.logo} logoColor={job.logoColor} size={6} />
                                <span style={{ color: 'var(--text-b)' }}>{job.extractedCompany}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-m)' }}>{job.appliedDate ? new Date(job.appliedDate).toLocaleDateString('en-GB') : 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`badge ${job.status === 'APPLIED' ? 'badge-orange' : job.status === 'INTERVIEW' ? 'badge-green' : job.status === 'OFFER' ? 'badge-blue' : job.status === 'REJECTED' ? 'badge-red' : 'badge-slate'}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-xs" style={{ color: (job.matchScore ?? 0) >= 85 ? 'var(--primary)' : 'var(--accent-dk)' }}>
                                {job.matchScore ? `${job.matchScore}%` : '0%'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-m)' }}>
                              {job.resumeUsed}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                                style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                            </td>
                            <td className="px-4 py-3">
                              {job.status === 'PENDING_SUBMISSION' ? (
                                <div className="flex gap-2">
                                  <button onClick={() => handleApplyClick(job)} className="btn btn-sm btn-ghost flex-shrink-0">
                                    Apply
                                  </button>
                                  <button onClick={() => updateJobStatus(job.id, 'APPLIED')} className="btn btn-sm btn-primary flex-shrink-0">
                                    Mark as Applied
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── KANBAN ── */}
          {tab === 'kanban' && (
            <div className="flex gap-4 overflow-x-auto pb-3">
              {COLS.map(col => {
                const colJobs = myJobs.filter(j => j.status === col.key)
                return (
                  <div key={col.key} className="kanban-col" style={{ minWidth: 268, flex: '0 0 268px' }}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const jobId = e.dataTransfer.getData('jobId');
                      if (jobId) {
                        await updateJobStatus(jobId, col.key);
                      }
                    }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-sm" style={{ color: col.color }}>{col.label}</span>
                      <span className="badge" style={{ background: col.bg, color: col.color }}>{colJobs.length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {colJobs.map(j => {
                        const badge = appliedByBadge['Manual']
                        return (
                          <div key={j.id} className="card p-4 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('jobId', j.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}>
                            <div className="flex items-center gap-2.5">
                              <CompanyLogo logoUrl={j.extractedLogo} companyName={j.extractedCompany} textLogo={j.logo} logoColor={j.logoColor} size={8} />
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate" style={{ color: 'var(--text-h)' }}>{j.title}</p>
                                <p className="text-xs" style={{ color: 'var(--text-m)' }}>{j.extractedCompany}</p>
                              </div>
                            </div>

                            {/* Applied By badge */}
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full w-fit"
                                style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>

                            <div className="flex gap-1.5 flex-wrap">
                              <span className="badge badge-slate">{j.employmentType || 'Full-time'}</span>
                            </div>
                            <div className="flex gap-1.5 flex-wrap text-xs" style={{ color: 'var(--text-m)' }}>
                              <span>Applied {j.appliedDate ? new Date(j.appliedDate).toLocaleDateString('en-GB') : 'N/A'}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <Link to={`/jobs/${j.id}`} className="btn btn-ghost btn-sm flex-1 justify-center text-xs">Details</Link>
                              {col.key === 'APPLIED' && (
                                <button onClick={() => updateJobStatus(j.id, 'INTERVIEW')} className="btn btn-sm flex-1 text-xs justify-center"
                                  style={{ background: '#f5f3ff', color: '#7c3aed', border: 'none' }}>→ Interview</button>
                              )}
                              {col.key === 'INTERVIEW' && (
                                <button onClick={() => updateJobStatus(j.id, 'OFFER')} className="btn btn-sm flex-1 text-xs justify-center"
                                  style={{ background: '#f0fdf4', color: '#16a34a', border: 'none' }}>→ Offer</button>
                              )}
                              {(col.key === 'APPLIED' || col.key === 'INTERVIEW') && (
                                <div className="flex gap-1.5 flex-1">
                                  <button onClick={() => updateJobStatus(j.id, 'REJECTED')} className="btn btn-sm px-2 text-xs flex-1"
                                    style={{ background: '#fef2f2', color: '#dc2626', border: 'none' }} title="Mark Rejected">✕</button>
                                  <button onClick={() => updateJobStatus(j.id, 'WITHDRAWN')} className="btn btn-sm px-2 text-xs flex-1"
                                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-m)', border: 'none' }} title="Withdraw Application">⎌</button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                      {colJobs.length === 0 && (
                        <div className="text-xs text-center py-6 rounded-xl" style={{ color: 'var(--text-f)', border: '1.5px dashed var(--border-md)' }}>
                          No entries yet
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── SAVED ── */}
          {tab === 'saved' && (
            saved.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🔖</span>
                <p className="font-bold" style={{ color: 'var(--text-h)' }}>No saved jobs yet</p>
                <Link to="/jobs" className="btn btn-primary btn-md mt-2">Browse Jobs</Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        {['Job', 'Company', 'Salary', 'Match', 'Deadline', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-m)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {saved.map((j, i) => (
                        <tr key={j.id} className="border-b" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.012)' }}>
                          <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-h)' }}>{j.title}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <CompanyLogo logoUrl={j.extractedLogo} companyName={j.extractedCompany} textLogo={j.logo} logoColor={j.logoColor} size={6} />
                              <span style={{ color: 'var(--text-b)' }}>{j.extractedCompany}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-medium">{j.salary || 'Not specified'}</td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-xs" style={{ color: (j.matchScore ?? 0) >= 85 ? 'var(--primary)' : 'var(--accent-dk)' }}>
                              {j.matchScore ? `${j.matchScore}%` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3" style={{ color: 'var(--text-m)' }}>{j.deadline || 'Not specified'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <Link to={`/jobs/${j.id}`} className="btn btn-ghost btn-sm">View</Link>
                              <button onClick={() => handleApplyClick(j)} className="btn btn-primary btn-sm">Apply</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleSaveToggle(j.id, true)}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── LIKED ── */}
          {tab === 'liked' && (
            liked.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">❤️</span>
                <p className="font-bold" style={{ color: 'var(--text-h)' }}>No liked jobs yet</p>
                <Link to="/jobs" className="btn btn-primary btn-md mt-2">Browse Jobs</Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                        {['Job', 'Company', 'Salary', 'Match', 'Deadline', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-m)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {liked.map((j, i) => (
                        <tr key={j.id} className="border-b" style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,.012)' }}>
                          <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-h)' }}>{j.title}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <CompanyLogo logoUrl={j.extractedLogo} companyName={j.extractedCompany} textLogo={j.logo} logoColor={j.logoColor} size={6} />
                              <span style={{ color: 'var(--text-b)' }}>{j.extractedCompany}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-medium">{j.salary || 'Not specified'}</td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-xs" style={{ color: (j.matchScore ?? 0) >= 85 ? 'var(--primary)' : 'var(--accent-dk)' }}>
                              {j.matchScore ? `${j.matchScore}%` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-3" style={{ color: 'var(--text-m)' }}>{j.deadline || 'Not specified'}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <Link to={`/jobs/${j.id}`} className="btn btn-ghost btn-sm">View</Link>
                              <button onClick={() => handleApplyClick(j)} className="btn btn-primary btn-sm">Apply</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => likeJob(j.id, true)}>Unlike</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── FOLLOW-UPS ── */}
          {tab === 'followups' && (
            followups.length === 0 ? (
              <div className="card p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">📧</span>
                <p className="font-bold" style={{ color: 'var(--text-h)' }}>No follow-ups needed yet</p>
                <Link to="/jobs" className="btn btn-primary btn-md mt-2">Browse Jobs</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {followups.map(j => {
                  const badge = appliedByBadge['Manual']
                  const subject = encodeURIComponent(`Following up: Application for ${j.title}`);
                  const body = encodeURIComponent(`Hi hiring team,\n\nI recently applied for the ${j.title} role on ${new Date(j.appliedDate).toLocaleDateString('en-GB')} and wanted to reiterate my strong interest in the position.\n\nPlease let me know if you need any additional information from me.\n\nBest regards,`);
                  
                  return (
                    <div key={j.id} className="card p-5 flex items-center gap-4">
                      <CompanyLogo logoUrl={j.extractedLogo} companyName={j.extractedCompany} textLogo={j.logo} logoColor={j.logoColor} size={10} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm" style={{ color: 'var(--text-h)' }}>{j.title} · {j.extractedCompany}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs" style={{ color: 'var(--text-m)' }}>Applied {new Date(j.appliedDate).toLocaleDateString('en-GB')}</p>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </div>
                      </div>
                      <span className="badge badge-orange flex-shrink-0">Follow Up Due</span>
                      <a href={`mailto:?subject=${subject}&body=${body}`} className="btn btn-primary btn-sm flex-shrink-0" target="_blank" rel="noopener noreferrer">
                        Suggest Email
                      </a>
                      <Link to={`/jobs/${j.id}`} className="btn btn-ghost btn-sm flex-shrink-0">Details</Link>
                    </div>
                  )
                })}
              </div>
            )
          )}
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
