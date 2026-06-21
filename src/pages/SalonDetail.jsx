import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle2, Clock, ArrowLeft, Calendar, Heart, Sparkles, ShieldCheck } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import { salons as staticSalons } from '../data/salons'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import { useAuth } from '../context/AuthContext'
import { calculateMatchScore } from '../services/salonMatchingEngine'
import { saveFavoriteSalon, getFavoriteSalons } from '../services/storageService'

const DEFAULT_ANALYSIS = {
  faceShape: { technicalClassification: 'Oval' },
  skinAnalysis: { technicalClassification: 'Medium Warm' },
  hairAnalysis: { technicalClassification: 'Wavy' },
  recommendations: {
    recommendedHairstyles: ['Soft Layers', 'Textured Crop', 'Classic Taper'],
    makeupDirection: 'Luminous glass skin makeup'
  }
}
const DEFAULT_PROFILE = {
  styleProfile: "Women's Styles",
  occasion: 'Wedding',
  styleIntent: 'Elegant bridal look',
  budgetRange: '₹1,500–₹3,000'
}

export default function SalonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, analysis, isAnalyzed } = useBeautyProfile()
  
  const [salon, setSalon] = useState(null)
  const [slot, setSlot] = useState(null)
  const [activeImg, setActiveImg] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const activeAnalysis = isAnalyzed ? analysis : DEFAULT_ANALYSIS
  const activeProfile = isAnalyzed ? profile : DEFAULT_PROFILE

  // Load salon details from sessionStorage or static list
  useEffect(() => {
    const cachedSalons = JSON.parse(sessionStorage.getItem('glowai_last_fetched_salons') || '[]')
    let found = cachedSalons.find(s => String(s.id) === String(id))
    
    if (!found) {
      found = staticSalons.find(s => String(s.id) === String(id))
    }
    
    // Add default mock coordinates and distance to static salons if they don't have them
    if (found && !found.coordinates) {
      found.coordinates = { lat: 19.0600, lng: 72.8311 }
      found.distance = 2.4
      found.openNow = 'Open Now'
      found.reviews = [
        { name: 'Sneha R.', rating: 5, date: '1 week ago', text: 'Absolutely stunning experience. The bridal package was worth every rupee.' },
        { name: 'Priya M.', rating: 5, date: '3 weeks ago', text: 'Best haircut of my life. The consultation was thorough, the result was perfect.' },
        { name: 'Aisha K.', rating: 4, date: '1 month ago', text: 'Premium ambience, skilled staff. Highly recommended.' }
      ]
    }
    
    setSalon(found)
    
    // Check if this salon is already saved in favorites
    if (found && user) {
      getFavoriteSalons(user.id).then(savedList => {
        setIsSaved(savedList.some(s => String(s.id) === String(found.id)))
      }).catch(err => console.error('Failed to get saved salons:', err))
    }
  }, [id, user])

  // Handle Save Salon action
  const handleSaveToggle = async () => {
    if (!user) {
      alert('Please log in to save salons to your profile!')
      navigate('/login')
      return
    }

    setSaveLoading(true)
    try {
      // For MVP, we save/add. If already saved, we can toggle/remove or inform.
      await saveFavoriteSalon(user.id, salon, `Notes for ${salon.name}`)
      setIsSaved(true)
      alert('Salon saved to your favorites!')
    } catch (err) {
      console.error(err)
    } finally {
      setSaveLoading(false)
    }
  }

  if (!salon) return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="font-playfair text-2xl text-glow-muted">Salon not found.</p>
          <button onClick={() => navigate('/salons')} className="btn-gold mt-5">Back to Salons</button>
        </div>
      </div>
    </MainLayout>
  )

  // Calculate Match Details dynamically
  const matchResult = calculateMatchScore(
    salon, 
    activeAnalysis, 
    activeProfile, 
    activeAnalysis.recommendations?.characterLooks || []
  )

  return (
    <MainLayout>
      <div className="pt-20 pb-20 min-h-screen">
        
        {/* Hero Image */}
        <div className="relative h-72 sm:h-[450px] overflow-hidden">
          <img 
            src={salon.gallery[activeImg]} 
            alt={salon.name} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80';
            }}
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-glow-black/80 via-glow-black/30 to-transparent" />
          
          <button 
            onClick={() => navigate('/salons')} 
            className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-full p-2.5 hover:bg-white transition-colors shadow-md z-10"
          >
            <ArrowLeft size={18} className="text-glow-black" />
          </button>
          
          {salon.badge && (
            <span className="absolute top-6 right-6 bg-glow-gold text-white text-xs font-inter font-medium px-4 py-1.5 rounded-full shadow-md z-10">
              {salon.badge}
            </span>
          )}

          <div className="absolute bottom-6 left-6 right-6 z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-glow-gold/25 backdrop-blur-md text-glow-gold border border-glow-gold/40 text-xs font-bold font-inter px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> {matchResult.score}% GlowAI Match
              </span>
              {salon.openNow && (
                <span className={`text-[10px] font-bold font-inter px-2.5 py-1 rounded-full ${salon.openNow.includes('Open') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {salon.openNow}
                </span>
              )}
            </div>
            
            <h1 className="font-playfair text-3xl sm:text-5xl font-semibold text-white mb-2 leading-tight">{salon.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/80">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-glow-gold" />
                <span className="font-inter text-sm">{salon.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-glow-gold fill-glow-gold" />
                <span className="font-inter text-sm font-semibold text-white">{salon.rating}</span>
                <span className="font-inter text-sm text-white/60">({salon.reviewCount} reviews)</span>
              </div>
              {salon.distance && (
                <div className="font-inter text-sm">
                  • <span className="font-semibold text-glow-gold ml-1">{salon.distance.toFixed(1)} km</span> away
                </div>
              )}
              {salon.verified && (
                <span className="flex items-center gap-1 text-xs font-inter text-glow-gold">
                  <ShieldCheck size={14} /> Verified Partner
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail Gallery */}
        <div className="bg-glow-black px-4 sm:px-8 py-4 border-b border-white/5">
          <div className="max-w-7xl mx-auto flex gap-3 overflow-x-auto scrollbar-none">
            {salon.gallery.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImg(i)} 
                className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-glow-gold scale-95 shadow-md' : 'border-transparent opacity-50 hover:opacity-80'}`}
              >
                <img 
                  src={img} 
                  alt="" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80';
                  }}
                  className="w-full h-full object-cover" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Left Column (Details, Services, Reviews) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* why GlowAI recommended */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gradient-to-br from-glow-surface to-glow-gold/5 border border-glow-gold/30 rounded-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-glow-gold/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="text-glow-gold animate-pulse" size={20} />
                  <h3 className="font-playfair text-lg font-semibold text-glow-black">Why GlowAI Recommended</h3>
                </div>
                <p className="font-inter text-sm text-glow-muted leading-relaxed mb-4">
                  {matchResult.reasoning}
                </p>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-glow-gold/20">
                  <div>
                    <span className="font-inter text-[10px] text-glow-muted uppercase tracking-wider block">Occasion Match</span>
                    <span className="font-inter text-sm font-semibold text-glow-black capitalize">{activeProfile.occasion || 'Bridal'}</span>
                  </div>
                  <div>
                    <span className="font-inter text-[10px] text-glow-muted uppercase tracking-wider block">Recommended Cut</span>
                    <span className="font-inter text-sm font-semibold text-glow-black truncate max-w-[150px] block">
                      {(activeAnalysis.recommendations?.recommendedHairstyles || [])[0] || 'Layers'}
                    </span>
                  </div>
                  <div>
                    <span className="font-inter text-[10px] text-glow-muted uppercase tracking-wider block">Price Category</span>
                    <span className="font-inter text-sm font-semibold text-glow-black">{salon.priceRange} ({salon.priceFrom}+)</span>
                  </div>
                </div>
              </motion.div>

              {/* About */}
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-3">About</h2>
                <p className="font-inter text-sm text-glow-muted leading-relaxed">{salon.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {salon.specialties.map((spec) => (
                    <span key={spec} className="font-inter text-xs bg-glow-gold/10 text-glow-gold border border-glow-gold/25 px-3.5 py-1 rounded-full font-medium">{spec}</span>
                  ))}
                  {salon.tags.map((tag) => (
                    <span key={tag} className="font-inter text-xs bg-glow-border text-glow-muted px-3.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Services List */}
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-5">Services & Pricing</h2>
                <div className="space-y-3">
                  {salon.services.map((svc, i) => (
                    <motion.div key={i} whileHover={{ x: 4 }} className="card-luxury p-4 flex items-center justify-between cursor-default">
                      <div>
                        <p className="font-inter text-sm font-semibold text-glow-black">{svc.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock size={11} className="text-glow-muted" />
                          <span className="font-inter text-xs text-glow-muted">{svc.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-playfair text-base font-semibold text-glow-gold">₹{svc.price.toLocaleString()}</p>
                        <button onClick={() => navigate('/booking')} className="font-inter text-xs text-glow-muted hover:text-glow-gold transition-colors mt-0.5 font-medium">Book →</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Client Reviews */}
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-5">Client Reviews</h2>
                <div className="space-y-4">
                  {(salon.reviews || []).map((rev, i) => (
                    <div key={i} className="card-luxury p-5 border border-glow-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-glow-gold to-glow-rose flex items-center justify-center text-white text-xs font-semibold">
                            {rev.name[0]}
                          </div>
                          <span className="font-inter text-sm font-semibold text-glow-black">{rev.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {[...Array(rev.rating)].map((_, j) => <Star key={j} size={12} className="text-glow-gold fill-glow-gold" />)}
                          <span className="font-inter text-xs text-glow-muted ml-1">{rev.date}</span>
                        </div>
                      </div>
                      <p className="font-inter text-sm text-glow-muted leading-relaxed italic">"{rev.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Booking, Save Salon Action) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Booking panel */}
              <div className="card-luxury p-6 sticky top-24 border border-glow-border bg-glow-surface shadow-luxury">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-playfair text-xl font-semibold text-glow-black">Book Appointment</h3>
                  <button 
                    onClick={handleSaveToggle}
                    disabled={saveLoading}
                    className={`p-2 rounded-full border transition-all ${isSaved ? 'bg-glow-rose/10 text-glow-rose border-glow-rose/25' : 'bg-glow-surface text-glow-muted border-glow-border hover:bg-glow-border'}`}
                    title={isSaved ? "Saved to Favorites" : "Save Salon"}
                  >
                    <Heart size={18} className={isSaved ? 'fill-glow-rose' : ''} />
                  </button>
                </div>
                <p className="font-inter text-xs text-glow-muted mb-5">Select a time slot to lock in your concierge booking.</p>

                <div className="mb-5">
                  <p className="font-inter text-xs font-semibold text-glow-black uppercase tracking-wider mb-3">Available Slots</p>
                  <div className="grid grid-cols-2 gap-2">
                    {salon.slots.map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setSlot(s)} 
                        className={`py-2.5 px-3 rounded-xl border font-inter text-xs font-medium transition-all duration-200 ${slot === s ? 'bg-glow-gold text-white border-glow-gold shadow-sm' : 'border-glow-border text-glow-muted hover:border-glow-gold'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-t border-glow-border mb-4">
                  <span className="font-inter text-sm text-glow-muted">Starting from</span>
                  <span className="font-playfair text-xl font-semibold text-glow-gold">₹{salon.priceFrom.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => navigate('/booking', { state: { salonId: salon.id, slot } })}
                  className={`btn-gold w-full text-sm py-3.5 ${!slot ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <Calendar size={15} /> Confirm Appointment
                </button>

                <p className="font-inter text-xs text-glow-muted text-center mt-3">Free rescheduling up to 2 hours prior</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </MainLayout>
  )
}