import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate, rateLimitStrict } from '../middleware/rateLimiter';
import { validateDomain, handleValidationErrors, sanitizeInput } from '../middleware/validation';
import { HTTP_STATUS, PLAN_LIMITS } from '../utils/constants';

const router = Router();
const prisma = new PrismaClient();

/**
 * Get user's custom domains
 * GET /domains
 */
router.get('/',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const skip = (page - 1) * limit;

      const [domains, total] = await Promise.all([
        prisma.domain.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            domain: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { urls: true }
            }
          }
        }),
        prisma.domain.count({
          where: { userId }
        })
      ]);

      res.json({
        domains: domains.map(domain => ({
          ...domain,
          urlCount: domain._count.urls
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('Get domains error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Add a new custom domain
 * POST /domains
 */
router.post('/',
  rateLimitStrict,
  requireAuth,
  sanitizeInput,
  validateDomain,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { domain } = req.body;
      const userPlan = req.user!.plan;

      // Check plan limits
      const planLimits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
      
      if (planLimits.customDomains === 0) {
        res.status(HTTP_STATUS.FORBIDDEN).json({
          error: 'Custom domains not available in your plan'
        });
        return;
      }

      if (planLimits.customDomains !== -1) {
        const domainCount = await prisma.domain.count({
          where: { userId }
        });

        if (domainCount >= planLimits.customDomains) {
          res.status(HTTP_STATUS.FORBIDDEN).json({
            error: `Domain limit reached for your plan (${planLimits.customDomains})`
          });
          return;
        }
      }

      // Check if domain already exists
      const existingDomain = await prisma.domain.findUnique({
        where: { domain }
      });

      if (existingDomain) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: 'Domain already registered'
        });
        return;
      }

      // Validate domain ownership (basic DNS check)
      // In production, you would implement proper domain verification
      const isValidDomain = await verifyDomainOwnership(domain);
      
      if (!isValidDomain) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Domain verification failed. Please ensure the domain is properly configured.'
        });
        return;
      }

      // Create domain
      const newDomain = await prisma.domain.create({
        data: {
          domain,
          userId,
          isActive: true
        },
        select: {
          id: true,
          domain: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(HTTP_STATUS.CREATED).json({
        domain: newDomain,
        message: 'Domain added successfully'
      });

    } catch (error) {
      console.error('Add domain error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Update domain status
 * PUT /domains/:id
 */
router.put('/:id',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'isActive must be a boolean value'
        });
        return;
      }

      const domain = await prisma.domain.findFirst({
        where: { id, userId }
      });

      if (!domain) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Domain not found'
        });
        return;
      }

      const updatedDomain = await prisma.domain.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          domain: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        domain: updatedDomain,
        message: 'Domain updated successfully'
      });

    } catch (error) {
      console.error('Update domain error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Delete a custom domain
 * DELETE /domains/:id
 */
router.delete('/:id',
  rateLimitModerate,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const domain = await prisma.domain.findFirst({
        where: { id, userId },
        include: {
          _count: {
            select: { urls: true }
          }
        }
      });

      if (!domain) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Domain not found'
        });
        return;
      }

      // Check if domain has associated URLs
      if (domain._count.urls > 0) {
        res.status(HTTP_STATUS.CONFLICT).json({
          error: `Cannot delete domain. It has ${domain._count.urls} associated URLs. Please delete or reassign them first.`
        });
        return;
      }

      await prisma.domain.delete({
        where: { id }
      });

      res.status(HTTP_STATUS.NO_CONTENT).send();

    } catch (error) {
      console.error('Delete domain error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Verify domain ownership
 * POST /domains/:id/verify
 */
router.post('/:id/verify',
  rateLimitStrict,
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const domain = await prisma.domain.findFirst({
        where: { id, userId }
      });

      if (!domain) {
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Domain not found'
        });
        return;
      }

      // Perform domain verification
      const isVerified = await verifyDomainOwnership(domain.domain);

      if (isVerified) {
        await prisma.domain.update({
          where: { id },
          data: { isActive: true }
        });

        res.json({
          verified: true,
          message: 'Domain verified successfully'
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          verified: false,
          error: 'Domain verification failed'
        });
      }

    } catch (error) {
      console.error('Verify domain error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error'
      });
    }
  }
);

/**
 * Basic domain ownership verification
 * In production, implement proper DNS TXT record verification
 */
async function verifyDomainOwnership(domain: string): Promise<boolean> {
  try {
    // Basic domain format validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    
    if (!domainRegex.test(domain)) {
      return false;
    }

    // In production, you would:
    // 1. Generate a unique verification token
    // 2. Ask user to create a TXT record with the token
    // 3. Perform DNS lookup to verify the TXT record
    // 4. Only activate domain after successful verification
    
    // For now, return true for valid domain format
    return true;

  } catch (error) {
    console.error('Domain verification error:', error);
    return false;
  }
}

export default router;
