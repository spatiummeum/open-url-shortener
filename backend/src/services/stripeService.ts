import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-06-30.basil',
});

// Crea un cliente de Stripe y Subscription en la base de datos
export const createCustomer = async (userId: string, email: string) => {
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });
  await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: customer.id,
      plan: 'FREE',
      status: 'inactive',
    },
  });
  return customer;
};

// Crea una sesión de checkout para suscripción
export const createCheckoutSession = async (userId: string, priceId: string, successUrl: string, cancelUrl: string) => {
  // Buscar o crear subscription
  let subscription = await prisma.subscription.findUnique({ where: { userId } });
  
  if (!subscription) {
    // Si no existe subscription, crear customer y subscription
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    const customer = await createCustomer(userId, user.email);
    subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) throw new Error('Failed to create subscription');
  }
  
  const session = await stripe.checkout.sessions.create({
    customer: subscription.stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
  });
  return session;
};

export const createPortalSession = async (userId: string, returnUrl: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('Subscription not found for this user.');
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return portalSession;
};

// Maneja eventos de webhook de Stripe
export const handleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);
      
      const userId = session.metadata?.userId;
      if (!userId) {
        console.error('User ID not found in checkout session metadata');
        return;
      }
      
      const stripeSubscriptionId = session.subscription;
      if (!stripeSubscriptionId || typeof stripeSubscriptionId !== 'string') {
        console.error('Stripe subscription ID not found in checkout session');
        return;
      }

      // Update subscription with stripeSubscriptionId
      await prisma.subscription.update({
        where: { userId: userId },
        data: {
          stripeSubscriptionId: stripeSubscriptionId,
        },
      });
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId = (invoice as any).subscription as string;
      if (typeof stripeSubscriptionId !== 'string') {
        console.error('Invoice payment succeeded but subscription ID is missing or not a string.');
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId },
      });

      if (subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const priceId = stripeSubscription.items.data[0]?.price.id;

        const planMap: { [key: string]: 'PRO' | 'ENTERPRISE' } = {
          [process.env.STRIPE_PRICE_ID_PRO!]: 'PRO',
          [process.env.STRIPE_PRICE_ID_ENTERPRISE!]: 'ENTERPRISE',
        };
        
        const plan = priceId ? planMap[priceId] || 'FREE' : 'FREE';

        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'active',
            plan: plan,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
          },
        });

        await prisma.user.update({
          where: { id: subscription.userId },
          data: { plan: plan },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      console.log('Subscription updated/created:', sub.id);
      
      if (sub.customer && typeof sub.customer === 'string') {
        // Determinar plan basado en el price ID
        const planMap: { [key: string]: 'FREE' | 'PRO' | 'ENTERPRISE' } = {
          [process.env.STRIPE_PRICE_ID_PRO!]: 'PRO',
          [process.env.STRIPE_PRICE_ID_ENTERPRISE!]: 'ENTERPRISE',
        };
        
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? planMap[priceId] || 'FREE' : 'FREE';
        
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            stripeSubscriptionId: sub.id,
            status: sub.status,
            plan,
            currentPeriodStart: new Date((sub as any)['current_period_start'] * 1000),
            currentPeriodEnd: new Date((sub as any)['current_period_end'] * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
          },
        });
        
        // Actualizar plan del usuario también
        const subscription = await prisma.subscription.findUnique({ 
          where: { stripeCustomerId: sub.customer } 
        });
        if (subscription) {
          await prisma.user.update({
            where: { id: subscription.userId },
            data: { plan },
          });
        }
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      console.log('Subscription deleted:', sub.id);
      
      if (sub.customer && typeof sub.customer === 'string') {
        await prisma.subscription.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: {
            status: 'canceled',
            plan: 'FREE',
            cancelAtPeriodEnd: true,
          },
        });
        
        // Downgrade usuario a FREE
        const subscription = await prisma.subscription.findUnique({ 
          where: { stripeCustomerId: sub.customer } 
        });
        if (subscription) {
          await prisma.user.update({
            where: { id: subscription.userId },
            data: { plan: 'FREE' },
          });
        }
      }
      break;
    }
    default:
      console.log('Unhandled event type:', event.type);
      break;
  }
};
