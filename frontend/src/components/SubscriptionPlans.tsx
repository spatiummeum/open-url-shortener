'use client';

import React, { useState, useEffect } from 'react';
import { stripeService } from '@/services/stripeService';
import type { Subscription } from '@/services/stripeService';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  plan: 'free' | 'pro' | 'enterprise';
  currentPlan?: string;
  onSelectPlan: (plan: 'pro' | 'enterprise') => void;
  loading?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  plan,
  currentPlan,
  onSelectPlan,
  loading
}) => {
  const isCurrentPlan = currentPlan?.toLowerCase() === plan;
  const isFree = plan === 'free';

  return (
    <div className={`
      border rounded-lg p-6 relative
      ${isCurrentPlan ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
    `}>
      {isCurrentPlan && (
        <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
          Current Plan
        </span>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <div className="text-3xl font-bold mb-4">{price}</div>
        
        <ul className="space-y-2 mb-6 text-left">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {!isFree && (
          <button
            onClick={() => onSelectPlan(plan as 'pro' | 'enterprise')}
            disabled={loading || isCurrentPlan}
            className={`
              w-full py-2 px-4 rounded-lg font-medium transition-colors
              ${isCurrentPlan 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading ? 'Processing...' : isCurrentPlan ? 'Current Plan' : `Upgrade to ${title}`}
          </button>
        )}
      </div>
    </div>
  );
};

export const SubscriptionPlans: React.FC = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userSubscription = await stripeService.getSubscription();
      setSubscription(userSubscription);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: 'pro' | 'enterprise') => {
    try {
      setCheckoutLoading(true);
      setError(null);
      
      await stripeService.redirectToCheckout(plan);
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('Failed to start checkout process. Please try again.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          role="status"
          aria-label="Loading subscription plans"
        ></div>
      </div>
    );
  }

  const plans = [
    {
      title: 'Free',
      price: '$0/month',
      features: [
        'Up to 100 URLs per month',
        'Basic analytics',
        'Custom short codes',
        'Standard support'
      ],
      plan: 'free' as const
    },
    {
      title: 'Pro',
      price: '$9.99/month',
      features: [
        'Up to 10,000 URLs per month',
        'Advanced analytics',
        'Custom domains',
        'API access',
        'Priority support',
        'Bulk operations'
      ],
      plan: 'pro' as const
    },
    {
      title: 'Enterprise',
      price: '$29.99/month',
      features: [
        'Unlimited URLs',
        'Premium analytics',
        'Multiple custom domains',
        'API access',
        'White-label solution',
        'Dedicated support',
        'Custom integrations'
      ],
      plan: 'enterprise' as const
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that best fits your needs</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.plan}
            title={plan.title}
            price={plan.price}
            features={plan.features}
            plan={plan.plan}
            currentPlan={subscription?.plan}
            onSelectPlan={handleSelectPlan}
            loading={checkoutLoading}
          />
        ))}
      </div>

      {subscription && subscription.plan !== 'FREE' && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Subscription</h3>
          <div className="text-sm text-gray-600">
            <p>Plan: {subscription.plan}</p>
            <p>Status: {subscription.status}</p>
            {subscription.currentPeriodEnd && (
              <p>
                Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {subscription.cancelAtPeriodEnd && (
              <p className="text-yellow-600">Will cancel at period end</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
