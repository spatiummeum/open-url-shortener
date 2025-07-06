import React from 'react';
import { AnalyticsSummary, PeriodComparison } from '../../types';

interface MetricCardProps {
  title: string;
  value: number | string;
  comparison?: PeriodComparison;
  format?: 'number' | 'percentage' | 'decimal';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  comparison, 
  format = 'number',
  icon 
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'decimal':
        return val.toFixed(2);
      default:
        return val.toLocaleString();
    }
  };

  const getComparisonColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getComparisonIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        </div>
      </div>
      
      <div className="mt-2">
        <div className="text-3xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        
        {comparison && (
          <div className="mt-2 flex items-center space-x-1">
            <span className={`text-sm font-medium ${getComparisonColor(comparison.change)}`}>
              {getComparisonIcon(comparison.change)}
              {Math.abs(comparison.changePercentage).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500">vs previous period</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface AnalyticsOverviewProps {
  summary: AnalyticsSummary;
  comparison: {
    clicks: PeriodComparison;
    uniqueClicks: PeriodComparison;
    urls: PeriodComparison;
  };
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({
  summary,
  comparison,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Clicks"
        value={summary.totalClicks}
        comparison={comparison.clicks}
        icon={<span className="text-xl">📊</span>}
      />
      
      <MetricCard
        title="Unique Clicks"
        value={summary.uniqueClicks}
        comparison={comparison.uniqueClicks}
        icon={<span className="text-xl">👥</span>}
      />
      
      <MetricCard
        title="Total URLs"
        value={summary.totalUrls}
        comparison={comparison.urls}
        icon={<span className="text-xl">🔗</span>}
      />
      
      <MetricCard
        title="Click Rate"
        value={summary.clickRate}
        format="decimal"
        icon={<span className="text-xl">📈</span>}
      />
      
      <MetricCard
        title="Clicks in Period"
        value={summary.clicksInPeriod}
        icon={<span className="text-xl">⏱️</span>}
      />
      
      <MetricCard
        title="Avg Clicks per URL"
        value={summary.avgClicksPerUrl}
        format="decimal"
        icon={<span className="text-xl">🎯</span>}
      />
    </div>
  );
};

export default AnalyticsOverview;
