import { config, isProduction } from '../config/env.js'
import { fetchGooglePlacesSalons, geocodeAddress } from '../services/googlePlacesService.js'
import { rankSalons, calculateMatchScore } from '../services/salonMatchingEngine.js'
import { salons as staticSalons } from '../data/salons.js'

export const getNearbySalons = async (req, res, next) => {
  try {
    const { 
      lat, 
      lng, 
      radius = 5000, 
      faceShape, 
      hairType, 
      skinTone, 
      budgetRange, 
      occasion, 
      styleIntent 
    } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and Longitude parameters are required.' })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    const rad = parseInt(radius)

    

    // Fetch salons from Places SDK / Simulator
    const salonsData = await fetchGooglePlacesSalons(latitude, longitude, rad)

    // Format analysis & profile context for ranking
    const analysisData = {
      faceShape: { technicalClassification: faceShape },
      hairAnalysis: { technicalClassification: hairType },
      skinAnalysis: { technicalClassification: skinTone }
    }
    const profileData = { budgetRange, occasion, styleIntent }

    // Rank salons using match engine
    const ranked = rankSalons(salonsData, analysisData, profileData)

    return res.status(200).json(ranked)
  } catch (err) {
    next(err)
  }
}

export const getSalonById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { faceShape, hairType, skinTone, budgetRange, occasion, styleIntent } = req.query

    // 1. Check static database
    let salon = staticSalons.find(s => String(s.id) === String(id))

    // 2. If not found, simulate a salon profile with that ID
    if (!salon) {
      if (isProduction) {
        return res.status(404).json({ error: 'Salon not found.' })
      }

      // Find in temporary cache or generate a dynamic one
      const dummyId = parseInt(id) || 100
      const centerLat = 19.0760
      const centerLng = 72.8777
      const specialties = ['Haircut', 'Skin Treatment', 'Balayage']
      
      salon = {
        id: dummyId,
        name: `Concierge Salon Studio ${dummyId}`,
        location: 'High Street, Local Area',
        area: 'Local Area',
        rating: 4.7,
        reviewCount: 124,
        priceRange: '₹₹₹',
        priceFrom: 1800,
        image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=80',
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=900&q=80'
        ],
        verified: true,
        specialties,
        description: 'A premium salon experience offering personalized hairstyles and organic facial treatments.',
        services: [
          { name: 'Signature Haircut', duration: '60 min', price: 1800 },
          { name: 'Balayage Color', duration: '3 hrs', price: 6500 },
          { name: 'Organic Glow Facial', duration: '75 min', price: 2500 }
        ],
        slots: ['10:00 AM', '12:00 PM', '2:30 PM', '4:30 PM', '6:30 PM'],
        tags: ['Concierge Selection'],
        topStylist: 'Master Stylist',
        badge: 'Verified',
        coordinates: { lat: centerLat, lng: centerLng },
        distance: 2.1,
        openNow: 'Open Now',
        reviews: [
          { name: 'Sneha R.', rating: 5, date: 'Recent', text: 'Beautiful experience and skilled staff.' }
        ]
      }
    }

    // Calculate Match Score dynamically if styling context is supplied
    let matchScore = null
    let whyRecommended = ''
    if (faceShape || hairType || skinTone) {
      const analysisData = {
        faceShape: { technicalClassification: faceShape },
        hairAnalysis: { technicalClassification: hairType },
        skinAnalysis: { technicalClassification: skinTone }
      }
      const profileData = { budgetRange, occasion, styleIntent }
      const match = calculateMatchScore(salon, analysisData, profileData, [])
      matchScore = match.score
      whyRecommended = match.reasoning
    }

    return res.status(200).json({
      ...salon,
      matchScore: matchScore || salon.matchScore,
      whyRecommended: whyRecommended || salon.whyRecommended
    })
  } catch (err) {
    next(err)
  }
}
