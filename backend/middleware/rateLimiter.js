/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP/user
 */

// Simple in-memory store (use Redis in production)
const requestCounts = new Map();
const requestWindows = new Map();

/**
 * Clear old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const cleanupWindow = process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 5 * 60 * 1000; // 5 min in dev, 15 min in prod
  for (const [key, timestamp] of requestWindows.entries()) {
    if (now - timestamp > cleanupWindow) {
      requestCounts.delete(key);
      requestWindows.delete(key);
    }
  }
}, 2 * 60 * 1000); // Clean up every 2 minutes (more frequent in dev)

/**
 * Rate limiter middleware
 * @param {Object} options - Rate limit options
 * @param {Number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @param {Number} options.maxRequests - Max requests per window (default: 100)
 * @param {String} options.keyGenerator - Function to generate key (default: IP address)
 */
function rateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = requestWindows.get(key) || now;

    // Reset window if expired
    if (now - windowStart > windowMs) {
      requestCounts.set(key, 0);
      requestWindows.set(key, now);
    }

    const count = requestCounts.get(key) || 0;

    if (count >= maxRequests) {
      const resetTime = new Date(windowStart + windowMs);
      const secondsUntilReset = Math.ceil((windowStart + windowMs - now) / 1000);
      
      // In development, provide more helpful message
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? `Rate limit exceeded. Please try again after ${resetTime.toISOString()}`
        : `Rate limit exceeded (${count}/${maxRequests} requests). Please wait ${secondsUntilReset} second${secondsUntilReset !== 1 ? 's' : ''} and try again.`;
      
      return res.status(429).json({
        error: 'Too many requests',
        message: errorMessage,
        retryAfter: secondsUntilReset,
        limit: maxRequests,
        remaining: 0,
        resetAt: resetTime.toISOString()
      });
    }

    // Increment count
    requestCounts.set(key, count + 1);
    if (!requestWindows.has(key)) {
      requestWindows.set(key, now);
    }

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - count - 1),
      'X-RateLimit-Reset': new Date(windowStart + windowMs).toISOString()
    });

    next();
  };
}

/**
 * Strict rate limiter for auth endpoints (login/signup only)
 * Note: /auth/me endpoint should not use this strict limiter
 */
const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'production' ? 10 : 50, // More lenient in development (50 attempts per 15 min)
  keyGenerator: (req) => {
    // Use email if available, otherwise IP
    // In development, use IP only to avoid issues with multiple attempts
    if (process.env.NODE_ENV === 'production') {
    return req.body?.email || req.ip || req.connection.remoteAddress;
    }
    // Development: use IP only, reset more frequently
    return req.ip || req.connection.remoteAddress || 'dev-client';
  }
});

/**
 * Lighter rate limiter for authenticated endpoints like /auth/me
 */
const authCheckRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute window
  maxRequests: 30, // 30 requests per minute (more lenient for auth checks)
  keyGenerator: (req) => {
    // Use user ID from token if available, otherwise IP
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwt = require('jsonwebtoken');
        const token = authHeader.substring(7);
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          return `user_${decoded.id}`;
        }
      }
    } catch (e) {
      // Fall back to IP if token parsing fails
    }
    return req.ip || req.connection.remoteAddress;
  }
});

/**
 * Standard rate limiter for general API endpoints
 */
const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per 15 minutes
});

/**
 * Clear rate limit for a specific key (useful for development/testing)
 * @param {String} key - The key to clear (email or IP)
 */
function clearRateLimit(key) {
  requestCounts.delete(key);
  requestWindows.delete(key);
}

/**
 * Clear all rate limits (use with caution - mainly for development)
 */
function clearAllRateLimits() {
  requestCounts.clear();
  requestWindows.clear();
}

module.exports = {
  rateLimiter,
  authRateLimiter,
  authCheckRateLimiter,
  apiRateLimiter,
  clearRateLimit,
  clearAllRateLimits
};

