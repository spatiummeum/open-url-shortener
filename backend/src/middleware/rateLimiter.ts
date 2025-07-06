import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { RATE_LIMIT_CONFIG } from '../utils/constants';

/**
 * Strict rate limiting for sensitive operations (login, register, password reset)
 */
export const rateLimitStrict = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 60 * 1000 : RATE_LIMIT_CONFIG.STRICT.windowMs, // 1 minute in dev
  max: process.env.NODE_ENV === 'development' ? 20 : RATE_LIMIT_CONFIG.STRICT.max, // 20 requests in dev
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: process.env.NODE_ENV === 'development' ? 60 : Math.ceil(RATE_LIMIT_CONFIG.STRICT.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests that don't indicate abuse
  skipSuccessfulRequests: false,
  // Skip failed requests that might be legitimate
  skipFailedRequests: false,
  // Custom key generator to include user ID if available
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return user ? `${user.id}:${ip}` : ip;
  }
});

/**
 * Moderate rate limiting for general API operations
 */
export const rateLimitModerate = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.MODERATE.windowMs,
  max: RATE_LIMIT_CONFIG.MODERATE.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(RATE_LIMIT_CONFIG.MODERATE.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return user ? `${user.id}:${ip}` : ip;
  }
});

/**
 * Lenient rate limiting for public operations (URL access, analytics)
 */
export const rateLimitLenient = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.LENIENT.windowMs,
  max: RATE_LIMIT_CONFIG.LENIENT.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(RATE_LIMIT_CONFIG.LENIENT.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

/**
 * API rate limiting for programmatic access
 */
export const rateLimitAPI = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.API.windowMs,
  max: RATE_LIMIT_CONFIG.API.max,
  message: {
    error: 'API rate limit exceeded. Please check your plan limits.',
    retryAfter: Math.ceil(RATE_LIMIT_CONFIG.API.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey) {
      return `api:${apiKey}`;
    }
    
    return user ? `user:${user.id}` : `ip:${ip}`;
  }
});

/**
 * Custom rate limiter for URL shortening based on user plan
 */
export const rateLimitURLCreation = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    const user = (req as any).user;
    if (!user) return 10; // Anonymous users get 10 per hour
    
    switch (user.plan) {
      case 'FREE':
        return 50; // 50 URLs per hour
      case 'PRO':
        return 500; // 500 URLs per hour
      case 'ENTERPRISE':
        return 5000; // 5000 URLs per hour
      default:
        return 10;
    }
  },
  message: (req: Request) => {
    const user = (req as any).user;
    const planLimit = user ? 
      (user.plan === 'FREE' ? '50' : user.plan === 'PRO' ? '500' : '5000') : 
      '10';
    
    return {
      error: `URL creation rate limit exceeded. Your ${user?.plan || 'anonymous'} plan allows ${planLimit} URLs per hour.`,
      retryAfter: 3600
    };
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return user ? `url-creation:${user.id}` : `url-creation:${ip}`;
  }
});

/**
 * Rate limiter for URL redirects to prevent abuse
 */
export const rateLimitRedirect = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 redirects per minute per IP
  message: {
    error: 'Too many redirect requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: false, // Don't expose rate limit headers for redirects
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: true, // Don't count 404s against the limit
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});
