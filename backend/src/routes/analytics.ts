import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate } from '../middleware/rateLimiter';
import { HTTP_STATUS } from '../utils/constants';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get dashboard analytics for user
 * GET /analytics/dashboard
 */
router.get('/dashboard',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { period = '30d' } = req.query;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Get user's URLs
      const userUrls = await prisma.url.findMany({
        where: { userId },
        select: { id: true }
      });

      if (userUrls.length === 0) {
        res.json({
          summary: {
            totalUrls: 0,
            totalClicks: 0,
            uniqueClicks: 0,
            clicksInPeriod: 0
          },
          charts: {
            clicksOverTime: [],
            topUrls: [],
            topCountries: [],
            topBrowsers: []
          }
        });
        return;
      }

      const urlIds = userUrls.map(url => url.id);

      // Get summary statistics
      const [totalUrls, totalClicks, uniqueClicks, clicksInPeriod] = await Promise.all([
        prisma.url.count({ where: { userId } }),
        prisma.click.count({ where: { urlId: { in: urlIds } } }),
        prisma.click.groupBy({
          by: ['ip'],
          where: { urlId: { in: urlIds } },
          _count: { ip: true }
        }).then(result => result.length),
        prisma.click.count({
          where: {
            urlId: { in: urlIds },
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        })
      ]);

      // Get clicks over time (daily aggregation)
      const clicksOverTime = await prisma.click.groupBy({
        by: ['timestamp'],
        where: {
          urlId: { in: urlIds },
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        orderBy: { timestamp: 'asc' }
      });

      // Group by day
      const dailyClicks = clicksOverTime.reduce((acc: any, click) => {
        const date = click.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (click._count || 0);
        return acc;
      }, {});

      const chartData = Object.entries(dailyClicks).map(([date, count]) => ({
        date,
        clicks: count
      }));

      // Get top URLs
      const topUrls = await prisma.click.groupBy({
        by: ['urlId'],
        where: {
          urlId: { in: urlIds },
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      });

      // Get URL details for top URLs
      const topUrlsWithDetails = await Promise.all(
        topUrls.map(async (item) => {
          const url = await prisma.url.findUnique({
            where: { id: item.urlId },
            select: { shortCode: true, title: true, originalUrl: true }
          });
          return {
            shortCode: url?.shortCode || '',
            title: url?.title || url?.originalUrl || '',
            clicks: item._count || 0
          };
        })
      );

      // Get top countries (mock data for now - would need geolocation)
      const topCountries = [
        { country: 'United States', clicks: Math.floor(totalClicks * 0.4) },
        { country: 'United Kingdom', clicks: Math.floor(totalClicks * 0.2) },
        { country: 'Canada', clicks: Math.floor(totalClicks * 0.15) },
        { country: 'Germany', clicks: Math.floor(totalClicks * 0.1) },
        { country: 'Others', clicks: Math.floor(totalClicks * 0.15) }
      ];

      // Get top browsers (simplified from user agent)
      const clicks = await prisma.click.findMany({
        where: {
          urlId: { in: urlIds },
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: { userAgent: true }
      });

      const browserCounts = clicks.reduce((acc: any, click) => {
        let browser = 'Unknown';
        if (click.userAgent?.includes('Chrome')) browser = 'Chrome';
        else if (click.userAgent?.includes('Firefox')) browser = 'Firefox';
        else if (click.userAgent?.includes('Safari')) browser = 'Safari';
        else if (click.userAgent?.includes('Edge')) browser = 'Edge';
        
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {});

      const topBrowsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({ browser, clicks: count }))
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 5);

      res.json({
        summary: {
          totalUrls,
          totalClicks,
          uniqueClicks,
          clicksInPeriod
        },
        charts: {
          clicksOverTime: chartData,
          topUrls: topUrlsWithDetails,
          topCountries,
          topBrowsers
        }
      });

    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get analytics for a specific URL
 * GET /analytics/:urlId
 */
router.get('/:urlId',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { urlId } = req.params;
      const userId = req.user!.id;
      const { period = '30d' } = req.query;

      // Verify URL belongs to user
      const url = await prisma.url.findFirst({
        where: { id: urlId, userId },
        select: { id: true, shortCode: true, originalUrl: true, createdAt: true }
      });

      if (!url) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get clicks data
      const clicks = await prisma.click.findMany({
        where: {
          urlId,
          timestamp: {
            gte: startDate
          }
        },
        select: {
          id: true,
          ip: true,
          country: true,
          city: true,
          device: true,
          browser: true,
          os: true,
          referer: true,
          timestamp: true
        }
      });

      // Calculate metrics
      const totalClicks = clicks.length;
      const uniqueClicks = new Set(clicks.map(click => click.ip)).size;
      
      // Group by date
      const clicksByDate: Record<string, number> = clicks.reduce((acc, click) => {
        const date = click.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top countries
      const countryStats = clicks.reduce((acc: any, click) => {
        if (click.country) {
          acc[click.country] = (acc[click.country] || 0) + 1;
        }
        return acc;
      }, {});

      // Top referrers
      const referrerStats = clicks.reduce((acc: any, click) => {
        const referrer = click.referer || 'Direct';
        acc[referrer] = (acc[referrer] || 0) + 1;
        return acc;
      }, {});

      // Top devices
      const deviceStats = clicks.reduce((acc: any, click) => {
        if (click.device) {
          acc[click.device] = (acc[click.device] || 0) + 1;
        }
        return acc;
      }, {});

      // Top browsers
      const browserStats = clicks.reduce((acc: any, click) => {
        if (click.browser) {
          acc[click.browser] = (acc[click.browser] || 0) + 1;
        }
        return acc;
      }, {});

      const topCountries = Object.entries(countryStats)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

      const topReferrers = Object.entries(referrerStats)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([referrer, count]) => ({ referrer, count }));

      const topDevices = Object.entries(deviceStats)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([device, count]) => ({ device, count }));

      const topBrowsers = Object.entries(browserStats)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([browser, count]) => ({ browser, count }));

      res.json({
        url,
        period,
        metrics: {
          totalClicks,
          uniqueClicks,
          clicksByDate,
          topCountries,
          topReferrers,
          topDevices,
          topBrowsers
        }
      });

    } catch (error) {
      console.error('Analytics error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get dashboard analytics for user
 * GET /analytics/dashboard
 */
router.get('/dashboard',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { period = '30d' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get user URLs
      const urls = await prisma.url.findMany({
        where: { userId },
        select: {
          id: true,
          shortCode: true,
          originalUrl: true,
          title: true,
          createdAt: true,
          _count: {
            select: { clicks: true }
          }
        }
      });

      // Get total clicks for period
      const totalClicks = await prisma.click.count({
        where: {
          url: { userId },
          timestamp: { gte: startDate }
        }
      });

      // Get unique clicks for period
      const clicksData = await prisma.click.findMany({
        where: {
          url: { userId },
          timestamp: { gte: startDate }
        },
        select: { ip: true, timestamp: true, urlId: true }
      });

      const uniqueClicks = new Set(clicksData.map(click => click.ip)).size;

      // Group clicks by date
      const clicksByDate: Record<string, number> = clicksData.reduce((acc, click) => {
        const date = click.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top performing URLs
      const urlPerformance = urls.map(url => ({
        id: url.id,
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        title: url.title,
        totalClicks: url._count.clicks,
        recentClicks: clicksData.filter(click => click.urlId === url.id).length
      })).sort((a, b) => b.recentClicks - a.recentClicks).slice(0, 10);

      res.json({
        period,
        summary: {
          totalUrls: urls.length,
          totalClicks,
          uniqueClicks,
          clicksByDate,
          topUrls: urlPerformance
        }
      });

    } catch (error) {
      console.error('Dashboard analytics error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
