import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MainLayout from '../../layouts/MainLayout'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 flex flex-col items-center justify-center bg-glow-bg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Join the Club
            </span>
            <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
              Create Your Account
            </h1>
            <p className="font-inter text-sm text-glow-muted">
              Your personalized beauty stylist awaits.
            </p>
          </div>

          <div className="card-luxury p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3">
                <AlertCircle size={16} className="text-red-500" />
                <p className="font-inter text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-inter text-sm font-medium text-glow-black block mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                  placeholder="e.g. Priya Sharma"
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-glow-black block mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="font-inter text-sm font-medium text-glow-black block mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !form.name || !form.email || !form.password}
                className="btn-gold w-full py-3.5 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-glow-border text-center">
              <p className="font-inter text-sm text-glow-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-glow-gold font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
