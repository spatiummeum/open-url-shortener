'use client';

import { useState } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SimpleChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'doughnut';
  height?: number;
  showValues?: boolean;
  isLoading?: boolean;
}

export function SimpleChart({ 
  title, 
  data, 
  type = 'bar', 
  height = 200, 
  showValues = false,
  isLoading = false 
}: SimpleChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="mt-2">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return <BarChart title={title} data={data} height={height} showValues={showValues} />;
  }

  if (type === 'line') {
    return <LineChart title={title} data={data} height={height} />;
  }

  if (type === 'doughnut') {
    return <DoughnutChart title={title} data={data} />;
  }

  return null;
}

function BarChart({ title, data, height, showValues }: { 
  title: string; 
  data: ChartDataPoint[]; 
  height: number; 
  showValues: boolean; 
}) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
          
          return (
            <div key={item.label} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate mr-3" title={item.label}>
                {item.label}
              </div>
              <div className="flex-1 flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
                  <div
                    className="h-4 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: color 
                    }}
                  ></div>
                </div>
                {showValues && (
                  <div className="w-16 text-sm font-medium text-gray-900 text-right">
                    {item.value.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ title, data, height }: { 
  title: string; 
  data: ChartDataPoint[]; 
  height: number; 
}) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg className="w-full h-full">
          <polyline
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
              return `${x}%,${y}%`;
            }).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
            return (
              <circle
                key={index}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                fill="#3B82F6"
                className="drop-shadow-sm"
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          {data.slice(0, 5).map((item, index) => (
            <span key={index} className="truncate" title={item.label}>
              {item.label.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DoughnutChart({ title, data }: { title: string; data: ChartDataPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="10"
            />
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const strokeDasharray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;
              const strokeDashoffset = -cumulativePercentage * 2.51327;
              const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const color = item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`;
            
            return (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                ></div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{item.label}</span>
                  <span className="text-gray-500 ml-2">
                    {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SimpleChart;
