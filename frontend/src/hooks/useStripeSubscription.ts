import { useState, useEffect, useCallback } from 'react';
import { stripeService, Subscription } from '../services/stripeService';

interface UseStripeSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  upgradeToEnterprise: () => Promise<void>;
  hasProPlan: boolean;
  hasEnterprisePlan: boolean;
  isSubscriptionActive: boolean;
}

export const useStripeSubscription = (): UseStripeSubscriptionReturn => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userSubscription = await stripeService.getSubscription();
      setSubscription(userSubscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription';
      setError(errorMessage);
      console.error('Error loading subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSubscription = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  const upgradeToPro = useCallback(async () => {
    await stripeService.redirectToCheckout('pro');
  }, []);

  const upgradeToEnterprise = useCallback(async () => {
    await stripeService.redirectToCheckout('enterprise');
  }, []);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const hasProPlan = subscription?.plan === 'PRO';
  const hasEnterprisePlan = subscription?.plan === 'ENTERPRISE';
  const isSubscriptionActive = subscription?.status === 'active';

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    upgradeToPro,
    upgradeToEnterprise,
    hasProPlan,
    hasEnterprisePlan,
    isSubscriptionActive,
  };
};

export default useStripeSubscription;
