// HTTP Status Codes
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
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_RESET_EXPIRY: '1h'
} as const;

// URL Configuration
export const URL_CONFIG = {
  SHORT_CODE_LENGTH: 8,
  MAX_ORIGINAL_URL_LENGTH: 2048,
  MAX_URL_LENGTH: 2048,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CUSTOM_CODE_LENGTH: 20,
  CUSTOM_CODE_REGEX: /^[a-zA-Z0-9_-]+$/,
  MAX_EXPIRATION_DAYS: 365
} as const;

// Plan Limits
export const PLAN_LIMITS = {
  FREE: {
    maxUrls: 100,
    urlsPerMonth: 100,
    maxClicksPerMonth: 1000,
    analyticsRetention: 30, // days
    customDomains: false,
    customCodes: false,
    passwordProtection: true,
    expirationDates: true
  },
  PRO: {
    maxUrls: 1000,
    urlsPerMonth: 1000,
    maxClicksPerMonth: 50000,
    analyticsRetention: 365, // days
    customDomains: true,
    customCodes: true,
    passwordProtection: true,
    expirationDates: true
  },
  ENTERPRISE: {
    maxUrls: -1, // unlimited
    urlsPerMonth: -1, // unlimited
    maxClicksPerMonth: -1, // unlimited
    analyticsRetention: -1, // unlimited
    customDomains: true,
    customCodes: true,
    passwordProtection: true,
    expirationDates: true
  }
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
  },
  MODERATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  LENIENT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  },
  URL_CREATION: {
    windowMs: 60 * 1000, // 1 minute
    max: 10 // limit each IP to 10 URL creations per minute
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // limit each IP to 200 API requests per 15 minutes
  }
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    min: 5,
    max: 255
  },
  PASSWORD: {
    min: 8,
    max: 128
  },
  NAME: {
    min: 1,
    max: 100
  },
  SHORT_CODE: {
    min: 3,
    max: 20,
    pattern: /^[a-zA-Z0-9_-]+$/
  }
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@urlshortener.com',
  TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password-reset',
    EMAIL_VERIFICATION: 'email-verification'
  }
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  BCRYPT_ROUNDS: 12,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_MIN_LENGTH: 8, // Alias for compatibility
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  CSRF_TOKEN_LENGTH: 32,
  PASSWORD_REQUIRE_UPPERCASE: false,
  PASSWORD_REQUIRE_LOWERCASE: false,
  PASSWORD_REQUIRE_NUMBERS: false,
  PASSWORD_REQUIRE_SYMBOLS: false
} as const;

// Rate Limit Configuration (alias for compatibility)
export const RATE_LIMIT_CONFIG = RATE_LIMITS;