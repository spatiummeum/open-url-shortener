import React from 'react';
import { DeviceData, BrowserData, ReferrerData } from '../../types';

interface TechnologyChartProps {
  devices: DeviceData[];
  browsers: BrowserData[];
  referrers: ReferrerData[];
  title?: string;
}

const TechnologyChart: React.FC<TechnologyChartProps> = ({
  devices,
  browsers,
  referrers,
  title = "Technology & Traffic Sources",
}) => {
  const maxPercentage = Math.max(
    ...devices.map(d => d.percentage),
    ...browsers.map(b => b.percentage),
    ...referrers.map(r => r.percentage)
  );

  const DataBar: React.FC<{ 
    label: string; 
    value: number; 
    percentage: number;
    icon?: string;
    color?: string;
  }> = ({ label, value, percentage, icon, color = 'bg-blue-600' }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {label}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`${color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${(percentage / (maxPercentage || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="text-right ml-4">
        <div className="text-sm font-semibold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
      </div>
    </div>
  );

  const getDeviceIcon = (device: string): string => {
    const iconMap: Record<string, string> = {
      'Desktop': '🖥️',
      'Mobile': '📱',
      'Tablet': '📱',
      'Unknown': '❓',
    };
    return iconMap[device] || '📱';
  };

  const getBrowserIcon = (browser: string): string => {
    const iconMap: Record<string, string> = {
      'Chrome': '🌐',
      'Firefox': '🦊',
      'Safari': '🧭',
      'Edge': '🔷',
      'Opera': '🎭',
      'Unknown': '❓',
    };
    return iconMap[browser] || '🌐';
  };

  const getReferrerIcon = (referrer: string): string => {
    const iconMap: Record<string, string> = {
      'Direct': '🔗',
      'google.com': '🔍',
      'facebook.com': '📘',
      'twitter.com': '🐦',
      'linkedin.com': '💼',
      'instagram.com': '📸',
      'youtube.com': '📺',
      'github.com': '🐙',
      'reddit.com': '🤖',
      'pinterest.com': '📌',
    };
    return iconMap[referrer] || '🌐';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Devices */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <span className="mr-2">📱</span>
            Devices
          </h4>
          <div className="space-y-3">
            {devices.slice(0, 6).map((device, index) => (
              <DataBar
                key={`device-${index}`}
                label={device.device}
                value={device.clicks}
                percentage={device.percentage}
                icon={getDeviceIcon(device.device)}
                color="bg-purple-600"
              />
            ))}
            {devices.length === 0 && (
              <div className="text-gray-500 text-sm py-8 text-center">
                No device data
              </div>
            )}
          </div>
        </div>

        {/* Browsers */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <span className="mr-2">🌐</span>
            Browsers
          </h4>
          <div className="space-y-3">
            {browsers.slice(0, 6).map((browser, index) => (
              <DataBar
                key={`browser-${index}`}
                label={browser.browser}
                value={browser.clicks}
                percentage={browser.percentage}
                icon={getBrowserIcon(browser.browser)}
                color="bg-green-600"
              />
            ))}
            {browsers.length === 0 && (
              <div className="text-gray-500 text-sm py-8 text-center">
                No browser data
              </div>
            )}
          </div>
        </div>

        {/* Traffic Sources */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <span className="mr-2">🚦</span>
            Traffic Sources
          </h4>
          <div className="space-y-3">
            {referrers.slice(0, 6).map((referrer, index) => (
              <DataBar
                key={`referrer-${index}`}
                label={referrer.referrer === 'Direct' ? 'Direct Traffic' : referrer.domain}
                value={referrer.clicks}
                percentage={referrer.percentage}
                icon={getReferrerIcon(referrer.domain)}
                color="bg-orange-600"
              />
            ))}
            {referrers.length === 0 && (
              <div className="text-gray-500 text-sm py-8 text-center">
                No referrer data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyChart;
