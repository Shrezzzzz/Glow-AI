import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, AlertCircle, Mail, CheckCircle, ArrowLeft, Copy, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('request')
  const [resetToken, setResetToken] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await forgotPassword(email.trim())
      setResetToken(result.token)
      setStep('sent')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetLink = resetToken
    ? `${window.location.origin}/reset-password?token=${resetToken}`
    : null

  const copyLink = () => {
    if (!resetLink) return
    navigator.clipboard.writeText(resetLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const goToReset = () => {
    if (resetToken) {
      navigate(`/reset-password?token=${resetToken}`)
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
            {step === 'request' && (
              <motion.div
                key="request"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="text-center mb-10">
                  <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> Password Recovery
                  </span>
                  <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
                    Forgot Your Password?
                  </h1>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed">
                    No worries. Enter your registered email address and we'll
                    generate a reset link for you.
                  </p>
                </div>

                <div className="card-luxury p-8">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                      <p className="font-inter text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="font-inter text-sm font-medium text-glow-black block mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-glow-muted pointer-events-none"
                        />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full border border-glow-border rounded-xl pl-10 pr-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Reset Link'}
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

            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-center mb-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-glow-gold/10 mb-5">
                    <CheckCircle size={32} className="text-glow-gold" />
                  </div>
                  <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                    <Sparkles size={12} /> Reset Link Ready
                  </span>
                  <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
                    Check Your Link
                  </h1>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed">
                    {resetToken ? (
                      <>
                        A reset link has been generated for{' '}
                        <strong className="text-glow-black">{email}</strong>.
                        In production this would arrive via email — for now, use the link below.
                      </>
                    ) : (
                      <>
                        If <strong className="text-glow-black">{email}</strong> is registered,
                        a reset link would be sent to that address. Please check your inbox.
                      </>
                    )}
                  </p>
                </div>

                <div className="card-luxury p-8 space-y-4">
                  {resetToken ? (
                    <>
                      <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                        <p className="font-inter text-xs text-amber-800 font-medium mb-2 uppercase tracking-widest">
                          Demo Mode — Reset Link
                        </p>
                        <p className="font-inter text-xs text-amber-700 break-all leading-relaxed">
                          {resetLink}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={copyLink}
                          className="flex-1 flex items-center justify-center gap-2 border border-glow-border rounded-xl py-3 font-inter text-sm text-glow-black hover:border-glow-gold transition-colors"
                        >
                          {copied
                            ? <Check size={15} className="text-green-500" />
                            : <Copy size={15} />}
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>

                        <button
                          onClick={goToReset}
                          className="flex-1 btn-gold py-3 flex items-center justify-center gap-2"
                        >
                          Reset Password <ArrowRight size={15} />
                        </button>
                      </div>

                      <p className="font-inter text-xs text-glow-muted text-center">
                        This link expires in 15 minutes.
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="font-inter text-sm text-glow-muted mb-6">
                        Didn't receive a link? Check the email address you used to register,
                        or try again.
                      </p>
                      <button
                        onClick={() => { setStep('request'); setError('') }}
                        className="btn-gold px-8 py-3 flex items-center justify-center gap-2 mx-auto"
                      >
                        Try Again <ArrowRight size={15} />
                      </button>
                    </div>
                  )}

                  <div className="pt-4 border-t border-glow-border text-center">
                    <Link to="/login" className="font-inter text-sm text-glow-gold hover:underline">
                      Return to Sign In
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </MainLayout>
  )
}