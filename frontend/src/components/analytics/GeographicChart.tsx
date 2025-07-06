import React from 'react';
import { GeoData } from '../../types';

interface GeographicChartProps {
  countries: GeoData[];
  cities: GeoData[];
  title?: string;
}

const GeographicChart: React.FC<GeographicChartProps> = ({
  countries,
  cities,
  title = "Geographic Distribution",
}) => {
  const maxPercentage = Math.max(
    ...countries.map(c => c.percentage),
    ...cities.map(c => c.percentage)
  );

  const DataBar: React.FC<{ 
    label: string; 
    value: number; 
    percentage: number;
    icon?: string;
  }> = ({ label, value, percentage, icon }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {icon && <span className="text-sm">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {label}
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(percentage / maxPercentage) * 100}%` }}
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

  const getCountryFlag = (countryName: string): string => {
    const flagMap: Record<string, string> = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Brazil': '🇧🇷',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'Russia': '🇷🇺',
      'South Korea': '🇰🇷',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Austria': '🇦🇹',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Portugal': '🇵🇹',
      'Greece': '🇬🇷',
      'Turkey': '🇹🇷',
      'Israel': '🇮🇱',
      'South Africa': '🇿🇦',
      'Egypt': '🇪🇬',
      'Nigeria': '🇳🇬',
      'Kenya': '🇰🇪',
      'Thailand': '🇹🇭',
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      'Indonesia': '🇮🇩',
      'Philippines': '🇵🇭',
      'Vietnam': '🇻🇳',
      'Taiwan': '🇹🇼',
      'Hong Kong': '🇭🇰',
      'New Zealand': '🇳🇿',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'Peru': '🇵🇪',
      'Venezuela': '🇻🇪',
      'Ukraine': '🇺🇦',
      'Romania': '🇷🇴',
      'Hungary': '🇭🇺',
      'Bulgaria': '🇧🇬',
      'Croatia': '🇭🇷',
      'Serbia': '🇷🇸',
      'Slovenia': '🇸🇮',
      'Slovakia': '🇸🇰',
      'Lithuania': '🇱🇹',
      'Latvia': '🇱🇻',
      'Estonia': '🇪🇪',
      'Ireland': '🇮🇪',
      'Iceland': '🇮🇸',
    };
    return flagMap[countryName] || '🌍';
  };

  if (countries.length === 0 && cities.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No geographic data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Countries */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <span className="mr-2">🌍</span>
            Top Countries
          </h4>
          <div className="space-y-3">
            {countries.slice(0, 8).map((country, index) => (
              <DataBar
                key={`country-${index}`}
                label={country.country}
                value={country.clicks}
                percentage={country.percentage}
                icon={getCountryFlag(country.country)}
              />
            ))}
            {countries.length === 0 && (
              <div className="text-gray-500 text-sm py-8 text-center">
                No country data available
              </div>
            )}
          </div>
        </div>

        {/* Top Cities */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-4 flex items-center">
            <span className="mr-2">🏙️</span>
            Top Cities
          </h4>
          <div className="space-y-3">
            {cities.slice(0, 8).map((city, index) => (
              <DataBar
                key={`city-${index}`}
                label={city.city ? `${city.city}, ${city.country}` : city.country}
                value={city.clicks}
                percentage={city.percentage}
                icon={getCountryFlag(city.country)}
              />
            ))}
            {cities.length === 0 && (
              <div className="text-gray-500 text-sm py-8 text-center">
                No city data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicChart;
