// @ts-nocheck
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mock Prisma Client
const mockPrismaClient = {
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

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

import { requireAuth, AuthRequest } from '../auth';

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();

    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('requireAuth middleware', () => {
    it('should call next() when valid token and user provided', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
      };

      // Set up request with valid token
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { id: true, email: true, name: true, plan: true, isActive: true },
      });
      expect(mockRequest.user).toEqual({
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 when no authorization header provided', async () => {
      // No authorization header
      mockRequest.headers = {};

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no Bearer token', async () => {
      // Authorization header without Bearer
      mockRequest.headers = {
        authorization: 'Invalid format',
      };

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when JWT verification fails', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      // Mock JWT verification to throw error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found in database', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'nonexistent' });
      
      // Mock Prisma user findUnique to return null
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is inactive', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: false, // User is inactive
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique to throw error
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database connection error'));

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer header', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
      };

      mockRequest.headers = {
        authorization: 'Bearer   token-with-spaces   ',
      };

      // Mock JWT verification
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user123' });
      
      // Mock Prisma user findUnique
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith('  token-with-spaces   ', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle malformed JWT token payload', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      // Mock JWT verification to return malformed payload
      (jwt.verify as jest.Mock).mockReturnValue({ wrongField: 'noUserId' });

      await requireAuth(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: undefined },
        select: { id: true, email: true, name: true, plan: true, isActive: true },
      });
      // Should fail because userId is undefined
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });
});