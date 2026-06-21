import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Crown, Calendar, Check, Circle, Sparkles, ArrowRight } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SectionHeader from '../components/SectionHeader'
import { generateBridalTimeline } from '../services/aiService'

const STYLES = ['Classic Indian', 'Modern Fusion', 'Minimalist', 'Vintage Glam', 'Bohemian', 'Custom Bridal Style']

export default function BridalPlanner() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ weddingDate: '', budget: 50000, style: '', customStyle: '' })
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [tasks, setTasks]       = useState({})

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleGenerate = async () => {
    if (!form.weddingDate || !form.style || (form.style === 'Custom Bridal Style' && !form.customStyle.trim())) return
    setLoading(true)
    const stylePreference = form.style === 'Custom Bridal Style' ? form.customStyle.trim() : form.style
    const data = await generateBridalTimeline(form.weddingDate, form.budget, stylePreference)
    setTimeline(data)
    const init = {}
    data.timeline.forEach((phase, pi) => phase.tasks.forEach((_, ti) => { init[`${pi}-${ti}`] = false }))
    setTasks(init)
    setLoading(false)
  }

  const toggleTask = (key) => setTasks((p) => ({ ...p, [key]: !p[key] }))

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeader
            badge="AI Bridal Planning"
            title="Your Bridal Beauty Planner"
            subtitle="A personalised 90-day beauty countdown crafted by AI — so your wedding day look is flawless."
          />

          {/* Input */}
          <div className="card-luxury p-8 mb-10">
            <div className="grid sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="font-inter text-sm font-semibold text-glow-black block mb-2">Wedding Date</label>
                <input
                  type="date"
                  value={form.weddingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => set('weddingDate', e.target.value)}
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-inter text-sm font-semibold text-glow-black">Bridal Beauty Budget</label>
                  <span className="font-playfair text-base font-semibold text-glow-gold">₹{form.budget.toLocaleString()}</span>
                </div>
                <input
                  type="range" min={10000} max={200000} step={5000}
                  value={form.budget} onChange={(e) => set('budget', Number(e.target.value))}
                  className="w-full accent-glow-gold h-1.5 rounded-full cursor-pointer mt-3"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="font-inter text-sm font-semibold text-glow-black block mb-3">Preferred Bridal Style</label>
              <div className="flex flex-wrap gap-2.5">
                {STYLES.map((s) => (
                  <button key={s} onClick={() => set('style', s)} className={`px-4 py-2.5 rounded-full border font-inter text-sm transition-all duration-200 ${form.style === s ? 'bg-glow-gold text-white border-glow-gold' : 'border-glow-border text-glow-muted hover:border-glow-gold'}`}>
                    {form.style === s && <Check size={12} className="inline mr-1.5" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {form.style === 'Custom Bridal Style' && (
              <div className="mb-6">
                <label className="font-inter text-sm font-semibold text-glow-black block mb-2">
                  What bridal look are you imagining?
                </label>
                <textarea
                  value={form.customStyle}
                  onChange={(e) => set('customStyle', e.target.value)}
                  rows={4}
                  placeholder="Royal Rajasthani Bride, South Indian Temple Bridal, Modern Bollywood Bride, Korean Minimal Bridal..."
                  className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors resize-none"
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!form.weddingDate || !form.style || (form.style === 'Custom Bridal Style' && !form.customStyle.trim()) || loading}
              className={`btn-gold w-full py-4 text-base ${(!form.weddingDate || !form.style || (form.style === 'Custom Bridal Style' && !form.customStyle.trim()) || loading) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Creating Your Timeline…
                </span>
              ) : (
                <><Crown size={16} /> Generate My Bridal Timeline</>
              )}
            </button>
          </div>

          {/* Timeline */}
          <AnimatePresence>
            {timeline && (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black flex items-center gap-2">
                    <Sparkles size={18} className="text-glow-gold" /> Your 90-Day Beauty Countdown
                  </h2>
                  <span className="font-inter text-xs text-glow-muted bg-glow-surface border border-glow-border px-3 py-1.5 rounded-full">
                    Style: {timeline.style}
                  </span>
                </div>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-5 sm:left-7 top-0 bottom-0 w-px bg-glow-border" />

                  <div className="space-y-8">
                    {timeline.timeline.map((phase, pi) => (
                      <motion.div
                        key={pi}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: pi * 0.15 }}
                        className="relative pl-14 sm:pl-20"
                      >
                        {/* Phase dot */}
                        <div className="absolute left-0 sm:left-2 top-1 w-10 h-10 bg-gradient-to-br from-glow-gold to-glow-rose rounded-full flex items-center justify-center text-white text-sm font-playfair shadow-luxury z-10">
                          {phase.icon}
                        </div>

                        <div className="card-luxury p-6">
                          <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4">{phase.phase}</h3>
                          <div className="space-y-3">
                            {phase.tasks.map((task, ti) => {
                              const key = `${pi}-${ti}`
                              const done = tasks[key]
                              return (
                                <button
                                  key={ti}
                                  onClick={() => toggleTask(key)}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${done ? 'bg-glow-gold/8 border border-glow-gold/20' : 'hover:bg-glow-bg'}`}
                                >
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${done ? 'bg-glow-gold border-glow-gold' : 'border-glow-border'}`}>
                                    {done && <Check size={11} className="text-white" />}
                                  </div>
                                  <div className="flex-1">
                                    <span className={`font-inter text-sm ${done ? 'line-through text-glow-muted' : 'text-glow-black'}`}>
                                      {task.task}
                                    </span>
                                  </div>
                                  <span className={`font-inter text-xs px-2 py-0.5 rounded-full shrink-0 ${task.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-glow-border text-glow-muted'}`}>
                                    {task.priority}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="card-luxury p-6 mt-8 flex items-center justify-between">
                  <div>
                    <p className="font-inter text-sm text-glow-muted">Estimated Bridal Budget</p>
                    <p className="font-playfair text-2xl font-semibold text-glow-gold">₹{timeline.estimatedBudget.toLocaleString()}</p>
                  </div>
                  <button onClick={() => navigate('/salons')} className="btn-gold">
                    Find Bridal Salons <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  )
}
