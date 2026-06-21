import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Calculator, Star, ArrowRight, TrendingDown, Award, Sparkles, Check } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SectionHeader from '../components/SectionHeader'
import { optimizeBudget } from '../services/aiService'
import { MUMBAI_AREA_GROUPS } from '../data/mumbaiAreas'

const ALL_SERVICES = ['Haircut', 'Hair Color', 'Facial', 'Nail Art', 'Waxing', 'Makeup', 'Body Polish', 'Massage']

export default function BudgetOptimizer() {
  const navigate  = useNavigate()
  const [budget, setBudget]     = useState(5000)
  const [location, setLocation] = useState('Bandra')
  const [services, setServices] = useState([])
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)

  const toggle = (s) => setServices((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])

  const handleOptimize = async () => {
    if (!services.length) return
    setLoading(true)
    const data = await optimizeBudget(budget, location, services)
    setResults(data)
    setLoading(false)
  }

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="AI-Powered"
            title="Budget Optimizer"
            subtitle="Get the most luxury for your beauty budget. Our AI finds the best value packages across Mumbai's top salons."
          />

          {/* Input Form */}
          <div className="card-luxury p-8 mb-8">
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              {/* Budget */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="font-inter text-sm font-semibold text-glow-black">Your Budget</label>
                  <span className="font-playfair text-lg font-semibold text-glow-gold">₹{budget.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={1000} max={30000} step={500}
                  value={budget} onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full accent-glow-gold h-1.5 rounded-full cursor-pointer"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="font-inter text-xs text-glow-muted">₹1,000</span>
                  <span className="font-inter text-xs text-glow-muted">₹30,000</span>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="font-inter text-sm font-semibold text-glow-black block mb-3">Preferred Area</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                >
                  {MUMBAI_AREA_GROUPS.map((group) => (
                    <optgroup key={group.region} label={group.region}>
                      {group.areas.map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Services */}
            <div className="mb-6">
              <label className="font-inter text-sm font-semibold text-glow-black block mb-3">
                Required Services <span className="font-normal text-glow-muted">(select all you need)</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {ALL_SERVICES.map((s) => (
                  <button key={s} onClick={() => toggle(s)} className={`px-4 py-2 rounded-full border font-inter text-sm transition-all duration-200 ${
                    services.includes(s) ? 'bg-glow-gold text-white border-glow-gold' : 'bg-glow-surface border-glow-border text-glow-muted hover:border-glow-gold'
                  }`}>
                    {services.includes(s) && <Check size={12} className="inline mr-1.5" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={!services.length || loading}
              className={`btn-gold w-full py-4 text-base ${(!services.length || loading) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Optimising…
                </span>
              ) : (
                <><Calculator size={16} /> Optimise My Budget</>
              )}
            </button>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-6 flex items-center gap-2">
                  <Sparkles size={18} className="text-glow-gold" /> Your Optimised Packages
                </h2>

                <div className="grid gap-5">
                  {results.map((pkg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`card-luxury p-6 ${i === 1 ? 'ring-2 ring-glow-gold ring-offset-2' : ''}`}
                    >
                      {i === 1 && (
                        <span className="inline-flex items-center gap-1.5 bg-glow-gold text-white text-xs font-inter font-medium px-3 py-1 rounded-full mb-3">
                          <Award size={11} /> Best Value
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-playfair text-lg font-semibold text-glow-black">{pkg.name}</h3>
                          <p className="font-inter text-sm text-glow-gold">{pkg.salon}</p>
                          <p className="font-inter text-xs text-glow-muted mt-0.5">Best for: {pkg.bestFor}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-inter text-xs text-glow-muted line-through">₹{pkg.originalPrice.toLocaleString()}</p>
                          <p className="font-playfair text-2xl font-semibold text-glow-gold">₹{pkg.optimizedPrice.toLocaleString()}</p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <TrendingDown size={12} className="text-emerald-500" />
                            <span className="font-inter text-xs text-emerald-600 font-medium">Save ₹{pkg.savings.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-glow-border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-glow-gold fill-glow-gold" />
                            <span className="font-inter text-sm font-semibold">{pkg.rating}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-24 h-1.5 bg-glow-border rounded-full overflow-hidden">
                              <div className="h-full bg-glow-gold rounded-full" style={{ width: `${pkg.valueScore}%` }} />
                            </div>
                            <span className="font-inter text-xs text-glow-muted">Value Score: {pkg.valueScore}/100</span>
                          </div>
                        </div>
                        <button onClick={() => navigate('/booking')} className="btn-gold py-2 px-5 text-sm">
                          Book Package <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  )
}
