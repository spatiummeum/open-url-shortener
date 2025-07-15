import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate } from '../middleware/rateLimiter';
import { HTTP_STATUS } from '../utils/constants';
import { getDashboardAnalytics, getUrlAnalytics } from '../services/analyticsService';

const router = Router();

/**
 * Get dashboard analytics for authenticated user
 * GET /api/analytics/dashboard?period=30d
 */
router.get('/dashboard', requireAuth, rateLimitModerate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const period = req.query.period as string || '30d';
    
    const analytics = await getDashboardAnalytics(userId, period);
    res.json(analytics);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch dashboard analytics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * Get analytics for a specific URL
 * GET /api/analytics/:urlId?period=30d
 */
router.get('/:urlId', requireAuth, rateLimitModerate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const urlId = req.params.urlId;
    const period = req.query.period as string || '30d';
    
    const analytics = await getUrlAnalytics(urlId, userId, period);
    
    if (!analytics) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'URL not found'
      });
    }

    res.json(analytics);
  } catch (error) {
    console.error('URL analytics error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch URL analytics',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

export default router;
