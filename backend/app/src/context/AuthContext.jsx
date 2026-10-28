import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const AuthContext = createContext(null)

import { API_BASE } from '../config/api'

async function safeJson(res) {
  const text = await res.text()
  try { return JSON.parse(text) } 
  catch { return { message: 'Server returned an invalid response (HTML)' } }
}

// ── localStorage helpers ───────────────────────────────────────────
const LS = {
  get:    (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  remove: (k)    => localStorage.removeItem(k),
}


// ── Legacy Domain Mapping ──────────────────────────────────────────
const OLD_DOMAIN_MAPPING = {
  'Information Technology': 'Infrastructure & Networking',
  'Software Engineering': 'Software Development',
  'Frontend': 'Software Development',
  'Backend': 'Software Development',
  'Full Stack': 'Software Development',
  'AI/ML': 'AI & Data',
  'Data Engineering': 'AI & Data',
  'Cloud': 'Cloud, DevOps & Security',
  'DevOps': 'Cloud, DevOps & Security',
  'QA': 'Testing & QA',
  'Cybersecurity': 'Cloud, DevOps & Security',
  'ServiceNow': 'Enterprise Applications'
};

const OLD_ROLE_MAPPING = {
  'Senior Software Engineer': 'Software Engineer',
  'Principal Engineer': 'Software Engineer',
  'Engineering Manager': 'Software Engineer',
  'Product Engineer': 'Software Engineer',
  '.NET Developer': 'Backend Developer',
  'Software Architect': 'Solutions Architect',
  'Database Administrator': 'Data Engineer',
  'Data Analyst': 'Data Scientist',
  'Cloud Architect': 'Cloud Engineer',
  'DevSecOps Engineer': 'DevOps Engineer',
  'Security Engineer': 'Cybersecurity Analyst',
  'ServiceNow Architect': 'ServiceNow Developer',
  'ServiceNow Administrator': 'ServiceNow Developer',
  'SDET': 'Automation Test Engineer',
  'IT Manager': 'System Administrator',
  'Help Desk Technician': 'System Administrator'
};

function mapLegacyPreferences(prefs) {
  if (!prefs) return prefs;
  
  const mappedDomains = new Set();
  (prefs.domains || []).forEach(d => {
    if (OLD_DOMAIN_MAPPING[d]) mappedDomains.add(OLD_DOMAIN_MAPPING[d]);
    else mappedDomains.add(d);
  });
  
  const mappedRoles = new Set();
  (prefs.roles || []).forEach(r => {
    if (OLD_ROLE_MAPPING[r]) mappedRoles.add(OLD_ROLE_MAPPING[r]);
    else mappedRoles.add(r);
  });

  return { ...prefs, domains: Array.from(mappedDomains), roles: Array.from(mappedRoles) };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken'))
  const [currentUser, setCurrentUser] = useState(null)
  const [storedPrefs, setStoredPrefs] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const isLoggedIn = !!token
  const pricingCompleted = currentUser?.pricingCompleted === true
  const onboardingCompleted = currentUser?.onboardingCompleted === true
  const prefsExist = storedPrefs && (storedPrefs.domains?.length > 0 || storedPrefs.roles?.length > 0)

  // Fetch user profile if token exists
  useEffect(() => {
    if (!token) {
      setCurrentUser(null)
      setStoredPrefs(null)
      setIsLoading(false)
      return
    }

    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await safeJson(res)
          setCurrentUser(data.user)
          setStoredPrefs(mapLegacyPreferences(data.user.preferences) || null)
        } else {
          // Token might be invalid
          logout()
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMe()
  }, [token])

  // ── Register ───────────────────────────────────────────────────
  const register = useCallback(async ({ name, firstName, lastName, email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, firstName, lastName, email, password })
      })
      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 403 && data.requireOTP) {
          return { ok: false, requireOTP: true, email: data.email, error: data.message }
        }
        return { ok: false, error: data.message || 'Registration failed.' }
      }
      
      // Auth Flow Fix: Do not auto-login on signup
      return { ok: true }
    } catch (error) {
      console.error("Register error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server. Ensure backend is running and CORS is configured.' : `Network error: ${error.message}` }
    }
  }, [])

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await safeJson(res)
      if (!res.ok) {
        if (res.status === 403 && data.requireOTP) {
          return { ok: false, requireOTP: true, email: data.email, error: data.message }
        }
        return { ok: false, error: data.message || 'Invalid credentials.' }
      }
      
      localStorage.setItem('authToken', data.token)
      setToken(data.token)
      setCurrentUser(data.user)
      setStoredPrefs(mapLegacyPreferences(data.user.preferences) || null)
      return { ok: true }
    } catch (error) {
      console.error("Login error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server. Ensure backend is running and CORS is configured.' : `Network error: ${error.message}` }
    }
  }, [])

  // ── Google Login ────────────────────────────────────────────────
  const googleLogin = useCallback(async (credentialResponse) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      })
      const data = await safeJson(res)
      
      if (!res.ok) {
        if (res.status === 403 && data.requireOTP) {
          return { ok: false, requireOTP: true, email: data.email, error: data.message }
        }
        return { ok: false, error: data.message || 'Google Login failed.' }
      }
      
      localStorage.setItem('authToken', data.token)
      setToken(data.token)
      setCurrentUser(data.user)
      setStoredPrefs(mapLegacyPreferences(data.user.preferences) || null)
      return { ok: true }
    } catch (error) {
      console.error("Google Login error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server.' : `Network error: ${error.message}` }
    }
  }, [])

  // ── Verify OTP ──────────────────────────────────────────────────
  const verifyOTP = useCallback(async (email, otp) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
      const data = await safeJson(res)
      
      if (!res.ok) {
        return { ok: false, error: data.message || 'OTP verification failed.' }
      }
      
      localStorage.setItem('authToken', data.token)
      setToken(data.token)
      setCurrentUser(data.user)
      setStoredPrefs(mapLegacyPreferences(data.user.preferences) || null)
      return { ok: true }
    } catch (error) {
      console.error("Verify OTP error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server.' : `Network error: ${error.message}` }
    }
  }, [])

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {}); // ignore errors on logout
      }
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setToken(null);
      setCurrentUser(null);
      setStoredPrefs(null);
    }
  }, [token])

  // ── Save preferences ───────────────────────────────────────────
  const savePreferences = useCallback(async (prefs) => {
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}/users/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(prefs)
      })
      const data = await safeJson(res)
      if (!res.ok) return { ok: false, error: data.message || 'Failed to save preferences' }
      
      setStoredPrefs(mapLegacyPreferences(data.preferences) || mapLegacyPreferences(prefs))
      if (data.user) {
        setCurrentUser({ ...data.user, onboardingCompleted: true })
      } else {
        setCurrentUser(prev => prev ? { ...prev, onboardingCompleted: true } : prev)
      }
      return { ok: true }
    } catch (error) {
      console.error("Save preferences error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server. Ensure backend is running and CORS is configured.' : `Network error: ${error.message}` }
    }
  }, [token])

  // ── Upload & parse resume ──────────────────────────────────────────────
  const uploadResume = useCallback(async (file) => {
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const res = await fetch(`${API_BASE}/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await safeJson(res)
      if (!res.ok) return { ok: false, error: data.message || 'Upload failed.' }
      return { ok: true, parsed: data.resume?.optimized || data.resume?.parsed || {} }
    } catch (error) {
      console.error('Upload resume error:', error)
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server.' : `Network error: ${error.message}` }
    }
  }, [token])

  // ── Update user profile ────────────────────────────────────────
  const updateProfile = useCallback(async (data) => {
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      const resData = await safeJson(res)
      if (!res.ok) return { ok: false, error: resData.message || 'Failed to update profile' }
      
      setCurrentUser(resData.user)
      return { ok: true }
    } catch (error) {
      console.error("Update profile error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server. Ensure backend is running and CORS is configured.' : `Network error: ${error.message}` }
    }
  }, [token])

  // ── Complete Pricing ───────────────────────────────────────────
  const completePricing = useCallback(async () => {
    if (!token) return { ok: false, error: 'Not authenticated' }
    try {
      const res = await fetch(`${API_BASE}/users/complete-pricing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const text = await res.text()
        console.error("API Error Text:", text)
        try {
          const data = JSON.parse(text)
          return { ok: false, error: data.message || 'Failed to complete pricing' }
        } catch {
          return { ok: false, error: 'Server returned an invalid response (HTML)' }
        }
      }
      
      const data = await safeJson(res)
      setCurrentUser(data.user)
      return { ok: true }
    } catch (error) {
      console.error("Complete pricing error:", error);
      return { ok: false, error: error.message === 'Failed to fetch' ? 'Cannot connect to server.' : `Network error: ${error.message}` }
    }
  }, [token])

  const contextValue = useMemo(() => ({
    isLoggedIn,
    token,
    currentUser,
    pricingCompleted,
    onboardingCompleted,
    storedPrefs,
    prefsExist,
    isLoading,
    register,
    login,
    googleLogin,
    verifyOTP,
    logout,
    savePreferences,
    uploadResume,
    updateProfile,
    completePricing,
  }), [
    isLoggedIn, token, currentUser, pricingCompleted, onboardingCompleted,
    storedPrefs, prefsExist, isLoading,
    register, login, googleLogin, verifyOTP, logout, savePreferences, uploadResume, updateProfile, completePricing
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
