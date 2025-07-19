import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate, rateLimitStrict } from '../middleware/rateLimiter';
import { sanitizeInput, handleValidationErrors } from '../middleware/validation';
import { HTTP_STATUS } from '../utils/constants';
import { body } from 'express-validator';

const router = Router();

/**
 * Get user profile
 * GET /api/users/profile
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
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          _count: {
            select: {
              urls: {
                where: { isActive: true }
              },
              refreshTokens: true
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

      // Get usage statistics
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const [monthlyUrls, monthlyClicks] = await Promise.all([
        prisma.url.count({
          where: {
            userId,
            createdAt: {
              gte: currentMonth
            }
          }
        }),
        prisma.click.count({
          where: {
            url: {
              userId
            },
            createdAt: {
              gte: currentMonth
            }
          }
        })
      ]);

      res.json({
        user: {
          ...user,
          totalUrls: user._count.urls,
          activeSessions: user._count.refreshTokens,
          monthlyStats: {
            urlsCreated: monthlyUrls,
            totalClicks: monthlyClicks
          }
        }
      });

    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile',
  rateLimitModerate,
  requireAuth,
  sanitizeInput,
  [
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be between 1 and 100 characters')
      .trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, email } = req.body;

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            id: { not: userId }
          }
        });

        if (existingUser) {
          res.status(HTTP_STATUS.CONFLICT).json({
            error: 'Email address is already taken'
          });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name }),
          ...(email !== undefined && { email, isVerified: false }), // Reset verification if email changed
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      res.json({
        user: updatedUser,
        message: email ? 'Profile updated. Please verify your new email address.' : 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Change password
 * PUT /api/users/password
 */
router.put('/password',
  rateLimitStrict,
  requireAuth,
  sanitizeInput,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      // Get current user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true
        }
      });

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all refresh tokens (force re-login on all devices)
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      res.json({
        message: 'Password updated successfully. Please log in again on all devices.'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get user activity/sessions
 * GET /api/users/sessions
 */
router.get('/sessions',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const sessions = await prisma.refreshToken.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          // We don't return the actual token for security
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        sessions: sessions.map(session => ({
          id: session.id,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
          isActive: session.expiresAt > new Date()
        }))
      });

    } catch (error) {
      console.error('Get user sessions error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Revoke session (logout from specific device)
 * DELETE /api/users/sessions/:sessionId
 */
router.delete('/sessions/:sessionId',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { sessionId } = req.params;

      const deletedSession = await prisma.refreshToken.deleteMany({
        where: {
          id: sessionId,
          userId
        }
      });

      if (deletedSession.count === 0) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Session not found'
        });
        return;
      }

      res.json({
        message: 'Session revoked successfully'
      });

    } catch (error) {
      console.error('Revoke session error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Revoke all sessions (logout from all devices)
 * DELETE /api/users/sessions
 */
router.delete('/sessions',
  rateLimitStrict,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      res.json({
        message: 'All sessions revoked successfully. Please log in again.'
      });

    } catch (error) {
      console.error('Revoke all sessions error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete user account
 * DELETE /api/users/account
 */
router.delete('/account',
  rateLimitStrict,
  requireAuth,
  sanitizeInput,
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required to delete account'),
    body('confirmation')
      .equals('DELETE')
      .withMessage('Must type "DELETE" to confirm account deletion'),
  ],
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { password } = req.body;

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password: true,
          email: true
        }
      });

      if (!user) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'User not found'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Password is incorrect'
        });
        return;
      }

      // Delete user and all related data (cascade delete should handle this)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
          name: null
        }
      });

      // Delete all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId }
      });

      // Soft delete all URLs
      await prisma.url.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      res.json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;