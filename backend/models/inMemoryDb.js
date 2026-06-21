/**
 * inMemoryDb.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates a server-side database for development MVP.
 * In a production release, these database methods can be directly mapped to
 * Supabase, PostgreSQL, or MongoDB.
 */

const users = {}
const analyses = {}
const savedRecommendations = {}
const favoriteSalons = {}
const chatHistories = {}

export const db = {
  users: {
    create: async (name, email, passwordHash) => {
      const id = `user_${Date.now()}`
      users[id] = { id, name, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() }
      return { id, name, email }
    },
    findByEmail: async (email) => {
      return Object.values(users).find(u => u.email === email.toLowerCase()) || null
    },
    findById: async (id) => {
      return users[id] || null
    }
  },
  analyses: {
    save: async (userId, data) => {
      if (!analyses[userId]) analyses[userId] = []
      const record = {
        analysisId: `an_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...data
      }
      analyses[userId] = [record, ...analyses[userId]]
      return record
    },
    getHistory: async (userId) => {
      return analyses[userId] || []
    }
  },
  favorites: {
    saveSalon: async (userId, salon, notes = '') => {
      if (!favoriteSalons[userId]) favoriteSalons[userId] = []
      const existing = favoriteSalons[userId].find(s => String(s.id) === String(salon.id))
      if (!existing) {
        const favorite = {
          ...salon,
          notes,
          savedAt: new Date().toISOString()
        }
        favoriteSalons[userId] = [favorite, ...favoriteSalons[userId]]
      }
      return true
    },
    getSalons: async (userId) => {
      return favoriteSalons[userId] || []
    },
    removeSalon: async (userId, salonId) => {
      if (favoriteSalons[userId]) {
        favoriteSalons[userId] = favoriteSalons[userId].filter(s => String(s.id) !== String(salonId))
      }
      return true
    }
  },
  recommendations: {
    save: async (userId, rec) => {
      if (!savedRecommendations[userId]) savedRecommendations[userId] = []
      if (!savedRecommendations[userId].some(r => r.characterName === rec.characterName)) {
        savedRecommendations[userId] = [{ ...rec, savedAt: new Date().toISOString() }, ...savedRecommendations[userId]]
      }
      return true
    },
    get: async (userId) => {
      return savedRecommendations[userId] || []
    }
  },
  chatHistories: {
    saveMessage: async (userId, message) => {
      if (!chatHistories[userId]) chatHistories[userId] = []
      const record = {
        id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        isUser: message.isUser,
        text: message.text,
        timestamp: message.timestamp || new Date().toISOString()
      }
      chatHistories[userId].push(record)
      return record
    },
    getHistory: async (userId) => {
      return chatHistories[userId] || []
    },
    clearHistory: async (userId) => {
      chatHistories[userId] = []
      return true
    }
  }
}
