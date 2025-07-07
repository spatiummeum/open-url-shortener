import { AxiosRequestConfig } from 'axios';
import { apiService } from './apiService';

export interface StripeConfig {
  priceIds: {
    pro: string;
    enterprise: string;
  };
  publishableKey?: string;
}

export interface StripeCustomer {
  id: string;
}

export interface CheckoutSession {
  url: string;
}

export interface Subscription {
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

class StripeService {
  /**
   * Get Stripe configuration (price IDs, publishable key)
   */
  async getConfig(): Promise<StripeConfig> {
    return await apiService.get('/stripe/config');
  }

  /**
   * Create Stripe customer
   */
  async createCustomer(config?: AxiosRequestConfig): Promise<StripeCustomer> {
    const response = await apiService.post('/stripe/customer', {}, config);
    return response.customer;
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    config?: AxiosRequestConfig
  ): Promise<CheckoutSession> {
    const response = await apiService.post(
      '/stripe/checkout',
      { priceId, successUrl, cancelUrl },
      config
    );
    return { url: response.url };
  }

  /**
   * Get user's subscription status
   */
  async getSubscription(config?: AxiosRequestConfig): Promise<Subscription | null> {
    const response = await apiService.get('/stripe/subscription', config);
    return response.subscription;
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(
    plan: 'pro' | 'enterprise',
    successUrl?: string,
    cancelUrl?: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    try {
      const stripeConfig = await this.getConfig();
      const priceId = stripeConfig.priceIds[plan];
      
      if (!priceId) {
        throw new Error(`Price ID not found for plan: ${plan}`);
      }

      const defaultSuccessUrl = `${window.location.origin}/dashboard?payment=success`;
      const defaultCancelUrl = `${window.location.origin}/dashboard?payment=canceled`;

      const session = await this.createCheckoutSession(
        priceId,
        successUrl || defaultSuccessUrl,
        cancelUrl || defaultCancelUrl,
        config
      );

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout redirect error:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;
