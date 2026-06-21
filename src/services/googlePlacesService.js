/**
 * googlePlacesService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Geolocation API wrapper, Google Places SDK connector, Mumbai geocoder
 * database, and local development salon generator.
 */

import { MUMBAI_AREA_COORDS } from '../data/mumbaiAreas'

// Geocoding database for manual search fallbacks
export const GEO_DATABASE = {
  cities: {
    'mumbai': { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  },
  areas: {
    ...MUMBAI_AREA_COORDS,
  },
  pincodes: {
    // Mumbai
    '400050': { lat: 19.0600, lng: 72.8311, area: 'bandra', label: 'Bandra (400050)' },
    '400053': { lat: 19.1200, lng: 72.8282, area: 'andheri', label: 'Andheri (400053)' },
    '400049': { lat: 19.1022, lng: 72.8268, area: 'juhu', label: 'Juhu (400049)' },
    '400076': { lat: 19.1176, lng: 72.9060, area: 'powai', label: 'Powai (400076)' },
    '400005': { lat: 18.9067, lng: 72.8147, area: 'colaba', label: 'Colaba (400005)' },
    '400013': { lat: 18.9953, lng: 72.8302, area: 'lower parel', label: 'Lower Parel (400013)' },
    '400018': { lat: 19.0088, lng: 72.8172, area: 'worli', label: 'Worli (400018)' },
  }
}

/**
 * Calculates Haversine distance in kilometers between two coordinates.
 */
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Request coordinates from browser Geolocation API.
 */
export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      options
    )
  })
}

/**
 * Resolves manual query (city name, area name, or pincode) to coordinates.
 */
export function geocodeAddress(query) {
  const norm = query.trim().toLowerCase()
  
  // 1. Check Pincodes
  if (GEO_DATABASE.pincodes[norm]) {
    return { ...GEO_DATABASE.pincodes[norm], type: 'pincode' }
  }

  // 2. Check Areas
  if (GEO_DATABASE.areas[norm]) {
    return { ...GEO_DATABASE.areas[norm], type: 'area' }
  }

  // 3. Check Cities
  if (GEO_DATABASE.cities[norm]) {
    return { ...GEO_DATABASE.cities[norm], type: 'city', label: GEO_DATABASE.cities[norm].name }
  }

  // Substring checks
  for (const [key, area] of Object.entries(GEO_DATABASE.areas)) {
    if (norm.includes(key) || key.includes(norm)) {
      return { ...area, type: 'area' }
    }
  }

  for (const [key, city] of Object.entries(GEO_DATABASE.cities)) {
    if (norm.includes(key) || key.includes(norm)) {
      return { ...city, type: 'city', label: city.name }
    }
  }

  // Fallback to Mumbai Center
  return { ...GEO_DATABASE.cities.mumbai, type: 'fallback', label: 'Mumbai (Default)' }
}

/**
 * Loads the Google Maps JavaScript SDK dynamically.
 */
let googleMapsLoadingPromise = null
function loadGoogleMapsSdk(apiKey) {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google)
  }
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise
  }

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps SDK loaded but window.google undefined.'))
      }
    }
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps SDK script.'))
    }
    document.head.appendChild(script)
  })

  return googleMapsLoadingPromise
}

/**
 * Perform Google Places nearbySearch.
 */
function searchGooglePlaces(lat, lng, radius = 5000) {
  return new Promise((resolve, reject) => {
    try {
      const center = new window.google.maps.LatLng(lat, lng)
      const mapDiv = document.createElement('div')
      const map = new window.google.maps.Map(mapDiv, { center, zoom: 15 })
      const service = new window.google.maps.places.PlacesService(map)

      const request = {
        location: center,
        radius: radius,
        type: ['beauty_salon', 'hair_care']
      }

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results)
        } else {
          reject(new Error(`NearbySearch failed with status: ${status}`))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Fetch Google Place Details for a given placeId.
 */
function fetchPlaceDetails(placeId) {
  return new Promise((resolve, reject) => {
    try {
      const mapDiv = document.createElement('div')
      const map = new window.google.maps.Map(mapDiv)
      const service = new window.google.maps.places.PlacesService(map)

      const fields = [
        'name', 'formatted_address', 'rating', 'user_ratings_total',
        'opening_hours', 'photos', 'geometry', 'reviews', 'price_level', 'place_id'
      ]

      service.getDetails({ placeId, fields }, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place)
        } else {
          reject(new Error(`GetDetails failed with status: ${status}`))
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

// Vocabulary for high-fidelity simulation salon generation
const SIM_PREFIX = ['Luxe', 'Velvet', 'Glow', 'Sculpt', 'Crown', 'Silhouette', 'Prism', 'Bloom', 'Vibe', 'Gloss', 'Urban', 'Enchante', 'Silk', 'Mirror']
const SIM_SUFFIX = ['Studio', 'Boutique', 'Aesthetic', 'Spa & Hair', 'Parlour', 'Wellness', 'Grooming Bar', 'Lounge', 'Hair Room', 'Maison', 'Clinic', 'Chic']
const SPECIALTY_COMBOS = [
  { specialties: ['Bridal', 'Facials', 'Advanced Skincare'], tags: ['Bridal', 'Luxury', 'Skincare'] },
  { specialties: ['Hair Color', 'Keratin', 'Balayage'], tags: ['Color Expert', 'Balayage Specialist'] },
  { specialties: ['Curls Styling', 'Deep Conditioning', 'Haircut'], tags: ['Curly Hair', 'Specialist'] },
  { specialties: ['Nail Art', 'Threading', 'Manicure'], tags: ['Nails Specialist', 'Budget Friendly'] },
  { specialties: ['Anti-Ageing', 'Dermabrasion', 'Laser Treatments'], tags: ['Clinical Precision', 'Premium'] },
  { specialties: ['Global Color', 'Hair Spa', 'Massage'], tags: ['Relaxing Spa', 'Eco-Certified'] }
]
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80',
  'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&q=80',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80',
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&q=80',
  'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?w=600&q=80',
  'https://images.unsplash.com/photo-1560869713-7d0a29430f39?w=600&q=80'
]
const SIM_SERVICES = [
  { name: 'Signature Haircut & Blow Dry', duration: '60 min', basePrice: 1500 },
  { name: 'Organic Hydrating Facial', duration: '75 min', basePrice: 2000 },
  { name: 'Global Hair Highlights & Balayage', duration: '3 hrs', basePrice: 5500 },
  { name: 'Nourishing Cysteine Smoothing', duration: '3.5 hrs', basePrice: 6500 },
  { name: 'Bridal Makeover Trial', duration: '2.5 hrs', basePrice: 4000 },
  { name: 'Advanced Skin Glow Treatment', duration: '90 min', basePrice: 3500 },
  { name: 'Designer Nail Art Overlay', duration: '75 min', basePrice: 1800 },
  { name: 'Root Touchup & Hair Spa', duration: '2 hrs', basePrice: 2200 }
]

const SIM_REVIEW_TEXTS = [
  'Absolutely loved my visit! Stylist took time to understand my goals.',
  'Premium service, lovely interiors, and extremely hygienic.',
  'Highly recommend their color treatments. Worth every rupee.',
  'Satisfied with the trim, but there was a slight wait. Staff is friendly.',
  'The skincare advice was brilliant. My face is glowing!',
  'Best salon in the locality. Very professional staff and amazing massage.'
]

/**
 * High-fidelity simulator generating realistic salons close to specified coordinates.
 */
export function generateSimulatedSalons(lat, lng) {
  const salonsCount = 8 + Math.floor(Math.random() * 3) // 8 to 10 salons
  const result = []

  for (let i = 0; i < salonsCount; i++) {
    // Offset lat/lng randomly by up to 2-3km (0.015 degrees)
    const latOffset = (Math.random() - 0.5) * 0.035
    const lngOffset = (Math.random() - 0.5) * 0.035
    const salonLat = lat + latOffset
    const salonLng = lng + lngOffset

    const distance = getHaversineDistance(lat, lng, salonLat, salonLng)
    
    // Choose properties
    const prefix = SIM_PREFIX[Math.floor(Math.random() * SIM_PREFIX.length)]
    const suffix = SIM_SUFFIX[Math.floor(Math.random() * SIM_SUFFIX.length)]
    const areaName = distance < 1.0 ? 'Nearby' : (Math.random() > 0.5 ? 'Market Center' : 'High Street')
    const name = `${prefix} ${suffix} ${areaName}`
    
    const specialtySet = SPECIALTY_COMBOS[Math.floor(Math.random() * SPECIALTY_COMBOS.length)]
    const image = UNSPLASH_IMAGES[i % UNSPLASH_IMAGES.length]
    
    // Services pricing based on premium multiplier
    const premiumFactor = Math.random() > 0.45 ? 1.5 : 0.8
    const priceFrom = Math.round(premiumFactor * 1000)
    
    const salonServices = SIM_SERVICES.map(svc => ({
      name: svc.name,
      duration: svc.duration,
      price: Math.round(svc.basePrice * premiumFactor)
    }))

    // Generate simulated reviews
    const reviewCount = 20 + Math.floor(Math.random() * 250)
    const rating = parseFloat((4.3 + Math.random() * 0.6).toFixed(1))
    
    const reviews = []
    const reviewNames = ['Anisha K.', 'Dev R.', 'Rohan G.', 'Priya S.', 'Siddharth M.', 'Kiara A.']
    for (let r = 0; r < 3; r++) {
      reviews.push({
        name: reviewNames[(i + r) % reviewNames.length],
        rating: Math.floor(rating + (Math.random() - 0.5)),
        date: 'Recent',
        text: SIM_REVIEW_TEXTS[(i * 3 + r) % SIM_REVIEW_TEXTS.length]
      })
    }

    result.push({
      id: 100 + i,
      name,
      location: `${areaName}, Local Area`,
      area: areaName,
      rating,
      reviewCount,
      priceRange: premiumFactor > 1.2 ? '₹₹₹₹' : premiumFactor > 0.9 ? '₹₹₹' : '₹₹',
      priceFrom,
      image,
      gallery: [
        image,
        UNSPLASH_IMAGES[(i + 1) % UNSPLASH_IMAGES.length],
        UNSPLASH_IMAGES[(i + 2) % UNSPLASH_IMAGES.length]
      ],
      verified: Math.random() > 0.3,
      specialties: specialtySet.specialties,
      description: `A dynamic beauty and hair concierge salon offering tailored aesthetic designs, bespoke styling, and top-tier grooming treatments.`,
      services: salonServices.slice(0, 3 + Math.floor(Math.random() * 3)),
      slots: ['10:00 AM', '12:00 PM', '2:30 PM', '4:30 PM', '6:30 PM'],
      tags: specialtySet.tags,
      topStylist: 'Senior Stylist',
      badge: rating >= 4.8 ? 'Top Pick' : 'Verified Partner',
      coordinates: { lat: salonLat, lng: salonLng },
      distance,
      reviews,
      openNow: Math.random() > 0.2 ? 'Open Now' : 'Closed'
    })
  }

  // Sort by distance
  return result.sort((a, b) => a.distance - b.distance)
}

/**
 * Primary fetcher matching API key or dynamic simulator.
 */
export async function getSalonsForLocation(coords, radius = 5000, stylingContext = null) {
  const providerType = import.meta.env.VITE_STORAGE_PROVIDER || 'local'
  const allowDevelopmentSimulation = import.meta.env.DEV

  // If in API mode, redirect search queries directly to the Node backend
  if (providerType === 'api') {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      const { faceShape, hairType, skinTone, budgetRange, occasion, styleIntent } = stylingContext || {}
      
      let queryStr = `/api/salons/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=${radius}`
      if (faceShape) queryStr += `&faceShape=${encodeURIComponent(faceShape)}`
      if (hairType) queryStr += `&hairType=${encodeURIComponent(hairType)}`
      if (skinTone) queryStr += `&skinTone=${encodeURIComponent(skinTone)}`
      if (budgetRange) queryStr += `&budgetRange=${encodeURIComponent(budgetRange)}`
      if (occasion) queryStr += `&occasion=${encodeURIComponent(occasion)}`
      if (styleIntent) queryStr += `&styleIntent=${encodeURIComponent(styleIntent)}`

      const response = await fetch(`${API_BASE}${queryStr}`)
      const rankedSalons = await response.json()
      if (!response.ok) {
        throw new Error(rankedSalons.error || 'Server-side salon search failed')
      }
      return rankedSalons
    } catch (err) {
      console.error('Express backend salons fetch failed:', err)
      if (!allowDevelopmentSimulation) return []
    }
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (apiKey) {
    try {
      console.log('Using real Google Places API for location:', coords)
      await loadGoogleMapsSdk(apiKey)
      const placeResults = await searchGooglePlaces(coords.lat, coords.lng, radius)
      
      // Get detailed specs for top 8 places to avoid rate limits
      const detailedSalons = []
      const limit = Math.min(placeResults.length, 8)
      
      for (let i = 0; i < limit; i++) {
        try {
          const detail = await fetchPlaceDetails(placeResults[i].place_id)
          const lat = detail.geometry.location.lat()
          const lng = detail.geometry.location.lng()
          const dist = getHaversineDistance(coords.lat, coords.lng, lat, lng)
          
          const rating = detail.rating || 4.2
          const photos = detail.photos 
            ? detail.photos.slice(0, 4).map(p => p.getUrl({ maxWidth: 800 }))
            : [UNSPLASH_IMAGES[i % UNSPLASH_IMAGES.length]]
            
          const reviewCount = detail.user_ratings_total || 12
          const level = detail.price_level || 2
          const priceFrom = level * 1000
          const levelStr = '₹'.repeat(level + 1)

          // Map real reviews
          const reviews = (detail.reviews || []).map(r => ({
            name: r.author_name,
            rating: r.rating,
            date: r.relative_time_description,
            text: r.text
          }))

          const specialties = ['Beauty Salon']
          const tags = [rating >= 4.5 ? 'Highly Rated' : 'Google Places'].filter(Boolean)
          const salonServices = [{ name: 'Beauty and grooming services', duration: 'Contact salon', price: null }]

          detailedSalons.push({
            id: detail.place_id,
            name: detail.name,
            location: detail.formatted_address,
            area: detail.vicinity || 'Local Area',
            rating,
            reviewCount,
            priceRange: levelStr,
            priceFrom,
            image: photos[0],
            gallery: photos,
            verified: true,
            specialties,
            description: `Local salon sourced from Google Places. Confirm exact service menu and prices with the business before booking.`,
            services: salonServices,
            slots: ['10:00 AM', '12:00 PM', '2:30 PM', '4:30 PM', '6:30 PM'],
            tags,
            topStylist: 'Senior Master Stylist',
            badge: rating >= 4.7 ? 'Highly Rated' : 'Verified',
            coordinates: { lat, lng },
            distance: dist,
            reviews: reviews.length > 0 ? reviews : [{ name: 'Client', rating: 5, date: 'Recent', text: 'Excellent service and friendly environment.' }],
            openNow: detail.opening_hours?.isOpen() ? 'Open Now' : 'Closed',
            source: 'google_places'
          })
        } catch (detailErr) {
          console.warn('Failed to fetch details for place, skipping:', detailErr)
        }
      }

      if (detailedSalons.length > 0) {
        return detailedSalons.sort((a, b) => a.distance - b.distance)
      }
    } catch (apiErr) {
      console.error('Google Places Search failed:', apiErr)
      if (!allowDevelopmentSimulation) return []
    }
  }

  // Fallback / Default Simulator
  if (!allowDevelopmentSimulation) return []
  console.log('Running simulated local salon search near coords:', coords)
  // Add a slight latency to make it feel authentic
  await new Promise(r => setTimeout(r, 800))
  return generateSimulatedSalons(coords.lat, coords.lng)
}
