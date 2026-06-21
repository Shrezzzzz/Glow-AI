import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Target, Heart, CheckCircle2 } from 'lucide-react'

export default function AboutGlowModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const features = [
    'AI Beauty Analysis',
    'Personalized Style Matching',
    'Character-Inspired Looks',
    'Smart Salon Discovery',
    'Occasion-Based Beauty Planning',
    'Glow AI Concierge',
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-glow-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-glow-black border border-glow-gold/30 rounded-3xl shadow-luxury-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative p-6 sm:p-8 border-b border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/8 border border-glow-gold/30 rounded-full flex items-center justify-center">
                <Sparkles size={15} className="text-glow-gold" />
              </div>
              <span className="font-playfair text-xl font-semibold text-white">GlowAI</span>
            </div>
            <p className="font-inter text-sm text-white/60">
              GlowAI is an AI-powered beauty discovery and personalization platform that helps users discover salons, beauty experiences, and styling recommendations tailored to their unique features, preferences, location, budget, and goals.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            <div>
              <h3 className="font-playfair text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-glow-gold" /> Features
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-glow-gold shrink-0 mt-0.5" />
                    <span className="font-inter text-sm text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-playfair text-lg font-semibold text-white flex items-center gap-2 mb-2">
                <Target size={16} className="text-glow-rose" /> Mission
              </h3>
              <p className="font-inter text-sm text-white/70 bg-white/5 p-4 rounded-xl border border-white/10">
                To make beauty guidance more personalized, accessible, and intelligent.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 sm:p-8 border-t border-white/10 bg-white/5 shrink-0 flex items-center justify-between">
            <span className="font-inter text-xs text-glow-muted font-medium">GlowAI MVP v1.0</span>
            <span className="font-inter text-xs text-glow-gold flex items-center gap-1.5 font-medium">
              Built in Mumbai 🇮🇳 <Heart size={12} className="fill-glow-gold text-glow-gold" />
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
