import { db } from '../models/inMemoryDb.js'

// ── AUTHENTICATION ─────────────────────────────────────────────────────────

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    const existing = await db.users.findByEmail(email)
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' })
    }

    // MVP base64 encoding (matching frontend btoa Simple Encoding)
    const passwordHash = Buffer.from(password).toString('base64')
    const user = await db.users.create(name, email, passwordHash)

    return res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const user = await db.users.findByEmail(email)
    const passwordHash = Buffer.from(password).toString('base64')

    if (!user || user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email
    })
  } catch (err) {
    next(err)
  }
}

// ── ANALYSIS HISTORY ───────────────────────────────────────────────────────

export const saveUserAnalysis = async (req, res, next) => {
  try {
    const { userId, analysisData, profileData } = req.body

    if (!userId || !analysisData || !profileData) {
      return res.status(400).json({ error: 'User ID, analysis data, and profile preferences are required.' })
    }

    const dataToSave = {
      faceAnalysis: analysisData.faceShape,
      hairAnalysis: analysisData.hairAnalysis,
      skinAnalysis: analysisData.skinAnalysis,
      styleIntent: profileData.styleIntent,
      occasion: profileData.occasion,
      budgetRange: profileData.budgetRange,
      recommendations: analysisData.recommendations
    }
    console.log("Saving analysis for user:", userId)
    const record = await db.analyses.save(userId, dataToSave)
    console.log("Saved record:", record)
    return res.status(200).json(record)
  } catch (err) {
    next(err)
  }
}

export const getUserAnalysisHistory = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID parameter is required.' })
    }

    const history = await db.analyses.getHistory(userId)
    return res.status(200).json(history)
  } catch (err) {
    next(err)
  }
}

// ── FAVORITE SALONS ────────────────────────────────────────────────────────

export const saveUserFavoriteSalon = async (req, res, next) => {
  try {
    const { userId, salon, notes } = req.body

    if (!userId || !salon) {
      return res.status(400).json({ error: 'User ID and salon details are required.' })
    }

    await db.favorites.saveSalon(userId, salon, notes)
    return res.status(200).json({ success: true, message: 'Salon saved to favorites.' })
  } catch (err) {
    next(err)
  }
}

export const getUserFavoriteSalons = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID parameter is required.' })
    }

    const salons = await db.favorites.getSalons(userId)
    return res.status(200).json(salons)
  } catch (err) {
    next(err)
  }
}

export const deleteUserFavoriteSalon = async (req, res, next) => {
  try {
    const { userId, salonId } = req.params

    if (!userId || !salonId) {
      return res.status(400).json({ error: 'User ID and Salon ID parameters are required.' })
    }

    await db.favorites.removeSalon(userId, salonId)
    return res.status(200).json({ success: true, message: 'Salon removed from favorites.' })
  } catch (err) {
    next(err)
  }
}

export const saveUserRecommendation = async (req, res, next) => {
  try {
    const { userId, recommendation } = req.body

    if (!userId || !recommendation) {
      return res.status(400).json({ error: 'User ID and recommendation details are required.' })
    }

    await db.recommendations.save(userId, recommendation)
    return res.status(200).json({ success: true, message: 'Recommendation saved.' })
  } catch (err) {
    next(err)
  }
}

export const getUserRecommendations = async (req, res, next) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: 'User ID parameter is required.' })
    }

    const recs = await db.recommendations.get(userId)
    return res.status(200).json(recs)
  } catch (err) {
    next(err)
  }
}
