import React from 'react';

interface UrlSummary {
  totalClicks: number;
  uniqueClicks: number;
  avgClicksPerDay: number;
  peakDay: { date: string; clicks: number };
  firstClick?: Date | string;
  lastClick?: Date | string;
}

interface UrlAnalyticsOverviewProps {
  summary: UrlSummary;
  urlInfo: {
    shortCode: string;
    originalUrl: string;
    createdAt: string | Date;
    title?: string;
  };
}

const UrlAnalyticsOverview: React.FC<UrlAnalyticsOverviewProps> = ({ 
  summary,
  urlInfo 
}) => {
  const cards = [
    {
      title: 'Total Clicks',
      value: summary.totalClicks.toLocaleString(),
      icon: '👆',
      color: 'bg-blue-500',
    },
    {
      title: 'Unique Clicks',
      value: summary.uniqueClicks.toLocaleString(),
      icon: '👥',
      color: 'bg-green-500',
    },
    {
      title: 'Avg Clicks/Day',
      value: summary.avgClicksPerDay.toFixed(1),
      icon: '📈',
      color: 'bg-purple-500',
    },
    {
      title: 'Peak Day Clicks',
      value: summary.peakDay.clicks.toLocaleString(),
      icon: '🔥',
      color: 'bg-orange-500',
      subtitle: new Date(summary.peakDay.date).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">{card.title}</h3>
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                {card.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900">{card.value}</span>
              {card.subtitle && (
                <span className="text-sm text-gray-500 mt-1">{card.subtitle}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Created
            </label>
            <p className="text-sm text-gray-900">
              {new Date(urlInfo.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {summary.firstClick && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Click
              </label>
              <p className="text-sm text-gray-900">
                {new Date(summary.firstClick).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}

          {summary.lastClick && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Click
              </label>
              <p className="text-sm text-gray-900">
                {new Date(summary.lastClick).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Activity Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Activity Status</h4>
              <p className="text-sm text-gray-500 mt-1">
                {summary.totalClicks === 0 
                  ? 'No clicks yet'
                  : summary.lastClick && new Date(summary.lastClick) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ? 'Active in last 24 hours'
                  : summary.lastClick && new Date(summary.lastClick) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ? 'Active in last week'
                  : 'Low recent activity'
                }
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              summary.totalClicks === 0 
                ? 'bg-gray-300'
                : summary.lastClick && new Date(summary.lastClick) > new Date(Date.now() - 24 * 60 * 60 * 1000)
                ? 'bg-green-500'
                : summary.lastClick && new Date(summary.lastClick) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlAnalyticsOverview;
