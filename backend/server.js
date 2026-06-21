import app from './app.js'
import { config } from './config/env.js'

const PORT = config.port

const server = app.listen(PORT, () => {
  console.log(`=========================================`)
  console.log(`🚀 GlowAI Concierge Server running!`)
  console.log(`📡 Port: ${PORT}`)
  console.log(`🔗 Allowed Origins: ${config.allowedOrigins.join(', ')}`)
  console.log(`=========================================`)
})

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
  })
})
