import React from 'react';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  className?: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = '',
}) => {
  const periods = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24h' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last year' },
  ];

  return (
    <div className={`inline-flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`
            px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
            ${
              selectedPeriod === period.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }
          `}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;
