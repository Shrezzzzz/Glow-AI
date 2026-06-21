import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Upload, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import MainLayout from '../layouts/MainLayout'

const STEPS = ['Photo', 'Style & Skin', 'Intent & Occasion', 'Inspiration', 'Budget']

const STYLE_PROFILES = ["Women's Styles", "Men's Styles", "Gender-Neutral Styles", "Custom Mix"]
const SKIN_CONCERNS = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal']
const OCCASIONS    = ['Wedding', 'Reception', 'Engagement', 'Party', 'Date Night', 'College Farewell', 'Convocation', 'Office Event', 'Interview', 'Photoshoot', 'Festival', 'Vacation', 'Casual Refresh', 'Other']

const INSPIRATIONS = {
  'Iconic Looks': ['Deepika Inspired Waves', 'Veronica (Cocktail)', 'Kaira (Dear Zindagi)', 'Naina (YJHD)', 'Rani (Rocky Aur Rani)'],
  'Modern Grooming': ['Arjun (ZNMD)', 'Bunny (YJHD)', 'Kabir', 'Rocky Randhawa', 'Harvey Specter'],
  'Gender Neutral': ['Korean Soft Luxury', 'Old Money Aesthetic', 'Clean Professional', 'Creative Modern', 'Corporate Executive'],
  'K-Drama': ['Hong Hae-in', 'Ri Jeong-hyeok', 'Kang Tae-moo'],
}

const BUDGETS = ['Under ₹1,000', '₹1,000–₹3,000', '₹3,000–₹5,000', '₹5,000–₹10,000', '₹10,000+']

function SelectPill({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-full border font-inter text-sm transition-all duration-200 ${
        selected
          ? 'bg-glow-gold text-white border-glow-gold shadow-luxury'
          : 'bg-glow-surface border-glow-border text-glow-muted hover:border-glow-gold hover:text-glow-black'
      }`}
    >
      {selected && <Check size={13} className="inline mr-1.5" />}
      {label}
    </button>
  )
}

export default function BeautyProfileSetup() {
  const navigate = useNavigate()
  const { onboardingStep, setOnboardingStep, form, setForm, saveProfile, aiScanSelfie } = useBeautyProfile()
  const step = onboardingStep
  const setStep = setOnboardingStep
  const [showErrors, setShowErrors] = useState(false)
  const hasAiScanSelfie = Boolean(aiScanSelfie?.preview)
  const isUsingAiScanSelfie = hasAiScanSelfie && form.photoSource === 'ai_scan'

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }))

  useEffect(() => {
    if (!aiScanSelfie?.preview || form.photoPreview) return
    setForm((p) => ({
      ...p,
      photo: null,
      photoPreview: aiScanSelfie.preview,
      photoSource: 'ai_scan',
    }))
  }, [aiScanSelfie, form.photoPreview, setForm])

  const toggleInspiration = (insp) => {
    setForm((p) => ({
      ...p,
      inspirations: p.inspirations.includes(insp) ? p.inspirations.filter((i) => i !== insp) : [...p.inspirations, insp],
    }))
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm((p) => ({
        ...p,
        photo: file,
        photoPreview: URL.createObjectURL(file),
        photoSource: hasAiScanSelfie ? 'replacement_upload' : 'upload',
      }))
    }
  }

  const handleSubmit = () => {
    if (!canNext) return
    saveProfile(form)
    navigate('/analyzing')
  }

  const handleContinue = () => {
    if (step === 0) {
      if (!form.name.trim() || !form.photoPreview) {
        setShowErrors(true)
        return
      }
    }
    setStep((s) => s + 1)
  }

  const handleBack = () => {
    if (step === 0) {
      navigate('/')
    } else {
      setStep((s) => s - 1)
    }
  }

  const canNext =
    step === 0 ? form.name.trim() && form.photoPreview :
    step === 1 ? form.styleProfile && form.skinConcern :
    step === 2 ? form.styleIntent.trim() && form.occasion :
    step === 3 ? form.inspirations.length > 0 :
    form.budgetRange

  const slideVariants = {
    initial:  { opacity: 0, x: 30 },
    animate:  { opacity: 1, x: 0 },
    exit:     { opacity: 0, x: -30 },
  }

  return (
    <MainLayout>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-4">
              <Sparkles size={12} /> AI Style Concierge
            </span>
            <h1 className="font-playfair text-4xl font-medium text-glow-black mb-3">
              Craft Your Style Profile
            </h1>
            <p className="font-inter text-sm text-glow-muted">
              We match you with beauty, grooming, and styling options tailored to your exact intent.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-10">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-3 flex-1" title={label}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-inter font-semibold transition-all duration-300 ${
                  i < step ? 'bg-glow-gold text-white' :
                  i === step ? 'bg-glow-black text-white' :
                  'bg-glow-border text-glow-muted'
                }`}>
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-all duration-500 ${i < step ? 'bg-glow-gold' : 'bg-glow-border'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="card-luxury p-8">
            <AnimatePresence mode="wait">
              {/* Step 0: Photo */}
              {step === 0 && (
                <motion.div key="step0" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-2">Your Name & Photo</h2>
                  <p className="font-inter text-sm text-glow-muted mb-8">We need a selfie to analyse your face shape and features.</p>

                  <div className="mb-6">
                    <label className="font-inter text-sm font-medium text-glow-black block mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className={`w-full border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors ${
                        showErrors && !form.name.trim() ? 'border-red-500' : 'border-glow-border'
                      }`}
                    />
                    {showErrors && !form.name.trim() && (
                      <p className="text-red-500 text-xs mt-1.5 font-inter">Name is required</p>
                    )}
                  </div>

                  {hasAiScanSelfie ? (
                    <div>
                      <label className="font-inter text-sm font-medium text-glow-black block mb-3">
                        Current Selfie
                      </label>
                      <div className="border border-glow-gold/35 rounded-2xl p-5 bg-glow-gold/5 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 font-inter text-xs font-semibold text-glow-gold uppercase tracking-widest">
                            <Check size={13} /> Current Selfie {isUsingAiScanSelfie ? '(Captured during AI Beauty Scan)' : '(Better Photo Selected)'}
                          </span>
                          {form.photoPreview && (
                            <img src={form.photoPreview} alt="Current selfie preview" className="w-28 h-28 rounded-2xl object-cover shadow-card" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 my-5">
                          <div className="h-px bg-glow-border flex-1" />
                          <span className="font-inter text-[11px] text-glow-muted uppercase tracking-widest">OR</span>
                          <div className="h-px bg-glow-border flex-1" />
                        </div>
                        <label className="inline-flex items-center justify-center gap-2 rounded-full border border-glow-gold/45 px-5 py-2.5 font-inter text-sm font-semibold text-glow-black cursor-pointer hover:bg-glow-gold/10 transition-all duration-200">
                          <Upload size={15} className="text-glow-gold" />
                          Upload a Better Photo (Optional)
                          <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <label className="font-inter text-sm font-medium text-glow-black block mb-3">
                        Upload Selfie <span className="text-red-500">*</span>
                      </label>
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                          form.photoPreview ? 'border-glow-gold' : showErrors && !form.photoPreview ? 'border-red-500 bg-red-50/10' : 'border-glow-border hover:border-glow-gold'
                        }`}>
                          {form.photoPreview ? (
                            <div className="flex flex-col items-center gap-3">
                              <img src={form.photoPreview} alt="preview" className="w-24 h-24 rounded-2xl object-cover shadow-card" />
                              <span className="font-inter text-sm text-glow-gold">Photo uploaded ✓ — tap to change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-glow-border rounded-full flex items-center justify-center">
                                <Upload size={20} className="text-glow-muted" />
                              </div>
                              <div>
                                <p className="font-inter text-sm font-medium text-glow-black">Tap to upload selfie</p>
                                <p className="font-inter text-xs text-glow-muted mt-0.5">Directly facing the camera, good lighting.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </>
                  )}
                  {showErrors && !form.photoPreview && (
                    <p className="text-red-500 text-xs mt-1.5 font-inter">Selfie upload is required</p>
                  )}
                </motion.div>
              )}

              {/* Step 1: Style Profile & Skin */}
              {step === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-2">Style Catalog & Skin</h2>
                  <p className="font-inter text-sm text-glow-muted mb-8">This determines the baseline for your aesthetic recommendations.</p>

                  <div className="mb-7">
                    <label className="font-inter text-sm font-semibold text-glow-black block mb-3">Which style catalog should GlowAI use?</label>
                    <div className="flex flex-wrap gap-2.5">
                      {STYLE_PROFILES.map((t) => (
                        <SelectPill key={t} label={t} selected={form.styleProfile === t} onClick={() => set('styleProfile', t)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-inter text-sm font-semibold text-glow-black block mb-3">Primary Skin Concern</label>
                    <div className="flex flex-wrap gap-2.5">
                      {SKIN_CONCERNS.map((s) => (
                        <SelectPill key={s} label={s} selected={form.skinConcern === s} onClick={() => set('skinConcern', s)} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Intent & Occasion */}
              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-2">Your Intent</h2>
                  <p className="font-inter text-sm text-glow-muted mb-8">Tell us what you are trying to achieve.</p>

                  <div className="mb-7">
                    <label className="font-inter text-sm font-semibold text-glow-black block mb-3">
                      What look is on your mind?
                    </label>
                    <textarea
                      value={form.styleIntent}
                      onChange={(e) => set('styleIntent', e.target.value)}
                      placeholder="e.g. I want a classy wedding look, or I want a corporate glow-up..."
                      rows={3}
                      className="w-full border border-glow-border rounded-xl px-4 py-3 font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="font-inter text-sm font-semibold text-glow-black block mb-3">
                      What is this look for?
                    </label>
                    <div className="flex flex-wrap gap-2.5 h-48 overflow-y-auto pr-2 pb-2">
                      {OCCASIONS.map((o) => (
                        <SelectPill key={o} label={o} selected={form.occasion === o} onClick={() => set('occasion', o)} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Inspirations */}
              {step === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-2">Find Your Inspiration</h2>
                  <p className="font-inter text-sm text-glow-muted mb-6">Select characters, movies, or aesthetics that inspire you. (Select multiple)</p>

                  <div className="max-h-[400px] overflow-y-auto pr-2 pb-4 space-y-6">
                    {Object.entries(INSPIRATIONS).map(([category, items]) => (
                      <div key={category}>
                        <h3 className="font-inter text-xs uppercase tracking-widest text-glow-gold mb-3">{category}</h3>
                        <div className="flex flex-wrap gap-2.5">
                          {items.map((item) => (
                            <SelectPill 
                              key={item} 
                              label={item} 
                              selected={form.inspirations.includes(item)} 
                              onClick={() => toggleInspiration(item)} 
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Budget */}
              {step === 4 && (
                <motion.div key="step4" variants={slideVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-2">Budget</h2>
                  <p className="font-inter text-sm text-glow-muted mb-8">This helps us match you with the right salons and treatments.</p>

                  <div>
                    <label className="font-inter text-sm font-semibold text-glow-black block mb-3">What is your budget for this look?</label>
                    <div className="flex flex-col gap-3">
                      {BUDGETS.map((b) => (
                        <button
                          key={b}
                          onClick={() => set('budgetRange', b)}
                          className={`w-full text-left px-5 py-4 rounded-xl border font-inter text-sm transition-all duration-200 ${
                            form.budgetRange === b
                              ? 'bg-glow-gold/10 border-glow-gold text-glow-black font-semibold'
                              : 'bg-glow-surface border-glow-border text-glow-muted hover:border-glow-gold'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{b}</span>
                            {form.budgetRange === b && <Check size={16} className="text-glow-gold" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-glow-border">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 font-inter text-sm text-glow-muted hover:text-glow-black transition-all duration-200"
              >
                <ArrowLeft size={15} /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={handleContinue}
                  className={`btn-gold ${!canNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className={`btn-gold text-base py-3.5 px-8 ${!canNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Sparkles size={16} /> Generate My Look
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
