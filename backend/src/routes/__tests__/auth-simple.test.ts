// @ts-nocheck
import request from 'supertest';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Simple mocks that work
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  url: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('../../utils/database', () => ({
  prisma: mockPrismaClient,
}));

jest.mock('../../middleware/rateLimiter', () => ({
  rateLimitURLCreation: (req: any, res: any, next: any) => next(),
  rateLimitModerate: (req: any, res: any, next: any) => next(),
  rateLimitLenient: (req: any, res: any, next: any) => next(),
  rateLimitStrict: (req: any, res: any, next: any) => next(),
  rateLimitRedirect: (req: any, res: any, next: any) => next(),
}));

jest.mock('../../middleware/validation', () => ({
  validateUrlCreation: [(req: any, res: any, next: any) => next()],
  validateUrlUpdate: [(req: any, res: any, next: any) => next()],
  validateUserRegistration: [(req: any, res: any, next: any) => next()],
  validateUserLogin: [(req: any, res: any, next: any) => next()],
  validatePasswordReset: [(req: any, res: any, next: any) => next()],
  validatePasswordChange: [(req: any, res: any, next: any) => next()],
  sanitizeInput: (req: any, res: any, next: any) => next(),
  handleValidationErrors: (req: any, res: any, next: any) => next(),
  validate: (validations: any) => [(req: any, res: any, next: any) => next()],
}));

jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user123', plan: 'FREE' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user123', plan: 'FREE' };
    next();
  },
}));

jest.mock('express-validator', () => {
  const mockValidationChain = (req: any, res: any, next: any) => next();
  
  // Add all the chaining methods to the mock
  Object.assign(mockValidationChain, {
    optional: jest.fn().mockReturnValue(mockValidationChain),
    notEmpty: jest.fn().mockReturnValue(mockValidationChain),
    isLength: jest.fn().mockReturnValue(mockValidationChain),
    isEmail: jest.fn().mockReturnValue(mockValidationChain),
    matches: jest.fn().mockReturnValue(mockValidationChain),
    equals: jest.fn().mockReturnValue(mockValidationChain),
    withMessage: jest.fn().mockReturnValue(mockValidationChain),
    trim: jest.fn().mockReturnValue(mockValidationChain),
    normalizeEmail: jest.fn().mockReturnValue(mockValidationChain),
    // Add the run method that auth.ts uses
    run: jest.fn().mockResolvedValue(undefined),
  });

  return {
    body: jest.fn(() => mockValidationChain),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: () => true,
      array: () => []
    }),
  };
});

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: jest.fn() } },
    customers: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  }));
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken'),
  verify: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('abc12345'),
}));

import app from '../../app';
import bcrypt from 'bcryptjs';

describe('Auth Routes - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: false,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.$transaction.mockResolvedValue([
        mockUser,
        { id: 'token123', token: 'refreshToken' }
      ]);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 400 when user already exists', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.user.update.mockResolvedValue(mockUser);
      mockPrismaClient.refreshToken.create.mockResolvedValue({
        id: 'token123',
        token: 'refreshToken',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid credentials', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens', async () => {
      const mockRefreshToken = {
        id: 'token123',
        token: 'validRefreshToken',
        userId: 'user123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'FREE',
          isActive: true,
        },
      };

      mockPrismaClient.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockPrismaClient.$transaction.mockResolvedValue([
        {},
        { id: 'newToken123', token: 'newRefreshToken' }
      ]);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'validRefreshToken',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid refresh token', async () => {
      mockPrismaClient.refreshToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalidRefreshToken',
        })
        .expect(401);

      expect(response.body.error).toBe('Refresh token not found');
    });
  });
});