/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '30d',
  ALGORITHM: 'HS256'
} as const;

/**
 * Security Configuration
 */
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
} as const;

/**
 * URL Configuration
 */
export const URL_CONFIG = {
  SHORT_CODE_LENGTH: 7,
  MAX_URL_LENGTH: 2048,
  MAX_CUSTOM_CODE_LENGTH: 50,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_EXPIRATION_DAYS: 365,
  CUSTOM_CODE_REGEX: /^[a-zA-Z0-9_-]+$/,
  RESERVED_CODES: [
    'api', 'admin', 'www', 'mail', 'ftp', 'dashboard', 'app',
    'login', 'register', 'signup', 'signin', 'logout', 'profile',
    'settings', 'help', 'support', 'contact', 'about', 'terms',
    'privacy', 'legal', 'docs', 'blog', 'news', 'home', 'index'
  ]
} as const;

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 requests per window
  },
  MODERATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // 1000 requests per window
  },
  API: {
    windowMs: 60 * 1000, // 1 minute
    max: 60 // 60 requests per minute
  }
} as const;

/**
 * Plan Limits
 */
export const PLAN_LIMITS = {
  FREE: {
    urlsPerMonth: 100,
    customDomains: 0,
    analyticsRetention: 30, // days
    passwordProtection: false,
    customCodes: false,
    apiAccess: false
  },
  PRO: {
    urlsPerMonth: 10000,
    customDomains: 5,
    analyticsRetention: 365, // days
    passwordProtection: true,
    customCodes: true,
    apiAccess: true
  },
  ENTERPRISE: {
    urlsPerMonth: -1, // unlimited
    customDomains: -1, // unlimited
    analyticsRetention: -1, // unlimited
    passwordProtection: true,
    customCodes: true,
    apiAccess: true
  }
} as const;

/**
 * Analytics Configuration
 */
export const ANALYTICS_CONFIG = {
  IP_HASH_SALT: process.env.IP_HASH_SALT || 'default-salt',
  UNIQUE_CLICK_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  BATCH_SIZE: 1000,
  RETENTION_DAYS: {
    FREE: 30,
    PRO: 365,
    ENTERPRISE: -1 // unlimited
  }
} as const;

/**
 * Email Configuration
 */
export const EMAIL_CONFIG = {
  FROM_ADDRESS: process.env.FROM_EMAIL || 'noreply@urlshortener.com',
  VERIFICATION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  RESET_PASSWORD_EXPIRY: 1 * 60 * 60 * 1000 // 1 hour
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  URL_TTL: 60 * 60, // 1 hour
  ANALYTICS_TTL: 5 * 60, // 5 minutes
  USER_TTL: 15 * 60, // 15 minutes
  DEFAULT_TTL: 10 * 60 // 10 minutes
} as const;

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads'
} as const;
