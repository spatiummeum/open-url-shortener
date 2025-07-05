'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../../../../src/services/apiService';

interface AnalyticsData {
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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/analytics/dashboard?period=${period}`);
      setAnalytics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track your URL performance and visitor insights.
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

      {/* Summary Stats */}
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
                  {analytics?.summary.totalUrls || 0}
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
                  {analytics?.summary.totalClicks || 0}
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
                  {analytics?.summary.uniqueClicks || 0}
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
                  {analytics?.summary.clicksInPeriod || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Clicks Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Clicks Over Time</h3>
          {analytics?.charts.clicksOverTime && analytics.charts.clicksOverTime.length > 0 ? (
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-1">
                {analytics.charts.clicksOverTime.slice(-30).map((day, index) => {
                  const maxClicks = Math.max(...analytics.charts.clicksOverTime.map(d => d.clicks));
                  const height = maxClicks > 0 ? (day.clicks / maxClicks) * 100 : 0;
                  
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.clicks} clicks`}
                      ></div>
                      {index % 5 === 0 && (
                        <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">No click data available</p>
            </div>
          )}
        </div>

        {/* Top URLs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing URLs</h3>
          {analytics?.charts.topUrls && analytics.charts.topUrls.length > 0 ? (
            <div className="space-y-4">
              {analytics.charts.topUrls.slice(0, 5).map((url, index) => (
                <div key={url.shortCode} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {url.title || `/${url.shortCode}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        /{url.shortCode}
                      </p>
                    </div>
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
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">No URL data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic by Country</h3>
          {analytics?.charts.topCountries && analytics.charts.topCountries.length > 0 ? (
            <div className="space-y-3">
              {analytics.charts.topCountries.slice(0, 5).map((country, index) => {
                const maxClicks = Math.max(...analytics.charts.topCountries.map(c => c.clicks));
                const percentage = maxClicks > 0 ? (country.clicks / maxClicks) * 100 : 0;
                
                return (
                  <div key={country.country} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {country.country}
                        </span>
                        <span className="text-sm text-gray-500">
                          {country.clicks} clicks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">No location data available</p>
            </div>
          )}
        </div>

        {/* Top Browsers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic by Browser</h3>
          {analytics?.charts.topBrowsers && analytics.charts.topBrowsers.length > 0 ? (
            <div className="space-y-3">
              {analytics.charts.topBrowsers.slice(0, 5).map((browser, index) => {
                const maxClicks = Math.max(...analytics.charts.topBrowsers.map(b => b.clicks));
                const percentage = maxClicks > 0 ? (browser.clicks / maxClicks) * 100 : 0;
                
                return (
                  <div key={browser.browser} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {browser.browser}
                        </span>
                        <span className="text-sm text-gray-500">
                          {browser.clicks} clicks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-500">No browser data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
