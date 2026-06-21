/**
 * storageService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified Storage Provider Abstraction for GlowAI.
 * Routes requests to either LocalStorageProvider or APIStorageProvider.
 */

const USERS_KEY = 'glowai_users'
const ANALYSES_KEY = 'glowai_analyses'
const SAVED_RECS_KEY = 'glowai_saved_recs'
const SAVED_SALONS_KEY = 'glowai_saved_salons'
const SESSION_KEY = 'glowai_session'
const RESET_TOKENS_KEY = 'glowai_reset_tokens'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const PROVIDER_TYPE = import.meta.env.VITE_STORAGE_PROVIDER || 'local'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const getLocalData = (key) => JSON.parse(localStorage.getItem(key)) || {}
const setLocalData = (key, data) => localStorage.setItem(key, JSON.stringify(data))

async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'API Request failed')
    }
    return data
  } catch (err) {
    console.error(`[API Error] Request to ${endpoint} failed:`, err)
    throw err
  }
}

// ── 1. LOCAL STORAGE PROVIDER ──
const LocalStorageProvider = {
  createUser: async (name, email, password) => {
    await delay(300)
    const users = getLocalData(USERS_KEY)

    if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already registered')
    }

    const userId = `user_${Date.now()}`
    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash: btoa(password),
      createdAt: new Date().toISOString()
    }

    users[userId] = newUser
    setLocalData(USERS_KEY, users)
    return { id: newUser.id, name: newUser.name, email: newUser.email }
  },

  loginUser: async (email, password, rememberMe = true) => {
    await delay(300)
    const users = getLocalData(USERS_KEY)
    const user = Object.values(users).find(u =>
      u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === btoa(password)
    )

    if (!user) throw new Error('Invalid email or password')
    const sessionUser = { id: user.id, name: user.name, email: user.email }

    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    }
    return sessionUser
  },

  logoutUser: async () => {
    await delay(100)
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return true
  },

  getCurrentUser: async () => {
    const localSession = localStorage.getItem(SESSION_KEY)
    const tempSession = sessionStorage.getItem(SESSION_KEY)
    if (localSession) return JSON.parse(localSession)
    if (tempSession) return JSON.parse(tempSession)
    return null
  },

  generateResetToken: async (email) => {
    await delay(400)
    const users = getLocalData(USERS_KEY)
    const user = Object.values(users).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    )

    if (!user) return { success: true, token: null }

    const token = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    const tokens = getLocalData(RESET_TOKENS_KEY)
    tokens[token] = {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 15 * 60 * 1000
    }
    setLocalData(RESET_TOKENS_KEY, tokens)

    return { success: true, token }
  },

  resetPassword: async (token, newPassword) => {
    await delay(400)
    const tokens = getLocalData(RESET_TOKENS_KEY)
    const record = tokens[token]

    if (!record) throw new Error('Invalid or expired reset link.')
    if (Date.now() > record.expiresAt) {
      delete tokens[token]
      setLocalData(RESET_TOKENS_KEY, tokens)
      throw new Error('This reset link has expired. Please request a new one.')
    }

    const users = getLocalData(USERS_KEY)
    const user = users[record.userId]
    if (!user) throw new Error('User not found.')

    user.passwordHash = btoa(newPassword)
    users[record.userId] = user
    setLocalData(USERS_KEY, users)

    delete tokens[token]
    setLocalData(RESET_TOKENS_KEY, tokens)

    return { success: true }
  },

  saveAnalysis: async (userId, analysisData, profileData) => {
    await delay(200)
    const analyses = getLocalData(ANALYSES_KEY)
    if (!analyses[userId]) analyses[userId] = []

    const newAnalysis = {
      analysisId: `an_${Date.now()}`,
      timestamp: new Date().toISOString(),
      faceAnalysis: analysisData.faceShape,
      hairAnalysis: analysisData.hairAnalysis,
      skinAnalysis: analysisData.skinAnalysis,
      styleIntent: profileData.styleIntent,
      occasion: profileData.occasion,
      budgetRange: profileData.budgetRange,
      recommendations: analysisData.recommendations
    }

    analyses[userId] = [newAnalysis, ...analyses[userId]]
    setLocalData(ANALYSES_KEY, analyses)
    return newAnalysis
  },

  getAnalysisHistory: async (userId) => {
    await delay(200)
    const analyses = getLocalData(ANALYSES_KEY)
    return analyses[userId] || []
  },

  saveRecommendation: async (userId, recommendation) => {
    await delay(100)
    const saved = getLocalData(SAVED_RECS_KEY)
    if (!saved[userId]) saved[userId] = []

    if (!saved[userId].some(r => r.characterName === recommendation.characterName)) {
      saved[userId] = [{ ...recommendation, savedAt: new Date().toISOString() }, ...saved[userId]]
      setLocalData(SAVED_RECS_KEY, saved)
    }
    return true
  },

  getSavedRecommendations: async (userId) => {
    await delay(100)
    const saved = getLocalData(SAVED_RECS_KEY)
    return saved[userId] || []
  },

  saveFavoriteSalon: async (userId, salon, notes = '') => {
    await delay(100)
    const salons = getLocalData(SAVED_SALONS_KEY)
    if (!salons[userId]) salons[userId] = []

    const existing = salons[userId].find(s => s.id === salon.id)
    if (!existing) {
      salons[userId] = [{ ...salon, notes, savedAt: new Date().toISOString() }, ...salons[userId]]
      setLocalData(SAVED_SALONS_KEY, salons)
    }
    return true
  },

  getFavoriteSalons: async (userId) => {
    await delay(100)
    const salons = getLocalData(SAVED_SALONS_KEY)
    return salons[userId] || []
  },

  removeFavoriteSalon: async (userId, salonId) => {
    await delay(100)
    const salons = getLocalData(SAVED_SALONS_KEY)
    if (salons[userId]) {
      salons[userId] = salons[userId].filter(s => String(s.id) !== String(salonId))
      setLocalData(SAVED_SALONS_KEY, salons)
    }
    return true
  }
}

// ── 2. API SERVICE PROVIDER ──
const APIStorageProvider = {
  createUser: async (name, email, password) => {
    return apiRequest('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    })
  },

  loginUser: async (email, password, rememberMe = true) => {
    const user = await apiRequest('/api/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })

    if (rememberMe) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    }
    return user
  },

  logoutUser: async () => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    return true
  },

  getCurrentUser: async () => {
    const localSession = localStorage.getItem(SESSION_KEY)
    const tempSession = sessionStorage.getItem(SESSION_KEY)
    if (localSession) return JSON.parse(localSession)
    if (tempSession) return JSON.parse(tempSession)
    return null
  },

  generateResetToken: async (email) => {
    return LocalStorageProvider.generateResetToken(email)
  },

  resetPassword: async (token, newPassword) => {
    return LocalStorageProvider.resetPassword(token, newPassword)
  },

  saveAnalysis: async (userId, analysisData, profileData) => {
    return apiRequest('/api/user/save-analysis', {
      method: 'POST',
      body: JSON.stringify({ userId, analysisData, profileData })
    })
  },

  getAnalysisHistory: async (userId) => {
    return apiRequest(`/api/user/analysis-history/${userId}`)
  },

  saveRecommendation: async (userId, recommendation) => {
    return apiRequest('/api/user/save-rec', {
      method: 'POST',
      body: JSON.stringify({ userId, recommendation })
    })
  },

  getSavedRecommendations: async (userId) => {
    return apiRequest(`/api/user/recs/${userId}`)
  },

  saveFavoriteSalon: async (userId, salon, notes = '') => {
    return apiRequest('/api/user/save-salon', {
      method: 'POST',
      body: JSON.stringify({ userId, salon, notes })
    })
  },

  getFavoriteSalons: async (userId) => {
    return apiRequest(`/api/user/favorites/${userId}`)
  },

  removeFavoriteSalon: async (userId, salonId) => {
    return apiRequest(`/api/user/favorites/${userId}/${salonId}`, {
      method: 'DELETE'
    })
  }
}

// Export wrapper routing to active provider
const activeProvider = PROVIDER_TYPE === 'api' ? APIStorageProvider : LocalStorageProvider

console.log(`[StorageProvider] Active backend configuration: "${PROVIDER_TYPE.toUpperCase()}"`)

export const createUser = activeProvider.createUser
export const loginUser = activeProvider.loginUser
export const logoutUser = activeProvider.logoutUser
export const getCurrentUser = activeProvider.getCurrentUser
export const generateResetToken = activeProvider.generateResetToken
export const resetPassword = activeProvider.resetPassword
export const saveAnalysis = activeProvider.saveAnalysis
export const getAnalysisHistory = activeProvider.getAnalysisHistory
export const saveRecommendation = activeProvider.saveRecommendation
export const getSavedRecommendations = activeProvider.getSavedRecommendations
export const saveFavoriteSalon = activeProvider.saveFavoriteSalon
export const getFavoriteSalons = activeProvider.getFavoriteSalons
export const removeFavoriteSalon = activeProvider.removeFavoriteSalon