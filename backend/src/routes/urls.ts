import { Router, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validateUrlCreation, validateUrlUpdate, handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { requireAuth, optionalAuth, AuthRequest } from '../middleware/auth';
import { rateLimitURLCreation, rateLimitModerate, rateLimitLenient } from '../middleware/rateLimiter';
import { HTTP_STATUS, URL_CONFIG, PLAN_LIMITS } from '../utils/constants';
import { validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

/**
 * Generate unique short code
 */
const generateShortCode = async (customCode?: string): Promise<string> => {
  if (customCode) {
    const existing = await prisma.url.findUnique({
      where: { shortCode: customCode }
    });
    
    if (existing) {
      throw new Error('Custom code already exists');
    }
    
    return customCode;
  }

  let shortCode: string;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    shortCode = nanoid(URL_CONFIG.SHORT_CODE_LENGTH);
    attempts++;
    
    if (attempts > maxAttempts) {
      throw new Error('Failed to generate unique short code');
    }
    
    const existing = await prisma.url.findUnique({
      where: { shortCode }
    });
    
    if (!existing) {
      return shortCode;
    }
  } while (attempts <= maxAttempts);

  throw new Error('Failed to generate unique short code');
};

/**
 * Check user plan limits
 */
const checkPlanLimits = async (userId: string, plan: string): Promise<boolean> => {
  const planLimits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
  
  if (planLimits.urlsPerMonth === -1) {
    return true; // Unlimited
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const urlCount = await prisma.url.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth
      }
    }
  });

  return urlCount < planLimits.urlsPerMonth;
};

/**
 * Create shortened URL
 * POST /urls
 */
router.post('/',
  rateLimitURLCreation,
  sanitizeInput,
  optionalAuth,
  ...validateUrlCreation,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { originalUrl, customCode, password, expiresAt, title, description } = req.body;
      const userId = req.user?.id;

      // Check plan limits for authenticated users
      if (userId) {
        const canCreate = await checkPlanLimits(userId, req.user!.plan);
        if (!canCreate) {
          res.status(HTTP_STATUS.FORBIDDEN).json({
            error: 'Monthly URL limit reached for your plan'
          });
          return;
        }

        // Check if user can use custom codes
        if (customCode) {
          const planLimits = PLAN_LIMITS[req.user!.plan as keyof typeof PLAN_LIMITS];
          if (!planLimits.customCodes) {
            res.status(HTTP_STATUS.FORBIDDEN).json({
              error: 'Custom codes not available in your plan'
            });
            return;
          }
        }

        // Check if user can use password protection
        if (password) {
          const planLimits = PLAN_LIMITS[req.user!.plan as keyof typeof PLAN_LIMITS];
          if (!planLimits.passwordProtection) {
            res.status(HTTP_STATUS.FORBIDDEN).json({
              error: 'Password protection not available in your plan'
            });
            return;
          }
        }
      } else {
        // Anonymous users have restrictions
        if (customCode || password) {
          res.status(HTTP_STATUS.UNAUTHORIZED).json({
            error: 'Custom codes and password protection require authentication'
          });
          return;
        }
      }

      // Generate short code
      const shortCode = await generateShortCode(customCode);

      // Hash password if provided
      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

      // Create URL
      const url = await prisma.url.create({
        data: {
          originalUrl,
          shortCode,
          title: title || null,
          description: description || null,
          password: hashedPassword,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          userId: userId || null
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          createdAt: true
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        ...url,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${url.shortCode}`,
        hasPassword: !!hashedPassword
      });

    } catch (error: any) {
      if (error.message === 'Custom code already exists') {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Custom code already exists'
        });
        return;
      }

      console.error('URL creation error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get user's URLs
 * GET /urls
 */
router.get('/',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
      const skip = (page - 1) * limit;
      const search = req.query.search as string;

      const where: any = { userId };
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { originalUrl: { contains: search, mode: 'insensitive' } },
          { shortCode: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [urls, total] = await Promise.all([
        prisma.url.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            originalUrl: true,
            shortCode: true,
            title: true,
            description: true,
            expiresAt: true,
            isActive: true,
            createdAt: true,
            clicks: true,
            _count: {
              select: { clicks: true }
            }
          }
        }),
        prisma.url.count({ where })
      ]);

      res.json({
        urls: urls.map(url => ({
          ...url,
          shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${url.shortCode}`,
          clickCount: url._count.clicks
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get URLs error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Get URL details
 * GET /urls/:id
 */
router.get('/:id',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const url = await prisma.url.findFirst({
        where: { 
          id,
          userId 
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { clicks: true }
          }
        }
      });

      if (!url) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      res.json({
        ...url,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${url.shortCode}`,
        clickCount: url._count.clicks
      });

    } catch (error) {
      console.error('Get URL error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update URL
 * PUT /urls/:id
 */
router.put('/:id',
  rateLimitModerate,
  requireAuth,
  sanitizeInput,
  ...validateUrlUpdate,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { title, description, isActive } = req.body;

      const existingUrl = await prisma.url.findFirst({
        where: { id, userId }
      });

      if (!existingUrl) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      const updatedUrl = await prisma.url.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existingUrl.title,
          description: description !== undefined ? description : existingUrl.description,
          isActive: isActive !== undefined ? isActive : existingUrl.isActive
        },
        select: {
          id: true,
          originalUrl: true,
          shortCode: true,
          title: true,
          description: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        ...updatedUrl,
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3001'}/${updatedUrl.shortCode}`
      });

    } catch (error) {
      console.error('Update URL error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Verify password for protected URL
 * POST /urls/verify-password/:shortCode
 */
router.post('/verify-password/:shortCode',
  rateLimitLenient,
  sanitizeInput,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortCode } = req.params;
      const { password } = req.body;

      if (!password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Password is required'
        });
        return;
      }

      const url = await prisma.url.findFirst({
        where: { 
          shortCode,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        select: {
          id: true,
          originalUrl: true,
          password: true
        }
      });

      if (!url) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found or expired'
        });
        return;
      }

      if (!url.password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'URL is not password protected'
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, url.password);

      if (!isValidPassword) {
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          error: 'Invalid password'
        });
        return;
      }

      res.json({
        success: true,
        originalUrl: url.originalUrl
      });

    } catch (error) {
      console.error('Password verification error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete URL
 * DELETE /urls/:id
 */
router.delete('/:id',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const url = await prisma.url.findFirst({
        where: { id, userId }
      });

      if (!url) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'URL not found'
        });
        return;
      }

      await prisma.url.delete({
        where: { id }
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();

    } catch (error) {
      console.error('Delete URL error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);



export default router;
