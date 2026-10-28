import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../context/AuthContext'
import GlobalLogo from '../components/GlobalLogo'


export default function Register() {
  const { register, googleLogin, verifyOTP } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '', otp: '' })
  const [error, setError] = useState('')
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

    if (!form.firstName.trim())  return setError('Please enter your first name.')
    if (!form.lastName.trim())   return setError('Please enter your last name.')
    if (!form.email.trim())      return setError('Please enter your email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')

    setLoading(true)
    const result = await register({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), password: form.password })
    setLoading(false)

    if (!result.ok) {
      if (result.requireOTP) {
        setRequireOTP(true)
        setOtpEmail(result.email || form.email.trim())
        setError('Please verify your email to continue.')
        return
      }
      return setError(result.error)
    }
    
    // Auth Flow Fix: redirect to login
    navigate('/login', { state: { message: 'Account created successfully! Please log in.' } })
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
          <h1 className="font-extrabold text-xl mb-1" style={{ color: 'var(--text-h)' }}>Create your account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-m)' }}>Start discovering jobs matched to your domain and role.</p>

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
                <input id="reg-otp" type="text" className="input" placeholder="Enter OTP sent to your email" value={form.otp} onChange={e => set('otp', e.target.value)} required />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>First Name</label>
                    <input id="reg-firstName" className="input" placeholder="e.g. John" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Last Name</label>
                    <input id="reg-lastName" className="input" placeholder="e.g. Smith" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Email Address</label>
                  <input id="reg-email" type="email" className="input" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Password</label>
                  <input id="reg-password" type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide block mb-1.5" style={{ color: 'var(--text-m)' }}>Confirm Password</label>
                  <input id="reg-confirm" type="password" className="input" placeholder="Re-enter password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary btn-lg justify-center mt-2" disabled={loading}>
              {loading ? 'Processing…' : (requireOTP ? 'Verify & Continue →' : 'Create Account & Continue →')}
            </button>

          </form>

          {!requireOTP && (
            <p className="text-sm text-center mt-5" style={{ color: 'var(--text-m)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-bold" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
