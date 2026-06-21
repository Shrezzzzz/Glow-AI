import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star, Clock, Check, ArrowRight, Sparkles } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SectionHeader from '../components/SectionHeader'
import { experiences } from '../data/experiences'
import { useBeautyProfile } from '../context/BeautyProfileContext'

const CATS = ['All', 'Bridal', 'Hair', 'Makeup', 'Skincare', 'Corporate']

export default function PremiumExperiences() {
  const navigate = useNavigate()
  const { openChat } = useBeautyProfile()
  const [cat, setCat] = useState('All')
  const [selected, setSelected] = useState(null)
  const [isCtaModalOpen, setIsCtaModalOpen] = useState(false)

  const filtered = cat === 'All' ? experiences : experiences.filter((e) => e.category === cat)

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen luxury-ambient">
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            badge="Curated Collection"
            title="Premium Beauty Experiences"
            subtitle="Meticulously curated luxury experiences for Mumbai's most discerning clients."
          />

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2.5 mb-10">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-5 py-2 rounded-full border font-inter text-sm transition-all duration-300 ${
                  cat === c
                    ? 'bg-glow-black text-white border-glow-gold/30 shadow-luxury'
                    : 'bg-white/75 backdrop-blur-md border-glow-border text-glow-muted hover:border-glow-gold hover:text-glow-ink hover:bg-glow-surface'
                }`}
              >
                {cat === c && <Check size={12} className="inline mr-1.5" />}
                {c}
              </button>
            ))}
          </div>

          {/* Featured Hero — first featured experience */}
          {cat === 'All' && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="relative rounded-3xl overflow-hidden mb-12 cursor-pointer group shadow-luxury-lg border border-glow-gold/15"
              onClick={() => navigate('/booking')}
            >
              <div className="h-80 sm:h-96 relative">
                <img
                  src={experiences[0].image}
                  alt={experiences[0].title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-glow-black/84 via-glow-black/40 to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-end p-8 sm:p-12">
                <div className="max-w-lg">
                  <span className="inline-flex items-center gap-1.5 bg-glow-black/82 backdrop-blur-md border border-glow-gold/30 text-glow-gold text-xs font-inter font-semibold px-3 py-1 rounded-full mb-3">
                    <Sparkles size={11} /> Featured Experience
                  </span>
                  <h2 className="font-playfair text-3xl sm:text-4xl font-semibold text-white mb-3 leading-tight">
                    {experiences[0].title}
                  </h2>
                  <p className="font-inter text-sm text-white/70 leading-relaxed mb-5 max-w-md">
                    {experiences[0].description}
                  </p>
                  <div className="flex items-center gap-5">
                    <span className="font-playfair text-2xl font-semibold text-glow-gold">
                      ₹{experiences[0].price.toLocaleString()}
                    </span>
                    <button className="btn-gold py-3 px-6 text-sm">
                      Book This Experience <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ y: -4 }}
                className={`card-luxury overflow-hidden cursor-pointer group ${
                  selected === exp.id ? 'ring-2 ring-glow-gold ring-offset-2' : ''
                }`}
                onClick={() => setSelected(selected === exp.id ? null : exp.id)}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-glow-black/80 via-glow-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-xs font-inter text-glow-gold uppercase tracking-widest mb-1 block">
                      {exp.category}
                    </span>
                    <h3 className="font-playfair text-lg font-semibold text-white leading-snug">
                      {exp.title}
                    </h3>
                  </div>
                  <div className="absolute top-3 right-3 bg-glow-black/82 backdrop-blur-md border border-glow-gold/30 text-glow-gold text-sm font-inter font-semibold px-3 py-1 rounded-full">
                    ₹{exp.price.toLocaleString()}
                  </div>
                  {exp.featured && (
                    <div className="absolute top-3 left-3 bg-white/92 backdrop-blur-sm border border-glow-gold/20 text-xs font-inter text-glow-ink px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Sparkles size={10} className="text-glow-gold" /> Featured
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Star size={12} className="text-glow-gold fill-glow-gold" />
                      <span className="font-inter text-sm font-semibold text-glow-black">{exp.rating}</span>
                      <span className="font-inter text-xs text-glow-muted">({exp.bookings} booked)</span>
                    </div>
                    <div className="flex items-center gap-1 text-glow-muted">
                      <Clock size={12} />
                      <span className="font-inter text-xs">{exp.duration}</span>
                    </div>
                  </div>

                  <p className="font-inter text-xs text-glow-muted leading-relaxed mb-4 line-clamp-2">
                    {exp.description}
                  </p>

                  {/* Includes (expanded when selected) */}
                  {selected === exp.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <p className="font-inter text-xs font-semibold text-glow-black uppercase tracking-wider mb-2">
                        What's Included
                      </p>
                      <div className="space-y-1.5">
                        {exp.includes.map((item) => (
                          <div key={item} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-glow-gold rounded-full shrink-0" />
                            <span className="font-inter text-xs text-glow-muted">{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-glow-border">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelected(selected === exp.id ? null : exp.id)
                      }}
                      className="font-inter text-xs text-glow-muted hover:text-glow-gold transition-colors"
                    >
                      {selected === exp.id ? 'Less info ↑' : 'View details ↓'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/booking')
                      }}
                      className="btn-gold py-2 px-4 text-xs"
                    >
                      Book Now <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-playfair text-xl text-glow-muted">No experiences in this category yet.</p>
              <button onClick={() => setCat('All')} className="btn-gold mt-5">
                View All Experiences
              </button>
            </div>
          )}

          {/* Bottom CTA */}
          <div
            onClick={() => setIsCtaModalOpen(true)}
            className="mt-16 bg-glow-black rounded-3xl p-10 text-center relative overflow-hidden cursor-pointer luxury-ambient border border-glow-gold/18 shadow-luxury-lg"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-glow-gold/8 rounded-full blur-3xl" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
                <Sparkles size={12} /> Bespoke Packages
              </span>
              <h3 className="font-playfair text-2xl sm:text-3xl font-medium text-white mb-3">
                Can't find what you're looking for?
              </h3>
              <p className="font-inter text-sm text-white/55 mb-7 max-w-sm mx-auto">
                Our concierge team curates completely bespoke beauty packages for your unique vision and occasion.
              </p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCtaModalOpen(true)
                }}
                className="btn-gold py-3.5 px-8 text-sm"
              >
                Request a Custom Package <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Transition Modal to open floating chatbot */}
          <AnimatePresence>
            {isCtaModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-md bg-glow-black border border-glow-gold/30 rounded-3xl p-8 relative shadow-luxury-lg text-center"
                >
                  <button 
                    onClick={() => setIsCtaModalOpen(false)}
                    className="absolute top-5 right-5 text-white/50 hover:text-white transition-colors text-lg"
                  >
                    ✕
                  </button>
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/8 border border-glow-gold/30 flex items-center justify-center shadow-lg mb-5">
                    <Sparkles size={24} className="text-glow-gold" />
                  </div>
                  
                  <h3 className="font-playfair text-2xl font-semibold text-white mb-2">✨ Talk to Glow</h3>
                  <p className="font-inter text-glow-gold text-[10px] uppercase tracking-widest font-semibold mb-6">
                    Our AI beauty concierge is waiting to hear you out
                  </p>
                  
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-3">
                    <p className="font-inter text-xs font-semibold text-white/80 uppercase tracking-wide">Describe:</p>
                    <ul className="space-y-2 font-inter text-sm text-white/90 list-disc list-inside">
                      <li>Your occasion</li>
                      <li>Your budget</li>
                      <li>Your dream look</li>
                    </ul>
                    <p className="font-inter text-xs text-white/55 italic pt-1 border-t border-white/5 mt-2">
                      and Glow will build a personalized beauty plan for you.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsCtaModalOpen(false)
                      openChat()
                    }}
                    className="btn-gold w-full py-3.5 text-sm flex items-center justify-center gap-2"
                  >
                    Talk To Glow <ArrowRight size={15} />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  )
}
