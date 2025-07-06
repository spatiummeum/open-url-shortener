import { renderHook, waitFor } from '@testing-library/react';
import { useAnalytics, useUrlAnalytics, useAnalyticsExport } from '../useAnalytics';
import analyticsService from '../../services/analyticsService';

// Mock the analytics service
jest.mock('../../services/analyticsService');
const mockAnalyticsService = analyticsService as jest.Mocked<typeof analyticsService>;

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard analytics successfully', async () => {
    const mockData = {
      summary: {
        totalUrls: 10,
        totalClicks: 250,
        uniqueClicks: 180,
        clicksInPeriod: 150,
        avgClicksPerUrl: 25.0,
        clickRate: 1.39,
      },
      comparison: {
        clicks: { current: 250, previous: 200, change: 50, changePercentage: 25.0 },
        uniqueClicks: { current: 180, previous: 160, change: 20, changePercentage: 12.5 },
        urls: { current: 10, previous: 8, change: 2, changePercentage: 25.0 }
      },
      charts: {
        clicksOverTime: [],
        topUrls: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: []
      }
    };

    mockAnalyticsService.getDashboardAnalytics.mockResolvedValue(mockData);

    const { result } = renderHook(() => useAnalytics('30d'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockAnalyticsService.getDashboardAnalytics).toHaveBeenCalledWith('30d');
  });

  it('should handle analytics fetch error', async () => {
    const errorMessage = 'Failed to fetch analytics';
    mockAnalyticsService.getDashboardAnalytics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAnalytics('30d'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should use default period when none provided', async () => {
    mockAnalyticsService.getDashboardAnalytics.mockResolvedValue({
      summary: {
        totalUrls: 0,
        totalClicks: 0,
        uniqueClicks: 0,
        clicksInPeriod: 0,
        avgClicksPerUrl: 0,
        clickRate: 0,
      },
      comparison: {
        clicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        uniqueClicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        urls: { current: 0, previous: 0, change: 0, changePercentage: 0 }
      },
      charts: {
        clicksOverTime: [],
        topUrls: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: []
      }
    });

    renderHook(() => useAnalytics());

    await waitFor(() => {
      expect(mockAnalyticsService.getDashboardAnalytics).toHaveBeenCalledWith('30d');
    });
  });

  it('should refresh analytics data', async () => {
    mockAnalyticsService.getDashboardAnalytics.mockResolvedValue({
      summary: {
        totalUrls: 0,
        totalClicks: 0,
        uniqueClicks: 0,
        clicksInPeriod: 0,
        avgClicksPerUrl: 0,
        clickRate: 0,
      },
      comparison: {
        clicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        uniqueClicks: { current: 0, previous: 0, change: 0, changePercentage: 0 },
        urls: { current: 0, previous: 0, change: 0, changePercentage: 0 }
      },
      charts: {
        clicksOverTime: [],
        topUrls: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: []
      }
    });

    const { result } = renderHook(() => useAnalytics('30d'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Call refresh
    result.current.refresh();

    expect(mockAnalyticsService.getDashboardAnalytics).toHaveBeenCalledTimes(2);
  });
});

describe('useUrlAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch URL analytics successfully', async () => {
    const mockData = {
      url: {
        id: '1',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        title: 'Test Title',
        createdAt: '2024-01-01T00:00:00Z'
      },
      summary: {
        totalClicks: 25,
        uniqueClicks: 20,
        avgClicksPerDay: 3.5,
        peakDay: { date: '2024-01-15', clicks: 10 },
        firstClick: '2024-01-02T00:00:00Z',
        lastClick: '2024-01-15T00:00:00Z'
      },
      charts: {
        clicksOverTime: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: [],
        hourlyDistribution: [],
        weeklyDistribution: []
      }
    };

    mockAnalyticsService.getUrlAnalytics.mockResolvedValue(mockData);

    const { result } = renderHook(() => useUrlAnalytics('test-url-id', '7d'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(mockAnalyticsService.getUrlAnalytics).toHaveBeenCalledWith('test-url-id', '7d');
  });

  it('should handle URL analytics fetch error', async () => {
    const errorMessage = 'Failed to fetch URL analytics';
    mockAnalyticsService.getUrlAnalytics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUrlAnalytics('test-url-id', '7d'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should not fetch when urlId is empty', async () => {
    const { result } = renderHook(() => useUrlAnalytics('', '7d'));

    // The hook starts with loading=true, but should quickly finish and not call the service
    await waitFor(() => {
      expect(result.current.loading).toBe(true); // Initially true
    });
    
    // Since urlId is empty, service should not be called
    expect(mockAnalyticsService.getUrlAnalytics).not.toHaveBeenCalled();
    expect(result.current.data).toBe(null);
  });

  it('should use default period when none provided', async () => {
    mockAnalyticsService.getUrlAnalytics.mockResolvedValue({
      url: {
        id: '1',
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        title: 'Test Title',
        createdAt: '2024-01-01T00:00:00Z'
      },
      summary: {
        totalClicks: 0,
        uniqueClicks: 0,
        avgClicksPerDay: 0,
        peakDay: { date: '2024-01-01', clicks: 0 }
      },
      charts: {
        clicksOverTime: [],
        topCountries: [],
        topCities: [],
        topReferrers: [],
        topDevices: [],
        topBrowsers: [],
        hourlyDistribution: [],
        weeklyDistribution: []
      }
    });

    renderHook(() => useUrlAnalytics('test-url-id'));

    await waitFor(() => {
      expect(mockAnalyticsService.getUrlAnalytics).toHaveBeenCalledWith('test-url-id', '30d');
    });
  });
});

describe('useAnalyticsExport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export analytics successfully', async () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    mockAnalyticsService.exportAnalytics.mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useAnalyticsExport());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    await result.current.exportAnalytics('test-url-id', '7d');

    expect(mockAnalyticsService.exportAnalytics).toHaveBeenCalledWith('test-url-id', '7d');
    expect(result.current.error).toBe(null);
  });

  it('should handle export error', async () => {
    const errorMessage = 'Failed to export analytics';
    mockAnalyticsService.exportAnalytics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAnalyticsExport());

    await result.current.exportAnalytics('test-url-id', '7d');

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });
  });

  it('should export with default parameters', async () => {
    const mockBlob = new Blob(['csv,data'], { type: 'text/csv' });
    mockAnalyticsService.exportAnalytics.mockResolvedValue(mockBlob);

    const { result } = renderHook(() => useAnalyticsExport());

    await result.current.exportAnalytics();

    expect(mockAnalyticsService.exportAnalytics).toHaveBeenCalledWith(undefined, '30d');
  });
});
