import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { rateLimitRedirect } from '../middleware/rateLimiter';
import { HTTP_STATUS } from '../utils/constants';

const router = Router();
const prisma = new PrismaClient();

/**
 * Redirect to original URL
 * GET /:shortCode
 */
router.get('/:shortCode',
  rateLimitRedirect,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const { password } = req.query;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const url = await prisma.url.findUnique({
        where: { shortCode },
        select: {
          id: true,
          originalUrl: true,
          password: true,
          isActive: true,
          expiresAt: true,
          userId: true
        }
      });

      if (!url) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      // Check if URL is active
      if (!url.isActive) {
        res.status(HTTP_STATUS.GONE).json({
          error: 'URL has been deactivated'
        });
        return;
      }

      // Check if URL has expired
      if (url.expiresAt && new Date() > url.expiresAt) {
        res.status(HTTP_STATUS.GONE).json({
          error: 'URL has expired'
        });
        return;
      }

      // Check password if required
      if (url.password) {
        if (!password) {
          // Redirect to frontend password page instead of returning JSON
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(`${frontendUrl}/protected/${shortCode}`);
          return;
        }

        const isValidPassword = await bcrypt.compare(password as string, url.password);
        if (!isValidPassword) {
          res.status(HTTP_STATUS.UNAUTHORIZED).json({
            error: 'Invalid password'
          });
          return;
        }
      }

      // Record click
      await prisma.click.create({
        data: {
          urlId: url.id,
          ip: clientIp,
          userAgent,
          referer: req.get('Referer') || null
        }
      });

      // Redirect to original URL
      res.redirect(301, url.originalUrl);

    } catch (error) {
      console.error('Redirect error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
