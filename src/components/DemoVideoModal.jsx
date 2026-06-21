import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play } from 'lucide-react'

/**
 * DemoVideoModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Fullscreen-overlay modal that plays the GlowAI demo video.
 *
 * To swap the video later:
 *   Option A — YouTube embed:  set DEMO_VIDEO_TYPE = 'youtube' and update YOUTUBE_VIDEO_ID.
 *   Option B — self-hosted:    set DEMO_VIDEO_TYPE = 'file' and update DEMO_VIDEO_SRC.
 *
 * The default ships with a YouTube embed of a public beauty/salon reel that
 * acts as a placeholder. Replace YOUTUBE_VIDEO_ID with your own video ID.
 */

const DEMO_VIDEO_TYPE    = 'youtube'            // 'youtube' | 'file'
const YOUTUBE_VIDEO_ID   = 'yUpHiGzo7LA'        // ← replace with your YouTube video ID
const DEMO_VIDEO_SRC     = '/videos/demo.mp4'   // ← used only when DEMO_VIDEO_TYPE = 'file'
const DEMO_VIDEO_POSTER  = ''                   // ← optional poster image path for 'file' mode

export default function DemoVideoModal({ isOpen, onClose }) {
  const overlayRef = useRef(null)

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prev
    }
  }, [isOpen, handleKeyDown])

  // Close when clicking the dark backdrop (not the video box itself)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const youtubeEmbedUrl =
    `https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}` +
    `?autoplay=1&rel=0&modestbranding=1&color=white&playsinline=1`

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
          aria-modal="true"
          role="dialog"
          aria-label="GlowAI demo video"
        >
          {/* Modal box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-4xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Gold accent border */}
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{ border: '1px solid rgba(212,175,106,0.30)' }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-inter text-sm"
              aria-label="Close demo video"
            >
              <span>Close</span>
              <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors">
                <X size={15} />
              </span>
            </button>

            {/* Header label */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex items-center gap-2 font-inter text-xs uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(212,175,106,0.12)', color: '#D4AF6A', border: '1px solid rgba(212,175,106,0.25)' }}
              >
                <Play size={10} fill="currentColor" /> GlowAI Demo
              </span>
            </div>

            {/* Video container — 16:9 aspect ratio */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
              {DEMO_VIDEO_TYPE === 'youtube' ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={youtubeEmbedUrl}
                  title="GlowAI Demo Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src={DEMO_VIDEO_SRC}
                  poster={DEMO_VIDEO_POSTER || undefined}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                >
                  <p className="absolute inset-0 flex items-center justify-center text-white/60 font-inter text-sm p-8 text-center">
                    Your browser doesn't support HTML5 video.{' '}
                    <a href={DEMO_VIDEO_SRC} className="underline text-glow-gold ml-1">
                      Download the video
                    </a>
                  </p>
                </video>
              )}
            </div>

            {/* Caption */}
            <p className="mt-3 font-inter text-xs text-white/40 text-center">
              See how GlowAI matches you to Mumbai's top salons and stylists in seconds.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}