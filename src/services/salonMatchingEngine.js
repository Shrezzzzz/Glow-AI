/**
 * salonMatchingEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Match scoring engine for salons based on physical analysis, styling intent,
 * budget, distance, ratings, and specialties.
 */

/**
 * Calculates a match score (0-100) for a salon against user profile and recommendations.
 */
export function calculateMatchScore(salon, analysisData, profileData, recommendedLooks = []) {
  const { faceShape, skinAnalysis, hairAnalysis } = analysisData || {}
  const { styleProfile, occasion, styleIntent = '', budgetRange = '₹1,500–₹3,000' } = profileData || {}

  let styleScore = 10 // Base style match
  let serviceScore = 10 // Base service match
  let budgetScore = 15 // Base budget match
  let distanceScore = 10 // Base distance match
  let ratingScore = 8 // Base rating match
  let popularityScore = 3 // Base popularity match

  const matchReasons = []
  const specialties = (salon.specialties || []).map(s => s.toLowerCase())
  const tags = (salon.tags || []).map(t => t.toLowerCase())
  const salonText = `${salon.name} ${salon.description || ''} ${specialties.join(' ')} ${tags.join(' ')}`.toLowerCase()

  // 1. Style Match (Max 25)
  // Check if salon specializes in the recommended characters' styles/aesthetics or user occasion/intent
  let styleHits = 0
  if (occasion) {
    const normOccasion = occasion.toLowerCase()
    if (specialties.includes(normOccasion) || tags.includes(normOccasion) || salonText.includes(normOccasion)) {
      styleHits += 2
      matchReasons.push(`specializes in ${occasion.toLowerCase()} styling`)
    }
  }

  // Match with recommended character aesthetics
  recommendedLooks.forEach(look => {
    const charName = look.characterName.toLowerCase()
    const source = look.source.toLowerCase()
    if (salonText.includes(charName) || salonText.includes(source)) {
      styleHits += 2
    }
  })

  // Match style intent keywords
  if (styleIntent) {
    const intentWords = styleIntent.toLowerCase().split(/\s+/)
    intentWords.forEach(word => {
      if (word.length > 3 && salonText.includes(word)) {
        styleHits += 1.5
      }
    })
  }

  styleScore = Math.min(styleScore + styleHits * 4, 25)
  if (styleHits >= 2 && !matchReasons.some(r => r.includes('specializes'))) {
    matchReasons.push(`aligns well with your desired "${styleIntent || 'concierge'}" look`)
  }

  // 2. Service Match (Max 25)
  // Check if salon services align with recommended hairstyles or makeup instructions
  const recHairstyles = analysisData?.recommendations?.recommendedHairstyles || []
  const makeupDir = (analysisData?.recommendations?.makeupDirection || '').toLowerCase()
  const salonServices = (salon.services || []).map(s => s.name.toLowerCase())

  let serviceHits = 0
  recHairstyles.forEach(style => {
    const styleLower = style.toLowerCase()
    // Look for matching words in salon service menu
    const matchedService = salonServices.find(s => s.includes(styleLower) || styleLower.includes(s) || (s.includes('haircut') && styleLower.includes('cut')))
    if (matchedService) {
      serviceHits++
    }
  })

  if (makeupDir.includes('makeup') || styleIntent.toLowerCase().includes('makeup')) {
    const offersMakeup = salonServices.some(s => s.includes('makeup') || s.includes('makeover')) || specialties.includes('bridal')
    if (offersMakeup) {
      serviceHits += 1.5
    }
  }

  serviceScore = Math.min(serviceScore + serviceHits * 5, 25)
  if (serviceHits > 0) {
    matchReasons.push(`offers services directly matching your recommended styling direction`)
  }

  // 3. Budget Match (Max 20)
  // Compare user budget bracket with salon priceFrom
  const minPrice = salon.priceFrom || 1000
  if (budgetRange.includes('Under ₹1,000')) {
    if (minPrice <= 1200) {
      budgetScore = 20
      matchReasons.push(`is highly budget-friendly (starts at ₹${minPrice.toLocaleString()})`)
    } else if (minPrice <= 1800) {
      budgetScore = 14
    } else {
      budgetScore = 8
    }
  } else if (budgetRange.includes('₹1,500–₹3,000')) {
    if (minPrice >= 1000 && minPrice <= 3200) {
      budgetScore = 20
      matchReasons.push(`fits perfectly in your ₹1,500–₹3,000 budget range`)
    } else if (minPrice < 1000) {
      budgetScore = 18 // Cheaper than requested is good but maybe not the premium they wanted
    } else {
      budgetScore = 10
    }
  } else if (budgetRange.includes('₹3,000–₹5,000') || budgetRange.includes('₹5,000+')) {
    if (minPrice >= 2000) {
      budgetScore = 20
      matchReasons.push(`delivers the premium experience matching your budget`)
    } else if (minPrice >= 1200) {
      budgetScore = 15
    } else {
      budgetScore = 10
    }
  }

  // 4. Distance Score (Max 15)
  const dist = salon.distance
  if (typeof dist === 'number' && !isNaN(dist)) {
    if (dist <= 1.5) {
      distanceScore = 15
      matchReasons.push(`is exceptionally close to you (${dist.toFixed(1)} km)`)
    } else if (dist <= 3.5) {
      distanceScore = 12
      matchReasons.push(`is just a short drive away (${dist.toFixed(1)} km)`)
    } else if (dist <= 7.0) {
      distanceScore = 9
    } else if (dist <= 15.0) {
      distanceScore = 6
    } else {
      distanceScore = 3
    }
  }

  // 5. Rating Score (Max 10)
  const rating = salon.rating || 4.0
  if (rating >= 4.8) {
    ratingScore = 10
  } else if (rating >= 4.5) {
    ratingScore = 8
  } else if (rating >= 4.0) {
    ratingScore = 6
  } else {
    ratingScore = 4
  }

  // 6. Popularity Score (Max 5)
  const reviews = salon.reviewCount || 0
  if (reviews >= 200) {
    popularityScore = 5
  } else if (reviews >= 100) {
    popularityScore = 4
  } else if (reviews >= 50) {
    popularityScore = 3
  } else {
    popularityScore = 2
  }

  const overallScore = Math.round(styleScore + serviceScore + budgetScore + distanceScore + ratingScore + popularityScore)
  const finalScore = Math.min(Math.max(overallScore, 40), 99) // Limit score between 40% and 99%

  // Build a summary reasoning string
  let reasonString = ''
  if (matchReasons.length > 0) {
    const uniqueReasons = [...new Set(matchReasons)]
    reasonString = `GlowAI matches this salon because it ${uniqueReasons.slice(0, 3).join(', ')}.`
  } else {
    reasonString = `Recommended salon in ${salon.location} featuring professional styling matching your profile.`
  }

  return {
    score: finalScore,
    reasoning: reasonString
  }
}

/**
 * Ranks a list of salons based on match scores.
 */
export function rankSalons(salonsList, analysisData, profileData) {
  const recLooks = analysisData?.recommendations?.characterLooks || []
  
  return salonsList
    .map(salon => {
      const { score, reasoning } = calculateMatchScore(salon, analysisData, profileData, recLooks)
      return {
        ...salon,
        matchScore: score,
        whyRecommended: reasoning
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}
