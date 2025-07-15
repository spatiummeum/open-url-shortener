import { Router, Request, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimitModerate } from '../middleware/rateLimiter';
import { createCheckoutSession, createCustomer, createPortalSession } from '../services/stripeService';
import { prisma } from '../utils/database';

const router = Router();

/**
 * Obtener configuración de Stripe (price IDs, etc.)
 * GET /stripe/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = {
      priceIds: {
        pro: process.env.STRIPE_PRICE_ID_PRO || 'price_pro',
        enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise',
      },
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
    res.json(config);
  } catch (error: any) {
    console.error('Get Stripe config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Crear customer de Stripe
 * POST /stripe/customer
 */
router.post('/customer', rateLimitModerate, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email;
    
    // Verificar si ya tiene subscription
    const existingSubscription = await prisma.subscription.findUnique({ where: { userId } });
    if (existingSubscription) {
      res.json({ customer: { id: existingSubscription.stripeCustomerId } });
      return;
    }
    
    const customer = await createCustomer(userId, email);
    res.json({ customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Inicia un checkout de Stripe para suscripción
 * POST /stripe/checkout
 * Body: { priceId, successUrl, cancelUrl }
 */
router.post('/checkout', rateLimitModerate, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { priceId, successUrl, cancelUrl } = req.body;
    if (!priceId || !successUrl || !cancelUrl) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    const session = await createCheckoutSession(userId, priceId, successUrl, cancelUrl);
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Crear una sesión del portal del cliente de Stripe
 * POST /stripe/portal
 * Body: { returnUrl }
 */
router.post('/portal', rateLimitModerate, requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { returnUrl } = req.body;

    if (!returnUrl) {
      res.status(400).json({ error: 'returnUrl is required' });
      return;
    }

    const portalSession = await createPortalSession(userId, returnUrl);
    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

/**
 * Obtener estado de la suscripción del usuario
 * GET /stripe/subscription
 */
router.get('/subscription', rateLimitModerate, requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    });
    
    if (!subscription) {
      res.json({ subscription: null });
      return;
    }
    
    res.json({ subscription });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
