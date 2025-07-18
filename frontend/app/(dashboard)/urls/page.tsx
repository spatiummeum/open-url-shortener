'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../src/components/dashboard/DashboardHeader';
import { apiService } from '../../../src/services/apiService';
import { useAuthStore } from '../../../src/store/authStore';
import { Url } from '../../../src/types';

export default function UrlsPage() {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [urls, setUrls] = useState<Url[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'clicks'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const authSuccess = await checkAuth();
      if (!authSuccess) {
        router.push('/login');
        return;
      }
      fetchUrls();
    };
    
    initAuth();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/urls');
      setUrls(data.urls || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (urlId: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return;
    
    try {
      await apiService.delete(`/urls/${urlId}`);
      setUrls(urls.filter(url => url.id !== urlId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete URL');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUrls.length} URLs?`)) return;
    
    try {
      await Promise.all(selectedUrls.map(id => apiService.delete(`/urls/${id}`)));
      setUrls(urls.filter(url => !selectedUrls.includes(url.id)));
      setSelectedUrls([]);
    } catch (err: any) {
      alert('Failed to delete some URLs');
    }
  };

  const toggleUrlSelection = (urlId: string) => {
    setSelectedUrls(prev => 
      prev.includes(urlId) 
        ? prev.filter(id => id !== urlId)
        : [...prev, urlId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedUrls.length === filteredUrls.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(filteredUrls.map(url => url.id));
    }
  };

  const filteredUrls = urls.filter(url => 
    url.shortCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    url.originalUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (url.title && url.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="My URLs" 
          subtitle="Manage your shortened URLs" 
        />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title="My URLs" 
        subtitle="Manage your shortened URLs" 
      />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search URLs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as 'createdAt' | 'clicks');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="clicks-desc">Most Clicks</option>
                  <option value="clicks-asc">Least Clicks</option>
                </select>
                
                {selectedUrls.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete ({selectedUrls.length})
                  </button>
                )}
                
                <Link
                  href="/urls/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New URL
                </Link>
              </div>
            </div>
          </div>

          {/* URLs Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {filteredUrls.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'No URLs found' : 'No URLs yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first short URL.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <Link
                      href="/urls/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create URL
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUrls.length === filteredUrls.length}
                          onChange={toggleAllSelection}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUrls.map((url) => (
                      <tr key={url.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUrls.includes(url.id)}
                            onChange={() => toggleUrlSelection(url.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2 mb-1">
                              <button
                                onClick={() => copyToClipboard((url as any).shortUrl || `http://localhost:3002/${url.shortCode}`)}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
                              >
                                {url.shortCode}
                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              {url.title && (
                                <span className="text-xs text-gray-500">•</span>
                              )}
                              {url.title && (
                                <span className="text-sm text-gray-900">{url.title}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-md" title={url.originalUrl}>
                              {url.originalUrl}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/analytics/${url.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {(url as any).clickCount || (url as any)._count?.clicks || 0}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(url.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            url.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {url.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/dashboard/urls/${url.id}/edit`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(url.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredUrls.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{' '}
                    <span className="font-medium">{filteredUrls.length}</span> of{' '}
                    <span className="font-medium">{filteredUrls.length}</span> results
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
