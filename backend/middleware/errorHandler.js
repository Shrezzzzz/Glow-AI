/**
 * errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Formats server exceptions into a standardized API response.
 * Stacks are omitted in production to protect application details.
 */

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
  
  console.error(`[API Error] ${req.method} ${req.url} - Status: ${statusCode}`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  })

  return res.status(statusCode).json({
    error: err.message || 'An unexpected server error occurred.',
    message: 'We encountered an error processing your request. Please try again shortly.',
    status: statusCode
  })
}
