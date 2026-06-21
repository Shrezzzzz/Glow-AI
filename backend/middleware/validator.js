/**
 * validator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates incoming JSON payloads before controller handling.
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters long.' })
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' })
  }

  next()
}

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body

  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' })
  }
  if (!password || password.trim().length === 0) {
    return res.status(400).json({ error: 'Password is required.' })
  }

  next()
}

export const validateAnalysis = (req, res, next) => {
  const { faceShape, skinAnalysis, hairAnalysis, profile } = req.body

  if (!profile) {
    return res.status(400).json({ error: 'Profile properties are required.' })
  }
  if (!faceShape || !skinAnalysis || !hairAnalysis) {
    return res.status(400).json({ error: 'Valid faceShape, skinAnalysis, and hairAnalysis payloads are required.' })
  }

  next()
}
