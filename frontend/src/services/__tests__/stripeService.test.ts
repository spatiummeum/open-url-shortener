import stripeService from '../stripeService';
import type { StripeConfig, StripeCustomer, CheckoutSession, Subscription } from '../stripeService';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock environment variable
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  mockLocation.href = '';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('StripeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch Stripe configuration', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
        publishableKey: 'pk_test_123',
      };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });

      const result = await stripeService.getConfig();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/stripe/config');
      expect(result).toEqual(mockConfig);
    });

    it('should use default API base URL', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });

      await stripeService.getConfig();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/stripe/config');
    });
  });

  describe('createCustomer', () => {
    it('should create Stripe customer', async () => {
      const mockCustomer: StripeCustomer = { id: 'cus_123' };
      mockedAxios.post.mockResolvedValue({ data: { customer: mockCustomer } });

      const result = await stripeService.createCustomer();

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/stripe/customer', {}, undefined);
      expect(result).toEqual(mockCustomer);
    });

    it('should pass axios config to createCustomer', async () => {
      const mockCustomer: StripeCustomer = { id: 'cus_123' };
      const config = { headers: { Authorization: 'Bearer token' } };
      mockedAxios.post.mockResolvedValue({ data: { customer: mockCustomer } });

      await stripeService.createCustomer(config);

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/stripe/customer', {}, config);
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_123' };
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      const result = await stripeService.createCheckoutSession(
        'price_123',
        'https://success.com',
        'https://cancel.com'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        {
          priceId: 'price_123',
          successUrl: 'https://success.com',
          cancelUrl: 'https://cancel.com',
        },
        undefined
      );
      expect(result).toEqual(mockSession);
    });

    it('should pass axios config to createCheckoutSession', async () => {
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_123' };
      const config = { headers: { Authorization: 'Bearer token' } };
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      await stripeService.createCheckoutSession(
        'price_123',
        'https://success.com',
        'https://cancel.com',
        config
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        {
          priceId: 'price_123',
          successUrl: 'https://success.com',
          cancelUrl: 'https://cancel.com',
        },
        config
      );
    });
  });

  describe('getSubscription', () => {
    it('should fetch user subscription', async () => {
      const mockSubscription: Subscription = {
        plan: 'PRO',
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date('2024-12-31'),
        stripeSubscriptionId: 'sub_123',
      };

      mockedAxios.get.mockResolvedValue({ data: { subscription: mockSubscription } });

      const result = await stripeService.getSubscription();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/stripe/subscription', undefined);
      expect(result).toEqual(mockSubscription);
    });

    it('should handle null subscription', async () => {
      mockedAxios.get.mockResolvedValue({ data: { subscription: null } });

      const result = await stripeService.getSubscription();

      expect(result).toBeNull();
    });

    it('should pass axios config to getSubscription', async () => {
      const config = { headers: { Authorization: 'Bearer token' } };
      mockedAxios.get.mockResolvedValue({ data: { subscription: null } });

      await stripeService.getSubscription(config);

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/stripe/subscription', config);
    });
  });

  describe('redirectToCheckout', () => {
    it('should redirect to checkout for pro plan', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_123' };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      await stripeService.redirectToCheckout('pro');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/stripe/config');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        {
          priceId: 'price_pro123',
          successUrl: 'http://localhost:3000/dashboard?payment=success',
          cancelUrl: 'http://localhost:3000/dashboard?payment=canceled',
        },
        undefined
      );
      expect(mockLocation.href).toBe('https://checkout.stripe.com/session_123');
    });

    it('should redirect to checkout for enterprise plan', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_456' };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      await stripeService.redirectToCheckout('enterprise');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        expect.objectContaining({
          priceId: 'price_ent123',
        }),
        undefined
      );
      expect(mockLocation.href).toBe('https://checkout.stripe.com/session_456');
    });

    it('should use custom success and cancel URLs', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_123' };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      await stripeService.redirectToCheckout(
        'pro',
        'https://custom-success.com',
        'https://custom-cancel.com'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        {
          priceId: 'price_pro123',
          successUrl: 'https://custom-success.com',
          cancelUrl: 'https://custom-cancel.com',
        },
        undefined
      );
    });

    it('should throw error if price ID not found', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });

      await expect(
        stripeService.redirectToCheckout('invalid' as any)
      ).rejects.toThrow('Price ID not found for plan: invalid');
    });

    it('should throw error if no checkout URL received', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });
      mockedAxios.post.mockResolvedValue({ data: { url: null } });

      await expect(
        stripeService.redirectToCheckout('pro')
      ).rejects.toThrow('No checkout URL received');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(
        stripeService.redirectToCheckout('pro')
      ).rejects.toThrow('Network error');
    });

    it('should pass axios config to redirectToCheckout', async () => {
      const mockConfig: StripeConfig = {
        priceIds: {
          pro: 'price_pro123',
          enterprise: 'price_ent123',
        },
      };
      const mockSession: CheckoutSession = { url: 'https://checkout.stripe.com/session_123' };
      const config = { headers: { Authorization: 'Bearer token' } };

      mockedAxios.get.mockResolvedValue({ data: mockConfig });
      mockedAxios.post.mockResolvedValue({ data: mockSession });

      await stripeService.redirectToCheckout('pro', undefined, undefined, config);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/stripe/checkout',
        expect.any(Object),
        config
      );
    });
  });
});
