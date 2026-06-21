import express from 'express'
import { analyzeProfile, getRecommendations } from '../controllers/analysisController.js'
import { apiLimiter } from '../middleware/rateLimiter.js'
import { validateAnalysis } from '../middleware/validator.js'

const router = express.Router()

router.post('/analyze', apiLimiter, validateAnalysis, analyzeProfile)
router.post('/recommendations', apiLimiter, getRecommendations)

export default router
