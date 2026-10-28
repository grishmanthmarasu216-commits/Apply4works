import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import StatCard from '../components/StatCard'
import CompanyLogo from '../components/CompanyLogo'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { calculateJobMatch } from '../utils/MatchEngine'
import { extractLogoUrl, extractCompanyName, extractMatchScore } from '../utils/jobHelpers'
import OnboardingModal from '../components/OnboardingModal'

function DashboardJobCard({ job, onApply }) {
  const { storedPrefs } = useAuth();
  const navigate = useNavigate();
  
  // Quick dynamic match score since Dashboard jobs might only have backend matchScore
  const md = job.matchDetails || calculateJobMatch(job, storedPrefs);
  const score = extractMatchScore(job, md);

  let badgeColor = '#ef4444';
  let badgeBg = '#fef2f2';
  if (score >= 80) { badgeColor = '#10b981'; badgeBg = '#ecfdf5'; }
  else if (score >= 60) { badgeColor = '#f59e0b'; badgeBg = '#fffbeb'; }

  return (
    <div className="card p-4 flex flex-col h-full hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer" 
      onClick={() => navigate(`/jobs/${job.id || job._id}`)}
      style={{ border: '1px solid var(--border)' }}>
      <div className="flex gap-3 mb-3">
        <CompanyLogo 
          logoUrl={extractLogoUrl(job)} 
          companyName={extractCompanyName(job)} 
          logoColor={job.logoColor} 
          size="small" 
        />
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug mb-1">{job.title}</h3>
          <p className="text-xs font-semibold text-slate-500 truncate">{extractCompanyName(job)}</p>
        </div>
      </div>
      
      {/* Small Badge overlay at top right */}
      <div className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: badgeBg, color: badgeColor }}>
        {score}%
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.location && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium truncate max-w-[120px]">{job.location}</span>}
        {job.workType && <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">{job.workType}</span>}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100">
        <button onClick={(e) => { e.stopPropagation(); onApply(job); }} className="w-full py-1.5 rounded-lg font-bold text-xs text-white transition-colors hover:opacity-90" style={{ background: 'var(--primary)' }}>
          Apply Now
        </button>
      </div>
    </div>
  );
}

import { API_BASE } from '../config/api';

export default function Dashboard() {
  const { toast, globalStats, applyToJob, updateJobStatus, withdrawApplication, applications, savedJobs } = useApp()
  const { currentUser, storedPrefs, savePreferences }   = useAuth()
  const navigate = useNavigate()
  

  // Apply Modal States
  const [applyingJob, setApplyingJob] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)

  const preferences = {
    domains: storedPrefs?.domains || [],
    roles: storedPrefs?.roles || [],
    workPreference: storedPrefs?.workPreference || '',
    experienceLevel: storedPrefs?.experienceLevel || ''
  }
  const firstName  = (currentUser?.name || 'User').split(' ')[0]
  const hasPref    = preferences.domains.length > 0

  // Backend states
  const [dashboardJobs, setDashboardJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      console.log(`[Frontend Dashboard] Fetching jobs from: ${API_BASE}/jobs?sort=match`);

      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [jobsRes] = await Promise.all([
        fetch(`${API_BASE}/jobs?sort=match&limit=20`, { credentials: 'include', headers })
      ])

      if (jobsRes.ok) {
        let data;
        try { data = await jobsRes.json(); } catch { data = { jobs: [] }; }
        console.log('[Frontend Dashboard] Jobs array length:', Array.isArray(data) ? data.length : (data.jobs ? data.jobs.length : 0))
        setDashboardJobs(Array.isArray(data) ? data : (data.jobs || []))
      } else {
        throw new Error(`API failed with status: ${jobsRes.status}`)
      }
    } catch (err) {
      console.error('[Frontend Dashboard] Error fetching dashboard data:', err)
      setDashboardJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData, JSON.stringify(storedPrefs)])

  const handleApply = async (job) => {
    window.open(job.apply_link || job.applyUrl, '_blank', 'noopener,noreferrer');
    // Ensure we create a pending application
    if (job.status !== 'APPLIED' && job.status !== 'PENDING_SUBMISSION') {
      await applyToJob(job, 'Manual');
    }
    setApplyingJob(job);
    setShowApplyModal(true);
  }


  const handleConfirmApply = async (didApply) => {
    if (!applyingJob) return;
    
    if (didApply) {
      await updateJobStatus(applyingJob.id || applyingJob._id, 'APPLIED');
    }
    
    setShowApplyModal(false);
    setApplyingJob(null);
  };

  const undoApply = async (job) => {
    await updateJobStatus(job.id, 'WITHDRAWN');
  }

  const dashboardJobsMapped = dashboardJobs.map(j => {
    const app = applications.find(a => (a.jobId?._id || a.jobId) === (j.id || j._id))
    if (app) return { ...j, status: app.status }
    return j
  })

  // Filter out applied jobs from recommended
  const unappliedDashboardJobs = dashboardJobsMapped.filter(j => 
    j.status !== 'APPLIED' && 
    j.status !== 'INTERVIEW' && 
    j.status !== 'OFFER' && 
    j.status !== 'REJECTED' && 
    j.status !== 'Applied'
  );

  // Recommended = top 6 unapplied jobs sorted by backend matchScore
  const recommended = [...unappliedDashboardJobs].sort((a, b) => b.matchScore - a.matchScore).slice(0, 6)

  const topScore = dashboardJobsMapped.length ? Math.max(...dashboardJobsMapped.map(j => j.matchScore)) : 0

  const quickActions = [
    { label: 'Daily Jobs',   to: '/jobs',         icon: '💼', color: 'var(--primary)' },
    { label: 'Build Resume', to: '/resume-builder', icon: '📝', color: 'var(--accent-dk)' },
    { label: 'Applications', to: '/applications', icon: '📋', color: 'var(--sage-dk)' },
  ]

  const statusBadge = { New: 'badge-blue', Saved: 'badge-sage', Applied: 'badge-orange', Interview: 'badge-green' }

  const allActivity = [
    ...applications.filter(a => a.status === 'APPLIED').map(a => {
      const jobInfo = a.jobId || {};
      return { 
        id: a.id || a._id, 
        type: 'app', 
        title: `Applied to ${jobInfo.title || 'Job'}`, 
        subtitle: jobInfo.company || 'Application Submitted', 
        date: new Date(a.dateApplied || a.updatedAt || a.createdAt || Date.now()) 
      };
    }),
    ...(savedJobs || []).map(s => {
      const jobInfo = s.jobId || {};
      return { 
        id: s.id || s._id, 
        type: 'save', 
        title: `Saved ${jobInfo.title || 'Job'}`, 
        subtitle: jobInfo.company || 'Job Bookmark', 
        date: new Date(s.savedAt || s.createdAt || Date.now()) 
      };
    })
  ];

  if (storedPrefs && (storedPrefs.updatedAt || storedPrefs.createdAt)) {
    allActivity.push({
      id: 'prefs-update',
      type: 'prefs',
      title: 'Preferences Updated',
      subtitle: 'Career focus refined',
      date: new Date(storedPrefs.updatedAt || storedPrefs.createdAt)
    });
  }

  const sortedActivity = allActivity.sort((a, b) => b.date - a.date).slice(0, 10);

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
        <TopBar title="Dashboard" subtitle={`Welcome back, ${firstName} 👋`} />
        <main className="p-7 flex flex-col gap-7">

          {currentUser?.canApplyJobs === false && (
            <div className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-4 bg-red-50 border border-red-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Manual Review Required
                </p>
                <p className="text-sm text-red-700">Your profile requires manual review based on your security questionnaire answers before job applications can continue.</p>
              </div>
            </div>
          )}

          {/* Preference banner */}
          {hasPref && (
            <div className="rounded-xl px-5 py-4 flex flex-wrap items-center gap-4"
              style={{ background: 'var(--primary-lt)', border: '1px solid rgba(31,122,108,.18)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--primary)' }}>Active Career Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {preferences.domains.map(d => <span key={d} className="badge badge-green">{d}</span>)}
                  {preferences.roles.map(r => (
                    <span key={r} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: 'var(--accent-lt)', color: 'var(--accent-dk)', border: '1px solid rgba(244,162,97,.2)' }}>{r}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 items-center">
                {preferences.workPreference && <span className="badge badge-slate">{preferences.workPreference}</span>}
                {preferences.experienceLevel && <span className="badge badge-slate">{preferences.experienceLevel}</span>}
                <button onClick={() => setShowPrefs(true)} className="btn btn-sm" style={{ background: '#fff', color: 'var(--primary)', border: '1px solid rgba(31,122,108,.3)' }}>
                  Edit Preferences
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Jobs Available Today" value={globalStats.totalJobsToday || 0} sub="New listings"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
            <StatCard label="Best Matches" value={`${topScore}%`} sub="Top preference match"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              color="var(--accent-dk)" iconBg="var(--accent-lt)" />
            <StatCard label="Saved Jobs" value={globalStats.savedCount || 0} sub="Ready to apply"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>}
              color="var(--sage-dk)" iconBg="var(--sage-lt)" />
            <StatCard label="Applications Submitted" value={globalStats.appliedCount || 0} sub={`${globalStats.appliedCount || 0} submitted`}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
          </div>

          <div className="grid md:grid-cols-2 gap-7">
            {/* Quick actions */}
            <div className="card p-5">
              <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-h)' }}>Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(a => (
                    <Link key={a.label} to={a.to}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                        <span className="text-2xl">{a.icon}</span>
                        <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                      </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-5 flex flex-col h-[280px]">
              <h2 className="font-bold text-sm mb-4 shrink-0" style={{ color: 'var(--text-h)' }}>Recent Activity</h2>
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {sortedActivity.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                    <span className="text-3xl mb-2">⏳</span>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>No activity yet</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-m)' }}>Your recent job actions will appear here.</p>
                  </div>
                ) : (
                  sortedActivity.map((act, i) => (
                    <div key={act.id + '-' + i} className="flex gap-3 items-center p-3 rounded-lg border bg-white shrink-0" style={{ borderColor: 'var(--border)' }}>
                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0" style={{ background: act.type === 'app' ? 'var(--primary)' : (act.type === 'prefs' ? 'var(--accent-dk)' : 'var(--sage-dk)') }}>
                         {act.type === 'app' ? '✓' : (act.type === 'prefs' ? '⚙️' : '❤️')}
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="text-sm font-bold truncate text-slate-800">{act.title}</p>
                         <p className="text-xs text-slate-500 truncate">{act.subtitle}</p>
                       </div>
                       <div className="text-[10px] text-slate-400 font-medium shrink-0">
                         {act.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Recommended Jobs ── */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-base" style={{ color: 'var(--text-h)' }}>Recommended Jobs</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-m)' }}>
                  {loading ? 'Loading best matches...' : (hasPref ? 'Matched to your domain and role preferences' : 'Top matches for your profile')}
                </p>
              </div>
              <Link to="/jobs" className="btn btn-ghost btn-sm">See all →</Link>
            </div>

            {loading ? (
               <div className="p-10 text-center"><p style={{ color: 'var(--text-m)' }}>Loading jobs from server...</p></div>
            ) : recommended.length === 0 ? (
               <div className="p-10 text-center flex flex-col items-center gap-2 rounded-xl" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                 <span className="text-3xl">🔍</span>
                 <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>No jobs available yet</p>
                 <p className="text-xs" style={{ color: 'var(--text-m)' }}>Check back later for new matches.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommended.map(j => <DashboardJobCard key={j.id} job={j} onApply={handleApply} />)}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full mx-4 flex flex-col gap-6 text-center" style={{ background: 'var(--bg)' }}>
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600 text-3xl">
              ?
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>Application Confirmation</h2>
              <p className="text-sm mt-2" style={{ color: 'var(--text-m)' }}>Did you successfully apply for this job?</p>
            </div>
            <div className="flex gap-2 w-full mt-4">
              <button className="flex-1 btn btn-ghost px-4 py-2 text-center justify-center" onClick={() => handleConfirmApply(false)} style={{ color: 'var(--text-m)' }}>
                Not Yet
              </button>
              <button className="flex-1 btn btn-primary px-4 py-2 font-bold text-center justify-center" onClick={() => handleConfirmApply(true)}>
                Yes, Applied
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Preferences Modal */}
      {showPrefs && (
        <OnboardingModal
          onClose={() => setShowPrefs(false)}
          onComplete={(prefs) => { savePreferences(prefs); setShowPrefs(false) }}
        />
      )}
    </div>
  )
}
