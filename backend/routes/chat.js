import express from 'express'
import { handleChat, getChatHistory, clearChatHistory } from '../controllers/chatController.js'
import { generalLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.post('/', generalLimiter, handleChat)
router.get('/history/:userId', generalLimiter, getChatHistory)
router.delete('/history/:userId', generalLimiter, clearChatHistory)

export default router
