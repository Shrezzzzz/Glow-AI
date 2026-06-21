import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sparkles, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Discover',       href: '/salons' },
  { label: 'Style Profile', href: '/profile-setup' },
  { label: 'Experiences',    href: '/experiences' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-[900] transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-xl shadow-card border-b border-glow-border'
          : 'bg-white/70 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 lg:h-20 relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-glow-black rounded-full flex items-center justify-center shadow-luxury">
            <Sparkles size={15} className="text-glow-gold" />
          </div>
          <span className="font-playfair text-xl font-semibold text-glow-ink tracking-tight">GlowAI</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`relative font-inter text-sm transition-colors duration-300 after:absolute after:left-0 after:-bottom-2 after:h-px after:bg-glow-gold after:transition-all after:duration-300 ${
                location.pathname === l.href
                  ? 'text-glow-gold after:w-full'
                  : 'text-glow-muted hover:text-glow-ink after:w-0 hover:after:w-full'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 font-inter text-sm text-glow-ink hover:text-glow-gold transition-colors">
              <User size={16} /> My Profile
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="font-inter text-sm text-glow-muted hover:text-glow-ink transition-colors">
              Sign In
            </button>
          )}
          <button onClick={() => navigate('/profile-setup')} className="btn-gold text-sm py-2.5 px-5">
            Create My Profile
          </button>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-1.5 text-glow-ink">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-t border-glow-border overflow-hidden"
          >
            <div className="px-5 py-6 space-y-5">
              {NAV_LINKS.map((l) => (
                <Link key={l.href} to={l.href} className="block font-inter text-base text-glow-muted hover:text-glow-ink">
                  {l.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-glow-border space-y-3">
                {user ? (
                  <button onClick={() => navigate('/profile')} className="font-inter text-sm text-glow-ink flex items-center gap-2">
                    <User size={16} /> My Profile
                  </button>
                ) : (
                  <button onClick={() => navigate('/login')} className="font-inter text-sm text-glow-muted block">Sign In</button>
                )}
                <button onClick={() => navigate('/profile-setup')} className="btn-gold w-full mt-2">
                  Create My Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
