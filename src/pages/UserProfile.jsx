import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Clock, MapPin, Star, ChevronRight, LogOut, Heart, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import { getAnalysisHistory, getSavedRecommendations, getFavoriteSalons, removeFavoriteSalon } from '../services/storageService'
import { useBeautyProfile } from '../context/BeautyProfileContext'

export default function UserProfile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { saveAnalysis, saveProfile } = useBeautyProfile()

  const [history, setHistory] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      const [hData, rData, sData] = await Promise.all([
        getAnalysisHistory(user.id),
        getSavedRecommendations(user.id),
        getFavoriteSalons(user.id)
      ])
      setHistory(hData)
      setRecommendations(rData)
      setSalons(sData)
      setLoading(false)
    }

    fetchData()
  }, [user, navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const openReport = (analysis) => {
    // We rehydrate the context with this historical analysis
    saveProfile({
      styleIntent: analysis.styleIntent,
      occasion: analysis.occasion,
      budgetRange: analysis.budgetRange
    })
    saveAnalysis({
      faceShape: analysis.faceAnalysis,
      hairAnalysis: analysis.hairAnalysis,
      skinAnalysis: analysis.skinAnalysis,
      recommendations: analysis.recommendations,
      explanations: {
        face: analysis.faceAnalysis?.plainEnglishMeaning,
        skin: analysis.skinAnalysis?.plainEnglishMeaning,
        hair: analysis.hairAnalysis?.plainEnglishMeaning,
      }
    })
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-32 pb-16 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-glow-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-2">
                <Sparkles size={12} /> My GlowAI Profile
              </span>
              <h1 className="font-playfair text-3xl font-medium text-glow-black">
                Welcome back, <span className="italic text-glow-gold">{user?.name}</span>
              </h1>
              <p className="font-inter text-sm text-glow-muted mt-2">
                You have {history.length} saved analyses and {recommendations.length} saved looks.
              </p>
            </motion.div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-inter text-sm">
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* ── Left Column ── */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Summary */}
              <div className="card-luxury p-6 bg-glow-black text-white">
                <h2 className="font-playfair text-xl font-semibold mb-6">Beauty Identity</h2>
                
                {history.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <span className="font-inter text-xs text-white/50 uppercase tracking-widest block mb-1">Latest Face Shape</span>
                      <p className="font-inter text-sm font-medium">{history[0].faceAnalysis?.technicalClassification || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="font-inter text-xs text-white/50 uppercase tracking-widest block mb-1">Latest Hair Type</span>
                      <p className="font-inter text-sm font-medium">{history[0].hairAnalysis?.technicalClassification || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="font-inter text-xs text-white/50 uppercase tracking-widest block mb-1">Latest Skin Tone</span>
                      <p className="font-inter text-sm font-medium">{history[0].skinAnalysis?.technicalClassification || 'Unknown'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-inter text-sm text-white/70">No analyses completed yet.</p>
                )}
                
                <button onClick={() => navigate('/profile-setup')} className="w-full mt-8 py-3 border border-white/20 rounded-xl font-inter text-sm hover:bg-white/10 transition-colors">
                  Start New Analysis
                </button>
              </div>
            </div>

            {/* ── Right Column ── */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Analysis History */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-playfair text-xl font-semibold text-glow-black">Analysis History</h2>
                  {history.length >= 2 && (
                    <button onClick={() => navigate('/compare')} className="flex items-center gap-2 text-glow-gold font-inter text-sm hover:underline">
                      <ArrowLeftRight size={15} /> Compare Reports
                    </button>
                  )}
                </div>
                
                {history.length === 0 ? (
                  <div className="card-luxury p-8 text-center bg-glow-surface border-dashed border-2">
                    <p className="font-inter text-sm text-glow-muted">No historical reports found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map(analysis => (
                      <div key={analysis.analysisId} className="card-luxury p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-glow-gold transition-colors">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-glow-gold" />
                            <span className="font-inter text-xs text-glow-muted font-medium">
                              {new Date(analysis.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="font-inter text-sm font-medium text-glow-black">
                            Intent: <span className="font-normal">{analysis.styleIntent || 'General Look'}</span>
                          </p>
                          <p className="font-inter text-xs text-glow-muted mt-1">
                            {analysis.occasion} • {analysis.budgetRange}
                          </p>
                        </div>
                        <button onClick={() => openReport(analysis)} className="btn-outline-gold text-xs px-4 py-2 shrink-0 flex items-center gap-2">
                          View Report <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Saved Recommendations */}
              <section>
                <h2 className="font-playfair text-xl font-semibold text-glow-black mb-4">Saved Looks</h2>
                {recommendations.length === 0 ? (
                  <div className="card-luxury p-8 text-center bg-glow-surface border-dashed border-2">
                    <p className="font-inter text-sm text-glow-muted">You haven't saved any recommendations yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="card-luxury p-4 border border-glow-rose/30 bg-glow-rose/5">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-playfair text-base font-semibold text-glow-black">{rec.characterName}</h3>
                          <Heart size={16} className="text-glow-rose fill-glow-rose" />
                        </div>
                        <p className="font-inter text-xs text-glow-muted line-clamp-2">{rec.stylingNotes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Saved Salons */}
              <section>
                <h2 className="font-playfair text-xl font-semibold text-glow-black mb-4">Favorite Salons</h2>
                {salons.length === 0 ? (
                  <div className="card-luxury p-8 text-center bg-glow-surface border-dashed border-2">
                    <p className="font-inter text-sm text-glow-muted">You haven't saved any salons yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {salons.map(salon => (
                      <div key={salon.id} className="card-luxury p-4 flex items-center justify-between gap-4 hover:border-glow-gold transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <img src={salon.image} alt={salon.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-playfair text-sm font-semibold text-glow-black truncate">{salon.name}</p>
                              {salon.matchScore && (
                                <span className="bg-glow-gold/10 text-glow-gold text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                  {salon.matchScore}% Match
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-glow-muted">
                              <span className="flex items-center gap-0.5">
                                <MapPin size={10} className="text-glow-gold" />
                                <span className="truncate">{salon.location}</span>
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Star size={10} className="text-glow-gold fill-glow-gold" />
                                <span className="font-medium text-glow-black">{salon.rating}</span>
                              </span>
                              {salon.distance && (
                                <>
                                  <span>•</span>
                                  <span>{salon.distance.toFixed(1)} km away</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <button 
                            onClick={async () => {
                              if (confirm(`Remove ${salon.name} from favorites?`)) {
                                await removeFavoriteSalon(user.id, salon.id)
                                setSalons(prev => prev.filter(s => s.id !== salon.id))
                              }
                            }}
                            className="p-1.5 rounded-full hover:bg-red-50 text-glow-rose transition-colors"
                            title="Unsave Salon"
                          >
                            <Heart size={16} className="fill-glow-rose" />
                          </button>
                          <button 
                            onClick={() => navigate(`/salons/${salon.id}`)} 
                            className="btn-outline-gold px-3.5 py-1.5 text-xs font-semibold"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
