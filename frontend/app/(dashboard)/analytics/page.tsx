'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAnalytics, useAnalyticsExport } from '@/hooks/useAnalytics';
import AnalyticsOverview from '@/components/analytics/AnalyticsOverview';
import ClicksChart from '@/components/analytics/ClicksChart';
import GeographicChart from '@/components/analytics/GeographicChart';
import TechnologyChart from '@/components/analytics/TechnologyChart';
import TopUrlsTable from '@/components/analytics/TopUrlsTable';
import PeriodSelector from '@/components/analytics/PeriodSelector';

const AnalyticsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const router = useRouter();

  const { data: analytics, loading, error, refresh } = useAnalytics(selectedPeriod);
  const { exportAnalytics, loading: exportLoading } = useAnalyticsExport();

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleViewUrlDetails = (urlId: string) => {
    router.push(`/dashboard/analytics/urls/${urlId}`);
  };

  const handleExportData = async () => {
    await exportAnalytics(undefined, selectedPeriod);
  };

  const handleRefresh = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg border p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">❌</div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Analytics</h3>
                <p className="text-red-600 mt-1">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
            <p className="text-gray-600">Create some URLs and get clicks to see analytics here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">
              Track your URL performance and visitor insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={handlePeriodChange}
            />
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Refresh data"
              >
                <span className="text-lg">🔄</span>
                <span>Refresh</span>
              </button>
              
              <button
                onClick={handleExportData}
                disabled={exportLoading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <span className="text-lg">{exportLoading ? '⏳' : '📊'}</span>
                <span>{exportLoading ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          <AnalyticsOverview
            summary={analytics.summary}
            comparison={analytics.comparison}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Clicks Over Time */}
          <div className="xl:col-span-2">
            <ClicksChart data={analytics.charts.clicksOverTime} />
          </div>

          {/* Geographic Data */}
          <div className="xl:col-span-2">
            <GeographicChart
              countries={analytics.charts.topCountries}
              cities={analytics.charts.topCities}
            />
          </div>

          {/* Technology & Traffic Sources */}
          <div className="xl:col-span-2">
            <TechnologyChart
              devices={analytics.charts.topDevices}
              browsers={analytics.charts.topBrowsers}
              referrers={analytics.charts.topReferrers}
            />
          </div>
        </div>

        {/* Top URLs Table */}
        <div className="mb-8">
          <TopUrlsTable
            urls={analytics.charts.topUrls}
            onViewDetails={handleViewUrlDetails}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Data updates in real-time. Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
