import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import Stripe from 'stripe';

// Mock Prisma first
const mockPrisma = {
  subscription: {
    create: jest.fn() as jest.MockedFunction<any>,
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
    updateMany: jest.fn() as jest.MockedFunction<any>,
  },
  user: {
    findUnique: jest.fn() as jest.MockedFunction<any>,
    update: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock Stripe
const mockStripe = {
  customers: {
    create: jest.fn() as jest.MockedFunction<any>,
  },
  checkout: {
    sessions: {
      create: jest.fn() as jest.MockedFunction<any>,
    },
  },
  webhooks: {
    constructEvent: jest.fn() as jest.MockedFunction<any>,
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

// Import after mocking
import { createCustomer, createCheckoutSession, handleWebhook } from '../stripeService';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    STRIPE_SECRET_KEY: 'sk_test_123',
    STRIPE_WEBHOOK_SECRET: 'whsec_123',
  };
  
  // Reset all mocks
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = originalEnv;
});

describe('StripeService', () => {
  describe('createCustomer', () => {
    it('should create a Stripe customer and subscription', async () => {
      const mockCustomer = { id: 'cus_123', email: 'test@example.com' };
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockPrisma.subscription.create.mockResolvedValue({
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
        plan: 'FREE',
        status: 'inactive',
      });

      const result = await createCustomer('user_123', 'test@example.com');

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: { userId: 'user_123' },
      });
      
      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          stripeCustomerId: 'cus_123',
          plan: 'FREE',
          status: 'inactive',
        },
      });
      
      expect(result).toEqual(mockCustomer);
    });

    it('should handle Stripe API errors', async () => {
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe API error'));

      await expect(createCustomer('user_123', 'test@example.com'))
        .rejects.toThrow('Stripe API error');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for existing subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
      };
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/pay/cs_123',
      };

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createCheckoutSession(
        'user_123',
        'price_123',
        'https://success.com',
        'https://cancel.com'
      );

      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
      });
      
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        payment_method_types: ['card'],
        line_items: [{ price: 'price_123', quantity: 1 }],
        mode: 'subscription',
        success_url: 'https://success.com',
        cancel_url: 'https://cancel.com',
        metadata: { userId: 'user_123' },
      });
      
      expect(result).toEqual(mockSession);
    });

    it('should create customer and subscription if not exists', async () => {
      const mockUser = { id: 'user_123', email: 'test@example.com' };
      const mockCustomer = { id: 'cus_123', email: 'test@example.com' };
      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
      };
      const mockSession = {
        id: 'cs_123',
        url: 'https://checkout.stripe.com/pay/cs_123',
      };

      // First call returns null (no subscription), second call returns the created subscription
      mockPrisma.subscription.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSubscription);
      
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockPrisma.subscription.create.mockResolvedValue(mockSubscription);
      mockStripe.checkout.sessions.create.mockResolvedValue(mockSession);

      const result = await createCheckoutSession(
        'user_123',
        'price_123',
        'https://success.com',
        'https://cancel.com'
      );

      expect(result).toEqual(mockSession);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(createCheckoutSession(
        'user_123',
        'price_123',
        'https://success.com',
        'https://cancel.com'
      )).rejects.toThrow('User not found');
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout.session.completed event', async () => {
      const mockEvent = {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            metadata: { userId: 'user_123' },
            subscription: 'sub_stripe_123', // Added this line
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
        plan: 'PRO',
      };

      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.subscription.update.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await handleWebhook(mockEvent);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { userId: 'user_123' }, // Changed from id to userId
        data: {
          stripeSubscriptionId: 'sub_stripe_123',
        },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { plan: 'PRO' },
      });
    });

    it('should handle customer.subscription.created event', async () => {
      process.env.STRIPE_PRICE_ID_PRO = 'price_pro'; // Mock the env variable
      const mockEvent = {
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_stripe_123',
            customer: 'cus_123',
            status: 'active',
            current_period_start: 1640995200, // Jan 1, 2022
            current_period_end: 1643673600,   // Feb 1, 2022
            cancel_at_period_end: false,
            items: {
              data: [{ price: { id: 'price_pro' } }],
            },
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
      };

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await handleWebhook(mockEvent);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_123' },
        data: {
          stripeSubscriptionId: 'sub_stripe_123',
          status: 'active',
          plan: 'PRO', // Expected PRO
          currentPeriodStart: new Date(1640995200 * 1000),
          currentPeriodEnd: new Date(1643673600 * 1000),
          cancelAtPeriodEnd: false,
        },
      });
    });

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_123',
            customer: 'cus_123',
          },
        },
      } as unknown as Stripe.Event;

      const mockSubscription = {
        id: 'sub_123',
        userId: 'user_123',
        stripeCustomerId: 'cus_123',
      };

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrisma.user.update.mockResolvedValue({});

      await handleWebhook(mockEvent);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_123' },
        data: {
          status: 'canceled',
          plan: 'FREE',
          cancelAtPeriodEnd: true,
        },
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user_123' },
        data: { plan: 'FREE' },
      });
    });

    it('should handle unknown event types gracefully', async () => {
      const mockEvent = {
        type: 'unknown.event.type',
        data: { object: {} },
      } as unknown as Stripe.Event;

      // Should not throw
      await expect(handleWebhook(mockEvent)).resolves.toBeUndefined();
    });
  });
});
