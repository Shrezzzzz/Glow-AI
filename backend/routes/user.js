import express from 'express'
import {
  registerUser,
  loginUser,
  saveUserAnalysis,
  getUserAnalysisHistory,
  saveUserFavoriteSalon,
  getUserFavoriteSalons,
  deleteUserFavoriteSalon,
  saveUserRecommendation,
  getUserRecommendations
} from '../controllers/userController.js'
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js'
import { validateRegister, validateLogin } from '../middleware/validator.js'

const router = express.Router()

// Auth
router.post('/register', authLimiter, validateRegister, registerUser)
router.post('/login', authLimiter, validateLogin, loginUser)

// Analysis history
router.post('/save-analysis', generalLimiter, saveUserAnalysis)
router.get('/analysis-history/:userId', generalLimiter, getUserAnalysisHistory)

// Favorite salons
router.post('/save-salon', generalLimiter, saveUserFavoriteSalon)
router.get('/favorites/:userId', generalLimiter, getUserFavoriteSalons)
router.delete('/favorites/:userId/:salonId', generalLimiter, deleteUserFavoriteSalon)

// Saved Recommendations
router.post('/save-rec', generalLimiter, saveUserRecommendation)
router.get('/recs/:userId', generalLimiter, getUserRecommendations)

export default router
