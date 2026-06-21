/**
 * recommendationEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Decoupled Character recommendation engine running on Node.js backend.
 */

import { characters } from '../data/characters.js'

function normalise(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '')
}

function scoreCharacter(character, faceShape, hairType, styleProfile, occasion, inspirations, styleIntent) {
  let score = 50 // Base score
  let matchReasons = []

  // 1. Style Profile Match
  if (!character.styleProfiles.includes(styleProfile) && styleProfile !== 'Custom Mix') {
    return { score: 0, reasons: [] }
  }

  // 2. Face Shape Match
  if (faceShape && character.faceShapes.includes(faceShape)) {
    score += 15
    matchReasons.push(`complements your ${faceShape.toLowerCase()} face shape`)
  }

  // 3. Hair Type Match
  if (hairType && character.hairTypes.includes(hairType)) {
    score += 10
    matchReasons.push('suits your natural hair texture')
  }

  // 4. Occasion Match
  if (occasion && character.occasions.includes(occasion)) {
    score += 15
    matchReasons.push(`is perfect for a ${occasion.toLowerCase()}`)
  } else if (occasion) {
    score -= 5
  }

  // 5. Inspiration Match
  const normInspirations = (inspirations || []).map(normalise)
  const isDirectInspiration = normInspirations.some(insp => 
    normalise(character.name).includes(insp) || 
    normalise(character.source).includes(insp) ||
    character.aesthetics.some(a => normalise(a).includes(insp))
  )

  if (isDirectInspiration) {
    score += 15
    matchReasons.push('matches your selected inspirations')
  }

  // 6. Style Intent Semantic Match
  if (styleIntent) {
    const intentWords = normalise(styleIntent).split(/\s+/)
    const targetText = [
      character.name, 
      character.source, 
      ...character.aesthetics, 
      character.stylingNotes
    ].map(normalise).join(' ')

    let intentHits = 0
    intentWords.forEach(word => {
      if (word.length > 3 && targetText.includes(word)) {
        intentHits++
      }
    })

    if (intentHits > 0) {
      score += (intentHits * 5)
      matchReasons.push(`aligns perfectly with your goal to create a "${styleIntent}" look`)
    }
  }

  return { 
    score: Math.min(Math.max(score, 10), 99), 
    reasons: matchReasons 
  }
}

export function generateRecommendations(analysisData, profileData) {
  const { faceShape, skinAnalysis, hairAnalysis } = analysisData || {}
  const { styleProfile = "Gender-Neutral Styles", occasion = "", inspirations = [], styleIntent = '', budgetRange = '' } = profileData || {}

  const faceConfidence = faceShape?.confidence ?? 0
  const skinConfidence = skinAnalysis?.confidence ?? 0
  const faceClassification = faceShape?.technicalClassification
  const skinClassification = skinAnalysis?.technicalClassification
  const hairClassification = hairAnalysis?.technicalClassification

  if (
    !faceShape || 
    !faceClassification || 
    !skinAnalysis || 
    !skinClassification || 
    faceConfidence < 60 || 
    skinConfidence < 60
  ) {
    return {
      error: "Analysis could not be completed accurately. Please retake your selfie.",
      characterLooks: [],
      recommendedHairstyles: [],
      makeupDirection: "",
      overallStyleDirection: "",
      stylingImplications: ""
    }
  }

  let scoredCharacters = characters.map(char => {
    const { score, reasons } = scoreCharacter(
      char, 
      faceClassification, 
      hairClassification, 
      styleProfile, 
      occasion, 
      inspirations, 
      styleIntent
    )
    return { ...char, matchScore: score, matchReasons: reasons }
  })

  scoredCharacters = scoredCharacters.filter(c => c.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore)
  const topCharacters = scoredCharacters.slice(0, 3).map(char => {
    let whyItFits = `Your face shape, hair texture, and desire for a stylish look align well with ${char.name}'s aesthetic.`
    if (char.matchReasons.length > 0) {
      const uniqueReasons = [...new Set(char.matchReasons)]
      whyItFits = `This look ${uniqueReasons.join(', and ')}.`
    }

    return {
      characterName: char.name,
      source: char.source,
      matchScore: char.matchScore,
      whyItFits: whyItFits,
      stylingNotes: char.stylingNotes,
      hairstyles: char.hairstyles
    }
  })

  let recommendedHairstyles = []
  topCharacters.forEach(c => {
    recommendedHairstyles.push(...c.hairstyles)
  })
  recommendedHairstyles = [...new Set(recommendedHairstyles)].slice(0, 4)

  if (recommendedHairstyles.length === 0) {
    recommendedHairstyles = ['Soft Layers', 'Textured Crop', 'Classic Taper']
  }

  const tone = skinAnalysis?.technicalClassification || 'your skin tone'
  let makeupDirection = `A glowing, balanced base tailored for ${tone.toLowerCase()}.`
  
  if (styleProfile === "Women's Styles" || styleProfile === "Custom Mix") {
    if (occasion === 'Wedding' || styleIntent.toLowerCase().includes('glam')) {
      makeupDirection = `Elevated glam makeup highlighting ${tone.toLowerCase()} with defined eyes and a flawless, long-lasting base.`
    } else {
      makeupDirection = `Fresh, luminous "glass skin" makeup complementing ${tone.toLowerCase()} with subtle lip tints.`
    }
  } else {
    makeupDirection = `Immaculate skin prep and subtle grooming to enhance ${tone.toLowerCase()}, ensuring a sharp, clean finish.`
  }

  let overallStyleDirection = `Based on your intent "${styleIntent || 'a fresh new look'}", we recommend leaning into the ${topCharacters[0]?.characterName || 'Modern'} aesthetic for your ${occasion || 'upcoming occasion'}. `
  
  if (budgetRange.includes('10,000+')) {
    overallStyleDirection += 'With a premium budget, prioritize luxury salon experiences and high-end treatments to achieve this look flawlessly.'
  } else if (budgetRange.includes('Under ₹1,000')) {
    overallStyleDirection += 'To stay within budget, focus on impactful foundational cuts and smart at-home styling techniques.'
  } else {
    overallStyleDirection += 'We will match you with highly-rated mid-tier salons to achieve this look optimally within your budget.'
  }

  return {
    characterLooks: topCharacters,
    recommendedHairstyles,
    makeupDirection,
    overallStyleDirection,
    stylingImplications: `Tailored for a ${faceClassification || 'balanced'} face shape and ${occasion || 'everyday wear'}.`
  }
}
