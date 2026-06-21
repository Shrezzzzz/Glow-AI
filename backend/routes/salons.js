import express from 'express'
import { getNearbySalons, getSalonById } from '../controllers/salonController.js'
import { apiLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.get('/nearby', apiLimiter, getNearbySalons)
router.get('/:id', apiLimiter, getSalonById)

export default router
