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

jest.mock('express-validator', () => ({
  validationResult: jest.fn().mockReturnValue({
    isEmpty: () => true,
    array: () => []
  }),
}));

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
    validatePasswordResetConfirm: [mockValidationChain],
  };
});

jest.mock('../../middleware/auth', () => ({
  requireAuth: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      id: 'user_123',
      email: 'test@example.com',
      plan: 'FREE',
    };
    next();
  }),
  optionalAuth: jest.fn((req: any, res: any, next: any) => {
    // Mock optionalAuth to either have a user or not, depending on the test case.
    // For simplicity here, we can just call next().
    next();
  }),
}));

import app from '../../app';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  subscription: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
} as any;

// Mock Stripe service
jest.mock('../../services/stripeService', () => ({
  createCustomer: jest.fn(),
  createCheckoutSession: jest.fn(),
}));

import { createCustomer, createCheckoutSession } from '../../services/stripeService';

describe('Stripe Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PrismaClient as jest.MockedClass<typeof PrismaClient>).mockImplementation(() => mockPrisma);
  });

  describe('GET /api/stripe/config', () => {
    it('should return Stripe configuration', async () => {
      const response = await request(app)
        .get('/api/stripe/config')
        .expect(200);

      expect(response.body).toHaveProperty('priceIds');
      expect(response.body).toHaveProperty('publishableKey');
      expect(response.body.priceIds).toHaveProperty('pro');
      expect(response.body.priceIds).toHaveProperty('enterprise');
    });
  });

  describe('POST /api/stripe/customer', () => {
    it('should create a new customer', async () => {
      const mockCustomer = { id: 'cus_123' };
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      (createCustomer as jest.MockedFunction<typeof createCustomer>)
        .mockResolvedValue(mockCustomer as any);

      const response = await request(app)
        .post('/api/stripe/customer')
        .expect(200);

      expect(response.body).toEqual({ customer: mockCustomer });
      expect(createCustomer).toHaveBeenCalledWith('user_123', 'test@example.com');
    });

    it('should return existing customer if subscription exists', async () => {
      const mockSubscription = { stripeCustomerId: 'cus_existing' };
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .post('/api/stripe/customer')
        .expect(200);

      expect(response.body).toEqual({ 
        customer: { id: 'cus_existing' } 
      });
      expect(createCustomer).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/stripe/checkout', () => {
    it('should create checkout session', async () => {
      const mockSession = { 
        url: 'https://checkout.stripe.com/pay/cs_123' 
      };
      (createCheckoutSession as jest.MockedFunction<typeof createCheckoutSession>)
        .mockResolvedValue(mockSession as any);

      const checkoutData = {
        priceId: 'price_123',
        successUrl: 'https://success.com',
        cancelUrl: 'https://cancel.com',
      };

      const response = await request(app)
        .post('/api/stripe/checkout')
        .send(checkoutData)
        .expect(200);

      expect(response.body).toEqual({ url: mockSession.url });
      expect(createCheckoutSession).toHaveBeenCalledWith(
        'user_123',
        'price_123',
        'https://success.com',
        'https://cancel.com'
      );
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(app)
        .post('/api/stripe/checkout')
        .send({ priceId: 'price_123' }) // Missing successUrl and cancelUrl
        .expect(400);

      expect(response.body).toEqual({ 
        error: 'Missing required parameters' 
      });
    });

    it('should handle checkout creation errors', async () => {
      (createCheckoutSession as jest.MockedFunction<typeof createCheckoutSession>)
        .mockRejectedValue(new Error('Checkout error'));

      const checkoutData = {
        priceId: 'price_123',
        successUrl: 'https://success.com',
        cancelUrl: 'https://cancel.com',
      };

      const response = await request(app)
        .post('/api/stripe/checkout')
        .send(checkoutData)
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Checkout error' 
      });
    });
  });

  describe('GET /api/stripe/subscription', () => {
    it('should return user subscription', async () => {
      const mockSubscription = {
        plan: 'PRO',
        status: 'active',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_123',
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);

      const response = await request(app)
        .get('/api/stripe/subscription')
        .expect(200);

      expect(response.body).toEqual({ subscription: mockSubscription });
      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        select: {
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          stripeSubscriptionId: true,
        },
      });
    });

    it('should return null for non-existent subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/stripe/subscription')
        .expect(200);

      expect(response.body).toEqual({ subscription: null });
    });
  });
});
