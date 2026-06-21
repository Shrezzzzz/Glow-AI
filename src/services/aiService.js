import { detectLandmarks, classifyFaceShape } from './faceAnalysisService'
import { analyzeSkin } from './skinAnalysisService'
import { generateRecommendations } from './recommendationEngine'
import { validateLandmarkReadiness } from './imageValidation'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))
const ANALYSIS_TIMEOUT_MS = 15_000

const withTimeout = (promise, label, timeoutMs = ANALYSIS_TIMEOUT_MS) => {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

// Helper to load an image from a blob URL
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function createFallbackFaceShape(reason) {
  return {
    technicalClassification: 'Oval',
    confidence: 52,
    plainEnglishMeaning: 'Fallback face-shape estimate used so your analysis can continue.',
    whyItWasDetected: `Fallback analysis used because ${reason}.`,
    fallbackUsed: true,
  }
}

function createFallbackSkinAnalysis(reason) {
  return {
    technicalClassification: 'Medium Neutral',
    tone: 'Medium',
    undertone: 'Neutral',
    confidence: 52,
    plainEnglishMeaning: 'Fallback skin-tone estimate used so your recommendations can continue.',
    whyItWasDetected: `Fallback analysis used because ${reason}.`,
    fallbackUsed: true,
  }
}

function analyzeHair(imgEl, landmarks) {
  if (!imgEl || !landmarks) {
    return {
      technicalClassification: null,
      confidence: 0,
      plainEnglishMeaning: '',
      whyItWasDetected: 'Hair analysis needs a clearer image with detectable facial landmarks.',
    }
  }

  return {
    technicalClassification: 'Natural Texture',
    confidence: 55,
    plainEnglishMeaning: 'Your hair appears suitable for versatile, natural styling recommendations.',
    whyItWasDetected: 'Local fallback hair analysis used because detailed hair segmentation is not available in this build.',
    fallbackUsed: true,
  }
}

function buildFinalAnalysis({ faceShape, skinAnalysis, hairAnalysis, profile, recommendations }) {
  const styleProfile = profile.styleProfile || "Gender-Neutral Styles"

  return {
    faceShape,
    skinAnalysis,
    hairAnalysis,
    styleProfile,
    confidenceScores: {
      face: faceShape.confidence,
      skin: skinAnalysis.confidence,
      hair: hairAnalysis.confidence,
    },
    explanations: {
      face: faceShape.plainEnglishMeaning,
      skin: skinAnalysis.plainEnglishMeaning,
      hair: hairAnalysis.plainEnglishMeaning,
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
    salonMatches: [1, 4, 2],
    budgetCategory: profile.budgetRange || 'Premium',
  }
}

async function postAnalysisWithTimeout(url, payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export class AnalysisValidationError extends Error {
  constructor(errors) {
    super(errors.join(' '))
    this.name = 'AnalysisValidationError'
    this.errors = errors
  }
}

export const analyzeBeautyProfile = async (profile) => {
  try {
    console.log('[GlowAI][ProfileAnalysis] start')
    let faceShape = null
    let skinAnalysis = null
    let hairAnalysis = null
    
    let imgEl = null
    let landmarks = null

    // Load image and detect landmarks if a photo is provided
    if (profile.photoPreview) {
      console.log('[GlowAI][ProfileAnalysis] load image: start')
      imgEl = await withTimeout(loadImage(profile.photoPreview), 'Profile image load')
      console.log('[GlowAI][ProfileAnalysis] load image: complete')

      console.log('[GlowAI][ProfileAnalysis] detect landmarks: start')
      try {
        landmarks = await withTimeout(detectLandmarks(imgEl), 'Profile landmark detection')
        console.log('[GlowAI][ProfileAnalysis] detect landmarks: complete', { found: Boolean(landmarks) })
      } catch (err) {
        console.warn('[GlowAI][ProfileAnalysis] detect landmarks failed, using fallback analysis', err)
        landmarks = null
      }
    }

    const readiness = validateLandmarkReadiness(imgEl, landmarks)
    if (!readiness.validationPassed) {
      console.warn('[GlowAI][ProfileAnalysis] landmark readiness failed, continuing with fallback', readiness.errors)
    }

    if (landmarks) {
      console.log('[GlowAI][ProfileAnalysis] classify face shape: start')
      faceShape = classifyFaceShape(landmarks)
      console.log('[GlowAI][ProfileAnalysis] classify face shape: complete', faceShape)

      console.log('[GlowAI][ProfileAnalysis] analyze skin: start')
      try {
        skinAnalysis = await withTimeout(Promise.resolve(analyzeSkin(imgEl, landmarks)), 'Profile skin analysis')
        console.log('[GlowAI][ProfileAnalysis] analyze skin: complete', skinAnalysis)
      } catch (err) {
        console.warn('[GlowAI][ProfileAnalysis] analyze skin failed, using fallback', err)
        skinAnalysis = createFallbackSkinAnalysis(err.message || 'skin analysis failed')
      }

      console.log('[GlowAI][ProfileAnalysis] analyze hair: start')
      try {
        hairAnalysis = await withTimeout(Promise.resolve(analyzeHair(imgEl, landmarks)), 'Profile hair analysis')
        console.log('[GlowAI][ProfileAnalysis] analyze hair: complete', hairAnalysis)
      } catch (err) {
        console.warn('[GlowAI][ProfileAnalysis] analyze hair failed, using fallback', err)
        hairAnalysis = analyzeHair(null, null)
      }
    } else {
      // Fallbacks if no face is detected
      const reason = readiness.errors?.join(' ') || 'no face landmarks were detected'
      console.log('[GlowAI][ProfileAnalysis] fallback face/skin/hair analysis: start', reason)
      faceShape = createFallbackFaceShape(reason)
      skinAnalysis = createFallbackSkinAnalysis(reason)
      hairAnalysis = analyzeHair(null, null)
      console.log('[GlowAI][ProfileAnalysis] fallback face/skin/hair analysis: complete')
    }

    // If API Mode is active, outsource scoring logic to the backend server
    if (import.meta.env.VITE_STORAGE_PROVIDER === 'api') {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
      console.log('[GlowAI][ProfileAnalysis] backend analysis API: start')
      try {
        const response = await postAnalysisWithTimeout(`${API_BASE}/api/analysis/analyze`, { faceShape, skinAnalysis, hairAnalysis, profile })
        console.log('[GlowAI][ProfileAnalysis] backend analysis API: response received', { ok: response.ok, status: response.status })
        const finalAnalysis = await withTimeout(response.json(), 'Backend analysis JSON parse')
        if (!response.ok) {
          throw new Error(finalAnalysis.error || 'Server-side analysis failed')
        }
        console.log('[GlowAI][ProfileAnalysis] backend analysis API: complete')
        return finalAnalysis
      } catch (err) {
        console.warn('[GlowAI][ProfileAnalysis] backend analysis API failed, using local fallback recommendations', err)
      }
    }

    console.log('[GlowAI][ProfileAnalysis] generate recommendations: start')
    const recommendations = generateRecommendations(
      { faceShape, skinAnalysis, hairAnalysis }, 
      profile
    )
    console.log('[GlowAI][ProfileAnalysis] generate recommendations: complete', recommendations)

    const finalAnalysis = buildFinalAnalysis({ faceShape, skinAnalysis, hairAnalysis, profile, recommendations })

    // Auto-save analysis if user is logged in
    console.log('[GlowAI][ProfileAnalysis] auto-save: start')
    import('./storageService').then(async ({ getCurrentUser, saveAnalysis }) => {
      const user = await withTimeout(getCurrentUser(), 'Current user lookup')
      if (user) {
        await withTimeout(saveAnalysis(user.id, finalAnalysis, profile), 'Analysis auto-save')
      }
      console.log('[GlowAI][ProfileAnalysis] auto-save: complete', { saved: Boolean(user) })
    }).catch(err => console.error('[GlowAI][ProfileAnalysis] auto-save failed:', err))

    console.log('[GlowAI][ProfileAnalysis] complete')
    return finalAnalysis
  } catch (err) {
    console.error('[GlowAI][ProfileAnalysis] failed:', err)
    throw err
  }
}

export const generateBridalTimeline = async (weddingDate, budget, style) => {
  await delay(2000)
  const bridalStyle = style || 'Personal bridal style'
  return {
    timeline: [
      {
        phase: '3 Months Before', icon: '✦',
        tasks: [
          { task: `Book bridal makeup artist experienced in ${bridalStyle}`, priority: 'High',   done: false },
          { task: 'Start pre-bridal skincare routine',   priority: 'High',   done: false },
          { task: 'Hair consultation & treatment plan',  priority: 'Medium', done: false },
          { task: 'Begin mehndi artist search',          priority: 'Medium', done: false },
        ],
      },
      {
        phase: '2 Months Before', icon: '✦',
        tasks: [
          { task: 'Bridal makeup trial session',       priority: 'High',   done: false },
          { task: 'Deep conditioning hair treatment',  priority: 'High',   done: false },
          { task: 'Eyebrow shaping & tinting',         priority: 'Medium', done: false },
          { task: `Finalise ${bridalStyle} references, jewellery balance, and draping direction`, priority: 'High', done: false },
        ],
      },
      {
        phase: '1 Month Before', icon: '✦',
        tasks: [
          { task: 'Pre-bridal facial series (3 sessions)', priority: 'High',   done: false },
          { task: 'Book nail artist for bridal nails',     priority: 'High',   done: false },
          { task: `Final ${bridalStyle} makeup and hair rehearsal`, priority: 'High', done: false },
          { task: 'Body polishing treatment',              priority: 'Medium', done: false },
        ],
      },
      {
        phase: 'Wedding Week', icon: '♦',
        tasks: [
          { task: 'Final skin brightening facial', priority: 'High', done: false },
          { task: 'Bridal mehendi appointment',   priority: 'High', done: false },
          { task: 'Hair treatment & trim',        priority: 'High', done: false },
          { task: 'Manicure & Pedicure',          priority: 'High', done: false },
        ],
      },
    ],
    estimatedBudget: budget,
    style: bridalStyle,
  }
}

export const optimizeBudget = async (budget, location, services) => {
  await delay(1600)
  return [
    {
      name: 'Essential Glow',
      salon: 'Aura Salon Powai', salonId: 3,
      services: services.slice(0, 2),
      originalPrice: Math.round(budget * 1.2),
      optimizedPrice: Math.round(budget * 0.82),
      savings: Math.round(budget * 0.38),
      valueScore: 92, rating: 4.7, bestFor: 'Everyday Beauty',
    },
    {
      name: 'Premium Experience',
      salon: 'Luxe Studio Bandra', salonId: 1,
      services,
      originalPrice: Math.round(budget * 1.5),
      optimizedPrice: Math.round(budget * 0.94),
      savings: Math.round(budget * 0.56),
      valueScore: 97, rating: 4.9, bestFor: 'Special Occasion',
    },
    {
      name: 'Luxury Splurge',
      salon: 'The Glam Room Juhu', salonId: 4,
      services: [...services, 'Luxury Add-On'],
      originalPrice: Math.round(budget * 2),
      optimizedPrice: Math.round(budget * 1.1),
      savings: Math.round(budget * 0.9),
      valueScore: 89, rating: 4.9, bestFor: 'Premium Indulgence',
    },
  ]
}
