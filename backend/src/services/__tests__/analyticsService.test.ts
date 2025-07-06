import { jest } from '@jest/globals';

// Mock Prisma before importing the service
const mockPrismaFunctions = {
  url: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  click: {
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  analytics: {
    upsert: jest.fn(),
  },
};

const mockPrisma = mockPrismaFunctions as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { 
  getDashboardAnalytics, 
  getUrlAnalytics, 
  createDailyAnalytics,
  AnalyticsSummary,
  DashboardAnalytics,
  UrlAnalytics 
} from '../analyticsService';

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    const mockUserId = 'user-123';
    const mockUrls = [
      {
        id: 'url-1',
        shortCode: 'abc123',
        title: 'Test URL 1',
        originalUrl: 'https://example.com',
        createdAt: new Date('2025-06-01'),
        _count: { clicks: 10 }
      },
      {
        id: 'url-2',
        shortCode: 'def456',
        title: 'Test URL 2',
        originalUrl: 'https://test.com',
        createdAt: new Date('2025-06-15'),
        _count: { clicks: 5 }
      }
    ];

    const mockClicks = [
      {
        id: 'click-1',
        ip: '192.168.1.1',
        timestamp: new Date('2025-07-01'),
        urlId: 'url-1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        referer: 'https://google.com',
        country: 'United States',
        city: 'New York',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows'
      },
      {
        id: 'click-2',
        ip: '192.168.1.2',
        timestamp: new Date('2025-07-02'),
        urlId: 'url-1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
        referer: null,
        country: 'Canada',
        city: 'Toronto',
        device: 'Mobile',
        browser: 'Safari',
        os: 'iOS'
      }
    ];

    it('should return empty analytics for user with no URLs', async () => {
      mockPrisma.url.findMany.mockResolvedValue([]);

      const result = await getDashboardAnalytics(mockUserId);

      expect(result.summary.totalUrls).toBe(0);
      expect(result.summary.totalClicks).toBe(0);
      expect(result.charts.topUrls).toHaveLength(0);
      expect(mockPrisma.url.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        select: {
          id: true,
          shortCode: true,
          title: true,
          originalUrl: true,
          createdAt: true,
          _count: { select: { clicks: true } }
        }
      });
    });

    it('should return comprehensive dashboard analytics', async () => {
      mockPrisma.url.findMany.mockResolvedValue(mockUrls);
      mockPrisma.click.count.mockResolvedValue(15);
      mockPrisma.click.findMany
        .mockResolvedValueOnce(mockClicks) // current period clicks
        .mockResolvedValueOnce([]) // previous period clicks
        .mockResolvedValueOnce(mockClicks) // current period detailed data
        .mockResolvedValueOnce([]); // previous period for comparison

      const result = await getDashboardAnalytics(mockUserId, '30d');

      expect(result.summary.totalUrls).toBe(2);
      expect(result.summary.totalClicks).toBe(15);
      expect(result.summary.avgClicksPerUrl).toBe(7.5);
      
      expect(result.charts.topUrls).toHaveLength(2);
      expect(result.charts.topCountries).toContainEqual({
        country: 'United States',
        clicks: 1,
        percentage: 50
      });
      
      expect(result.charts.topDevices).toContainEqual({
        device: 'Desktop',
        clicks: 1,
        percentage: 50
      });

      expect(result.comparison.clicks.current).toBe(2);
      expect(result.comparison.clicks.previous).toBe(0);
    });

    it('should handle different time periods', async () => {
      mockPrisma.url.findMany.mockResolvedValue(mockUrls);
      mockPrisma.click.count.mockResolvedValue(10);
      mockPrisma.click.findMany.mockResolvedValue([]);

      await getDashboardAnalytics(mockUserId, '7d');
      await getDashboardAnalytics(mockUserId, '90d');

      expect(mockPrisma.url.findMany).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUrlAnalytics', () => {
    const mockUrlId = 'url-123';
    const mockUserId = 'user-123';
    
    const mockUrl = {
      id: mockUrlId,
      shortCode: 'abc123',
      originalUrl: 'https://example.com',
      title: 'Test URL',
      createdAt: new Date('2025-06-01')
    };

    const mockUrlClicks = [
      {
        id: 'click-1',
        ip: '192.168.1.1',
        timestamp: new Date('2025-07-01T10:00:00Z'),
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        referer: 'https://google.com',
        country: 'United States',
        city: 'New York',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows'
      },
      {
        id: 'click-2',
        ip: '192.168.1.1',
        timestamp: new Date('2025-07-01T15:00:00Z'),
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        referer: 'https://twitter.com',
        country: 'United States',
        city: 'New York',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows'
      }
    ];

    it('should return null for non-existent URL', async () => {
      mockPrisma.url.findFirst.mockResolvedValue(null);

      const result = await getUrlAnalytics(mockUrlId, mockUserId);

      expect(result).toBeNull();
      expect(mockPrisma.url.findFirst).toHaveBeenCalledWith({
        where: { id: mockUrlId, userId: mockUserId },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          title: true,
          createdAt: true
        }
      });
    });

    it('should return detailed URL analytics', async () => {
      mockPrisma.url.findFirst.mockResolvedValue(mockUrl);
      mockPrisma.click.findMany.mockResolvedValue(mockUrlClicks);

      const result = await getUrlAnalytics(mockUrlId, mockUserId, '30d');

      expect(result).not.toBeNull();
      expect(result!.url.id).toBe(mockUrlId);
      expect(result!.summary.totalClicks).toBe(2);
      expect(result!.summary.uniqueClicks).toBe(1);
      expect(result!.summary.peakDay.clicks).toBe(2);
      
      expect(result!.charts.hourlyDistribution).toHaveLength(24);
      expect(result!.charts.weeklyDistribution).toHaveLength(7);
      expect(result!.charts.topCountries).toContainEqual({
        country: 'United States',
        clicks: 2,
        percentage: 100
      });
    });

    it('should calculate hourly and weekly distributions correctly', async () => {
      mockPrisma.url.findFirst.mockResolvedValue(mockUrl);
      mockPrisma.click.findMany.mockResolvedValue(mockUrlClicks);

      const result = await getUrlAnalytics(mockUrlId, mockUserId);

      expect(result!.charts.hourlyDistribution.find(h => h.hour === 10)?.clicks).toBe(1); // 10 AM
      expect(result!.charts.hourlyDistribution.find(h => h.hour === 15)?.clicks).toBe(1); // 3 PM
      
      // July 1, 2025 is a Tuesday (day index 2)
      expect(result!.charts.weeklyDistribution.find(d => d.day === 'Tuesday')?.clicks).toBe(2);
    });
  });

  describe('createDailyAnalytics', () => {
    const mockDate = new Date('2025-07-01');
    
    const mockUrlsWithClicks = [
      { urlId: 'url-1' },
      { urlId: 'url-2' }
    ];

    const mockClicksForUrl = [
      {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        referer: 'https://google.com',
        country: 'United States',
        city: 'New York',
        device: 'Desktop',
        browser: 'Chrome',
        os: 'Windows'
      },
      {
        ip: '192.168.1.2',
        userAgent: 'Mozilla/5.0 Safari/605.1',
        referer: null,
        country: 'Canada',
        city: 'Toronto',
        device: 'Mobile',
        browser: 'Safari',
        os: 'iOS'
      }
    ];

    it('should create daily analytics aggregation', async () => {
      mockPrisma.click.groupBy.mockResolvedValue(mockUrlsWithClicks);
      mockPrisma.click.findMany.mockResolvedValue(mockClicksForUrl);
      mockPrisma.analytics.upsert.mockResolvedValue({});

      await createDailyAnalytics(mockDate);

      expect(mockPrisma.click.groupBy).toHaveBeenCalledWith({
        by: ['urlId'],
        where: {
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        }
      });

      expect(mockPrisma.analytics.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.analytics.upsert).toHaveBeenCalledWith({
        where: {
          urlId_date: {
            urlId: 'url-1',
            date: expect.any(Date)
          }
        },
        create: {
          urlId: 'url-1',
          date: expect.any(Date),
          clicks: 2,
          uniqueClicks: 2,
          topCountries: { 'United States': 1, 'Canada': 1 },
          topReferrers: { 'google.com': 1, 'Direct': 1 },
          topDevices: { 'Desktop': 1, 'Mobile': 1 },
          topBrowsers: { 'Chrome': 1, 'Safari': 1 }
        },
        update: {
          clicks: 2,
          uniqueClicks: 2,
          topCountries: { 'United States': 1, 'Canada': 1 },
          topReferrers: { 'google.com': 1, 'Direct': 1 },
          topDevices: { 'Desktop': 1, 'Mobile': 1 },
          topBrowsers: { 'Chrome': 1, 'Safari': 1 }
        }
      });
    });

    it('should use current date when no date provided', async () => {
      mockPrisma.click.groupBy.mockResolvedValue([]);

      await createDailyAnalytics();

      expect(mockPrisma.click.groupBy).toHaveBeenCalledWith({
        by: ['urlId'],
        where: {
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date)
          }
        }
      });
    });
  });

  describe('Helper Functions', () => {
    // Test the utility functions indirectly through the main functions
    it('should parse user agents correctly', async () => {
      const mockUrl = {
        id: 'url-1',
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: 'Test',
        createdAt: new Date()
      };

      const mockClicks = [
        {
          id: 'click-1',
          ip: '192.168.1.1',
          timestamp: new Date(),
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          referer: null,
          country: 'US',
          city: 'NYC',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows'
        }
      ];

      mockPrisma.url.findFirst.mockResolvedValue(mockUrl);
      mockPrisma.click.findMany.mockResolvedValue(mockClicks);

      const result = await getUrlAnalytics('url-1', 'user-1');

      expect(result!.charts.topBrowsers).toContainEqual({
        browser: 'Chrome',
        clicks: 1,
        percentage: 100
      });
    });

    it('should extract domains from referrers correctly', async () => {
      const mockUrl = {
        id: 'url-1',
        shortCode: 'abc123',
        originalUrl: 'https://example.com',
        title: 'Test',
        createdAt: new Date()
      };

      const mockClicks = [
        {
          id: 'click-1',
          ip: '192.168.1.1',
          timestamp: new Date(),
          userAgent: 'Mozilla/5.0',
          referer: 'https://www.google.com/search?q=test',
          country: 'US',
          city: 'NYC',
          device: 'Desktop',
          browser: 'Chrome',
          os: 'Windows'
        }
      ];

      mockPrisma.url.findFirst.mockResolvedValue(mockUrl);
      mockPrisma.click.findMany.mockResolvedValue(mockClicks);

      const result = await getUrlAnalytics('url-1', 'user-1');

      expect(result!.charts.topReferrers).toContainEqual({
        referrer: 'google.com',
        domain: 'google.com',
        clicks: 1,
        percentage: 100
      });
    });
  });
});
