import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Star, X, LayoutGrid, Map as MapIcon, Sparkles, Navigation, AlertCircle, MessageSquare } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import SalonCard  from '../components/SalonCard'
import SectionHeader from '../components/SectionHeader'
import MapComponent from '../components/MapComponent'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import { getSalonsForLocation, geocodeAddress, getCurrentCoordinates } from '../services/googlePlacesService'
import { rankSalons } from '../services/salonMatchingEngine'
import { MUMBAI_AREA_GROUPS, MUMBAI_AREAS } from '../data/mumbaiAreas'

const RATINGS = ['All', '4.8+', '4.6+', '4.4+']
const BUDGETS = ['All', 'Under ₹1,500', '₹1,500–₹3,000', 'Above ₹3,000']

const DEFAULT_ANALYSIS = {
  faceShape: { technicalClassification: 'Oval', confidence: 90, plainEnglishMeaning: 'Balanced proportions', whyItWasDetected: 'Default profile' },
  skinAnalysis: { technicalClassification: 'Medium Warm', confidence: 92, plainEnglishMeaning: 'Golden undertones', whyItWasDetected: 'Default profile' },
  hairAnalysis: { technicalClassification: 'Wavy', confidence: 85, plainEnglishMeaning: 'Soft natural waves', whyItWasDetected: 'Default profile' },
  recommendations: {
    recommendedHairstyles: ['Soft Layers', 'Textured Crop', 'Classic Taper'],
    makeupDirection: 'Fresh, luminous "glass skin" makeup with warm tones',
    overallStyleDirection: 'Leaning into a balanced, elegant aesthetic.'
  }
}
const DEFAULT_PROFILE = {
  name: 'Guest',
  styleProfile: 'Gender-Neutral Styles',
  occasion: 'Style Refresh',
  styleIntent: 'Clean professional style refresh',
  budgetRange: '₹1,500–₹3,000'
}

export default function SalonMarketplace() {
  const { profile, analysis, isAnalyzed, openChat } = useBeautyProfile()

  const [permissionState, setPermissionState] = useState('prompt')
  const [coords, setCoords]           = useState(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [manualQuery, setManualQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const [query,  setQuery]  = useState('')
  const [rating, setRating] = useState('All')
  const [budget, setBudget] = useState('All')
  const [viewMode, setViewMode] = useState('list')
  const [loading, setLoading]   = useState(false)
  const [rawSalons, setRawSalons]     = useState([])
  const [rankedSalons, setRankedSalons] = useState([])
  const [selectedMapSalon, setSelectedMapSalon] = useState(null)

  const activeAnalysis = isAnalyzed ? analysis : DEFAULT_ANALYSIS
  const activeProfile  = isAnalyzed ? profile  : DEFAULT_PROFILE

  const requestLocation = async () => {
    setPermissionState('requesting')
    setLoading(true)
    setErrorMessage('')
    try {
      const position = await getCurrentCoordinates()
      setCoords(position)
      setPermissionState('granted')
      setLocationLabel('Current Location')

      const stylingContext = {
        faceShape:   activeAnalysis?.faceShape?.technicalClassification,
        hairType:    activeAnalysis?.hairAnalysis?.technicalClassification,
        skinTone:    activeAnalysis?.skinAnalysis?.technicalClassification,
        budgetRange: activeProfile?.budgetRange,
        occasion:    activeProfile?.occasion,
        styleIntent: activeProfile?.styleIntent,
      }

      const salonsData = await getSalonsForLocation(position, 5000, stylingContext)
      console.log("Fetched salons:", salonsData)
      setRawSalons(salonsData)
      console.log("Count:", salonsData.length)
    } catch (err) {
      console.warn('Geolocation failed:', err)
      setPermissionState('denied')
      setErrorMessage(
        err.code === 1
          ? 'location_denied'
          : 'location_error'
      )

      // Load fallback (Mumbai Centre) silently
      const fallbackCoords = { lat: 19.0760, lng: 72.8777 }
      setCoords(fallbackCoords)
      setLocationLabel('Mumbai (Default)')

      const stylingContext = {
        faceShape:   activeAnalysis?.faceShape?.technicalClassification,
        hairType:    activeAnalysis?.hairAnalysis?.technicalClassification,
        skinTone:    activeAnalysis?.skinAnalysis?.technicalClassification,
        budgetRange: activeProfile?.budgetRange,
        occasion:    activeProfile?.occasion,
        styleIntent: activeProfile?.styleIntent,
      }

      try {
        const salonsData = await getSalonsForLocation(fallbackCoords, 5000, stylingContext)
        setRawSalons(salonsData)
      } catch (finalErr) {
        console.error('Final fallback fetch failed:', finalErr)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManualSearch = async (e) => {
    if (e) e.preventDefault()

    const searchText = manualQuery.trim()
    const stylingContext = {
      faceShape:   activeAnalysis?.faceShape?.technicalClassification,
      hairType:    activeAnalysis?.hairAnalysis?.technicalClassification,
      skinTone:    activeAnalysis?.skinAnalysis?.technicalClassification,
      budgetRange: activeProfile?.budgetRange,
      occasion:    activeProfile?.occasion,
      styleIntent: activeProfile?.styleIntent,
    }

    if (!searchText) {
      const cityData = geocodeAddress('mumbai')
      setLoading(true)
      setCoords({ lat: cityData.lat, lng: cityData.lng })
      setLocationLabel(cityData.label)
      const salonsData = await getSalonsForLocation({ lat: cityData.lat, lng: cityData.lng }, 5000, stylingContext)
      setRawSalons(salonsData)
      setPermissionState('granted')
      setLoading(false)
      return
    }

    setLoading(true)
    const geocoded = geocodeAddress(searchText)
    setCoords({ lat: geocoded.lat, lng: geocoded.lng })
    setLocationLabel(geocoded.label)

    try {
      const salonsData = await getSalonsForLocation({ lat: geocoded.lat, lng: geocoded.lng }, 5000, stylingContext)
      setRawSalons(salonsData)
      setPermissionState('granted')
      // Clear location error when user searches manually
      setErrorMessage('')
    } catch (err) {
      console.error('Manual search fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rawSalons.length > 0) {
      const ranked = rankSalons(rawSalons, activeAnalysis, activeProfile)
      setRankedSalons(ranked)
      if (ranked.length > 0) setSelectedMapSalon(ranked[0])
    } else {
      setRankedSalons([])
    }
  }, [rawSalons, activeAnalysis, activeProfile])

  const filteredSalons = rankedSalons.filter(s => {
    const qMatch = s.name.toLowerCase().includes(query.toLowerCase()) ||
                   s.location.toLowerCase().includes(query.toLowerCase()) ||
                   s.specialties.some(sp => sp.toLowerCase().includes(query.toLowerCase()))
    const rMatch = rating === 'All' || s.rating >= parseFloat(rating)
    const bMatch = budget === 'All' ||
      (budget === 'Under ₹1,500' && s.priceFrom < 1500) ||
      (budget === '₹1,500–₹3,000' && s.priceFrom >= 1500 && s.priceFrom <= 3000) ||
      (budget === 'Above ₹3,000' && s.priceFrom > 3000)
    return qMatch && rMatch && bMatch
  })

  const showLocationError = (errorMessage === 'location_denied' || errorMessage === 'location_error') && rankedSalons.length === 0

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">

          <SectionHeader
            badge="AI style concierge"
            title="Smart Salon Matching"
            subtitle="GlowAI finds nearby salons and grooming partners matched to your style goals, budget, and profile."
          />

          {!isAnalyzed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-glow-gold/10 border border-glow-gold/25 rounded-2xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="text-glow-gold shrink-0" size={20} />
                <div>
                  <p className="font-playfair text-sm font-semibold text-glow-black">Using Default Match Settings</p>
                  <p className="font-inter text-xs text-glow-muted">Complete your selfie analysis to unlock 100% personalized salon matching scores.</p>
                </div>
              </div>
              <button
                onClick={() => window.location.href = '/profile-setup'}
                className="btn-gold py-1.5 px-4 text-xs"
              >
                Analyze Now
              </button>
            </motion.div>
          )}

          {/* ── Geolocation Prompt ── */}
          {permissionState === 'prompt' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-luxury p-8 max-w-2xl mx-auto mb-12 border border-glow-gold/30 bg-gradient-to-br from-glow-surface to-glow-gold/5 text-center relative overflow-hidden shadow-luxury"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-glow-gold/10 rounded-full blur-2xl" />
              <MapPin className="text-glow-gold mx-auto mb-4 animate-bounce" size={40} />
              <h2 className="font-playfair text-2xl font-medium text-glow-black mb-3">Find Nearby Salons</h2>
              <p className="font-inter text-sm text-glow-muted leading-relaxed max-w-md mx-auto mb-6">
                GlowAI uses your location to discover the best salons in your area capable of styling your recommended look.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
                <button
                  onClick={requestLocation}
                  className="btn-gold py-3 px-6 text-sm flex items-center justify-center gap-2"
                >
                  <Navigation size={15} /> Use My Location
                </button>
                <button
                  onClick={() => setPermissionState('denied')}
                  className="btn-outline-gold py-3 px-6 text-sm"
                >
                  Search Manually
                </button>
              </div>
              <div className="mt-4">
                <button
                  onClick={openChat}
                  className="flex items-center gap-2 text-glow-gold/70 font-inter text-xs hover:text-glow-gold transition-colors mx-auto"
                >
                  <MessageSquare size={13} /> Or ask Glow to find salons near you
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Requesting Location Spinner ── */}
          {permissionState === 'requesting' && (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full border-2 border-glow-gold border-t-transparent animate-spin mx-auto mb-4" />
              <p className="font-playfair text-lg text-glow-black font-semibold">Requesting Location Permission…</p>
              <p className="font-inter text-xs text-glow-muted mt-1">Please approve the browser location popup.</p>
            </div>
          )}

          {/* ── Main Dashboard ── */}
          {(permissionState === 'granted' || permissionState === 'denied' || permissionState === 'error') && (
            <div>
              {/* Location Bar + Manual Search */}
              <div className="card-luxury p-5 mb-6 border border-glow-border flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-glow-gold/10 flex items-center justify-center text-glow-gold shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="font-inter text-[10px] font-semibold text-glow-gold uppercase tracking-wider block">Active Radius Search</span>
                    <span className="font-playfair text-base font-semibold text-glow-black capitalize">{locationLabel || 'Mumbai'}</span>
                  </div>
                </div>

                <form onSubmit={handleManualSearch} className="flex-1 max-w-xl flex flex-wrap gap-2.5 items-center">
                  <div className="py-2.5 px-3 border border-glow-border rounded-xl font-inter text-xs font-semibold text-glow-black bg-glow-surface">
                    Mumbai
                  </div>
                  <select
                    value={selectedArea}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedArea(value)
                      setManualQuery(value)
                    }}
                    className="py-2.5 px-3 border border-glow-border rounded-xl font-inter text-xs text-glow-black bg-glow-surface focus:border-glow-gold outline-none"
                  >
                    <option value="">Select Mumbai area</option>
                    {MUMBAI_AREA_GROUPS.map((group) => (
                      <optgroup key={group.region} label={group.region}>
                        {group.areas.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    list="mumbai-area-options"
                    placeholder="Enter area or pincode (e.g. Bandra West, 400050)..."
                    className="flex-1 min-w-[150px] py-2.5 px-4 border border-glow-border rounded-xl font-inter text-xs text-glow-black bg-glow-surface focus:border-glow-gold outline-none shadow-sm"
                  />
                  <datalist id="mumbai-area-options">
                    {MUMBAI_AREAS.map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                  <button type="submit" className="btn-gold py-2.5 px-4 text-xs font-semibold">
                    Go
                  </button>
                </form>
              </div>

              {/* ── Location Error Banner ── */}
              {showLocationError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-5 bg-glow-surface border border-glow-border rounded-2xl flex items-start gap-4 shadow-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-glow-gold/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-glow-gold" />
                  </div>
                  <div>
                    <p className="font-playfair text-base font-semibold text-glow-black mb-1">
                      We're sorry, currently unable to access your location
                    </p>
                    <p className="font-inter text-xs text-glow-muted leading-relaxed">
                      Please search manually by entering your Mumbai area or pincode above to find nearby salons.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Filters + View Toggle */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex-1 relative max-w-md">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-glow-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by salon name or specialty…"
                    className="w-full pl-11 pr-4 py-2.5 border border-glow-border rounded-full font-inter text-xs text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors"
                  />
                  {query && (
                    <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                      <X size={14} className="text-glow-muted" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Budget Filters */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-inter text-[11px] text-glow-muted">Budget:</span>
                    <div className="flex bg-glow-border/40 p-0.5 rounded-lg border border-glow-border">
                      {BUDGETS.slice(0, 3).map((b) => (
                        <button
                          key={b}
                          onClick={() => setBudget(b)}
                          className={`px-3 py-1 rounded-md font-inter text-[10px] font-medium transition-colors ${budget === b ? 'bg-glow-gold text-white shadow-sm' : 'text-glow-muted hover:text-glow-black'}`}
                        >
                          {b === 'All' ? 'All' : b.split(' ')[1] || b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filters */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-inter text-[11px] text-glow-muted">Rating:</span>
                    <div className="flex bg-glow-border/40 p-0.5 rounded-lg border border-glow-border">
                      {RATINGS.map((r) => (
                        <button
                          key={r}
                          onClick={() => setRating(r)}
                          className={`px-2.5 py-1 rounded-md font-inter text-[10px] font-medium transition-colors ${rating === r ? 'bg-glow-gold text-white shadow-sm' : 'text-glow-muted hover:text-glow-black'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex border border-glow-border rounded-xl p-0.5 bg-glow-surface shrink-0">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-glow-gold text-white' : 'text-glow-muted hover:text-glow-black'}`}
                      title="List View"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-glow-gold text-white' : 'text-glow-muted hover:text-glow-black'}`}
                      title="Map View"
                    >
                      <MapIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Content ── */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-10 h-10 rounded-full border-2 border-glow-gold border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="font-inter text-xs text-glow-muted">Fetching matched salons…</p>
                </div>
              ) : filteredSalons.length > 0 ? (
                <div>
                  {viewMode === 'list' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredSalons.map((salon, i) => (
                        <motion.div
                          key={salon.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <SalonCard salon={salon} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <MapComponent
                          userCoords={coords}
                          salons={filteredSalons}
                          onSelectSalon={(s) => setSelectedMapSalon(s)}
                        />
                      </div>

                      <div className="lg:col-span-1 flex flex-col justify-between">
                        {selectedMapSalon ? (
                          <motion.div
                            key={selectedMapSalon.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card-luxury p-5 flex-1 flex flex-col justify-between border border-glow-gold/30 bg-gradient-to-b from-glow-surface to-glow-gold/5"
                          >
                            <div>
                              <div className="relative h-44 rounded-xl overflow-hidden mb-4">
                                <img
                                  src={selectedMapSalon.image}
                                  alt={selectedMapSalon.name}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute top-2.5 right-2.5 bg-glow-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                                  {selectedMapSalon.matchScore}% Match
                                </span>
                              </div>
                              <h3 className="font-playfair text-lg font-semibold text-glow-black mb-1">{selectedMapSalon.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-glow-muted mb-2">
                                <MapPin size={11} className="text-glow-gold" />
                                <span className="truncate">{selectedMapSalon.location}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-3 text-xs">
                                <Star size={11} className="text-glow-gold fill-glow-gold" />
                                <span className="font-semibold text-glow-black">{selectedMapSalon.rating}</span>
                                <span className="text-glow-muted">({selectedMapSalon.reviewCount} reviews)</span>
                                <span className="text-glow-gold font-bold">•</span>
                                <span className="text-glow-muted font-medium">{selectedMapSalon.distance.toFixed(1)} km away</span>
                              </div>

                              <div className="p-3 bg-white/60 border border-glow-gold/20 rounded-xl mb-4">
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-glow-gold uppercase tracking-wider">
                                  <Sparkles size={11} /> Why GlowAI Recommended
                                </div>
                                <p className="font-inter text-xs text-glow-muted leading-relaxed">
                                  {selectedMapSalon.whyRecommended}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-1 mb-4">
                                {selectedMapSalon.specialties.slice(0, 3).map(sp => (
                                  <span key={sp} className="text-[10px] bg-glow-border font-inter px-2 py-0.5 rounded-full text-glow-muted">{sp}</span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-glow-border mt-auto">
                              <span className="font-inter text-xs font-semibold text-glow-black">Starting from ₹{selectedMapSalon.priceFrom}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => window.location.href = `/salons/${selectedMapSalon.id}`}
                                  className="btn-outline-gold py-1.5 px-3 text-xs"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => window.location.href = '/booking'}
                                  className="btn-gold py-1.5 px-3 text-xs"
                                >
                                  Book
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="card-luxury p-8 text-center flex items-center justify-center h-full">
                            <p className="font-playfair text-glow-muted text-sm">Select a marker on the map to review details.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : !loading && rankedSalons.length === 0 && !showLocationError ? (
                <div className="text-center py-20 card-luxury p-8">
                  <p className="font-playfair text-lg text-glow-muted">No salons found matching those filters.</p>
                  <p className="font-inter text-xs text-glow-muted/70 mt-1">Try broadening your search or selecting other filter choices.</p>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  )
}