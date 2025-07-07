import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../../../app/(dashboard)/dashboard/page';
import { apiService } from '../../../services/apiService';
import { useAuthStore } from '../../../store/authStore';

// Mock the dependencies
jest.mock('../../../services/apiService');
jest.mock('../../../store/authStore');
jest.mock('../../../hooks/useStripeSubscription', () => ({
  useStripeSubscription: () => ({
    subscription: null,
    loading: false,
    error: null,
    hasProPlan: false,
    hasEnterprisePlan: false,
    isSubscriptionActive: false
  })
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockDashboardData = {
  summary: {
    totalUrls: 5,
    totalClicks: 150,
    uniqueClicks: 120,
    clicksInPeriod: 75,
    avgClicksPerUrl: 30,
    clickRate: 80
  },
  comparison: {
    clicks: { changePercentage: 25 },
    uniqueClicks: { changePercentage: 15 },
    urls: { changePercentage: 50 }
  },
  charts: {
    clicksOverTime: [
      { date: '2024-01-01', clicks: 10 },
      { date: '2024-01-02', clicks: 15 },
      { date: '2024-01-03', clicks: 20 }
    ],
    topUrls: [
      { id: '1', shortCode: 'abc123', title: 'Test URL', originalUrl: 'https://example.com', clicks: 50, uniqueClicks: 40 }
    ],
    topCountries: [
      { country: 'United States', clicks: 75 }
    ],
    topBrowsers: [
      { browser: 'Chrome', clicks: 100 }
    ]
  }
};

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        plan: 'FREE',
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      isAuthenticated: true,
      token: 'mock-token',
      login: jest.fn(),
      logout: jest.fn(),
      updateUser: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders dashboard header', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitor your URL shortening performance')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    mockApiService.get.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<DashboardPage />);
    
    // Should show skeleton loading states - check that there are at least 4 loading elements
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(4);
  });

  test('displays dashboard metrics when data loads', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Total URLs
      expect(screen.getByText('150')).toBeInTheDocument(); // Total Clicks
      expect(screen.getByText('120')).toBeInTheDocument(); // Unique Visitors
      expect(screen.getByText('80.0%')).toBeInTheDocument(); // Click Rate
    });
  });

  test('displays charts with data', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Clicks Over Time')).toBeInTheDocument();
      expect(screen.getByText('Top Performing URLs')).toBeInTheDocument();
      expect(screen.getByText('Top Countries')).toBeInTheDocument();
      expect(screen.getByText('Top Browsers')).toBeInTheDocument();
    });
  });

  test('shows recent activity section', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getAllByText('Test URL')).toHaveLength(2); // One in chart, one in recent activity
      expect(screen.getByText('50 clicks')).toBeInTheDocument();
    });
  });

  test('displays quick actions', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create Short URL')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });
  });

  test('handles time range selection', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    const user = userEvent.setup();
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('30 Days')).toBeInTheDocument();
    });
    
    // Click on 7 Days
    await user.click(screen.getByText('7 Days'));
    
    // Should make new API call with different period
    expect(mockApiService.get).toHaveBeenCalledWith('/analytics/dashboard?period=7d');
  });

  test('displays error state when API fails', async () => {
    const errorMessage = 'Failed to load dashboard data';
    mockApiService.get.mockRejectedValue(new Error(errorMessage));
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('shows empty state when no URLs exist', async () => {
    const emptyData = {
      ...mockDashboardData,
      summary: {
        ...mockDashboardData.summary,
        totalUrls: 0
      },
      charts: {
        ...mockDashboardData.charts,
        topUrls: []
      }
    };
    
    mockApiService.get.mockResolvedValue(emptyData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('No URLs yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first short URL.')).toBeInTheDocument();
    });
  });

  test('displays user name in header', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      // Check for the welcome text and user name separately since they're in different elements
      expect(screen.getByText('Welcome back,')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  test('shows change indicators for metrics', async () => {
    mockApiService.get.mockResolvedValue(mockDashboardData);
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      // Should show percentage changes
      expect(screen.getByText('25%')).toBeInTheDocument(); // Clicks change
      expect(screen.getByText('15%')).toBeInTheDocument(); // Unique clicks change
      expect(screen.getByText('50%')).toBeInTheDocument(); // URLs change
    });
  });
});
