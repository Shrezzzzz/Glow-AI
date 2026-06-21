import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'

// Import routes
import analysisRouter from './routes/analysis.js'
import salonsRouter from './routes/salons.js'
import userRouter from './routes/user.js'
import chatRouter from './routes/chat.js'

const app = express()

// 1. Core Security & Logger Middlewares
app.use(helmet())
app.use(morgan('dev'))

// CORS configuration supporting whitelist origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or curl requests
    if (!origin) return callback(null, true)
    if (config.allowedOrigins.indexOf(origin) !== -1 || config.allowedOrigins.includes('*')) {
      return callback(null, true)
    }
    return callback(new Error('Blocked by CORS policy'))
  },
  credentials: true
}))

// Body parsers
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health Check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// 2. Mount API Routes
app.use('/api/analysis', analysisRouter)
app.use('/api/salons', salonsRouter)
app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)

// 3. 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` })
})

// 4. Global Error Handler
app.use(errorHandler)

export default app
