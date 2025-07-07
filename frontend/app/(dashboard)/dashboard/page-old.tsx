'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../../../src/services/apiService';
import { useAuthStore } from '../../../src/store/authStore';

interface DashboardStats {
  summary: {
    totalUrls: number;
    totalClicks: number;
    uniqueClicks: number;
    clicksInPeriod: number;
  };
  charts: {
    clicksOverTime: Array<{ date: string; clicks: number }>;
    topUrls: Array<{ shortCode: string; title: string; clicks: number }>;
    topCountries: Array<{ country: string; clicks: number }>;
    topBrowsers: Array<{ browser: string; clicks: number }>;
  };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchDashboardStats();
  }, [period]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/analytics/dashboard?period=${period}`);
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name || user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's an overview of your URL shortening activity.
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6">
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: '1y', label: '1 Year' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                period === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total URLs
                </dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {stats?.summary.totalUrls || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Clicks
                </dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {stats?.summary.totalClicks || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Unique Visitors
                </dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {stats?.summary.uniqueClicks || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Clicks This Period
                </dt>
                <dd className="text-3xl font-bold text-gray-900">
                  {stats?.summary.clicksInPeriod || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top URLs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top URLs</h3>
          {stats?.charts.topUrls && stats.charts.topUrls.length > 0 ? (
            <div className="space-y-3">
              {stats.charts.topUrls.slice(0, 5).map((url, index) => (
                <div key={url.shortCode} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {url.title || url.shortCode}
                    </p>
                    <p className="text-sm text-gray-500">{url.shortCode}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {url.clicks} clicks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No URLs with clicks yet</p>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Countries</h3>
          {stats?.charts.topCountries && stats.charts.topCountries.length > 0 ? (
            <div className="space-y-3">
              {stats.charts.topCountries.slice(0, 5).map((country, index) => (
                <div key={country.country} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {country.country}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {country.clicks} clicks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No location data yet</p>
          )}
        </div>

        {/* Top Browsers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Browsers</h3>
          {stats?.charts.topBrowsers && stats.charts.topBrowsers.length > 0 ? (
            <div className="space-y-3">
              {stats.charts.topBrowsers.slice(0, 5).map((browser, index) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {browser.browser}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {browser.clicks} clicks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No browser data yet</p>
          )}
        </div>

        {/* Clicks Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clicks Over Time</h3>
          {stats?.charts.clicksOverTime && stats.charts.clicksOverTime.length > 0 ? (
            <div className="h-64 flex items-end space-x-1">
              {stats.charts.clicksOverTime.slice(-14).map((day, index) => {
                const maxClicks = Math.max(...stats.charts.clicksOverTime.map(d => d.clicks));
                const height = maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45">
                      {new Date(day.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No click data yet</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/dashboard/urls/new"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Create New URL</span>
          </a>
          
          <a
            href="/dashboard/analytics"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">View Analytics</span>
          </a>
          
          <a
            href="/dashboard/domains"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Manage Domains</span>
          </a>
          
          <a
            href="/dashboard/profile"
            className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="h-6 w-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">Profile Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}
