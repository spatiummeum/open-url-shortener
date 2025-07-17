'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

export interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showSubscriptionStatus?: boolean;
}

export default function DashboardHeader({ 
  title, 
  subtitle, 
  showSubscriptionStatus = true 
}: DashboardHeaderProps) {
  const { user } = useAuthStore();
  const { subscription, loading } = useStripeSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const getPlanBadge = () => {
    if (loading) {
      return (
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded-full"></div>
      );
    }

    if (!subscription || subscription.status !== 'active') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100/80 text-gray-800 backdrop-blur-sm border border-gray-200/50">
          Free Plan
        </span>
      );
    }

    const planName = subscription.plan === 'ENTERPRISE' ? 'Enterprise' : subscription.plan === 'PRO' ? 'Pro' : 'Free';
    const bgColor = subscription.plan === 'ENTERPRISE' 
      ? 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 border-warning-300/50' 
      : 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border-primary-300/50';

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${bgColor}`}>
        {planName}
      </span>
    );
  };

  const getUsageLimits = () => {
    if (!subscription || subscription.status !== 'active') {
      return {
        urlsUsed: 0, // We'll get this from API later
        urlsLimit: 10,
        clicksUsed: 0, // We'll get this from API later  
        clicksLimit: 1000
      };
    }

    // Pro plan limits
    if (subscription.plan === 'PRO') {
      return {
        urlsUsed: 0, // We'll get this from API later
        urlsLimit: 1000,
        clicksUsed: 0, // We'll get this from API later
        clicksLimit: 100000
      };
    }

    // Enterprise plan (unlimited)
    return {
      urlsUsed: 0, // We'll get this from API later
      urlsLimit: null,
      clicksUsed: 0, // We'll get this from API later
      clicksLimit: null
    };
  };

  const usage = getUsageLimits();

  return (
    <div className="glass-modern backdrop-blur-xl border-b border-white/20 shadow-soft">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {title}
              </h1>
              {showSubscriptionStatus && (
                <div className="ml-4">
                  {getPlanBadge()}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
            
            {/* Welcome message */}
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-medium">{user?.name || user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Usage indicators */}
            {showSubscriptionStatus && (
              <div className="hidden sm:flex items-center space-x-6">
                {/* URLs usage */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {usage.urlsUsed} / {usage.urlsLimit || '∞'}
                  </div>
                  <div className="text-xs text-gray-500">URLs</div>
                  {usage.urlsLimit && (
                    <div className="mt-1 w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ width: `${Math.min((usage.urlsUsed / usage.urlsLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Clicks usage */}
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">
                    {usage.clicksUsed.toLocaleString()} / {usage.clicksLimit ? usage.clicksLimit.toLocaleString() : '∞'}
                  </div>
                  <div className="text-xs text-gray-500">Clicks</div>
                  {usage.clicksLimit && (
                    <div className="mt-1 w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-green-600 h-1 rounded-full" 
                        style={{ width: `${Math.min((usage.clicksUsed / usage.clicksLimit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade button for free users */}
            {(!subscription || subscription.status !== 'active') && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="btn-modern inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:shadow-glow focus-ring-modern transition-all duration-300 hover:scale-105"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade
              </button>
            )}

            {/* Quick actions dropdown */}
            <div className="relative">
              <Link
                href="/urls/new"
                className="inline-flex items-center px-6 py-3 glass-modern rounded-xl shadow-soft text-sm font-medium text-gray-700 backdrop-blur-sm border border-white/30 hover:bg-white/80 focus-ring-modern transition-all duration-300 hover-scale"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New URL
              </Link>
            </div>
          </div>
        </div>

        {/* Usage warning for near-limit users */}
        {usage.urlsLimit && usage.urlsUsed / usage.urlsLimit > 0.8 && (
          <div className="mt-4 glass-modern bg-warning-50/80 border border-warning-200/50 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning-800 text-balance">
                  Approaching URL limit
                </h3>
                <div className="mt-2 text-sm text-warning-700">
                  <p className="text-pretty">
                    You're using {usage.urlsUsed} of {usage.urlsLimit} URLs. 
                    <a href="/dashboard/subscription" className="font-medium underline ml-1 hover:text-warning-800 transition-colors">
                      Upgrade your plan
                    </a> to create more URLs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
