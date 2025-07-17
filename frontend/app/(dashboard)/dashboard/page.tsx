'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '../../../src/components/dashboard/DashboardHeader';
import { MetricGrid, MetricIcons } from '../../../src/components/dashboard/MetricGrid';
import SimpleChart from '../../../src/components/dashboard/SimpleChart';
import QuickActions from '../../../src/components/dashboard/QuickActions';
import { useDashboardData } from '../../../src/hooks/useDashboardData';

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
];

export default function DashboardPage() {
  const { data, isLoading, error, timeRange, setTimeRange } = useDashboardData('30d');

  const getMetrics = () => {
    if (!data) return [];

    return [
      {
        title: 'Total URLs',
        value: data.summary.totalUrls,
        icon: MetricIcons.urls,
        colorClass: 'text-blue-600',
        change: data.comparison?.urls ? {
          value: data.comparison.urls.changePercentage,
          type: data.comparison.urls.changePercentage > 0 ? 'increase' as const : 
                data.comparison.urls.changePercentage < 0 ? 'decrease' as const : 'neutral' as const,
          period: 'last period'
        } : undefined
      },
      {
        title: 'Total Clicks',
        value: data.summary.totalClicks,
        icon: MetricIcons.clicks,
        colorClass: 'text-green-600',
        change: data.comparison?.clicks ? {
          value: data.comparison.clicks.changePercentage,
          type: data.comparison.clicks.changePercentage > 0 ? 'increase' as const : 
                data.comparison.clicks.changePercentage < 0 ? 'decrease' as const : 'neutral' as const,
          period: 'last period'
        } : undefined
      },
      {
        title: 'Unique Visitors',
        value: data.summary.uniqueClicks,
        icon: MetricIcons.visitors,
        colorClass: 'text-purple-600',
        change: data.comparison?.uniqueClicks ? {
          value: data.comparison.uniqueClicks.changePercentage,
          type: data.comparison.uniqueClicks.changePercentage > 0 ? 'increase' as const : 
                data.comparison.uniqueClicks.changePercentage < 0 ? 'decrease' as const : 'neutral' as const,
          period: 'last period'
        } : undefined
      },
      {
        title: 'Click Rate',
        value: `${data.summary.clickRate?.toFixed(1) || 0}%`,
        icon: MetricIcons.conversion,
        colorClass: 'text-orange-600'
      }
    ];
  };

  const getChartData = () => {
    if (!data?.charts) return {
      clicksOverTime: [],
      topUrls: [],
      topCountries: [],
      topBrowsers: []
    };

    return {
      clicksOverTime: data.charts.clicksOverTime?.map(item => ({
        label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: item.clicks
      })) || [],
      
      topUrls: data.charts.topUrls?.slice(0, 5).map(url => ({
        label: url.title || url.shortCode,
        value: url.clicks,
        color: '#3B82F6'
      })) || [],
      
      topCountries: data.charts.topCountries?.slice(0, 5).map((country, index) => ({
        label: country.country,
        value: country.clicks,
        color: `hsl(${(index * 360) / 5}, 70%, 50%)`
      })) || [],
      
      topBrowsers: data.charts.topBrowsers?.slice(0, 5).map((browser, index) => ({
        label: browser.browser || 'Unknown',
        value: browser.clicks,
        color: `hsl(${(index * 360) / 5 + 120}, 70%, 50%)`
      })) || []
    };
  };

  const chartData = getChartData();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="Dashboard" 
          subtitle="Monitor your URL shortening performance" 
        />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading dashboard
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="Dashboard" 
        subtitle="Monitor your URL shortening performance" 
      />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Time Range Selector */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
              <div className="flex space-x-2">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      timeRange === range.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <MetricGrid metrics={getMetrics()} isLoading={isLoading} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SimpleChart
              title="Clicks Over Time"
              data={chartData.clicksOverTime}
              type="line"
              height={250}
              isLoading={isLoading}
            />
            
            <SimpleChart
              title="Top Performing URLs"
              data={chartData.topUrls}
              type="bar"
              height={250}
              showValues={true}
              isLoading={isLoading}
            />
            
            <SimpleChart
              title="Top Countries"
              data={chartData.topCountries}
              type="doughnut"
              isLoading={isLoading}
            />
            
            <SimpleChart
              title="Top Browsers"
              data={chartData.topBrowsers}
              type="bar"
              height={250}
              showValues={true}
              isLoading={isLoading}
            />
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Activity
              </h3>
              {data?.charts.topUrls && data.charts.topUrls.length > 0 ? (
                <div className="flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {data.charts.topUrls.slice(0, 5).map((url) => (
                      <li key={url.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {url.title || url.shortCode}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {url.originalUrl}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="text-sm text-gray-900 font-medium">
                              {url.clicks} clicks
                            </div>
                            <div className="text-sm text-gray-500">
                              {url.uniqueClicks} unique
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No URLs yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first short URL.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/urls/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create URL
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
