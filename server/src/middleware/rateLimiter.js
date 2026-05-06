import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication-related endpoints.
 * Strict limit to prevent brute-force attacks on login/signup.
 * 
 * 10 attempts per 15 minutes per IP address.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many authentication attempts',
    message: 'You have exceeded the maximum number of login attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
});

/**
 * General API rate limiter.
 * Moderate limit for normal API operations.
 * 
 * 200 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the API rate limit. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Webhook rate limiter.
 * Higher limit for inbound webhooks from external services (Meta, WhatsApp, etc.)
 * These come from platform servers and may be bursty.
 * 
 * 500 requests per minute per IP.
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: {
    error: 'Too many webhook requests',
    message: 'Webhook rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Password reset rate limiter.
 * Very strict to prevent email enumeration and spam.
 * 
 * 3 attempts per 15 minutes per IP.
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  message: {
    error: 'Too many password reset requests',
    message: 'Please wait before requesting another password reset.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default { authLimiter, apiLimiter, webhookLimiter, passwordResetLimiter };
