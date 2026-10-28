import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import GlobalLogo from '../components/GlobalLogo'


export default function Login() {
  const { login, googleLogin, verifyOTP } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', otp: '' })
  const [error, setError] = useState('')
  const [successMsg] = useState(location.state?.message || '')
  const [loading, setLoading] = useState(false)
  const [requireOTP, setRequireOTP] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (requireOTP) {
      if (!form.otp.trim()) return setError('Please enter the verification code.')
      setLoading(true)
      const result = await verifyOTP(otpEmail, form.otp.trim())
      setLoading(false)
      
      if (!result.ok) return setError(result.error || 'Invalid OTP.')
      navigate('/jobs')
      return;
    }
    
    if (!form.email.trim())    return setError('Please enter your email address.')
    if (!form.password.trim()) return setError('Please enter your password.')

    setLoading(true)
    const result = await login({ email: form.email.trim(), password: form.password })
    setLoading(false)

    if (!result.ok) {
      if (result.requireOTP) {
        setRequireOTP(true)
        setOtpEmail(result.email || form.email.trim())
        setError('Please verify your email to continue.')
        return
      }
      return setError('Invalid email or password. Please try again.')
    }

    // AppRoute in App.jsx automatically redirects to /onboarding if prefs are missing
    navigate('/jobs')
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    const result = await googleLogin(credentialResponse)
    setLoading(false)

    if (!result.ok) {
      if (result.requireOTP) {
        setRequireOTP(true)
        setOtpEmail(result.email)
        setError('Please verify your email to continue.')
      } else {
        setError(result.error)
      }
      return
    }

    navigate('/jobs')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <GlobalLogo size="lg" />
        </div>

        <div className="card p-8">
          <h1 className="font-extrabold text-xl mb-1" style={{ color: 'var(--text-h)' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-m)' }}>Log in to continue your job search.</p>

          {successMsg && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {!requireOTP && (
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign in failed')}
                useOneTap
              />
            </div>
          )}
          
          {!requireOTP && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {requireOTP ? (
               <div>
                <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Verification Code</label>
                <input id="login-otp" type="text" className="input" placeholder="Enter OTP sent to your email" value={form.otp} onChange={e => set('otp', e.target.value)} required />
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Email Address</label>
                  <input id="login-email" type="email" className="input" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Password</label>
                  <input id="login-password" type="password" className="input" placeholder="Your password" value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg justify-center mt-2" disabled={loading}>
              {loading ? 'Processing…' : (requireOTP ? 'Verify & Continue →' : 'Log In →')}
            </button>

          </form>

          {!requireOTP && (
            <p className="text-sm text-center mt-5" style={{ color: 'var(--text-m)' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-bold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign up free</Link>
            </p>
          )}

          {/* Demo hint */}
          <div className="mt-5 p-3 rounded-xl text-xs text-center" style={{ background: 'var(--bg-subtle)', color: 'var(--text-m)' }}>
            First time? Click <strong>Sign up free</strong> to create an account and set your preferences.
          </div>
        </div>
      </div>
    </div>
  )
}
