'use client';

import Link from 'next/link';
import { useStripeSubscription } from '@/hooks/useStripeSubscription';

export interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  requiresPro?: boolean;
}

export interface QuickActionsProps {
  actions?: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const { hasProPlan, hasEnterprisePlan } = useStripeSubscription();
  
  const defaultActions: QuickAction[] = [
    {
      title: 'Create Short URL',
      description: 'Generate a new short link',
      href: '/dashboard/urls/new',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      title: 'View Analytics',
      description: 'Check your link performance',
      href: '/dashboard/analytics',
      color: 'text-green-600 bg-green-50 hover:bg-green-100',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: 'Bulk Import',
      description: 'Import multiple URLs at once',
      href: '/dashboard/urls/import',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      requiresPro: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      )
    },
    {
      title: 'Custom Domains',
      description: 'Manage your branded domains',
      href: '/dashboard/domains',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      requiresPro: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s1.343-9 3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    },
    {
      title: 'API Access',
      description: 'Integrate with our REST API',
      href: '/dashboard/api',
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
      requiresPro: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: 'Team Management',
      description: 'Manage team members and permissions',
      href: '/dashboard/team',
      color: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
      requiresPro: true,
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const actionsToShow = actions || defaultActions;
  const isPremiumUser = hasProPlan || hasEnterprisePlan;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {actionsToShow.map((action, index) => {
            const isLocked = action.requiresPro && !isPremiumUser;
            
            if (isLocked) {
              return (
                <div
                  key={index}
                  className="relative group cursor-not-allowed"
                >
                  <div className="relative flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60">
                    <div className={`flex-shrink-0 ${action.color.split(' ')[0]} ${action.color.split(' ')[1]}`}>
                      {action.icon}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {action.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {action.description}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Upgrade tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Upgrade to Pro to unlock this feature
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={index}
                href={action.href}
                className={`flex items-center p-4 border border-gray-200 rounded-lg transition-colors duration-200 hover:border-gray-300 ${action.color}`}
              >
                <div className="flex-shrink-0">
                  {action.icon}
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {action.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {action.description}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        {!isPremiumUser && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-purple-900">
                  Unlock Premium Features
                </h4>
                <p className="text-sm text-purple-700 mt-1">
                  Upgrade to Pro or Enterprise to access bulk import, custom domains, API access, and team management.
                </p>
              </div>
              <div className="ml-6 flex-shrink-0">
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Upgrade Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
