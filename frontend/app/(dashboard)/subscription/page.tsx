'use client';

import { useState } from 'react';
import DashboardHeader from '../../../src/components/dashboard/DashboardHeader';
import { SubscriptionPlans } from '../../../src/components/SubscriptionPlans';
import { useStripeSubscription } from '../../../src/hooks/useStripeSubscription';

export default function SubscriptionPage() {
  const { subscription, loading, error, hasProPlan, hasEnterprisePlan } = useStripeSubscription();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const getCurrentPlanInfo = () => {
    if (loading) return null;
    
    if (!subscription || subscription.status !== 'active') {
      return {
        name: 'Free Plan',
        price: '$0',
        billing: 'Forever',
        features: [
          '10 short URLs',
          '1,000 clicks per month',
          'Basic analytics',
          'Standard support'
        ]
      };
    }

    if (subscription.plan === 'PRO') {
      return {
        name: 'Pro Plan',
        price: '$9',
        billing: 'per month',
        features: [
          '1,000 short URLs',
          '100,000 clicks per month',
          'Advanced analytics',
          'Custom domains',
          'API access',
          'Priority support'
        ]
      };
    }

    if (subscription.plan === 'ENTERPRISE') {
      return {
        name: 'Enterprise Plan',
        price: '$29',
        billing: 'per month',
        features: [
          'Unlimited URLs',
          'Unlimited clicks',
          'Advanced analytics',
          'Custom domains',
          'API access',
          'Team management',
          'White-label options',
          'Dedicated support'
        ]
      };
    }

    return null;
  };

  const currentPlan = getCurrentPlanInfo();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="Subscription" 
          subtitle="Manage your subscription and billing" 
          showSubscriptionStatus={false}
        />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Subscription" 
        subtitle="Manage your subscription and billing" 
        showSubscriptionStatus={false}
      />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Current Plan */}
          {currentPlan && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Current Plan</h3>
              </div>
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-xl font-semibold text-gray-900">{currentPlan.name}</h4>
                      {subscription?.status === 'active' && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {currentPlan.price} <span className="text-sm font-normal text-gray-500">{currentPlan.billing}</span>
                    </p>
                    
                    {subscription?.status === 'active' && subscription.currentPeriodEnd && (
                      <p className="text-sm text-gray-500 mt-2">
                        Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {subscription?.status === 'active' && (
                      <>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel Subscription
                        </button>
                        <button
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Manage Billing
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Plan Features</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Usage This Month</h3>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">URLs Created</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Total Clicks</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">API Calls</div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade Plans */}
          {(!subscription || subscription.status !== 'active' || subscription.plan === 'FREE') && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upgrade Your Plan</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Get more features and higher limits with a premium plan
                </p>
              </div>
              <div className="p-6">
                <SubscriptionPlans />
              </div>
            </div>
          )}

          {/* Billing History */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No billing history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your billing history will appear here once you have a paid subscription.
                </p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h4 className="text-lg font-medium text-gray-900">Need Help?</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Have questions about your subscription or billing? Our support team is here to help.
                </p>
              </div>
              <div className="ml-6 flex-shrink-0">
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Cancel Subscription</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 mr-2 mb-2"
                >
                  Cancel Subscription
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-900 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Keep Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
