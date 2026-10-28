import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import FilterBar from '../components/FilterBar'
import JobCard from '../components/JobCard'
import ApplyModal from '../components/ApplyModal'
import AutoApplyPanel from '../components/AutoApplyPanel'
import ProGate from '../components/ProGate'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { API_BASE } from '../config/api';

export default function DailyJobs() {
  const { autoApply, toast, withdrawApplication, updateJobStatus, globalStats, saveJob, applyToJob, applications, savedJobs } = useApp()
  const { storedPrefs, currentUser } = useAuth()

  const prefs = {
    domains: storedPrefs?.domains || [],
    roles: storedPrefs?.roles || [],
    skills: storedPrefs?.skills || [],
    workPreference: storedPrefs?.workPreference || '',
    experienceLevel: storedPrefs?.experienceLevel || '',
    location: storedPrefs?.location || ''
  }

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('match')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyingJob, setApplyingJob] = useState(null)
  
  const [jobsData, setJobsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalJobs, setTotalJobs] = useState(0)

  // Stable fetching function independent of constant re-renders
  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (filters.location) params.append('location', filters.location)
      if (filters.role) params.append('role', filters.role)
      if (filters.experience) params.append('experience', filters.experience)
      if (filters.employmentType) params.append('employmentType', filters.employmentType)
      if (filters.workMode) params.append('workMode', filters.workMode)
      if (filters.industry) params.append('industry', filters.industry)
      if (filters.datePosted) params.append('datePosted', filters.datePosted)
      if (filters.h1b) params.append('h1b', filters.h1b)

      params.append('page', pageNum)
      params.append('limit', 100)
      if (sortBy === 'match' || sortBy === 'Highest Match %' || sortBy === 'Most Relevant') {
        params.append('sort', 'match')
      }

      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/jobs?${params.toString()}`, { credentials: 'include', headers })

      if (res.ok) {
        let data;
        try { data = await res.json(); } catch { data = { jobs: [] }; }
        let fetchedJobs = data.jobs || data.data || data;
        if (!Array.isArray(fetchedJobs)) fetchedJobs = [];
        
        setJobsData(prev => append ? [...prev, ...fetchedJobs] : fetchedJobs)
        if (data.totalPages) setTotalPages(data.totalPages)
        if (data.totalJobs) setTotalJobs(data.totalJobs)
      }
    } catch (err) {
      console.error('[Frontend] Error fetching jobs:', err)
      if (!append) setJobsData([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [search, sortBy, filters, JSON.stringify(storedPrefs)]) // Restored storedPrefs so preferences changes trigger refresh!

  useEffect(() => {
    // Only fire initial fetch exactly once when filters/sort/search change
    setPage(1)
    fetchJobs(1, false)
  }, [fetchJobs]) 

  const handleLoadMore = () => {
    setPage(p => p + 1);
    fetchJobs(page + 1, true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const filteredJobs = useMemo(() => {
    return jobsData.filter(job => {
      // Remove applied jobs from Daily Jobs view!
      const isAppliedByContext = applications.some(a => (a.jobId?._id || a.jobId) === (job.id || job._id) && (a.status === 'APPLIED' || a.status === 'INTERVIEW' || a.status === 'OFFER' || a.status === 'REJECTED' || a.status === 'Applied'));
      const isAppliedByBackend = job.status === 'APPLIED' || job.status === 'INTERVIEW' || job.status === 'OFFER' || job.status === 'REJECTED' || job.status === 'Applied';
      
      if (isAppliedByContext || isAppliedByBackend) return false;

      if (filters.location && !((job.location || '').toLowerCase().includes(filters.location.toLowerCase()))) return false;
      if (filters.role && !((job.title || '').toLowerCase().includes(filters.role.toLowerCase()))) return false;
      if (filters.experience && !((job.experienceLevel || '').toLowerCase().includes(filters.experience.toLowerCase()))) return false;
      if (filters.employmentType && !((job.jobType || job.employmentType || '').toLowerCase().includes(filters.employmentType.toLowerCase()))) return false;
      if (filters.workMode && !((job.workType || '').toLowerCase().includes(filters.workMode.toLowerCase()))) return false;
      if (filters.industry && !((job.industry || '').toLowerCase().includes(filters.industry.toLowerCase()))) return false;
      
      if (filters.datePosted && filters.datePosted !== 'All') {
        const jobDate = new Date(job.created_at || job.postedDate || 0).getTime();
        const now = Date.now();
        const diffDays = (now - jobDate) / (1000 * 60 * 60 * 24);
        
        if (filters.datePosted === 'Past 24 hours' && diffDays > 1) return false;
        if (filters.datePosted === 'Past week' && diffDays > 7) return false;
        if (filters.datePosted === 'Past month' && diffDays > 30) return false;
      }
      
      if (filters.h1b) {
        if (filters.h1b === 'Sponsors H1B' && job.h1bSponsor !== true && job.h1bSponsor !== 'Likely') return false;
        if (filters.h1b === 'No Sponsorship' && (job.h1bSponsor === true || job.h1bSponsor === 'Likely')) return false;
      }
      
      return true;
    });
  }, [jobsData, filters, applications]);

  const sortedJobs = useMemo(() => {
    if (sortBy === 'match' || sortBy === 'Most Relevant' || sortBy === 'Highest Match %') {
      return filteredJobs; // Backend already perfectly sorted it, including ID tie-breakers
    }
    
    return [...filteredJobs].sort((a, b) => {
      if (sortBy === 'Company A-Z') {
        return (a.company || '').localeCompare(b.company || '');
      }
      if (sortBy === 'newest') {
        const dateA = new Date(a.created_at || a.postedDate || 0).getTime();
        const dateB = new Date(b.created_at || b.postedDate || 0).getTime();
        return dateB - dateA;
      }
      return 0;
    });
  }, [filteredJobs, sortBy]);

  const hasPref = prefs.roles.length > 0 || prefs.skills.length > 0;
  const prefMatchCount = sortedJobs.filter(j => j.matchScore >= 65).length;
  const exactMatchExists = sortedJobs.some(j => j.matchReason?.includes('Strong') || j.matchReason?.includes('Excellent'));

  useEffect(() => {
    const handleFocus = () => {
      const pendingStr = localStorage.getItem('pendingApplyJob');
      if (pendingStr) {
        try {
          const job = JSON.parse(pendingStr);
          setApplyingJob(job);
          setShowApplyModal(true);
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
  }, []);

  const handleConfirmApply = async (didApply) => {
    if (!applyingJob) return;
    
    if (didApply) {
      await updateJobStatus(applyingJob.id || applyingJob._id, 'APPLIED');
    }
    
    localStorage.removeItem('pendingApplyJob');
    setShowApplyModal(false);
    setApplyingJob(null);
  };

  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 md:ml-[240px] w-full md:w-[calc(100%-240px)]">
        <TopBar
          title="Daily Jobs"
          subtitle="Curated job matches updated every morning"
          actions={
            autoApply ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: 'var(--primary-lt)', color: 'var(--primary)' }}>
                Auto Apply: ON ⚡
              </span>
            ) : null
          }
        />

        <main className="p-4 flex flex-col gap-3 relative">
          
          <FilterBar filters={filters} onFilterChange={handleFilterChange} prefMatchCount={prefMatchCount} />

          <div className="grid lg:grid-cols-4 gap-4">
            
            <div className="lg:col-span-3 flex flex-col gap-3">
              
              {!exactMatchExists && hasPref && sortedJobs.length > 0 && (
                <div className="px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
                  <span>⚠️</span> No exact role matches found. Showing closest matches.
                </div>
              )}

              <div className="card p-2 px-3 flex flex-wrap items-center gap-3 justify-between" style={{ borderRadius: '16px' }}>
                <div className="relative flex-1 min-w-[280px]">
                  <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-m)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    className="input rounded-full text-sm" style={{ paddingLeft: '36px', paddingRight: '16px', background: 'var(--bg-card)', paddingBottom: '6px', paddingTop: '6px' }}
                    placeholder="Search by job title, company, skills, industry..."
                    value={search} onChange={e => setSearch(e.target.value)} 
                  />
                </div>

                <div className="flex items-center gap-4">
                  {totalJobs > 0 && (
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-m)' }}>
                      Showing {sortedJobs.length} of {totalJobs} jobs
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[0.8rem] font-semibold" style={{ color: 'var(--text-m)' }}>Sort By:</span>
                    <select 
                      className="input rounded-full py-1 px-3 w-auto cursor-pointer text-sm" style={{ background: 'var(--bg-card)', fontWeight: 'bold' }}
                      value={sortBy} onChange={e => setSortBy(e.target.value)}
                    >
                    <option value="match">Best Match</option>
                    <option value="Highest Match %">Highest Match %</option>
                    <option value="Most Relevant">Most Relevant</option>
                    <option value="newest">Newest</option>
                    <option value="Company A-Z">Company A-Z</option>
                  </select>
                </div>
                </div>
              </div>

              {loading && <div className="p-10 text-center font-bold" style={{ color: 'var(--text-m)' }}>Loading jobs...</div>}

              {!loading && (
                <div className="flex flex-col gap-3">
                  {sortedJobs.map(j => <JobCard key={j.id} job={j} />)}
                  {sortedJobs.length === 0 && (
                    <div className="card p-12 text-center flex flex-col items-center gap-3">
                      <span className="text-4xl">🔍</span>
                      <p className="font-bold" style={{ color: 'var(--text-h)' }}>No jobs matched your filters</p>
                      <button className="btn btn-ghost btn-sm mt-2" onClick={() => setFilters({})}>Clear Filters</button>
                    </div>
                  )}
                </div>
              )}

              {!loading && page < totalPages && (
                <div className="flex justify-center mt-2 mb-6">
                  <button 
                    className="btn px-6 py-2 rounded-full font-bold shadow-sm hover:translate-y-[-1px] transition-transform"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-b)', border: '1px solid var(--border)' }}
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Jobs'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <ProGate inline featureName="Auto Apply">
                <AutoApplyPanel />
              </ProGate>

              <div className="card p-4">
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-m)' }}>MANUAL APPLY</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-b)' }}>
                  Click <strong>Apply</strong> on any job to open the link and mark it as pending.
                </p>
                <div className="mt-3 flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text-m)' }}>
                  <div className="flex items-center gap-1.5"><span style={{ color: 'var(--primary)' }}>✓</span> Real-time Job Postings</div>
                  <div className="flex items-center gap-1.5"><span style={{ color: 'var(--primary)' }}>✓</span> Skill match analysis shown</div>
                  <div className="flex items-center gap-1.5"><span style={{ color: 'var(--primary)' }}>✓</span> Filter by preferences</div>
                  <div className="flex items-center gap-1.5"><span style={{ color: 'var(--primary)' }}>✓</span> Apply directly</div>
                </div>
              </div>

              {hasPref && (
                <div className="card p-4" style={{ background: 'var(--primary-lt)', border: '1px solid rgba(31,122,108,.15)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: 'var(--primary)' }}>YOUR FOCUS</p>
                  <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--sec-mid)' }}>
                    <div><span className="font-semibold">Roles: </span>{prefs.roles.slice(0,2).join(', ')}</div>
                    {prefs.workPreference && <div><span className="font-semibold">Work: </span>{prefs.workPreference}</div>}
                    {prefs.experienceLevel && <div><span className="font-semibold">Level: </span>{prefs.experienceLevel}</div>}
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
