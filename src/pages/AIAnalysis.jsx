import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Check, ArrowLeft, RefreshCw } from 'lucide-react'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import {
  saveAnalysis as saveAnalysisToStorage,
  getCurrentUser
} from '../services/storageService'
import { AnalysisValidationError, analyzeBeautyProfile } from '../services/aiService'

const STEPS = [
  'Analysing your preferences',
  'Understanding beauty goals',
  'Matching Mumbai salons',
  'Creating personalised recommendations',
]

const ANALYSIS_TIMEOUT_MS = 15_000

function withAnalysisTimeout(promise) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Analysis timed out after 15 seconds.')), ANALYSIS_TIMEOUT_MS)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export default function AIAnalysis() {
  const navigate = useNavigate()
  const { profile, saveAnalysis } = useBeautyProfile()
  const [current, setCurrent]     = useState(0)
  const [done, setDone]           = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [analysisError, setAnalysisError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  const retryAnalysis = () => {
    setCurrent(0)
    setDone(false)
    setValidationErrors([])
    setAnalysisError('')
    setRetryKey((key) => key + 1)
  }

  useEffect(() => {
    if (!profile) { navigate('/profile-setup'); return }
    let active = true

    const run = async () => {
      for (let i = 0; i < STEPS.length; i++) {
        if (!active) return
        await new Promise((r) => setTimeout(r, 750))
        if (!active) return
        setCurrent(i + 1)
      }
      if (!active) return
      try {
        console.log('[GlowAI][AIAnalysisPage] analyzeBeautyProfile: start')
        const result = await withAnalysisTimeout(analyzeBeautyProfile(profile))

        if (!active) return

        console.log('[GlowAI][AIAnalysisPage] analyzeBeautyProfile: complete', result)

// Save to React Context
        saveAnalysis(result)

// Save to backend (inMemoryDb)
        const user = await getCurrentUser()

        console.log("Current user:", user)

        if (!user) {
          console.error("No logged in user found!")
        } else {
          console.log("Saving for user:", user.id)

          try {
            const response = await saveAnalysisToStorage(
              user.id,
              result,
              profile
            )

            console.log("Backend response:", response)
          } catch (err) {
            console.error("Backend save failed:", err)
          }
        }

        setDone(true)
        setTimeout(() => {
          if (active) navigate('/dashboard')
        }, 900)
      } catch (err) {
        if (!active) return
        if (err instanceof AnalysisValidationError || err?.name === 'AnalysisValidationError') {
          setValidationErrors(err.errors || [err.message])
          return
        }
        setAnalysisError(err.message || 'Analysis failed. Please try again.')
      }
    }
    run()

    return () => {
      active = false
    }
  }, [retryKey])

  return (
    <div className="min-h-screen bg-glow-black flex flex-col items-center justify-center px-4 relative" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,106,0.12) 0%, #1A1A1A 60%)' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/profile-setup')}
        className="absolute top-8 left-8 flex items-center gap-2 font-inter text-sm text-white/60 hover:text-white transition-all duration-200 z-20"
      >
        <ArrowLeft size={15} /> Back to Setup
      </button>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 mb-12"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-glow-gold to-glow-rose rounded-full flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <span className="font-playfair text-2xl font-semibold text-white">GlowAI</span>
      </motion.div>

      {/* Pulse ring */}
      <div className="relative mb-12 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.12, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-glow-gold"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 relative"
        >
          <div className="w-20 h-20 rounded-full border-2 border-glow-gold/30 border-t-glow-gold" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={22} className="text-glow-gold" />
        </div>
      </div>

      {validationErrors.length > 0 || analysisError ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center"
        >
          <h2 className="font-playfair text-2xl font-semibold text-white mb-3">
            {analysisError ? 'Analysis Could Not Complete' : 'Selfie Needs A Retake'}
          </h2>
          <p className="font-inter text-sm text-white/80 leading-relaxed mb-5">
            {analysisError
              ? 'GlowAI could not finish this analysis. You can retry without retaking your photo.'
              : 'We could not analyze this image reliably, so GlowAI stopped before making any guesses.'}
          </p>
          {(analysisError ? [analysisError] : validationErrors).length > 0 && (
            <div className="space-y-2 text-left mb-6">
              {(analysisError ? [analysisError] : validationErrors).map((error) => (
                <p key={error} className="font-inter text-sm text-amber-100 bg-black/20 border border-white/10 rounded-xl px-3 py-2">
                  {error}
                </p>
              ))}
            </div>
          )}
          {analysisError ? (
            <button onClick={retryAnalysis} className="btn-gold w-full flex items-center justify-center gap-2">
              <RefreshCw size={15} /> Retry Analysis
            </button>
          ) : (
            <button onClick={() => navigate('/profile-setup')} className="btn-gold w-full">
              Retake Selfie
            </button>
          )}
        </motion.div>
      ) : (
        <>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-playfair text-3xl font-medium text-white mb-3 text-center"
      >
        Crafting Your Profile
      </motion.h2>
      <p className="font-inter text-sm text-white/70 mb-12 text-center max-w-sm">
        Our AI is analysing your preferences to build your personalised beauty concierge experience.
      </p>

      {/* Steps */}
      <div className="space-y-4 w-full max-w-sm">
        {STEPS.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'active' : 'pending'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: state === 'pending' ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="flex items-center gap-4"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                state === 'done'   ? 'bg-glow-gold' :
                state === 'active' ? 'border-2 border-glow-gold bg-transparent' :
                'border border-white/20 bg-transparent'
              }`}>
                {state === 'done' && <Check size={13} className="text-white" />}
                {state === 'active' && (
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-2 bg-glow-gold rounded-full" />
                )}
              </div>
              <span className={`font-inter text-sm ${state === 'done' ? 'text-glow-gold' : state === 'active' ? 'text-white' : 'text-white/60'}`}>
                {step}
              </span>
            </motion.div>
          )
        })}
      </div>

      {done && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-playfair text-sm italic text-glow-gold mt-10"
        >
          Your beauty concierge is ready ✦
        </motion.p>
      )}
        </>
      )}
    </div>
  )
}
