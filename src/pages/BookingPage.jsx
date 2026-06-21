import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, CreditCard, ChevronDown,
  Check, Sparkles, Shield, Tag,
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SectionHeader from '../components/SectionHeader'

const SERVICES = [
  { name: 'Signature Haircut & Blow Dry', price: 2500, duration: '90 min' },
  { name: 'Global Hair Color', price: 6000, duration: '3 hrs' },
  { name: 'Bridal Makeup', price: 15000, duration: '4 hrs' },
  { name: 'Luxury Facial', price: 3500, duration: '90 min' },
  { name: 'Keratin Treatment', price: 8000, duration: '4 hrs' },
]

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

const PAYMENT_METHODS = [
  { id: 'upi',  label: 'UPI',          icon: '⚡' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'pay',  label: 'Pay at Salon', icon: '🏪' },
]

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function BookingPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    service: SERVICES[0],
    date: getTomorrow(),
    time: '',
    notes: '',
    payment: 'upi',
    coupon: '',
    couponApplied: false,
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const discount = form.couponApplied ? Math.round(form.service.price * 0.1) : 0
  const total    = form.service.price - discount
  const gst      = Math.round(total * 0.18)
  const grand    = total + gst

  const applyCoupon = () => {
    if (form.coupon.toUpperCase() === 'GLOW10') {
      set('couponApplied', true)
    } else {
      alert('Invalid coupon code. Try GLOW10')
    }
  }

  const handleConfirm = async () => {
    if (!form.time) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1800))
    navigate('/booking/confirmed')
  }

  const canConfirm = form.time && form.date

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            badge="Confirm Your Visit"
            title="Book Your Appointment"
            subtitle="You're moments away from your luxury beauty experience."
          />

          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── LEFT: Booking Form ── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Salon Info */}
              <div className="card-luxury p-5 flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=120&q=80"
                  alt="Luxe Studio"
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
                <div>
                  <p className="font-playfair text-base font-semibold text-glow-black">Luxe Studio Bandra</p>
                  <p className="font-inter text-xs text-glow-muted">Bandra West, Mumbai</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-glow-gold text-xs">★</span>
                    ))}
                    <span className="font-inter text-xs text-glow-muted ml-1">4.9 · Top Rated</span>
                  </div>
                </div>
                <span className="ml-auto font-inter text-xs bg-glow-gold/10 text-glow-gold border border-glow-gold/30 px-3 py-1 rounded-full">
                  Verified
                </span>
              </div>

              {/* Service Selection */}
              <div className="card-luxury p-6">
                <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-glow-gold text-white flex items-center justify-center text-xs font-semibold">1</div>
                  Select Service
                </h3>
                <div className="space-y-2.5">
                  {SERVICES.map((svc) => (
                    <button
                      key={svc.name}
                      onClick={() => set('service', svc)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        form.service.name === svc.name
                          ? 'border-glow-gold bg-glow-gold/5'
                          : 'border-glow-border hover:border-glow-gold/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          form.service.name === svc.name ? 'border-glow-gold bg-glow-gold' : 'border-glow-border'
                        }`}>
                          {form.service.name === svc.name && <Check size={10} className="text-white" />}
                        </div>
                        <div>
                          <p className="font-inter text-sm font-medium text-glow-black">{svc.name}</p>
                          <p className="font-inter text-xs text-glow-muted flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {svc.duration}
                          </p>
                        </div>
                      </div>
                      <span className="font-playfair text-base font-semibold text-glow-gold shrink-0 ml-3">
                        ₹{svc.price.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="card-luxury p-6">
                <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-glow-gold text-white flex items-center justify-center text-xs font-semibold">2</div>
                  Choose Date & Time
                </h3>

                <div className="mb-5">
                  <label className="font-inter text-sm font-medium text-glow-black block mb-2">Date</label>
                  <div className="relative">
                    <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-glow-muted" />
                    <input
                      type="date"
                      value={form.date}
                      min={getTomorrow()}
                      onChange={(e) => set('date', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-glow-border rounded-xl font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-inter text-sm font-medium text-glow-black block mb-3">Available Time Slots</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => set('time', slot)}
                        className={`py-2.5 rounded-xl border font-inter text-xs font-medium transition-all duration-200 ${
                          form.time === slot
                            ? 'bg-glow-gold text-white border-glow-gold shadow-luxury'
                            : 'border-glow-border text-glow-muted hover:border-glow-gold hover:text-glow-black'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special Notes */}
              <div className="card-luxury p-6">
                <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-glow-gold text-white flex items-center justify-center text-xs font-semibold">3</div>
                  Special Requests
                  <span className="font-inter text-xs font-normal text-glow-muted">(optional)</span>
                </h3>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Any allergies, preferences, or special occasions we should know about…"
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors resize-none"
                />
              </div>

              {/* Payment Method */}
              <div className="card-luxury p-6">
                <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-glow-gold text-white flex items-center justify-center text-xs font-semibold">4</div>
                  Payment Method
                </h3>
                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => set('payment', pm.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                        form.payment === pm.id
                          ? 'border-glow-gold bg-glow-gold/5'
                          : 'border-glow-border hover:border-glow-gold/50'
                      }`}
                    >
                      <span className="text-xl">{pm.icon}</span>
                      <span className="font-inter text-sm font-medium text-glow-black">{pm.label}</span>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        form.payment === pm.id ? 'border-glow-gold bg-glow-gold' : 'border-glow-border'
                      }`}>
                        {form.payment === pm.id && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="lg:col-span-2">
              <div className="card-luxury p-6 sticky top-24">
                <h3 className="font-playfair text-xl font-semibold text-glow-black mb-5">
                  Booking Summary
                </h3>

                {/* Service */}
                <div className="bg-glow-bg rounded-2xl p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=80&q=80"
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <p className="font-inter text-sm font-semibold text-glow-black leading-snug">
                        {form.service.name}
                      </p>
                      <p className="font-inter text-xs text-glow-muted mt-0.5">Luxe Studio Bandra</p>
                      {form.date && form.time && (
                        <p className="font-inter text-xs text-glow-gold mt-1.5 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(form.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          &nbsp;·&nbsp;{form.time}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="mb-5">
                  <label className="font-inter text-xs font-semibold text-glow-black block mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-glow-muted" />
                      <input
                        type="text"
                        value={form.coupon}
                        onChange={(e) => set('coupon', e.target.value.toUpperCase())}
                        disabled={form.couponApplied}
                        placeholder="GLOW10"
                        className="w-full pl-9 pr-3 py-2.5 border border-glow-border rounded-xl font-inter text-sm bg-glow-surface outline-none focus:border-glow-gold transition-colors disabled:opacity-60"
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={form.couponApplied || !form.coupon}
                      className={`btn-outline-gold text-xs py-2 px-4 shrink-0 ${
                        (form.couponApplied || !form.coupon) ? 'opacity-40 pointer-events-none' : ''
                      }`}
                    >
                      {form.couponApplied ? <><Check size={12} /> Applied</> : 'Apply'}
                    </button>
                  </div>
                  {form.couponApplied && (
                    <motion.p
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-inter text-xs text-emerald-600 mt-1.5 flex items-center gap-1"
                    >
                      <Check size={11} /> 10% discount applied!
                    </motion.p>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pb-4 mb-4 border-b border-glow-border">
                  <div className="flex justify-between">
                    <span className="font-inter text-sm text-glow-muted">Service</span>
                    <span className="font-inter text-sm text-glow-black">₹{form.service.price.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="font-inter text-sm text-emerald-600">Promo (GLOW10)</span>
                      <span className="font-inter text-sm text-emerald-600">− ₹{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-inter text-sm text-glow-muted">GST (18%)</span>
                    <span className="font-inter text-sm text-glow-black">₹{gst.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="font-inter text-base font-semibold text-glow-black">Total</span>
                  <span className="font-playfair text-2xl font-semibold text-glow-gold">
                    ₹{grand.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm || loading}
                  className={`btn-gold w-full py-4 text-base ${
                    (!canConfirm || loading) ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Confirming…
                    </span>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Confirm Booking
                    </>
                  )}
                </button>

                {!form.time && (
                  <p className="font-inter text-xs text-center text-glow-muted mt-3">
                    Please select a time slot to continue.
                  </p>
                )}

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-5 mt-5 pt-5 border-t border-glow-border">
                  <div className="flex items-center gap-1.5 text-glow-muted">
                    <Shield size={13} className="text-glow-gold" />
                    <span className="font-inter text-xs">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-glow-muted">
                    <Sparkles size={13} className="text-glow-gold" />
                    <span className="font-inter text-xs">Verified Salon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}