// @ts-nocheck
import request from 'supertest';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

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
  };
});

// Mock auth middleware
const mockRequireAuth = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'FREE',
  };
  next();
});

const mockOptionalAuth = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'FREE',
  };
  next();
});

jest.mock('../../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
  optionalAuth: mockOptionalAuth,
}));

// Mock Prisma Client
const mockPrismaClient = {
  url: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
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

// Mock nanoid
jest.mock('nanoid', () => ({
  nanoid: jest.fn().mockReturnValue('abc12345'),
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

describe('URLs Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.BASE_URL = 'http://localhost:3002';
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /api/urls', () => {
    it('should create URL with correct port (3002)', async () => {
      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        title: null,
        description: null,
        userId: 'user123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: 0,
      };

      // Mock user limits check
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user123',
        plan: 'FREE',
      });

      // Mock URL count check
      mockPrismaClient.url.count.mockResolvedValue(5); // Under FREE limit

      // Mock URL creation
      mockPrismaClient.url.create.mockResolvedValue(mockUrl);

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('shortUrl');
      
      // Verify the shortUrl uses correct port (3002)
      expect(response.body.shortUrl).toBe('http://localhost:3002/abc12345');
      
      expect(mockPrismaClient.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://example.com',
          shortCode: 'abc12345',
          userId: 'user123',
          title: null,
          description: null,
          password: null,
          expiresAt: null,
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          createdAt: true
        }
      });
    });

    it('should use BASE_URL environment variable for shortUrl generation', async () => {
      // Override BASE_URL for this test
      process.env.BASE_URL = 'https://myshortener.com';

      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        userId: 'user123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: 0,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user123',
        plan: 'FREE',
      });
      mockPrismaClient.url.count.mockResolvedValue(5);
      mockPrismaClient.url.create.mockResolvedValue(mockUrl);

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
        })
        .expect(201);

      expect(response.body.shortUrl).toBe('https://myshortener.com/abc12345');
    });

    it('should fallback to localhost:3002 when BASE_URL not set', async () => {
      // Remove BASE_URL
      delete process.env.BASE_URL;

      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        userId: 'user123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: 0,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user123',
        plan: 'FREE',
      });
      mockPrismaClient.url.count.mockResolvedValue(5);
      mockPrismaClient.url.create.mockResolvedValue(mockUrl);

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
        })
        .expect(201);

      // Should fallback to localhost:3002 (not 3001)
      expect(response.body.shortUrl).toBe('http://localhost:3002/abc12345');
    });

    it('should respect plan limits for URL creation', async () => {
      // Mock user with FREE plan
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user123',
        plan: 'FREE',
      });

      // Mock URL count at FREE limit (10)
      mockPrismaClient.url.count.mockResolvedValue(10);

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('limit');
    });

    it('should create URL with custom title and description', async () => {
      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        title: 'My Custom Title',
        description: 'My Custom Description',
        userId: 'user123',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: 0,
      };

      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: 'user123',
        plan: 'FREE',
      });
      mockPrismaClient.url.count.mockResolvedValue(5);
      mockPrismaClient.url.create.mockResolvedValue(mockUrl);

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'https://example.com',
          title: 'My Custom Title',
          description: 'My Custom Description',
        })
        .expect(201);

      expect(response.body.title).toBe('My Custom Title');
      expect(response.body.description).toBe('My Custom Description');
      
      expect(mockPrismaClient.url.create).toHaveBeenCalledWith({
        data: {
          originalUrl: 'https://example.com',
          shortCode: 'abc12345',
          userId: 'user123',
          title: 'My Custom Title',
          description: 'My Custom Description',
        },
      });
    });

    it('should validate originalUrl format', async () => {
      // Mock optionalAuth to not set a user for this test
      mockOptionalAuth.mockImplementationOnce((req: any, res: any, next: any) => {
        // No user set, so it's an anonymous request
        next();
      });

      const response = await request(app)
        .post('/api/urls')
        .send({
          originalUrl: 'not-a-valid-url',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/urls', () => {
    it('should return user URLs with correct shortUrl format', async () => {
      const mockUrls = [
        {
          id: 'url1',
          originalUrl: 'https://example1.com',
          shortCode: 'abc12345',
          title: 'Example 1',
          description: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          clicks: 5,
          _count: { clicks: 5 },
        },
        {
          id: 'url2',
          originalUrl: 'https://example2.com',
          shortCode: 'def67890',
          title: null,
          description: 'Example 2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          clicks: 10,
          _count: { clicks: 10 },
        },
      ];

      mockPrismaClient.url.findMany.mockResolvedValue(mockUrls);
      mockPrismaClient.url.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/urls')
        .expect(200);

      expect(response.body).toHaveProperty('urls');
      expect(response.body.urls).toHaveLength(2);
      expect(response.body).toHaveProperty('pagination');
      
      // Verify shortUrl format with correct port
      expect(response.body.urls[0].shortUrl).toBe('http://localhost:3002/abc12345');
      expect(response.body.urls[1].shortUrl).toBe('http://localhost:3002/def67890');
      
      expect(mockPrismaClient.url.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          clicks: true,
          _count: {
            select: { clicks: true }
          }
        }
      });
    });

    it('should handle pagination correctly', async () => {
      const mockUrls = Array.from({ length: 5 }, (_, i) => ({
        id: `url${i}`,
        originalUrl: `https://example${i}.com`,
        shortCode: `code${i}`,
        title: `Example ${i}`,
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        clicks: i,
        _count: { clicks: i },
      }));

      mockPrismaClient.url.findMany.mockResolvedValue(mockUrls);
      mockPrismaClient.url.count.mockResolvedValue(5);

      const response = await request(app)
        .get('/api/urls?page=2&limit=5')
        .expect(200);

      expect(mockPrismaClient.url.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 5, // (page - 1) * limit = (2 - 1) * 5
        take: 5,
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          clicks: true,
          _count: {
            select: { clicks: true }
          }
        }
      });
    });
  });

  describe('GET /api/urls/:id', () => {
    it('should return specific URL with correct shortUrl format', async () => {
      const mockUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        title: 'Example',
        description: 'Test URL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { clicks: 15 },
      };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockUrl);

      const response = await request(app)
        .get('/api/urls/url123')
        .expect(200);

      expect(response.body.shortUrl).toBe('http://localhost:3002/abc12345');
      expect(response.body.clickCount).toBe(15);
      
      expect(mockPrismaClient.url.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'url123',
          userId: 'user123',
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { clicks: true }
          }
        }
      });
    });

    it('should return 404 for non-existent URL', async () => {
      mockPrismaClient.url.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/urls/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'URL not found');
    });
  });

  describe('PUT /api/urls/:id', () => {
    it('should update URL and return with correct shortUrl format', async () => {
      const mockExistingUrl = {
        id: 'url123',
        title: 'Old Title',
        description: 'Old Description',
        isActive: true,
      };

      const mockUpdatedUrl = {
        id: 'url123',
        originalUrl: 'https://example.com',
        shortCode: 'abc12345',
        title: 'Updated Title',
        description: 'Updated Description',
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockExistingUrl);
      mockPrismaClient.url.update.mockResolvedValue(mockUpdatedUrl);

      const response = await request(app)
        .put('/api/urls/url123')
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        })
        .expect(200);

      expect(response.body.shortUrl).toBe('http://localhost:3002/abc12345');
      expect(response.body.title).toBe('Updated Title');
      
      expect(mockPrismaClient.url.update).toHaveBeenCalledWith({
        where: { id: 'url123' },
        data: {
          title: 'Updated Title',
          description: 'Updated Description',
          isActive: true,
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      });
    });
  });

  describe('DELETE /api/urls/:id', () => {
    it('should delete URL and return 204', async () => {
      const mockUrl = {
        id: 'url123',
        userId: 'user123',
      };

      mockPrismaClient.url.findFirst.mockResolvedValue(mockUrl);
      mockPrismaClient.url.delete.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/urls/url123')
        .expect(204);

      expect(response.body).toEqual({});
      
      expect(mockPrismaClient.url.delete).toHaveBeenCalledWith({
        where: { id: 'url123' }
      });
    });
  });
});