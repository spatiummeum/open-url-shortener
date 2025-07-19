// @ts-nocheck
import request from 'supertest';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Simple mocks that work
const mockPrismaClient = {
  url: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
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
  handleValidationErrors: (req: any, res: any, next: any) => next(),
  sanitizeInput: (req: any, res: any, next: any) => next(),
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

jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('abc12345'),
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

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: jest.fn() } },
    customers: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  }));
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mockToken'),
  verify: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

import app from '../../app';

describe('URLs Routes - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3002';
  });

  describe('POST /api/urls', () => {
    it('should create URL with correct port', async () => {
      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        title: null,
        description: null,
        expiresAt: null,
        createdAt: new Date(),
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'user123', plan: 'FREE' });
      mockPrismaClient.url.count.mockResolvedValue(5);
      mockPrismaClient.url.findUnique.mockResolvedValue(null); // For generateShortCode
      mockPrismaClient.url.create.mockResolvedValue(mockUrl);

      const response = await request(app)
        .post('/api/urls')
        .send({ originalUrl: 'https://example.com' })
        .expect(201);

      expect(response.body.shortUrl).toBe('http://localhost:3002/abc12345');
    });
  });

  describe('GET /api/urls', () => {
    it('should return user URLs', async () => {
      const mockUrls = [
        {
          id: 'url1',
          originalUrl: 'https://example.com',
          shortCode: 'abc123',
          title: 'Test',
          description: null,
          isActive: true,
          createdAt: new Date(),
          clicks: 5,
          _count: { clicks: 5 },
        },
      ];

      mockPrismaClient.url.findMany.mockResolvedValue(mockUrls);
      mockPrismaClient.url.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/urls')
        .expect(200);

      expect(response.body.urls).toHaveLength(1);
      expect(response.body.urls[0].shortUrl).toBe('http://localhost:3002/abc123');
    });
  });

  describe('GET /api/urls/:id', () => {
    it('should return specific URL', async () => {
      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        title: 'Test',
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        _count: { clicks: 10 },
      };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockUrl);

      const response = await request(app)
        .get('/api/urls/url123')
        .expect(200);

      expect(response.body.shortUrl).toBe('http://localhost:3002/abc123');
      expect(response.body.clickCount).toBe(10);
    });

    it('should return 404 for non-existent URL', async () => {
      mockPrismaClient.url.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/urls/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('URL not found');
    });
  });

  describe('PUT /api/urls/:id', () => {
    it('should update URL', async () => {
      const mockExistingUrl = {
        id: 'url123',
        title: 'Old Title',
        description: 'Old Description',
        isActive: true,
      };

      const mockUpdatedUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        title: 'New Title',
        description: 'New Description',
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockExistingUrl);
      mockPrismaClient.url.update.mockResolvedValue(mockUpdatedUrl);

      const response = await request(app)
        .put('/api/urls/url123')
        .send({ title: 'New Title', description: 'New Description' })
        .expect(200);

      expect(response.body.shortUrl).toBe('http://localhost:3002/abc123');
      expect(response.body.title).toBe('New Title');
    });
  });

  describe('DELETE /api/urls/:id', () => {
    it('should delete URL', async () => {
      const mockUrl = { id: 'url123', userId: 'user123' };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockUrl);
      mockPrismaClient.url.delete.mockResolvedValue({});

      await request(app)
        .delete('/api/urls/url123')
        .expect(204);

      expect(mockPrismaClient.url.delete).toHaveBeenCalledWith({
        where: { id: 'url123' }
      });
    });
  });
});