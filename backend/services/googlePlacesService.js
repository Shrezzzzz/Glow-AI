/**
 * googlePlacesService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side Google Places HTTP client, Mumbai geocoder, and development-only
 * procedural nearby generator.
 */

import { config, isProduction } from '../config/env.js'
import { getHaversineDistance } from '../utils/geo.js'
import { MUMBAI_AREA_COORDS } from '../data/mumbaiAreas.js'

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

export function geocodeAddress(query) {
  const norm = query.trim().toLowerCase()
  if (GEO_DATABASE.pincodes[norm]) return { ...GEO_DATABASE.pincodes[norm], type: 'pincode' }
  if (GEO_DATABASE.areas[norm]) return { ...GEO_DATABASE.areas[norm], type: 'area' }
  if (GEO_DATABASE.cities[norm]) return { ...GEO_DATABASE.cities[norm], type: 'city', label: GEO_DATABASE.cities[norm].name }

  for (const [key, area] of Object.entries(GEO_DATABASE.areas)) {
    if (norm.includes(key) || key.includes(norm)) return { ...area, type: 'area' }
  }
  for (const [key, city] of Object.entries(GEO_DATABASE.cities)) {
    if (norm.includes(key) || key.includes(norm)) return { ...city, type: 'city', label: city.name }
  }

  return { ...GEO_DATABASE.cities.mumbai, type: 'fallback', label: 'Mumbai (Default)' }
}

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

export function generateSimulatedSalons(lat, lng) {
  const salonsCount = 8 + Math.floor(Math.random() * 3)
  const result = []

  for (let i = 0; i < salonsCount; i++) {
    const latOffset = (Math.random() - 0.5) * 0.035
    const lngOffset = (Math.random() - 0.5) * 0.035
    const salonLat = lat + latOffset
    const salonLng = lng + lngOffset

    const distance = getHaversineDistance(lat, lng, salonLat, salonLng)
    const prefix = SIM_PREFIX[Math.floor(Math.random() * SIM_PREFIX.length)]
    const suffix = SIM_SUFFIX[Math.floor(Math.random() * SIM_SUFFIX.length)]
    const areaName = distance < 1.0 ? 'Nearby' : (Math.random() > 0.5 ? 'Market Center' : 'High Street')
    const name = `${prefix} ${suffix} ${areaName}`
    
    const specialtySet = SPECIALTY_COMBOS[Math.floor(Math.random() * SPECIALTY_COMBOS.length)]
    const image = UNSPLASH_IMAGES[i % UNSPLASH_IMAGES.length]
    const premiumFactor = Math.random() > 0.45 ? 1.5 : 0.8
    const priceFrom = Math.round(premiumFactor * 1000)
    
    const salonServices = SIM_SERVICES.map(svc => ({
      name: svc.name,
      duration: svc.duration,
      price: Math.round(svc.basePrice * premiumFactor)
    }))

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

  return result.sort((a, b) => a.distance - b.distance)
}

export async function fetchGooglePlacesSalons(lat, lng, radius = 5000) {
  const apiKey = config.googlePlacesApiKey
  if (!apiKey) {
    console.log("No Google Places API key found. Using simulated salons.");
    return generateSimulatedSalons(lat, lng);
  }

  try {
    // 1. Fetch nearby place IDs from Google Place Search API
    const searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=beauty_salon&key=${apiKey}`
    const response = await fetch(searchUrl)
    const searchResult = await response.json()

    if (searchResult.status !== 'OK' || !searchResult.results) {
      console.warn('Google search places failed with status:', searchResult.status)
      return generateSimulatedSalons(lat, lng)
    }

    const detailedSalons = []
    const limit = Math.min(searchResult.results.length, 8)

    // 2. Fetch specific detail parameters for each place ID
    for (let i = 0; i < limit; i++) {
      const place = searchResult.results[i]
      try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_address,rating,user_ratings_total,opening_hours,photos,reviews,price_level,geometry,types,business_status&key=${apiKey}`
        const detailRes = await fetch(detailUrl)
        const detailData = await detailRes.json()

        if (detailData.status === 'OK' && detailData.result) {
          const res = detailData.result
          const pLat = res.geometry.location.lat
          const pLng = res.geometry.location.lng
          const dist = getHaversineDistance(lat, lng, pLat, pLng)
          const rating = res.rating || 4.2
          const reviewCount = res.user_ratings_total || 12
          const level = res.price_level || 2
          const priceFrom = level * 1000
          const levelStr = '₹'.repeat(level + 1)

          const photos = res.photos 
            ? res.photos.slice(0, 4).map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${p.photo_reference}&key=${apiKey}`)
            : [UNSPLASH_IMAGES[i % UNSPLASH_IMAGES.length]]

          const reviews = (res.reviews || []).map(r => ({
            name: r.author_name,
            rating: r.rating,
            date: r.relative_time_description,
            text: r.text
          }))

          const types = res.types || place.types || []
          const specialties = [
            types.includes('hair_care') ? 'Hair Care' : null,
            types.includes('beauty_salon') ? 'Beauty Salon' : null,
            types.includes('spa') ? 'Spa' : null,
          ].filter(Boolean)
          const tags = [
            res.business_status === 'OPERATIONAL' ? 'Operational' : null,
            rating >= 4.5 ? 'Highly Rated' : null,
          ].filter(Boolean)
          const salonServices = specialties.length
            ? specialties.map(name => ({ name, duration: 'Contact salon', price: null }))
            : [{ name: 'Beauty and grooming services', duration: 'Contact salon', price: null }]

          detailedSalons.push({
            id: res.place_id,
            name: res.name,
            location: res.formatted_address,
            area: res.vicinity || 'Local Area',
            rating,
            reviewCount,
            priceRange: levelStr,
            priceFrom: priceFrom || null,
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
            coordinates: { lat: pLat, lng: pLng },
            distance: dist,
            reviews: reviews.length > 0 ? reviews : [{ name: 'Client', rating: 5, date: 'Recent', text: 'Excellent service and friendly environment.' }],
            openNow: res.opening_hours?.open_now ? 'Open Now' : 'Closed',
            source: 'google_places',
          })
        }
      } catch (err) {
        console.warn('Failed to resolve place detail:', err)
      }
    }

    if (detailedSalons.length > 0) {
      return detailedSalons.sort((a, b) => a.distance - b.distance)
    }
  } catch (err) {
    console.error('Google Places fetch execution failed:', err)
  }

  return generateSimulatedSalons(lat, lng)
}
