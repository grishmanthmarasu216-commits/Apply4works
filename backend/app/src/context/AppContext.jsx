import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)
import { API_BASE } from '../config/api'

export function AppProvider({ children }) {
  const { sessionEmail, currentUser, storedPrefs, token } = useAuth()

  // ── Global Backend State ─────────────────────────────────────────
  const [applications, setApplications] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [likedJobs, setLikedJobs] = useState([])
  const [followUpsList, setFollowUpsList] = useState([])
  const [globalStats, setGlobalStats] = useState({ totalJobsToday: 0, appliedCount: 0, savedCount: 0, prefMatchCount: 0 })
  const [isGlobalLoading, setIsGlobalLoading] = useState(true)

  // ── Mobile Sidebar State ───────────────────────────────────────
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // ── Auto Apply session ─────────────────────────────────────────
  const [autoApply,    setAutoApply]   = useState(false)
  const [autoSession,  setAutoSession] = useState(null)
  const timerRef   = useRef(null)
  const applierRef = useRef(null)

  // ── Toast state ───────────────────────────────────────────────
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success', duration = 1400) => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
  }, [])

  // ── Fetch Global Data ─────────────────────────────────────────
  const refreshGlobalData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const safeFetch = (url, opts) => fetch(url, opts).catch(() => ({ ok: false, json: async () => ({}) }));

      const [appRes, savedRes, likedRes, followRes, statsRes] = await Promise.all([
        safeFetch(`${API_BASE}/applications`, { headers }),
        safeFetch(`${API_BASE}/jobs/saved`, { headers }),
        safeFetch(`${API_BASE}/jobs/liked`, { headers }),
        safeFetch(`${API_BASE}/applications/followups`, { headers }),
        safeFetch(`${API_BASE}/dashboard/stats`, { headers })
      ]);

      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data.applications || []);
      }
      if (savedRes.ok) {
        const data = await savedRes.json();
        setSavedJobs(data.savedJobs || []);
      }
      if (likedRes.ok) {
        const data = await likedRes.json();
        setLikedJobs(data.likedJobs || []);
      }
      if (followRes.ok) {
        const data = await followRes.json();
        setFollowUpsList(data.followups || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setGlobalStats(data);
      }
    } catch (e) {
      console.error('Error refreshing global data:', e);
    } finally {
      setIsGlobalLoading(false);
    }
  }, [token]);

  // Initial fetch on token change
  useEffect(() => {
    if (token) {
      setIsGlobalLoading(true);
      refreshGlobalData();
    } else {
      setApplications([]);
      setSavedJobs([]);
      setFollowUpsList([]);
      setGlobalStats({ totalJobsToday: 0, appliedCount: 0, savedCount: 0, prefMatchCount: 0 });
      setIsGlobalLoading(false);
    }
  }, [token, refreshGlobalData]);

  // ── Save job ──────────────────────────────────────────────────
  const saveJob = useCallback(async (jobId, isCurrentlySaved) => {
    try {
      // Optimistic Update
      if (isCurrentlySaved) {
        setSavedJobs(prev => prev.filter(s => (s.jobId?._id || s.jobId) !== jobId));
      } else {
        setSavedJobs(prev => [...prev, { jobId: { _id: jobId } }]);
      }

      const method = isCurrentlySaved ? 'DELETE' : 'POST';
      const endpoint = isCurrentlySaved ? `${API_BASE}/jobs/save/${jobId}` : `${API_BASE}/jobs/save`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(!isCurrentlySaved && { body: JSON.stringify({ jobId }) })
      })

      if (res.ok) {
        toast(!isCurrentlySaved ? 'Job saved 🔖' : 'Removed from saved')
        await refreshGlobalData()
        return true
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast('Failed to save job', 'error')
    }
    return false
  }, [token, refreshGlobalData, toast])

  // ── Like job ──────────────────────────────────────────────────
  const likeJob = useCallback(async (jobId, isCurrentlyLiked) => {
    try {
      // Optimistic Update
      if (isCurrentlyLiked) {
        setLikedJobs(prev => prev.filter(s => (s.jobId?._id || s.jobId) !== jobId));
      } else {
        setLikedJobs(prev => [...prev, { jobId: { _id: jobId } }]);
      }

      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      const endpoint = isCurrentlyLiked ? `${API_BASE}/jobs/like/${jobId}` : `${API_BASE}/jobs/like`;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(!isCurrentlyLiked && { body: JSON.stringify({ jobId }) })
      })

      if (res.ok) {
        toast(!isCurrentlyLiked ? 'Job liked ❤️' : 'Removed from liked')
        await refreshGlobalData()
        return true
      }
    } catch (error) {
      console.error('Error liking:', error)
      toast('Failed to like job', 'error')
    }
    return false
  }, [token, refreshGlobalData, toast])

  // ── Apply to job ──────────────────────────────────────────────
  const applyToJob = useCallback(async (job, source = 'Manual') => {
    try {
      console.log(`[AppContext] applyToJob called for jobId: ${job.id || job._id}`);
      
      // Optimistic update
      setApplications(prev => {
        const targetId = job.id || job._id;
        if (prev.some(a => (a.jobId?._id || a.jobId) === targetId)) return prev;
        return [...prev, { jobId: job, status: 'PENDING_SUBMISSION', source, matchScore: job.matchScore || 0, appliedDate: new Date() }];
      });

      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ jobId: job.id || job._id, source, matchScore: job.matchScore || 0, status: 'PENDING_SUBMISSION' })
      });
      console.log(`[AppContext] applyToJob response status: ${res.status}`);
      if (res.ok) {
        if (source !== 'Manual') toast(`Auto Apply: Applied to ${job.title || 'job'} ⚡`, 'success');
        await refreshGlobalData();
        console.log(`[AppContext] refreshGlobalData completed after apply`);
        return true;
      } else {
        const errData = await res.json();
        console.error(`[AppContext] applyToJob failed:`, errData);
      }
    } catch (e) {
      console.error('[AppContext] Error in applyToJob:', e);
    }
    return false;
  }, [token, refreshGlobalData, toast])

  // ── Update Status ──────────────────────────────────────────────
  const updateJobStatus = useCallback(async (jobId, newStatus) => {
    try {
      console.log(`[AppContext] updateJobStatus called for jobId: ${jobId}, newStatus: ${newStatus}`);
      
      // Optimistic update
      setApplications(prev => prev.map(a => {
        if ((a.jobId?._id || a.jobId) === jobId || a._id === jobId) {
          return { ...a, status: newStatus };
        }
        return a;
      }));

      const res = await fetch(`${API_BASE}/applications/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: newStatus })
      });
      
      console.log(`[AppContext] updateJobStatus response status: ${res.status}`);
      if (res.ok) {
        await refreshGlobalData();
        console.log(`[AppContext] refreshGlobalData completed after status update`);
        if (newStatus === 'WITHDRAWN') toast('Application withdrawn', 'info');
        else if (newStatus === 'APPLIED') toast('Marked as Applied! 🎉', 'success');
        else if (newStatus === 'REJECTED') toast('Marked as Rejected', 'info');
        else toast(`Moved to ${newStatus}`);
        return true;
      } else {
        const errData = await res.json();
        console.error(`[AppContext] updateJobStatus failed:`, errData);
      }
    } catch (error) {
      console.error('[AppContext] Error in updateJobStatus:', error);
      toast('Failed to update status', 'error');
    }
    return false;
  }, [token, refreshGlobalData, toast])

  const markInterview = useCallback((jobId) => updateJobStatus(jobId, 'INTERVIEW'), [updateJobStatus])
  const markRejected = useCallback((jobId) => updateJobStatus(jobId, 'REJECTED'), [updateJobStatus])
  const withdrawApplication = useCallback((jobId) => updateJobStatus(jobId, 'WITHDRAWN'), [updateJobStatus])

  // ── Stop Auto Apply ───────────────────────────────────────────
  const stopAutoApply = useCallback((msg = 'Auto Apply session stopped') => {
    if (timerRef.current)   clearInterval(timerRef.current)
    if (applierRef.current) clearInterval(applierRef.current)
    timerRef.current = applierRef.current = null
    setAutoApply(false)
    setAutoSession(s => s ? { ...s, running: false, currentJob: null } : null)
    toast(msg, 'info')
  }, [toast])

  // ── Start Auto Apply ──────────────────────────────────────────
  const startAutoApply = useCallback(async ({ timeLimit, maxApps, minScore, availableJobs }) => {
    // Validate user profile
    if (!currentUser) { toast('Please log in first', 'error'); return }
    if (!storedPrefs?.roles?.length) { toast('Set your role preferences first', 'info'); return }

    // Build eligible queue
    const queue = availableJobs
      .filter(j => {
        const isApplied = j.status === 'APPLIED' || j.status === 'INTERVIEW' || j.status === 'REJECTED' || j.status === 'PENDING_SUBMISSION'
        return j.matchScore >= minScore && !isApplied
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxApps)

    if (queue.length === 0) {
      toast(`No eligible jobs found (≥${minScore}% match, not yet applied)`, 'info')
      return
    }

    setAutoApply(true)
    setAutoSession({ running: true, submitted: 0, timeRemaining: timeLimit, maxApps, minScore, currentJob: queue[0], queue, total: queue.length, idx: 0 })
    toast(`Auto Apply started — ${queue.length} jobs queued ⚡`)

    let timeLeft  = timeLimit
    let submitted = 0
    let idx       = 0

    // Countdown every second
    timerRef.current = setInterval(() => {
      timeLeft -= 1
      setAutoSession(s => s ? { ...s, timeRemaining: timeLeft } : null)
      if (timeLeft <= 0) {
        clearInterval(timerRef.current)
        clearInterval(applierRef.current)
        timerRef.current = applierRef.current = null
        setAutoApply(false)
        setAutoSession(s => s ? { ...s, running: false, currentJob: null } : null)
        toast(`Auto Apply complete — ${submitted} application${submitted !== 1 ? 's' : ''} submitted ✓`)
      }
    }, 1000)

    // Apply one job every 3 seconds
    applierRef.current = setInterval(async () => {
      if (idx >= queue.length || submitted >= maxApps) {
        clearInterval(applierRef.current)
        clearInterval(timerRef.current)
        timerRef.current = applierRef.current = null
        setAutoApply(false)
        setAutoSession(s => s ? { ...s, running: false, currentJob: null } : null)
        toast(`Auto Apply complete — ${submitted} application${submitted !== 1 ? 's' : ''} submitted ✓`)
        return
      }
      const job = queue[idx]
      
      // Auto-Apply creates PENDING_SUBMISSION, but for "Auto" let's just create it. 
      // To simulate auto apply, we apply and immediately set to APPLIED.
      const started = await applyToJob(job, 'Auto');
      if (started) {
        await updateJobStatus(job.id || job._id, 'APPLIED');
        submitted += 1;
      }
      idx += 1
      setAutoSession(s => s ? { ...s, submitted, idx, currentJob: idx < queue.length ? queue[idx] : null } : null)
    }, 3000)
  }, [currentUser, storedPrefs, applyToJob, updateJobStatus, toast])

  const contextValue = useMemo(() => ({
    applications,
    savedJobs,
    likedJobs,
    followUpsList,
    globalStats,
    isGlobalLoading,
    refreshGlobalData,
    saveJob, likeJob, applyToJob, markInterview, markRejected, updateJobStatus, withdrawApplication,
    autoApply, setAutoApply,
    autoSession,
    startAutoApply, stopAutoApply,
    toast,
    isMobileSidebarOpen, setMobileSidebarOpen
  }), [
    applications, savedJobs, likedJobs, followUpsList, globalStats, isGlobalLoading, refreshGlobalData,
    saveJob, likeJob, applyToJob, markInterview, markRejected, updateJobStatus, withdrawApplication,
    autoApply, autoSession, startAutoApply, stopAutoApply, toast, isMobileSidebarOpen
  ])

  return (
    <AppContext.Provider value={contextValue}>
      {children}

      {/* Global toast */}
      <div className="fixed bottom-6 right-6 z-[400] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 320 }}>
        {toasts.map(t => (
          <div key={t.id} className="px-5 py-3 rounded-xl text-sm font-semibold shadow-lg pointer-events-auto"
            style={{ background: t.type === 'success' ? 'var(--primary)' : t.type === 'info' ? 'var(--sec-mid)' : '#dc2626', color: '#fff', animation: 'fadeUp .3s ease both' }}>
            {t.msg}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

