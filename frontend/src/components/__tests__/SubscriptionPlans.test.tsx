import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionPlans from '../SubscriptionPlans';
import { stripeService } from '@/services/stripeService';

// Mock the stripe service
jest.mock('@/services/stripeService', () => ({
  stripeService: {
    getSubscription: jest.fn(),
    redirectToCheckout: jest.fn(),
  },
}));

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>;

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

describe('SubscriptionPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockStripeService.getSubscription.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<SubscriptionPlans />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render all subscription plans', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'FREE',
      status: 'active',
      cancelAtPeriodEnd: false,
    });

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    expect(screen.getByText('$0/month')).toBeInTheDocument();
    expect(screen.getByText('$9.99/month')).toBeInTheDocument();
    expect(screen.getByText('$29.99/month')).toBeInTheDocument();
  });

  it('should highlight current plan', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'PRO',
      status: 'active',
      cancelAtPeriodEnd: false,
    });

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getAllByText('Current Plan')).toHaveLength(2); // span + button
    });

    const currentPlanButton = screen.getByRole('button', { name: /current plan/i });
    expect(currentPlanButton).toBeDisabled();
  });

  it('should handle upgrade to pro plan', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'FREE',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
    mockStripeService.redirectToCheckout.mockResolvedValue();

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade to Pro');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('pro');
    });
  });

  it('should handle upgrade to enterprise plan', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'FREE',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
    mockStripeService.redirectToCheckout.mockResolvedValue();

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Enterprise')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade to Enterprise');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(mockStripeService.redirectToCheckout).toHaveBeenCalledWith('enterprise');
    });
  });

  it('should display error message on subscription load failure', async () => {
    mockStripeService.getSubscription.mockRejectedValue(new Error('Network error'));

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load subscription information')).toBeInTheDocument();
    });
  });

  it('should display error message on checkout failure', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'FREE',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
    mockStripeService.redirectToCheckout.mockRejectedValue(new Error('Checkout failed'));

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade to Pro');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to start checkout process/i)).toBeInTheDocument();
    });
  });

  it('should show subscription details for paid plans', async () => {
    const subscriptionData = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date('2024-12-31'),
      stripeSubscriptionId: 'sub_123',
    };

    mockStripeService.getSubscription.mockResolvedValue(subscriptionData);

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Current Subscription')).toBeInTheDocument();
      expect(screen.getByText('Plan: PRO')).toBeInTheDocument();
      expect(screen.getByText('Status: active')).toBeInTheDocument();
    });
  });

  it('should show cancel notice for subscriptions ending', async () => {
    const subscriptionData = {
      plan: 'PRO' as const,
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date('2024-12-31'),
      stripeSubscriptionId: 'sub_123',
    };

    mockStripeService.getSubscription.mockResolvedValue(subscriptionData);

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Will cancel at period end')).toBeInTheDocument();
    });
  });

  it('should show loading state during checkout', async () => {
    mockStripeService.getSubscription.mockResolvedValue({
      plan: 'FREE',
      status: 'active',
      cancelAtPeriodEnd: false,
    });
    
    // Mock a slow checkout process
    mockStripeService.redirectToCheckout.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByText('Upgrade to Pro');
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      // Check for any Processing... button (should be at least one)
      expect(screen.getAllByText('Processing...')).toHaveLength(2); // Pro and Enterprise buttons
    });
  });

  it('should close error message when x is clicked', async () => {
    mockStripeService.getSubscription.mockRejectedValue(new Error('Network error'));

    render(<SubscriptionPlans />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load subscription information')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(screen.queryByText('Failed to load subscription information')).not.toBeInTheDocument();
  });
});
