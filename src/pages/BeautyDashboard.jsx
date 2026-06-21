import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Star, MapPin, Heart,
  ShoppingBag, Home, Crown, Calculator, Calendar,
  CheckCircle2, Zap, User, ArrowRightLeft, Smile, AlertCircle
} from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import { getSalonsForLocation } from '../services/googlePlacesService'
import { rankSalons } from '../services/salonMatchingEngine'

const QUICK_ACTIONS = [
  { icon: <MapPin size={20} />,      label: 'Explore Salons',       href: '/salons',      color: 'from-glow-gold to-amber-400' },
  { icon: <Crown size={20} />,       label: 'Plan My Wedding',      href: '/bridal',      color: 'from-glow-rose to-pink-300' },
  { icon: <Home size={20} />,        label: 'At-Home Services',     href: '/at-home',     color: 'from-emerald-400 to-teal-400' },
  { icon: <Calculator size={20} />,  label: 'Optimise My Budget',   href: '/budget',      color: 'from-purple-400 to-violet-400' },
  { icon: <Star size={20} />,        label: 'Premium Experiences',  href: '/experiences', color: 'from-blue-400 to-cyan-400' },
]

const BEAUTY_TIPS = [
  'Use a silk pillowcase to reduce overnight hair breakage and frizz.',
  'Apply SPF 50 every morning — Mumbai humidity amplifies UV damage.',
  'Double-cleanse at night to remove pollution and makeup thoroughly.',
  'Stay hydrated: Mumbai heat dehydrates skin faster than you realise.',
]

export default function BeautyDashboard() {
  const navigate = useNavigate()
  const { profile, analysis } = useBeautyProfile()

  const userName = profile?.name || 'Your'
  const [matchedSalons, setMatchedSalons] = useState([])
  const [loadingSalons, setLoadingSalons] = useState(false)

  useEffect(() => {
    const fetchMatches = async () => {
      setLoadingSalons(true)
      try {
        let coords = { lat: 19.0760, lng: 72.8777 } // default Mumbai
        const cached = localStorage.getItem('glowai_coords')
        if (cached) {
          coords = JSON.parse(cached)
        }
        
        const stylingContext = {
          faceShape: analysis?.faceShape?.technicalClassification,
          hairType: analysis?.hairAnalysis?.technicalClassification,
          skinTone: analysis?.skinAnalysis?.technicalClassification,
          budgetRange: profile?.budgetRange,
          occasion: profile?.occasion,
          styleIntent: profile?.styleIntent
        }

        const raw = await getSalonsForLocation(coords, 5000, stylingContext)
        // Score using active recommendations
        const ranked = rankSalons(raw, analysis, profile || {})
        // Cache ranked salons in sessionStorage
        sessionStorage.setItem('glowai_last_fetched_salons', JSON.stringify(ranked))
        setMatchedSalons(ranked.slice(0, 3))
      } catch (err) {
        console.error('Failed to load matched salons for dashboard:', err)
      } finally {
        setLoadingSalons(false)
      }
    }

    if (analysis) {
      fetchMatches()
    }
  }, [analysis, profile])

  const profileData = [
    { label: 'Face Shape',     value: analysis?.faceShape?.technicalClassification || 'Not determined' },
    { label: 'Skin Tone',      value: analysis?.skinAnalysis?.technicalClassification  || 'Not determined' },
    { label: 'Hair Type',      value: analysis?.hairAnalysis?.technicalClassification || 'Not determined' },
    { label: 'Style Profile',  value: analysis?.styleProfile || 'Not set' },
    { label: 'Budget Type',    value: profile?.budgetRange || 'Not set' },
  ]

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* ── Welcome ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
            <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-3">
              <Sparkles size={12} /> Your Beauty Concierge
            </span>
            <h1 className="font-playfair text-4xl font-medium text-glow-black mb-2">
              Welcome back,{' '}
              <span className="italic text-glow-gold">{userName}</span>
            </h1>
            <p className="font-inter text-sm text-glow-muted">
              Here's your personalised beauty dashboard — curated just for you.
            </p>
          </motion.div>

          {/* ── Analysis Quality Guardrail Warning ── */}
          {analysis && (
            analysis?.recommendations?.error ||
            (analysis?.faceShape?.confidence ?? 0) < 60 ||
            (analysis?.skinAnalysis?.confidence ?? 0) < 60
          ) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-amber-50 border border-amber-300/50 rounded-2xl p-5 flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-playfair text-sm font-semibold text-amber-800 mb-1">
                  Analysis Confidence Too Low
                </p>
                <p className="font-inter text-xs text-amber-700 leading-relaxed mb-3">
                  {analysis?.recommendations?.error ||
                    'Your selfie did not produce high-confidence results. Recommendations may be inaccurate.'}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="font-inter text-xs font-semibold text-amber-800 bg-amber-200/60 hover:bg-amber-200 px-4 py-1.5 rounded-full transition-colors"
                >
                  Retake Selfie →
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Beauty Journey Summary Timeline ── */}
          {analysis?.recommendations && !analysis?.recommendations?.error && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="card-luxury p-6 mb-8 border border-glow-gold/30 bg-gradient-to-r from-glow-surface via-glow-surface to-glow-gold/5 shadow-luxury"
            >
              <h2 className="font-playfair text-lg font-semibold text-glow-black mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-glow-gold animate-pulse" /> Your AI Beauty Journey Summary
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                
                {/* Step 1: Desired Look */}
                <div className="relative p-4 bg-white/70 rounded-xl border border-glow-border flex flex-col justify-between">
                  <div>
                    <span className="font-inter text-[9px] font-bold text-glow-gold uppercase tracking-widest block mb-1">1. Desired Look</span>
                    <h4 className="font-playfair text-sm font-semibold text-glow-black">{profile?.occasion || 'Wedding'} Goal</h4>
                    <p className="font-inter text-xs text-glow-muted mt-1 italic">"{profile?.styleIntent || 'A fresh new look'}"</p>
                  </div>
                  <span className="font-inter text-[10px] text-glow-gold font-semibold mt-3 block">{profile?.budgetRange || '₹1,500–₹3,000'}</span>
                </div>

                {/* Step 2: Character Fit */}
                <div className="p-4 bg-white/70 rounded-xl border border-glow-border flex flex-col justify-between">
                  <div>
                    <span className="font-inter text-[9px] font-bold text-glow-gold uppercase tracking-widest block mb-1">2. Character Fit</span>
                    <h4 className="font-playfair text-sm font-semibold text-glow-black">
                      {analysis?.recommendations?.characterLooks?.[0]?.characterName || 'Signature Look'}
                    </h4>
                    <p className="font-inter text-xs text-glow-muted mt-1 leading-snug">
                      Inspired by {analysis?.recommendations?.characterLooks?.[0]?.source || 'Modern Aesthetic'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-3">
                    <Star size={10} className="text-glow-gold fill-glow-gold" />
                    <span className="font-inter text-[10px] text-glow-gold font-semibold">
                      {analysis?.recommendations?.characterLooks?.[0]?.matchScore || 95}% Fit
                    </span>
                  </div>
                </div>

                {/* Step 3: Style Direction */}
                <div className="p-4 bg-white/70 rounded-xl border border-glow-border flex flex-col justify-between">
                  <div>
                    <span className="font-inter text-[9px] font-bold text-glow-gold uppercase tracking-widest block mb-1">3. Styling Direction</span>
                    <h4 className="font-playfair text-sm font-semibold text-glow-black">Key Hair & Grooming</h4>
                    <p className="font-inter text-xs text-glow-muted mt-1 line-clamp-2 leading-relaxed">
                      {analysis?.recommendations?.recommendedHairstyles?.[0] || 'Soft Layers'}, {analysis?.recommendations?.makeupDirection}
                    </p>
                  </div>
                  <span className="font-inter text-[10px] text-glow-gold font-semibold mt-3 block">Custom Prep Plan</span>
                </div>

                {/* Step 4: Salon Match */}
                <div className="p-4 bg-glow-black text-white rounded-xl flex flex-col justify-between shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-glow-gold/20 rounded-full blur-xl"></div>
                  <div>
                    <span className="font-inter text-[9px] font-bold text-glow-gold uppercase tracking-widest block mb-1">4. Best Salon Match</span>
                    <h4 className="font-playfair text-sm font-semibold text-white truncate">
                      {matchedSalons[0]?.name || 'Loading Best Salon…'}
                    </h4>
                    <p className="font-inter text-xs text-white/60 mt-1">
                      {matchedSalons[0] ? `${matchedSalons[0].distance.toFixed(1)} km away • ${matchedSalons[0].location}` : 'Finding closest expert…'}
                    </p>
                  </div>
                  {matchedSalons[0] ? (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                      <span className="font-inter text-[10px] text-glow-gold font-semibold">{matchedSalons[0].matchScore}% Match</span>
                      <button 
                        onClick={() => navigate(`/salons/${matchedSalons[0].id}`)}
                        className="text-[10px] text-white hover:text-glow-gold transition-colors font-bold font-inter"
                      >
                        Book Now →
                      </button>
                    </div>
                  ) : (
                    <span className="font-inter text-[10px] text-white/45 mt-3 block">Calculating…</span>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Left Column ── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-glow-black rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-glow-gold to-glow-rose overflow-hidden">
                    {profile?.photoPreview
                      ? <img src={profile.photoPreview} alt="profile" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><User size={22} className="text-white" /></div>
                    }
                  </div>
                  <div>
                    <p className="font-playfair text-white text-sm font-semibold">{userName}</p>
                    <p className="font-inter text-xs text-glow-gold">Style Profile Active</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {profileData.map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-white/8 last:border-0">
                      <span className="font-inter text-xs text-white/45">{row.label}</span>
                      <span className="font-inter text-xs font-medium text-white capitalize">{row.value}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate('/profile-setup')} className="btn-outline-gold w-full mt-5 text-sm py-2.5">
                  Update Profile
                </button>
              </motion.div>

              {/* Beauty Tips */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-luxury p-6">
                <h3 className="font-playfair text-base font-semibold text-glow-black mb-4 flex items-center gap-2">
                  <Zap size={15} className="text-glow-gold" /> AI Beauty Tips
                </h3>
                <div className="space-y-3">
                  {(analysis?.beautyTips || BEAUTY_TIPS).map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={13} className="text-glow-gold shrink-0 mt-0.5" />
                      <p className="font-inter text-xs text-glow-muted leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── Right Column ── */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <h2 className="font-playfair text-xl font-semibold text-glow-black mb-4">Your Beauty Modules</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {QUICK_ACTIONS.map((action, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(action.href)}
                      className="card-luxury p-5 text-left group hover:shadow-luxury"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform duration-200`}>
                        {action.icon}
                      </div>
                      <p className="font-inter text-sm font-medium text-glow-black leading-snug">{action.label}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Recommended Looks & Characters — hidden when recommendation engine returned an error */}
              {analysis?.recommendations && !analysis?.recommendations?.error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
                
                {/* Overall Direction */}
                <div className="card-luxury p-6 bg-gradient-to-br from-glow-surface to-glow-gold/5 border-glow-gold/20">
                  <h2 className="font-playfair text-xl font-semibold text-glow-black mb-3">Your Signature Style</h2>
                  <p className="font-inter text-sm text-glow-muted leading-relaxed mb-4">
                    {analysis?.recommendations?.overallStyleDirection}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-glow-border">
                    <div className="flex-1">
                      <span className="font-inter text-xs font-semibold text-glow-gold uppercase tracking-widest block mb-1">Makeup & Grooming</span>
                      <p className="font-inter text-sm text-glow-black">{analysis?.recommendations?.makeupDirection}</p>
                    </div>
                    <div className="flex-1">
                      <span className="font-inter text-xs font-semibold text-glow-gold uppercase tracking-widest block mb-1">Key Hairstyles</span>
                      <p className="font-inter text-sm text-glow-black">{(analysis?.recommendations?.recommendedHairstyles || []).join(', ')}</p>
                    </div>
                  </div>
                </div>

                {/* Character Matches */}
                <div>
                  <h2 className="font-playfair text-xl font-semibold text-glow-black mb-4">Top Matches for Your Intent</h2>
                  <div className="space-y-4">
                    {(analysis?.recommendations?.characterLooks || []).map((char, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="card-luxury p-5 border border-glow-border hover:border-glow-gold transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-playfair text-lg font-semibold text-glow-black flex items-center gap-2">
                              {char.characterName} <span className="text-glow-muted font-normal text-sm">({char.source})</span>
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-glow-gold/10 rounded-full">
                              <Star size={12} className="text-glow-gold fill-glow-gold" />
                              <span className="font-inter text-xs font-semibold text-glow-gold">{char.matchScore}% Match</span>
                            </div>
                            <button 
                              onClick={async () => {
                                const { saveRecommendation, getCurrentUser } = await import('../services/storageService')
                                const user = await getCurrentUser()
                                if (user) {
                                  await saveRecommendation(user.id, char)
                                  alert('Recommendation saved to your profile!')
                                } else {
                                  alert('Please login to save recommendations')
                                }
                              }}
                              className="p-1.5 rounded-full hover:bg-glow-rose/10 text-glow-muted hover:text-glow-rose transition-colors"
                              title="Save Recommendation"
                            >
                              <Heart size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="font-inter text-xs font-semibold text-glow-muted uppercase tracking-wider block mb-1">Why it fits</span>
                            <p className="font-inter text-sm text-glow-black">{char.whyItFits}</p>
                          </div>
                          <div>
                            <span className="font-inter text-xs font-semibold text-glow-muted uppercase tracking-wider block mb-1">Styling Notes</span>
                            <p className="font-inter text-sm text-glow-black">{char.stylingNotes}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              )}

              {/* Detailed AI Analysis Explanations */}
              {analysis?.explanations && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="card-luxury p-6">
                  <h2 className="font-playfair text-xl font-semibold text-glow-black mb-4">Why we recommended this</h2>
                  <div className="space-y-6">
                    {['face', 'skin', 'hair'].map(type => {
                      const title = type === 'face' ? 'Face Shape' : type === 'skin' ? 'Skin Analysis' : 'Hair Analysis'
                      const data = type === 'face' ? analysis.faceShape : type === 'skin' ? analysis.skinAnalysis : analysis.hairAnalysis
                      if (!data || !data.technicalClassification) return null

                      return (
                        <div key={type} className="border-b border-glow-border pb-4 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-playfair font-semibold text-glow-black">{title}</span>
                            <span className="font-inter text-xs font-medium text-glow-gold">
                              {data.confidence}% Confidence
                            </span>
                          </div>
                          <p className="font-inter text-sm text-glow-black font-medium mb-1">
                            {data.plainEnglishMeaning}
                          </p>
                          <p className="font-inter text-xs text-glow-muted">
                            {data.whyItWasDetected}
                          </p>
                        </div>
                      )
                    })}
                    {analysis?.recommendations?.stylingImplications && (
                      <div className="mt-4 p-3 bg-glow-gold/10 rounded-xl">
                        <p className="font-inter text-sm text-glow-black">
                          <span className="font-semibold">Styling Implication:</span> {analysis.recommendations.stylingImplications}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Top Salon Matches */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-playfair text-xl font-semibold text-glow-black">Your Matched Salons</h2>
                  <button onClick={() => navigate('/salons')} className="font-inter text-xs text-glow-gold flex items-center gap-1 hover:gap-2 transition-all">
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                
                {loadingSalons ? (
                  <div className="card-luxury p-8 text-center flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-glow-gold border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="font-inter text-xs text-glow-muted">Finding nearby matches…</span>
                  </div>
                ) : matchedSalons.length === 0 ? (
                  <div className="card-luxury p-8 text-center bg-glow-surface border-dashed border-2">
                    <p className="font-inter text-sm text-glow-muted">No nearby matched salons found. Try searching on the Marketplace.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchedSalons.map((salon, i) => (
                      <motion.div
                        key={salon.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        onClick={() => navigate(`/salons/${salon.id}`)}
                        className="card-luxury p-4 flex items-center gap-4 cursor-pointer hover:shadow-luxury transition-shadow"
                      >
                        <img 
                          src={salon.image} 
                          alt={salon.name} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80';
                          }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className="font-playfair text-sm font-semibold text-glow-black truncate">{salon.name}</p>
                            <span className="font-inter text-xs font-semibold text-glow-gold ml-2 shrink-0">
                              {salon.matchScore}% Match
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-glow-muted">
                            <span className="flex items-center gap-0.5">
                              <MapPin size={10} className="text-glow-muted" />
                              <span>{salon.location}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5">
                              <Star size={10} className="text-glow-gold fill-glow-gold" />
                              <span className="font-medium text-glow-black">{salon.rating}</span>
                            </span>
                            <span>•</span>
                            <span>{salon.distance.toFixed(1)} km</span>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/salons/${salon.id}`) }} className="btn-gold py-2 px-4 text-xs shrink-0">
                          Book
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}