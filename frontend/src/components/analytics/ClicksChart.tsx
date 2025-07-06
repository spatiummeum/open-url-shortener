import React from 'react';
import { ClicksOverTime } from '../../types';

interface ClicksChartProps {
  data: ClicksOverTime[];
  title?: string;
  height?: number;
}

const ClicksChart: React.FC<ClicksChartProps> = ({ 
  data, 
  title = "Clicks Over Time",
  height = 300 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const maxClicks = Math.max(...data.map(d => Math.max(d.clicks, d.uniqueClicks)));
  const chartWidth = 800;
  const chartHeight = height - 100;
  const padding = 40;

  const getX = (index: number) => {
    return padding + (index * (chartWidth - 2 * padding)) / (data.length - 1 || 1);
  };

  const getY = (value: number) => {
    return chartHeight - padding - ((value / (maxClicks || 1)) * (chartHeight - 2 * padding));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    
    let path = `M ${getX(0)} ${getY(values[0])}`;
    for (let i = 1; i < values.length; i++) {
      path += ` L ${getX(i)} ${getY(values[i])}`;
    }
    return path;
  };

  const clicksPath = createPath(data.map(d => d.clicks));
  const uniqueClicksPath = createPath(data.map(d => d.uniqueClicks));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Total Clicks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-gray-600">Unique Clicks</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <svg width={chartWidth} height={height} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width={chartWidth} height={chartHeight} fill="url(#grid)" opacity="0.5"/>

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = Math.round(maxClicks * ratio);
            const y = getY(value);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  className="text-xs fill-gray-500"
                  textAnchor="end"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((item, index) => {
            if (index % Math.ceil(data.length / 6) === 0 || index === data.length - 1) {
              const x = getX(index);
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - 10}
                  className="text-xs fill-gray-500"
                  textAnchor="middle"
                >
                  {formatDate(item.date)}
                </text>
              );
            }
            return null;
          })}

          {/* Total clicks line */}
          <path
            d={clicksPath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Unique clicks line */}
          <path
            d={uniqueClicksPath}
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {data.map((item, index) => {
            const x = getX(index);
            const y1 = getY(item.clicks);
            const y2 = getY(item.uniqueClicks);
            
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y1}
                  r="4"
                  fill="#2563eb"
                  className="hover:r-6 transition-all duration-200"
                >
                  <title>{`${formatDate(item.date)}: ${item.clicks} clicks`}</title>
                </circle>
                <circle
                  cx={x}
                  cy={y2}
                  r="4"
                  fill="#16a34a"
                  className="hover:r-6 transition-all duration-200"
                >
                  <title>{`${formatDate(item.date)}: ${item.uniqueClicks} unique clicks`}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default ClicksChart;
