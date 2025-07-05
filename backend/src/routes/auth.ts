import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { validateUserRegistration, validateUserLogin, handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { rateLimitStrict, rateLimitModerate } from '../middleware/rateLimiter';
import { HTTP_STATUS, JWT_CONFIG } from '../utils/constants';

const router = Router();
const prisma = new PrismaClient();

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
  validateUserRegistration,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
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
  validateUserLogin,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
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

export default router;
