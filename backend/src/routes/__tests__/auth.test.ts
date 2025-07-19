// @ts-nocheck
import request from 'supertest';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock all middleware before importing app
jest.mock('../../middleware/rateLimiter', () => ({
  rateLimitURLCreation: (req: any, res: any, next: any) => next(),
  rateLimitModerate: (req: any, res: any, next: any) => next(),
  rateLimitLenient: (req: any, res: any, next: any) => next(),
  rateLimitStrict: (req: any, res: any, next: any) => next(),
  rateLimitRedirect: (req: any, res: any, next: any) => next(),
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
  });

  return {
    body: jest.fn(() => mockValidationChain),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: () => true,
      array: () => []
    }),
  };
});

jest.mock('../../middleware/validation', () => {
  const mockValidationChain = (req: any, res: any, next: any) => next();
  
  return {
    validateUrlCreation: [mockValidationChain],
    validateUrlUpdate: [mockValidationChain],
    handleValidationErrors: (req: any, res: any, next: any) => next(),
    sanitizeInput: (req: any, res: any, next: any) => next(),
    validateUserRegistration: [mockValidationChain],
    validateUserLogin: [mockValidationChain],
    validatePasswordReset: [mockValidationChain],
    validatePasswordChange: [mockValidationChain],
  };
});

// Mock Prisma Client
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

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
  Plan: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

// Mock the database module
jest.mock('../../utils/database', () => ({
  prisma: mockPrismaClient,
}));

// Mock email service
jest.mock('../../services/emailService', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken'),
  verify: jest.fn(),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

import app from '../../app';

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.FRONTEND_URL = 'http://localhost:3003';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when valid token provided', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
      });
      
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should return 401 when invalid token provided', async () => {
      // Mock JWT verification to throw error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 when user not found', async () => {
      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'nonexistent' });
      
      // Mock Prisma user findUnique to return null
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 when user is inactive', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: false, // User is inactive
        isVerified: true,
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should handle database errors', async () => {
      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique to throw error
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });
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

      // Mock Prisma user findUnique to return null (user doesn't exist)
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      
      // Mock Prisma user create
      mockPrismaClient.user.create.mockResolvedValue(mockUser);
      
      // Mock refresh token creation
      mockPrismaClient.refreshToken.create.mockResolvedValue({
        id: 'token123',
        token: 'refreshToken',
      });
      
      // Mock transaction
      mockPrismaClient.$transaction.mockImplementation((operations) => {
        // For register, the transaction creates user and refresh token
        return Promise.resolve([mockUser, { id: 'token123' }]);
      });

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
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 when user already exists', async () => {
      const existingUser = {
        id: 'user123',
        email: 'test@example.com',
      };

      // Mock Prisma user findUnique to return existing user
      mockPrismaClient.user.findUnique.mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
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

      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock refresh token creation
      mockPrismaClient.refreshToken.create.mockResolvedValue({
        id: 'token123',
        token: 'refreshToken',
      });
      
      // Mock update last login
      mockPrismaClient.user.update.mockResolvedValue(mockUser);

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
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 401 with invalid credentials', async () => {
      // Mock Prisma user findUnique to return null
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const mockRefreshToken = {
        id: 'token123',
        token: 'validRefreshToken',
        userId: 'user123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          plan: 'FREE',
          isActive: true,
        },
      };

      // Mock Prisma refreshToken findUnique
      mockPrismaClient.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      
      // Mock new refresh token creation
      mockPrismaClient.refreshToken.create.mockResolvedValue({
        id: 'newToken123',
        token: 'newRefreshToken',
      });
      
      // Mock transaction for refresh token rotation
      mockPrismaClient.$transaction.mockImplementation((operations) => {
        return Promise.resolve([{}, { id: 'newToken123' }]);
      });

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
      // Mock Prisma refreshToken findUnique to return null
      mockPrismaClient.refreshToken.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalidRefreshToken',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });
});