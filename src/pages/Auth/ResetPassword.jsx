import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sparkles, ArrowRight, AlertCircle, Eye, EyeOff,
  CheckCircle, ArrowLeft, ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score === 0) return { label: '', color: '', width: '0%' }
  if (score === 1) return { label: 'Weak', color: 'bg-red-400', width: '25%' }
  if (score === 2) return { label: 'Fair', color: 'bg-amber-400', width: '50%' }
  if (score === 3) return { label: 'Good', color: 'bg-blue-400', width: '75%' }
  return { label: 'Strong', color: 'bg-green-500', width: '100%' }
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()

  const token = searchParams.get('token')
  const hasToken = Boolean(token)

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')

  const strength = getStrength(form.password)
  const passwordsMatch = form.password && form.confirm && form.password === form.confirm
  const canSubmit = hasToken && form.password.length >= 6 && passwordsMatch && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, form.password)
      setStep('success')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 flex flex-col items-center justify-center bg-glow-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-glow-muted font-inter text-sm hover:text-glow-gold transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>

          <AnimatePresence mode="wait">
            {!hasToken && (
              <motion.div
                key="no-token"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center mb-10">
                  <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> Invalid Link
                  </span>
                  <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
                    Link Not Valid
                  </h1>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed">
                    This reset link is missing or malformed. Please request a new one.
                  </p>
                </div>
                <div className="card-luxury p-8 text-center">
                  <Link
                    to="/forgot-password"
                    className="btn-gold px-8 py-3 inline-flex items-center gap-2"
                  >
                    Request New Link <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            )}

            {hasToken && step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-glow-gold/10 mb-5">
                    <ShieldCheck size={30} className="text-glow-gold" />
                  </div>
                  <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> Set New Password
                  </span>
                  <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
                    Create New Password
                  </h1>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed">
                    Choose a strong password for your GlowAI account.
                  </p>
                </div>

                <div className="card-luxury p-8">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-inter text-sm text-red-600">{error}</p>
                        {error.toLowerCase().includes('expired') && (
                          <Link
                            to="/forgot-password"
                            className="font-inter text-xs text-red-500 underline mt-1 inline-block"
                          >
                            Request a new link →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="font-inter text-sm font-medium text-glow-black block mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={form.password}
                          onChange={e => setForm({ ...form, password: e.target.value })}
                          className="w-full border border-glow-border rounded-xl px-4 py-3 pr-11 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-glow-muted hover:text-glow-black transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>

                      {form.password && (
                        <div className="mt-2">
                          <div className="h-1 w-full bg-glow-border rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: strength.width }}
                              transition={{ duration: 0.3 }}
                              className={`h-full rounded-full ${strength.color}`}
                            />
                          </div>
                          <p className="font-inter text-xs text-glow-muted mt-1">
                            Strength:{' '}
                            <span className="font-medium text-glow-black">{strength.label}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-inter text-sm font-medium text-glow-black block mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          required
                          value={form.confirm}
                          onChange={e => setForm({ ...form, confirm: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-3 pr-11 font-inter text-sm text-glow-black bg-glow-surface outline-none transition-colors ${
                            form.confirm
                              ? passwordsMatch
                                ? 'border-green-400 focus:border-green-400'
                                : 'border-red-300 focus:border-red-300'
                              : 'border-glow-border focus:border-glow-gold'
                          }`}
                          placeholder="••••••••"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-glow-muted hover:text-glow-black transition-colors"
                          aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                          {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {form.confirm && !passwordsMatch && (
                        <p className="font-inter text-xs text-red-500 mt-1">
                          Passwords don't match.
                        </p>
                      )}
                      {form.confirm && passwordsMatch && (
                        <p className="font-inter text-xs text-green-600 mt-1">
                          Passwords match ✓
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                      {!loading && <ArrowRight size={16} />}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-glow-border text-center">
                    <p className="font-inter text-sm text-glow-muted">
                      Remember your password?{' '}
                      <Link to="/login" className="text-glow-gold font-medium hover:underline">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {hasToken && step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 mb-5"
                  >
                    <CheckCircle size={40} className="text-green-500" />
                  </motion.div>
                  <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> All Done
                  </span>
                  <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
                    Password Updated!
                  </h1>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed">
                    Your password has been changed successfully.
                    You can now sign in with your new credentials.
                  </p>
                </div>

                <div className="card-luxury p-8 text-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="btn-gold px-8 py-3.5 inline-flex items-center gap-2"
                  >
                    Sign In Now <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </MainLayout>
  )
}