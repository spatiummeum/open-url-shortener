import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate } from '../middleware/rateLimiter';
import { HTTP_STATUS } from '../utils/constants';
import { getDashboardAnalytics, getUrlAnalytics } from '../services/analyticsService';

const router = Router();

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
      const { period = '30d' } = req.query as { period?: string };

      const analytics = await getDashboardAnalytics(userId, period);

      res.json(analytics);

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
      const { period = '30d' } = req.query as { period?: string };

      if (!urlId) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'URL ID is required'
        });
        return;
      }

      const analytics = await getUrlAnalytics(urlId, userId, period || '30d');

      if (!analytics) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      res.json(analytics);

    } catch (error) {
      console.error('URL analytics error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
