import React from 'react';
import { TopUrl } from '../../types';

interface TopUrlsTableProps {
  urls: TopUrl[];
  title?: string;
  onViewDetails?: (urlId: string) => void;
}

const TopUrlsTable: React.FC<TopUrlsTableProps> = ({
  urls,
  title = "Top Performing URLs",
  onViewDetails,
}) => {
  const formatUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (urls.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-32 text-gray-500">
          No URLs found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="text-sm text-gray-500">
          Showing top {Math.min(urls.length, 10)} URLs
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unique Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {urls.map((url, index) => (
              <tr key={url.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {url.title || 'Untitled'}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {formatUrl(url.originalUrl)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {url.shortCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/${url.shortCode}`)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy short URL"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-semibold">
                    {url.clicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    #{index + 1} most clicked
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {url.uniqueClicks.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {url.clicks > 0 ? ((url.uniqueClicks / url.clicks) * 100).toFixed(1) : 0}% unique
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(url.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(url.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View Details
                      </button>
                    )}
                    <button
                      onClick={() => window.open(url.originalUrl, '_blank')}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Visit original URL"
                    >
                      🔗
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {urls.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No URLs to display
        </div>
      )}
    </div>
  );
};

export default TopUrlsTable;
