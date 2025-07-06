'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUrlAnalytics, useAnalyticsExport } from '@/hooks/useAnalytics';
import UrlAnalyticsOverview from '@/components/analytics/UrlAnalyticsOverview';
import ClicksChart from '@/components/analytics/ClicksChart';
import GeographicChart from '@/components/analytics/GeographicChart';
import TechnologyChart from '@/components/analytics/TechnologyChart';
import PeriodSelector from '@/components/analytics/PeriodSelector';

interface UrlAnalyticsPageProps {
  params: Promise<{
    urlId: string;
  }>;
}

const UrlAnalyticsPage: React.FC<UrlAnalyticsPageProps> = ({ params }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [urlId, setUrlId] = useState<string>('');
  const router = useRouter();

  // Unwrap params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setUrlId(resolvedParams.urlId);
    });
  }, [params]);

  const { data: analytics, loading, error, refresh } = useUrlAnalytics(urlId, selectedPeriod);
  const { exportAnalytics, loading: exportLoading } = useAnalyticsExport();

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleExportData = async () => {
    if (urlId) {
      await exportAnalytics(urlId, selectedPeriod);
    }
  };

  const handleGoBack = () => {
    router.push('/dashboard/analytics');
  };

  const handleRefresh = () => {
    refresh();
  };

  // Don't render until we have the urlId
  if (!urlId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back to Analytics</span>
            </button>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 text-xl mr-3">❌</div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading URL Analytics</h3>
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
          <div className="mb-6">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="text-lg">←</span>
              <span>Back to Analytics</span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg border p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
            <p className="text-gray-600">This URL hasn't received any clicks yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span className="text-lg">←</span>
            <span>Back to Analytics</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Analytics</h1>
            
            {/* URL Info */}
            <div className="bg-white rounded-lg border p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="bg-gray-100 px-3 py-2 rounded text-sm">
                      {analytics.url.shortCode}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(`${window.location.origin}/${analytics.url.shortCode}`)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <a
                      href={analytics.url.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm truncate"
                    >
                      {analytics.url.originalUrl}
                    </a>
                    <span className="text-lg">🔗</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Created
                  </label>
                  <p className="text-sm text-gray-600">
                    {new Date(analytics.url.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {analytics.url.title && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <p className="text-sm text-gray-900">{analytics.url.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0 lg:ml-6">
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
          <UrlAnalyticsOverview
            summary={analytics.summary}
            urlInfo={analytics.url}
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

export default UrlAnalyticsPage;
