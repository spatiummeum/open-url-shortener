import { renderHook, waitFor, act } from '@testing-library/react';
import { useStripeSubscription } from '../useStripeSubscription';
import { stripeService } from '@/services/stripeService';

// Mock the stripe service
jest.mock('@/services/stripeService', () => ({
  stripeService: {
    getSubscription: jest.fn(),
    createCustomer: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
}));

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>;

describe('useStripeSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockStripeService.getSubscription.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useStripeSubscription());

    expect(result.current.loading).toBe(true);
    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should load subscription successfully', async () => {
    const mockSubscription = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2024-12-31'),
      stripeSubscriptionId: 'sub_123',
    };

    mockStripeService.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toEqual(mockSubscription);
    expect(result.current.error).toBeNull();
  });

  it('should handle subscription loading error', async () => {
    const errorMessage = 'Failed to load subscription';
    mockStripeService.getSubscription.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle null subscription', async () => {
    mockStripeService.getSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should upgrade to pro plan successfully', async () => {
    mockStripeService.getSubscription.mockResolvedValue(null);
    mockStripeService.redirectToCheckout.mockResolvedValue();

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.upgradeToPro();

    expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('pro');
  });

  it('should upgrade to enterprise plan successfully', async () => {
    mockStripeService.getSubscription.mockResolvedValue(null);
    mockStripeService.redirectToCheckout.mockResolvedValue();

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.upgradeToEnterprise();

    expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('enterprise');
  });

  it('should handle upgrade error', async () => {
    mockStripeService.getSubscription.mockResolvedValue(null);
    mockStripeService.redirectToCheckout.mockRejectedValue(new Error('Checkout failed'));

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await expect(result.current.upgradeToPro()).rejects.toThrow('Checkout failed');
  });

  it('should refresh subscription data', async () => {
    const initialSubscription = {
      plan: 'FREE' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
    };

    const updatedSubscription = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2024-12-31'),
      stripeSubscriptionId: 'sub_123',
    };

    mockStripeService.getSubscription
      .mockResolvedValueOnce(initialSubscription)
      .mockResolvedValueOnce(updatedSubscription);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.subscription).toEqual(initialSubscription);

    await act(async () => {
      await result.current.refreshSubscription();
    });

    await waitFor(() => {
      expect(result.current.subscription).toEqual(updatedSubscription);
    });
    
    expect(mockStripeService.getSubscription).toHaveBeenCalledTimes(2);
  });

  it('should check if user has pro plan', async () => {
    const proSubscription = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
    };

    mockStripeService.getSubscription.mockResolvedValue(proSubscription);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasProPlan).toBe(true);
    expect(result.current.hasEnterprisePlan).toBe(false);
  });

  it('should check if user has enterprise plan', async () => {
    const enterpriseSubscription = {
      plan: 'ENTERPRISE' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
    };

    mockStripeService.getSubscription.mockResolvedValue(enterpriseSubscription);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasProPlan).toBe(false);
    expect(result.current.hasEnterprisePlan).toBe(true);
  });

  it('should check subscription status correctly', async () => {
    const activeSubscription = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
    };

    mockStripeService.getSubscription.mockResolvedValue(activeSubscription);

    const { result } = renderHook(() => useStripeSubscription());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSubscriptionActive).toBe(true);
  });
});
