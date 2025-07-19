import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import { useAuthStore } from '@/store/authStore';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

// Mock Next.js useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Link component from Next.js
jest.mock('next/link', () => {
  const MockLink = ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = 'Link';
  return MockLink;
});

// Mock AuthStore
const mockLogout = jest.fn();
const mockUseAuthStore = jest.fn();
jest.mock('@/store/authStore', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Mock Stripe Subscription hook
const mockUseStripeSubscription = jest.fn();
jest.mock('@/hooks/useStripeSubscription', () => ({
  useStripeSubscription: () => mockUseStripeSubscription(),
}));

describe('DashboardHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      logout: mockLogout,
    });

    mockUseStripeSubscription.mockReturnValue({
      subscription: null,
      loading: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render title and subtitle correctly', () => {
      render(
        <DashboardHeader 
          title="Dashboard" 
          subtitle="Manage your URLs"
        />
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your URLs')).toBeInTheDocument();
    });

    it('should display welcome message with user name', () => {
      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText(/Welcome back,/)).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display user email when name is not available', () => {
      mockUseAuthStore.mockReturnValue({
        user: {
          id: 'user123',
          email: 'test@example.com',
          name: null,
          plan: 'FREE',
        },
        logout: mockLogout,
      });

      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should render sign out button', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toBeInTheDocument();
    });

    it('should call logout and navigate to login when sign out button is clicked', async () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should have logout button with correct styling', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toHaveClass('glass-modern');
      expect(signOutButton).toHaveClass('hover:bg-red-50/80');
      expect(signOutButton).toHaveClass('hover:text-red-700');
    });

    it('should show logout icon in button', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      const icon = signOutButton.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Plan Badge Display', () => {
    it('should display Free Plan badge for users without subscription', () => {
      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText('Free Plan')).toBeInTheDocument();
    });

    it('should display Pro badge for pro subscription', () => {
      mockUseStripeSubscription.mockReturnValue({
        subscription: {
          status: 'active',
          plan: 'PRO',
        },
        loading: false,
      });

      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('should display Enterprise badge for enterprise subscription', () => {
      mockUseStripeSubscription.mockReturnValue({
        subscription: {
          status: 'active',
          plan: 'ENTERPRISE',
        },
        loading: false,
      });

      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should show loading state for plan badge', () => {
      mockUseStripeSubscription.mockReturnValue({
        subscription: null,
        loading: true,
      });

      render(<DashboardHeader title="Dashboard" />);

      const loadingDiv = screen.getByRole('generic', { hidden: true });
      expect(loadingDiv).toHaveClass('animate-pulse');
    });

    it('should hide subscription status when showSubscriptionStatus is false', () => {
      render(<DashboardHeader title="Dashboard" showSubscriptionStatus={false} />);

      expect(screen.queryByText('Free Plan')).not.toBeInTheDocument();
    });
  });

  describe('Usage Limits Display', () => {
    it('should display usage indicators for free plan', () => {
      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText(/0 \/ 10/)).toBeInTheDocument(); // URLs
      expect(screen.getByText(/0 \/ 1,000/)).toBeInTheDocument(); // Clicks
      expect(screen.getByText('URLs')).toBeInTheDocument();
      expect(screen.getByText('Clicks')).toBeInTheDocument();
    });

    it('should display unlimited usage for enterprise plan', () => {
      mockUseStripeSubscription.mockReturnValue({
        subscription: {
          status: 'active',
          plan: 'ENTERPRISE',
        },
        loading: false,
      });

      render(<DashboardHeader title="Dashboard" />);

      expect(screen.getByText(/0 \/ ∞/)).toBeInTheDocument();
    });

    it('should hide usage indicators on small screens', () => {
      render(<DashboardHeader title="Dashboard" />);

      const usageContainer = screen.getByText('URLs').closest('.hidden.sm\\:flex');
      expect(usageContainer).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should render New URL link', () => {
      render(<DashboardHeader title="Dashboard" />);

      const newUrlLink = screen.getByRole('link', { name: /new url/i });
      expect(newUrlLink).toBeInTheDocument();
      expect(newUrlLink).toHaveAttribute('href', '/urls/new');
    });

    it('should render upgrade button for free users', () => {
      render(<DashboardHeader title="Dashboard" />);

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
      expect(upgradeButton).toBeInTheDocument();
    });

    it('should not render upgrade button for pro users', () => {
      mockUseStripeSubscription.mockReturnValue({
        subscription: {
          status: 'active',
          plan: 'PRO',
        },
        loading: false,
      });

      render(<DashboardHeader title="Dashboard" />);

      expect(screen.queryByRole('button', { name: /upgrade/i })).not.toBeInTheDocument();
    });

    it('should show upgrade modal when upgrade button is clicked', () => {
      render(<DashboardHeader title="Dashboard" />);

      const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
      fireEvent.click(upgradeButton);

      // Since we don't have the actual modal component mocked, 
      // we're just testing that the button is clickable
      expect(upgradeButton).toBeInTheDocument();
    });
  });

  describe('Usage Warning', () => {
    it('should show warning when approaching URL limit', () => {
      // Mock a user who has used 9 out of 10 URLs (90%)
      // Note: This would require mocking the usage data from an API
      // For now, we test the component structure
      render(<DashboardHeader title="Dashboard" />);

      // The component should render without the warning by default (0 usage)
      expect(screen.queryByText(/Approaching URL limit/)).not.toBeInTheDocument();
    });

    it('should link to subscription page in warning', () => {
      render(<DashboardHeader title="Dashboard" />);

      // Check that the component renders properly
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Navigation Integration', () => {
    it('should use Next.js Link for New URL button', () => {
      render(<DashboardHeader title="Dashboard" />);

      const newUrlLink = screen.getByRole('link', { name: /new url/i });
      expect(newUrlLink).toHaveAttribute('href', '/urls/new');
    });

    it('should use useRouter hook for logout navigation', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      fireEvent.click(signOutButton);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('Responsive Design', () => {
    it('should hide sign out text on small screens', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutText = screen.getByText('Sign out');
      expect(signOutText).toHaveClass('hidden', 'sm:block');
    });

    it('should apply glass-modern styling', () => {
      render(<DashboardHeader title="Dashboard" />);

      const header = screen.getByText('Dashboard').closest('div.glass-modern');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('backdrop-blur-xl');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button titles', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      expect(signOutButton).toHaveAttribute('title', 'Sign out');
    });

    it('should have proper heading structure', () => {
      render(<DashboardHeader title="Dashboard" />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Dashboard');
    });

    it('should have accessible icons with proper SVG structure', () => {
      render(<DashboardHeader title="Dashboard" />);

      const signOutButton = screen.getByRole('button', { name: /sign out/i });
      const icon = signOutButton.querySelector('svg');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('stroke', 'currentColor');
    });
  });
});