import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate, rateLimitStrict } from '../middleware/rateLimiter';
import { validateUserUpdate, handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { HTTP_STATUS, SECURITY_CONFIG } from '../utils/constants';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get user profile
 * GET /users/profile
 */
router.get('/profile',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              urls: true,
              domains: true
            }
          }
        }
      });

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'User not found'
        });
        return;
      }

      // Get user's subscription if exists
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: {
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true
        }
      });

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentClicks = await prisma.click.count({
        where: {
          url: { userId },
          timestamp: { gte: thirtyDaysAgo }
        }
      });

      const recentUrls = await prisma.url.count({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      res.json({
        user: {
          ...user,
          subscription,
          stats: {
            totalUrls: user._count.urls,
            totalDomains: user._count.domains,
            recentClicks,
            recentUrls
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update user profile
 * PUT /users/profile
 */
router.put('/profile',
  rateLimitModerate,
  requireAuth,
  sanitizeInput,
  validateUserUpdate,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, email, currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, email: true }
      });

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'User not found'
        });
        return;
      }

      const updateData: any = {};

      // Update name if provided
      if (name !== undefined) {
        updateData.name = name;
      }

      // Update email if provided and different
      if (email && email !== user.email) {
        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingUser) {
          res.status(HTTP_STATUS.CONFLICT).json({
            error: 'Email already in use'
          });
          return;
        }

        updateData.email = email;
        updateData.isVerified = false; // Require email verification for new email
      }

      // Update password if provided
      if (newPassword) {
        if (!currentPassword) {
          res.status(HTTP_STATUS.BAD_REQUEST).json({
            error: 'Current password is required to change password'
          });
          return;
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          res.status(HTTP_STATUS.UNAUTHORIZED).json({
            error: 'Current password is incorrect'
          });
          return;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        updateData.password = hashedPassword;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Log security event if password or email changed
      if (updateData.password || updateData.email) {
        await prisma.securityEvent.create({
          data: {
            userId,
            type: updateData.password ? 'PASSWORD_CHANGE' : 'LOGIN',
            description: updateData.password ? 'Password changed by user' : 'Email changed by user',
            ip: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
          }
        });
      }

      res.json({
        user: updatedUser,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete user account
 * DELETE /users/profile
 */
router.delete('/profile',
  rateLimitStrict,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { password, confirmation } = req.body;

      if (!password || confirmation !== 'DELETE') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Password and confirmation required. Type "DELETE" to confirm.'
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'User not found'
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid password'
        });
        return;
      }

      // Log security event
      await prisma.securityEvent.create({
        data: {
          userId,
          type: 'SUSPICIOUS_ACTIVITY',
          description: 'User account deletion requested',
          ip: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        }
      });

      // Delete user (cascade will handle related data)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get user activity log
 * GET /users/activity
 */
router.get('/activity',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        prisma.securityEvent.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            type: true,
            description: true,
            ip: true,
            timestamp: true
          }
        }),
        prisma.securityEvent.count({
          where: { userId }
        })
      ]);

      res.json({
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get activity error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
