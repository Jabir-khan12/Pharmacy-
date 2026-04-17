import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication endpoints (login, register).
 * 15 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many attempts. Please try again after 15 minutes.'
    }
  }
});

/**
 * General rate limiter for API routes.
 * 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please slow down.'
    }
  }
});
