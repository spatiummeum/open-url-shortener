import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { SECURITY_CONFIG, URL_CONFIG, HTTP_STATUS } from '../utils/constants';

/**
 * Handle validation results
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined
      }))
    });
    return;
  }
  
  next();
};

/**
 * User registration validation
 */
export const validateUserRegistration: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 254 })
    .withMessage('Email address is too long'),
    
  body('password')
    .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH, max: 128 })
    .withMessage(`Password must be between ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} and 128 characters`)
    .custom((value: string) => {
      // Enhanced password validation
      const commonPasswords = [
        'password', '123456', 'password123', 'admin', 'qwerty',
        'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
      ];
      
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common');
      }
      
      // Check for repeated characters
      if (/(.)\1{3,}/.test(value)) {
        throw new Error('Password cannot have more than 3 repeated characters');
      }
      
      if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(value)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(value)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(value)) {
        throw new Error('Password must contain at least one number');
      }
      if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[^A-Za-z0-9]/.test(value)) {
        throw new Error('Password must contain at least one special character');
      }
      return true;
    }),
    
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
];

/**
 * User login validation
 */
export const validateUserLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ max: 128 })
    .withMessage('Password is too long')
];

/**
 * User profile update validation
 */
export const validateUserUpdate: ValidationChain[] = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\u00C0-\u017F]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot exceed 100 characters'),

  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password is required when changing password')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),

  body('newPassword')
    .optional()
    .isLength({ min: SECURITY_CONFIG.PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .isLength({ max: 128 })
    .withMessage('Password is too long'),

  body('confirmation')
    .optional()
    .equals('DELETE')
    .withMessage('Confirmation must be exactly "DELETE"')
];

/**
 * URL creation validation
 */
export const validateUrlCreation: ValidationChain[] = [
  body('originalUrl')
    .notEmpty()
    .withMessage('URL is required')
    .isURL({
      protocols: ['http', 'https'],
      require_protocol: true
    })
    .withMessage('Please provide a valid URL with http:// or https://')
    .isLength({ max: URL_CONFIG.MAX_URL_LENGTH })
    .withMessage(`URL cannot exceed ${URL_CONFIG.MAX_URL_LENGTH} characters`)
    .custom((value: string) => {
      // Additional URL validation
      try {
        const url = new URL(value);
        
        // Block localhost and private IPs for security
        if (url.hostname === 'localhost' || 
            url.hostname === '127.0.0.1' ||
            url.hostname.match(/^192\.168\./) ||
            url.hostname.match(/^10\./) ||
            url.hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)) {
          throw new Error('Private and localhost URLs are not allowed');
        }
        
        return true;
      } catch (error) {
        throw new Error('Invalid URL format');
      }
    }),
    
  body('customCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: URL_CONFIG.MAX_CUSTOM_CODE_LENGTH })
    .withMessage(`Custom code must be between 3 and ${URL_CONFIG.MAX_CUSTOM_CODE_LENGTH} characters`)
    .matches(URL_CONFIG.CUSTOM_CODE_REGEX)
    .withMessage('Custom code can only contain letters, numbers, hyphens, and underscores')
    .custom((value: string) => {
      // Check for reserved words
      const reservedWords = [
        'api', 'admin', 'www', 'mail', 'ftp', 'dashboard', 'app',
        'login', 'register', 'signup', 'signin', 'logout', 'profile',
        'settings', 'help', 'support', 'contact', 'about', 'terms',
        'privacy', 'legal', 'docs', 'blog', 'news', 'home', 'index'
      ];
      
      if (reservedWords.includes(value.toLowerCase())) {
        throw new Error('This custom code is reserved and cannot be used');
      }
      
      return true;
    }),
    
  body('title')
    .optional()
    .trim()
    .isLength({ max: URL_CONFIG.MAX_TITLE_LENGTH })
    .withMessage(`Title cannot exceed ${URL_CONFIG.MAX_TITLE_LENGTH} characters`)
    .escape(), // Sanitize HTML
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: URL_CONFIG.MAX_DESCRIPTION_LENGTH })
    .withMessage(`Description cannot exceed ${URL_CONFIG.MAX_DESCRIPTION_LENGTH} characters`)
    .escape(), // Sanitize HTML
    
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date')
    .custom((value: string) => {
      const expirationDate = new Date(value);
      const now = new Date();
      const maxExpiration = new Date();
      maxExpiration.setDate(now.getDate() + URL_CONFIG.MAX_EXPIRATION_DAYS);
      
      if (expirationDate <= now) {
        throw new Error('Expiration date must be in the future');
      }
      
      if (expirationDate > maxExpiration) {
        throw new Error(`Expiration date cannot be more than ${URL_CONFIG.MAX_EXPIRATION_DAYS} days from now`);
      }
      
      return true;
    })
];

/**
 * URL update validation
 */
export const validateUrlUpdate: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: URL_CONFIG.MAX_TITLE_LENGTH })
    .withMessage(`Title cannot exceed ${URL_CONFIG.MAX_TITLE_LENGTH} characters`)
    .escape(),
    
  body('description')
    .optional()
    .trim()
    .isLength({ max: URL_CONFIG.MAX_DESCRIPTION_LENGTH })
    .withMessage(`Description cannot exceed ${URL_CONFIG.MAX_DESCRIPTION_LENGTH} characters`)
    .escape(),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

/**
 * Domain validation
 */
export const validateDomain: ValidationChain[] = [
  body('domain')
    .notEmpty()
    .withMessage('Domain is required')
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 253 })
    .withMessage('Domain must be between 3 and 253 characters')
    .matches(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/)
    .withMessage('Invalid domain format')
    .custom((value: string) => {
      // Additional domain validation
      const parts = value.split('.');
      
      // Check each part
      for (const part of parts) {
        if (part.length === 0 || part.length > 63) {
          throw new Error('Each domain part must be between 1 and 63 characters');
        }
        
        if (part.startsWith('-') || part.endsWith('-')) {
          throw new Error('Domain parts cannot start or end with hyphens');
        }
      }
      
      // Must have at least 2 parts (domain.tld)
      if (parts.length < 2) {
        throw new Error('Domain must have at least one subdomain and TLD');
      }
      
      // TLD must be at least 2 characters
      if (parts[parts.length - 1].length < 2) {
        throw new Error('Top-level domain must be at least 2 characters');
      }
      
      return true;
    })
];

/**
 * Sanitize input middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Remove any null bytes
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/\0/g, '');
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized: any = Array.isArray(value) ? [] : {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };
  
  // Sanitize body (this is safe to reassign)
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  // For query and params, sanitize in place to avoid readonly issues
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      if (typeof value === 'string') {
        (req.query as any)[key] = value.replace(/\0/g, '');
      }
    });
  }
  
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      const value = req.params[key];
      if (typeof value === 'string') {
        req.params[key] = value.replace(/\0/g, '');
      }
    });
  }
  
  next();
};
