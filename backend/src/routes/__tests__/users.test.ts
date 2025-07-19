// @ts-nocheck
import request from 'supertest';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Simple mocks that work
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  url: {
    count: jest.fn(),
    aggregate: jest.fn(),
    updateMany: jest.fn(),
  },
  click: {
    count: jest.fn(),
  },
  refreshToken: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('../../utils/database', () => ({
  prisma: mockPrismaClient,
}));

jest.mock('../../middleware/rateLimiter', () => ({
  rateLimitURLCreation: (req: any, res: any, next: any) => next(),
  rateLimitModerate: (req: any, res: any, next: any) => next(),
  rateLimitStrict: (req: any, res: any, next: any) => next(),
  rateLimitLenient: (req: any, res: any, next: any) => next(),
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

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile with statistics', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        _count: {
          urls: 5,
          refreshTokens: 2
        }
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaClient.url.count.mockResolvedValue(3); // Monthly URLs
      mockPrismaClient.click.count.mockResolvedValue(150); // Monthly clicks

      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(response.body.user).toHaveProperty('id', 'user123');
      expect(response.body.user).toHaveProperty('totalUrls', 5);
      expect(response.body.user).toHaveProperty('activeSessions', 2);
      expect(response.body.user.monthlyStats).toEqual({
        urlsCreated: 3,
        totalClicks: 150
      });
    });

    it('should return 404 if user not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const mockUpdatedUser = {
        id: 'user123',
        email: 'updated@example.com',
        name: 'Updated Name',
        plan: 'FREE',
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.user.findFirst.mockResolvedValue(null); // Email not taken
      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/profile')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
        .expect(200);

      expect(response.body.user.name).toBe('Updated Name');
      expect(response.body.user.email).toBe('updated@example.com');
      expect(response.body.message).toContain('verify your new email');
    });

    it('should return 409 if email is already taken', async () => {
      const mockExistingUser = {
        id: 'other-user',
        email: 'taken@example.com'
      };

      mockPrismaClient.user.findFirst.mockResolvedValue(mockExistingUser);

      const response = await request(app)
        .put('/api/users/profile')
        .send({
          email: 'taken@example.com'
        })
        .expect(409);

      expect(response.body.error).toBe('Email address is already taken');
    });
  });

  describe('PUT /api/users/password', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user123',
        password: 'hashedOldPassword'
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaClient.user.update.mockResolvedValue({});
      mockPrismaClient.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'oldPassword',
          newPassword: 'NewPassword123'
        })
        .expect(200);

      expect(response.body.message).toContain('Password updated successfully');
      expect(mockPrismaClient.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user123' }
      });
    });

    it('should return 400 if current password is incorrect', async () => {
      const mockUser = {
        id: 'user123',
        password: 'hashedOldPassword'
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .put('/api/users/password')
        .send({
          currentPassword: 'wrongPassword',
          newPassword: 'NewPassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Current password is incorrect');
    });
  });

  describe('GET /api/users/sessions', () => {
    it('should return user sessions', async () => {
      const mockSessions = [
        {
          id: 'session1',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        {
          id: 'session2',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago (expired)
        }
      ];

      mockPrismaClient.refreshToken.findMany.mockResolvedValue(mockSessions);

      const response = await request(app)
        .get('/api/users/sessions')
        .expect(200);

      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions[0].isActive).toBe(true);
      expect(response.body.sessions[1].isActive).toBe(false);
    });
  });

  describe('DELETE /api/users/sessions/:sessionId', () => {
    it('should revoke specific session', async () => {
      mockPrismaClient.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const response = await request(app)
        .delete('/api/users/sessions/session123')
        .expect(200);

      expect(response.body.message).toBe('Session revoked successfully');
      expect(mockPrismaClient.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'session123',
          userId: 'user123'
        }
      });
    });

    it('should return 404 if session not found', async () => {
      mockPrismaClient.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const response = await request(app)
        .delete('/api/users/sessions/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Session not found');
    });
  });

  describe('DELETE /api/users/sessions', () => {
    it('should revoke all sessions', async () => {
      mockPrismaClient.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const response = await request(app)
        .delete('/api/users/sessions')
        .expect(200);

      expect(response.body.message).toContain('All sessions revoked successfully');
    });
  });

  describe('DELETE /api/users/account', () => {
    it('should delete user account', async () => {
      const mockUser = {
        id: 'user123',
        password: 'hashedPassword',
        email: 'test@example.com'
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaClient.user.update.mockResolvedValue({});
      mockPrismaClient.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaClient.url.updateMany.mockResolvedValue({ count: 5 });

      const response = await request(app)
        .delete('/api/users/account')
        .send({
          password: 'correctPassword',
          confirmation: 'DELETE'
        })
        .expect(200);

      expect(response.body.message).toBe('Account deleted successfully');
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'user123' },
        data: {
          isActive: false,
          email: expect.stringContaining('deleted_'),
          name: null
        }
      });
    });

    it('should return 400 if password is incorrect', async () => {
      const mockUser = {
        id: 'user123',
        password: 'hashedPassword',
        email: 'test@example.com'
      };

      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/users/account')
        .send({
          password: 'wrongPassword',
          confirmation: 'DELETE'
        })
        .expect(400);

      expect(response.body.error).toBe('Password is incorrect');
    });
  });
});