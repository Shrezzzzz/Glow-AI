import rateLimit from 'express-rate-limit'

// General limit for API requests
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this device.',
    message: 'Please try again in 15 minutes.'
  }
})

// Tight limit for analysis calculations & Place SDK requests to protect Google API quotas
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many analysis or salon search requests.',
    message: 'Please wait a few minutes before trying again to protect API limits.'
  }
})

// Tight limit for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // limit each IP to 15 login/signup actions per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login or signup attempts.',
    message: 'Please try again shortly.'
  }
})
