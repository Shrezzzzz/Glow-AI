import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2, Calendar, Clock, MapPin, Sparkles,
  Download, ArrowRight, Home, Star,
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'

const CONFETTI_COLORS = ['#C9A86A', '#D8B4A0', '#F8F5F0', '#EAE4DA', '#ffffff']

function ConfettiDot({ style }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={style}
      initial={{ opacity: 1, y: 0, x: 0 }}
      animate={{ opacity: 0, y: Math.random() * 160 + 60, x: (Math.random() - 0.5) * 120 }}
      transition={{ duration: 1.4 + Math.random() * 0.8, ease: 'easeOut' }}
    />
  )
}

export default function BookingConfirmation() {
  const navigate = useNavigate()

  const confettiDots = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    style: {
      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 30}%`,
    },
  }))

  const DETAILS = [
    { icon: <Calendar size={15} />, label: 'Date',    value: 'Saturday, 15 June 2025' },
    { icon: <Clock size={15} />,    label: 'Time',    value: '11:00 AM' },
    { icon: <MapPin size={15} />,   label: 'Salon',   value: 'Luxe Studio Bandra' },
    { icon: <MapPin size={15} />,   label: 'Address', value: 'Hill Road, Bandra West, Mumbai 400050' },
  ]

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {/* Success Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="card-luxury overflow-hidden relative"
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiDots.map((dot) => (
                <ConfettiDot key={dot.id} style={dot.style} />
              ))}
            </div>

            {/* Header Strip */}
            <div
              className="px-8 pt-10 pb-8 text-center relative"
              style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2d2015 100%)' }}
            >
              {/* Glow ring behind check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-4 relative"
              >
                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute inset-0 bg-glow-gold rounded-full"
                />
                <div className="relative w-20 h-20 bg-gradient-to-br from-glow-gold to-glow-rose rounded-full flex items-center justify-center shadow-luxury">
                  <CheckCircle2 size={36} className="text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
              >
                <p className="font-inter text-xs text-glow-gold uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                  <Sparkles size={11} /> Booking Confirmed
                </p>
                <h1 className="font-playfair text-3xl font-semibold text-white mb-2">
                  You're all set!
                </h1>
                <p className="font-inter text-sm text-white/55">
                  Your luxury beauty appointment has been confirmed. See you soon.
                </p>
              </motion.div>
            </div>

            {/* Booking Reference */}
            <div className="px-8 py-4 bg-glow-gold/8 border-b border-glow-border flex items-center justify-between">
              <div>
                <p className="font-inter text-xs text-glow-muted">Booking Reference</p>
                <p className="font-inter text-base font-semibold text-glow-black tracking-widest">
                  GLW-2025-4821
                </p>
              </div>
              <div className="text-right">
                <p className="font-inter text-xs text-glow-muted">Service</p>
                <p className="font-inter text-sm font-semibold text-glow-black">
                  Signature Haircut & Blow Dry
                </p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="px-8 py-6">
              <h2 className="font-playfair text-base font-semibold text-glow-black mb-4">
                Appointment Details
              </h2>
              <div className="space-y-4">
                {DETAILS.map((d, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-glow-gold/10 border border-glow-gold/20 flex items-center justify-center shrink-0 text-glow-gold">
                      {d.icon}
                    </div>
                    <div>
                      <p className="font-inter text-xs text-glow-muted">{d.label}</p>
                      <p className="font-inter text-sm font-medium text-glow-black">{d.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stylist */}
            <div className="mx-8 mb-6 bg-glow-bg rounded-2xl p-4 flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80"
                alt="Ananya Sharma"
                className="w-12 h-12 rounded-2xl object-cover shrink-0"
              />
              <div>
                <p className="font-inter text-xs text-glow-muted mb-0.5">Your Stylist</p>
                <p className="font-inter text-sm font-semibold text-glow-black">Ananya Sharma</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="text-glow-gold fill-glow-gold" />
                  ))}
                  <span className="font-inter text-xs text-glow-muted ml-1">Master Hairstylist</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="font-inter text-xs text-glow-muted">Total Paid</p>
                <p className="font-playfair text-lg font-semibold text-glow-gold">₹2,950</p>
              </div>
            </div>

            {/* Reminder Banner */}
            <div className="mx-8 mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <span className="text-base">⏰</span>
              <div>
                <p className="font-inter text-xs font-semibold text-amber-800">Reminder sent</p>
                <p className="font-inter text-xs text-amber-700">
                  A confirmation has been sent to your phone. We'll remind you 2 hours before your appointment.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 space-y-3">
              <button className="btn-gold w-full py-3.5 text-sm">
                <Download size={15} /> Add to Calendar
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-outline-gold py-3 text-sm"
                >
                  <Home size={14} /> Dashboard
                </button>
                <button
                  onClick={() => navigate('/salons')}
                  className="btn-outline-gold py-3 text-sm"
                >
                  Explore Salons <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Bottom Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center font-inter text-xs text-glow-muted mt-6 flex items-center justify-center gap-1.5"
          >
            <Sparkles size={11} className="text-glow-gold" />
            Free cancellation up to 2 hours before your appointment.
          </motion.p>
        </div>
      </div>
    </MainLayout>
  )
}