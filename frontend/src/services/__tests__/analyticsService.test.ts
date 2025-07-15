import { analyticsService } from '../analyticsService';
import { DashboardAnalytics, UrlAnalytics } from '@/types';

// Mock fetch
global.fetch = jest.fn();

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock data
const mockDashboardAnalytics: DashboardAnalytics = {
  summary: {
    totalUrls: 5,
    totalClicks: 100,
    uniqueClicks: 75,
    clicksInPeriod: 50,
    avgClicksPerUrl: 20,
    clickRate: 1.33
  },
  comparison: {
    clicks: { current: 50, previous: 40, change: 10, changePercentage: 25 },
    uniqueClicks: { current: 75, previous: 60, change: 15, changePercentage: 25 },
    urls: { current: 5, previous: 4, change: 1, changePercentage: 25 }
  },
  charts: {
    clicksOverTime: [
      { date: '2025-01-01', clicks: 10, uniqueClicks: 8 },
      { date: '2025-01-02', clicks: 15, uniqueClicks: 12 }
    ],
    topUrls: [
      {
        id: 'url-1',
        shortCode: 'abc123',
        title: 'Test URL',
        originalUrl: 'https://example.com',
        clicks: 25,
        uniqueClicks: 20,
        createdAt: '2025-01-01'
      }
    ],
    topCountries: [
      { country: 'United States', clicks: 30, percentage: 60 }
    ],
    topCities: [
      { country: 'United States', city: 'New York', clicks: 15, percentage: 30 }
    ],
    topReferrers: [
      { referrer: 'google.com', domain: 'google.com', clicks: 20, percentage: 40 }
    ],
    topDevices: [
      { device: 'Desktop', clicks: 35, percentage: 70 }
    ],
    topBrowsers: [
      { browser: 'Chrome', clicks: 40, percentage: 80 }
    ]
  }
};

const mockUrlAnalytics: UrlAnalytics = {
  url: {
    id: 'url-123',
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    title: 'Test URL',
    createdAt: '2025-01-01'
  },
  summary: {
    totalClicks: 50,
    uniqueClicks: 40,
    avgClicksPerDay: 2.5,
    peakDay: { date: '2025-01-15', clicks: 10 },
    firstClick: '2025-01-01T10:00:00Z',
    lastClick: '2025-01-20T15:30:00Z'
  },
  charts: {
    clicksOverTime: [
      { date: '2025-01-01', clicks: 5, uniqueClicks: 4 }
    ],
    topCountries: [
      { country: 'United States', clicks: 25, percentage: 50 }
    ],
    topCities: [
      { country: 'United States', city: 'New York', clicks: 12, percentage: 24 }
    ],
    topReferrers: [
      { referrer: 'google.com', domain: 'google.com', clicks: 15, percentage: 30 }
    ],
    topDevices: [
      { device: 'Desktop', clicks: 30, percentage: 60 }
    ],
    topBrowsers: [
      { browser: 'Chrome', clicks: 35, percentage: 70 }
    ],
    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({ hour, clicks: 2 })),
    weeklyDistribution: [
      { day: 'Monday', clicks: 8 },
      { day: 'Tuesday', clicks: 12 },
      { day: 'Wednesday', clicks: 6 },
      { day: 'Thursday', clicks: 10 },
      { day: 'Friday', clicks: 8 },
      { day: 'Saturday', clicks: 4 },
      { day: 'Sunday', clicks: 2 }
    ]
  }
};

describe('Analytics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => 'mock-token'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    // Mock download related globals
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    const mockAnchor = {
      href: '',
      download: '',
      click: jest.fn(),
      style: { display: '' }
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    jest.spyOn(document.body, 'appendChild').mockImplementation();
    jest.spyOn(document.body, 'removeChild').mockImplementation();
  });

  describe('getDashboardAnalytics', () => {
    it('should fetch dashboard analytics successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboardAnalytics })
      } as Response);

      const result = await analyticsService.getDashboardAnalytics('30d');

      expect(result).toEqual(mockDashboardAnalytics);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/analytics/dashboard?period=30d',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      } as Response);

      await expect(analyticsService.getDashboardAnalytics('30d')).rejects.toThrow('Failed to fetch dashboard analytics');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(analyticsService.getDashboardAnalytics('30d')).rejects.toThrow('Network error');
    });

    it('should use default period if none provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboardAnalytics })
      } as Response);

      await analyticsService.getDashboardAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/analytics/dashboard?period=30d',
        expect.any(Object)
      );
    });
  });

  describe('getUrlAnalytics', () => {
    const mockUrlId = 'url-123';

    it('should fetch URL analytics successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUrlAnalytics })
      } as Response);

      const result = await analyticsService.getUrlAnalytics(mockUrlId, '7d');

      expect(result).toEqual(mockUrlAnalytics);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3002/api/analytics/${mockUrlId}?period=7d`,
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle 404 errors for non-existent URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'URL not found' })
      } as Response);

      await expect(analyticsService.getUrlAnalytics(mockUrlId, '7d')).rejects.toThrow('Failed to fetch URL analytics');
    });

    it('should handle authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      } as Response);

      await expect(analyticsService.getUrlAnalytics(mockUrlId, '7d')).rejects.toThrow('Failed to fetch URL analytics');
    });
  });

  describe('exportAnalytics', () => {
    it('should export dashboard analytics successfully', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      } as Response);

      const result = await analyticsService.exportAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/analytics/dashboard/export?period=30d',
        {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );

      expect(result).toBe(mockBlob);
      expect(result.type).toBe('text/csv');
    });

    it('should export URL analytics with correct filename', async () => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob
      } as Response);

      const result = await analyticsService.exportAnalytics('url-123', '7d');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/analytics/url-123/export?period=7d',
        expect.any(Object)
      );

      expect(result).toBe(mockBlob);
      expect(result.type).toBe('text/csv');
    });

    it('should handle export errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      await expect(analyticsService.exportAnalytics()).rejects.toThrow('Failed to export analytics: undefined');
    });
  });

  describe('Authentication', () => {
    it('should include auth token in requests', async () => {
      window.localStorage.getItem = jest.fn(() => 'test-auth-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboardAnalytics })
      } as Response);

      await analyticsService.getDashboardAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-auth-token'
          })
        })
      );
    });

    it('should handle missing auth token', async () => {
      window.localStorage.getItem = jest.fn(() => null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDashboardAnalytics })
      } as Response);

      await analyticsService.getDashboardAnalytics();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });
});
