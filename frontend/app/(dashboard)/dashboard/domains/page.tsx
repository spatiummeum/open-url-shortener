'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../../../../src/services/apiService';
import { useAuthStore } from '../../../../src/store/authStore';

interface Domain {
  id: string;
  domain: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    urls: number;
  };
}

interface DomainsResponse {
  domains: Domain[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DomainsPage() {
  const { user } = useAuthStore();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const data: DomainsResponse = await apiService.get('/domains');
      setDomains(data.domains);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await apiService.post('/domains', { domain: newDomain });
      setDomains([response.domain, ...domains]);
      setNewDomain('');
      setShowCreateForm(false);
      setSuccess('Domain created successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create domain');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain? All URLs using this domain will be moved to the default domain.')) {
      return;
    }

    try {
      await apiService.delete(`/domains/${domainId}`);
      setDomains(domains.filter(d => d.id !== domainId));
      setSuccess('Domain deleted successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete domain');
    }
  };

  const isPremiumUser = user?.plan !== 'FREE';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Domains</h1>
            <p className="text-gray-600 mt-2">
              Manage your custom domains for branded short links.
            </p>
          </div>
          {isPremiumUser && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Domain
            </button>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Premium Plan Warning */}
      {!isPremiumUser && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                Premium Feature
              </h3>
              <p className="text-yellow-700 mt-1">
                Custom domains are available for Premium and Business plan users. 
                <a href="/dashboard/billing" className="underline ml-1">Upgrade your plan</a> to use this feature.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Domain Form */}
      {showCreateForm && isPremiumUser && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Domain</h2>
          <form onSubmit={handleCreateDomain} className="space-y-4">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                Domain Name
              </label>
              <input
                id="domain"
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your domain without protocol (http/https)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Domain'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDomain('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Domains List */}
      <div className="bg-white rounded-lg shadow">
        {domains.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No domains</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isPremiumUser ? 'Get started by creating your first custom domain.' : 'Upgrade to Premium to add custom domains.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URLs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {domains.map((domain) => (
                  <tr key={domain.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {domain.domain}
                          </div>
                          <div className="text-sm text-gray-500">
                            https://{domain.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        domain.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {domain.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {domain._count.urls} URLs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => {
                            // Handle domain settings
                            console.log('Edit domain', domain.id);
                          }}
                        >
                          Settings
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteDomain(domain.id)}
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

      {/* Domain Setup Instructions */}
      {isPremiumUser && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Setting Up Your Custom Domain
          </h3>
          <div className="space-y-3 text-sm text-blue-700">
            <p>To use your custom domain, you'll need to configure DNS settings:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Add a CNAME record pointing your domain to our service</li>
              <li>Wait for DNS propagation (usually 24-48 hours)</li>
              <li>Verify your domain in the settings</li>
              <li>Start using your branded short links!</li>
            </ol>
            <p className="mt-4">
              <strong>DNS Configuration:</strong><br />
              Type: CNAME<br />
              Name: @ (or your subdomain)<br />
              Value: links.urlshortener.com
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
