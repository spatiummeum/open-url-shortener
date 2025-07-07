import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { validateUserRegistration, validateUserLogin, sanitizeInput } from '../middleware/validation';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { rateLimitStrict, rateLimitModerate } from '../middleware/rateLimiter';
import { HTTP_STATUS, JWT_CONFIG } from '../utils/constants';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService';
import { validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

/**
 * Validation middleware wrapper based on Context7 express-validator best practices
 */
const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      // Run all validations
      await Promise.all(validations.map((validation: any) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      res.status(400).json({ errors: errors.array() });
    } catch (error) {
      next(error);
    }
  };
};

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
  };
}

/**
 * Generate JWT tokens
 */
const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 * POST /auth/register
 */
router.post('/register', 
  rateLimitStrict,
  sanitizeInput,
  validate(validateUserRegistration),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Register request received:', { body: req.body });
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: 'User already exists with this email'
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          plan: 'FREE'
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        message: 'User registered successfully',
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      });

      // Send welcome email (don't await to avoid delaying the response)
      sendWelcomeEmail({
        to: user.email,
        userName: user.name || 'New User'
      }).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Login user
 * POST /auth/login
 */
router.post('/login',
  rateLimitStrict,
  sanitizeInput,
  validate(validateUserLogin),
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Login request received:', { body: req.body });
      const { email, password } = req.body;
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          plan: true,
          isActive: true,
          isVerified: true
        }
      });

      if (!user) {
        // Log failed attempt
        await prisma.loginAttempt.create({
          data: {
            email,
            ip: clientIp,
            success: false,
            userAgent: req.get('User-Agent') || 'unknown'
          }
        });

        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid credentials'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Account is deactivated'
        });
        return;
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Log failed attempt
        await prisma.loginAttempt.create({
          data: {
            email,
            ip: clientIp,
            success: false,
            userId: user.id,
            userAgent: req.get('User-Agent') || 'unknown'
          }
        });

        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid credentials'
        });
        return;
      }

      // Log successful attempt
      await prisma.loginAttempt.create({
        data: {
          email,
          ip: clientIp,
          success: true,
          userId: user.id,
          userAgent: req.get('User-Agent') || 'unknown'
        }
      });

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Refresh access token
 * POST /auth/refresh
 */
router.post('/refresh',
  rateLimitModerate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Refresh token is required'
        });
        return;
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      } catch (error) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid refresh token'
        });
        return;
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true }
      });

      if (!storedToken) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Refresh token not found'
        });
        return;
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        // Delete expired token
        await prisma.refreshToken.delete({
          where: { token: refreshToken }
        });

        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Refresh token expired'
        });
        return;
      }

      // Check if user is still active
      if (!storedToken.user.isActive) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'User account is inactive'
        });
        return;
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = generateTokens(storedToken.userId);

      // Delete old refresh token and create new one
      await prisma.$transaction([
        prisma.refreshToken.delete({
          where: { token: refreshToken }
        }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshToken,
            userId: storedToken.userId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        })
      ]);

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: storedToken.user.id,
          email: storedToken.user.email,
          name: storedToken.user.name,
          plan: storedToken.user.plan
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Forgot password - Send password reset email
 * POST /auth/forgot-password
 */
router.post('/forgot-password',
  rateLimitStrict,
  sanitizeInput,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Email is required'
        });
        return;
      }

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, isActive: true }
      });

      // Always return success message for security (don't reveal if email exists)
      const successMessage = 'If an account with this email exists, you will receive password reset instructions.';

      if (!user || !user.isActive) {
        res.json({ message: successMessage });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: resetTokenHash,
          expiresAt: resetTokenExpiry
        }
      });

      // TODO: Send email with reset link
      // For now, we'll just log the reset link for development
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      try {
        // Send password reset email using Resend
        await sendPasswordResetEmail({
          to: user.email,
          resetUrl,
          userName: user.name || undefined
        });
        console.log(`Password reset email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Still log the URL for development
        console.log(`Password reset link for ${email}: ${resetUrl}`);
      }

      res.json({ message: successMessage });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Reset password
 * POST /auth/reset-password
 */
router.post('/reset-password',
  rateLimitStrict,
  sanitizeInput,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Token and password are required'
        });
        return;
      }

      // Validate password strength (same as registration)
      if (password.length < 8) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Validation failed',
          errors: [{ field: 'password', message: 'Password must be at least 8 characters long' }]
        });
        return;
      }

      // Hash the token to find it in database
      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find valid reset token
      const resetTokenRecord = await prisma.passwordResetToken.findFirst({
        where: {
          token: resetTokenHash,
          expiresAt: { gt: new Date() },
          usedAt: null
        },
        include: { user: true }
      });

      if (!resetTokenRecord) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid or expired reset token'
        });
        return;
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetTokenRecord.userId },
          data: { password: hashedPassword }
        }),
        prisma.passwordResetToken.update({
          where: { id: resetTokenRecord.id },
          data: { usedAt: new Date() }
        }),
        // Invalidate all refresh tokens for this user
        prisma.refreshToken.deleteMany({
          where: { userId: resetTokenRecord.userId }
        })
      ]);

      res.json({ message: 'Password reset successfully' });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

export default router;
