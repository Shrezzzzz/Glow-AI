import { generateRecommendations } from '../services/recommendationEngine.js'

export const analyzeProfile = async (req, res, next) => {
  try {
    const { faceShape, skinAnalysis, hairAnalysis, profile } = req.body

    if (!profile) {
      return res.status(400).json({ error: 'Profile intent and preferences are required.' })
    }

    // Call recommendation engine
    const recommendations = generateRecommendations(
      { faceShape, skinAnalysis, hairAnalysis },
      profile
    )

    // Generate output layout
    const analysisResponse = {
      faceShape,
      skinAnalysis,
      hairAnalysis,
      styleProfile: profile.styleProfile || "Gender-Neutral Styles",
      confidenceScores: {
        face: faceShape?.confidence || 0,
        skin: skinAnalysis?.confidence || 0,
        hair: hairAnalysis?.confidence || 0
      },
      explanations: {
        face: faceShape?.plainEnglishMeaning || '',
        skin: skinAnalysis?.plainEnglishMeaning || '',
        hair: hairAnalysis?.plainEnglishMeaning || ''
      },
      recommendations,
      treatments:
        profile.skinConcern === 'Dry'       ? ['Hydrating Facial', 'Moisture Boost', 'Oil Infusion Mask'] :
        profile.skinConcern === 'Oily'      ? ['Deep Cleansing Facial', 'Clay Mask', 'Sebum Control'] :
        profile.skinConcern === 'Sensitive' ? ['Calming Facial', 'Aloe Treatment', 'Gentle Exfoliation'] :
                                              ['Balancing Facial', 'Niacinamide Treatment', 'Combination Care'],
      beautyTips: [
        'Use a silk pillowcase to reduce hair breakage overnight',
        'Apply SPF 50 every morning — even on Mumbai monsoon days',
        'Double-cleanse at night to remove humidity and pollution',
      ],
      budgetCategory: profile.budgetRange || 'Premium'
    }

    return res.status(200).json(analysisResponse)
  } catch (err) {
    next(err)
  }
}

export const getRecommendations = async (req, res, next) => {
  try {
    const { analysisData, profileData } = req.body
    
    if (!analysisData || !profileData) {
      return res.status(400).json({ error: 'Analysis details and profile context are required.' })
    }

    const recommendations = generateRecommendations(analysisData, profileData)
    return res.status(200).json(recommendations)
  } catch (err) {
    next(err)
  }
}
