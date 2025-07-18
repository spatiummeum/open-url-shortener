'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '../../../../src/components/dashboard/DashboardHeader';
import UrlForm from '../../../../src/components/UrlForm';
import { apiService } from '../../../../src/services/apiService';
import { useAuthStore } from '../../../../src/store/authStore';

export default function NewUrlPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const authSuccess = await checkAuth();
      if (!authSuccess) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const handleSubmit = async (formData: {
    originalUrl: string;
    customCode?: string;
    title?: string;
    description?: string;
    expiresAt?: Date;
    password?: string;
  }) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await apiService.post('/urls', formData);
      
      // Redirect to the URLs page with success message
      router.push('/urls?created=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          title="Create New URL" 
          subtitle="Shorten a new URL and customize its settings" 
        />
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
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
        title="Create New URL" 
        subtitle="Shorten a new URL and customize its settings" 
      />
      
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Tips for creating URLs
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Add a custom short code to make your URLs more memorable</li>
                    <li>Include a title and description for better organization</li>
                    <li>Set an expiration date for time-sensitive links</li>
                    <li>Add password protection for sensitive content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error creating URL
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* URL Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">URL Details</h3>
              <p className="text-sm text-gray-500 mt-1">
                Enter the URL you want to shorten and customize its settings
              </p>
            </div>
            <div className="px-6 py-4">
              <UrlForm 
                onSuccess={(result) => {
                  // Redirect to the URLs page with success message
                  router.push('/urls?created=true');
                }}
                className=""
              />
            </div>
          </div>

          {/* Recent URLs */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent URLs</h3>
              <p className="text-sm text-gray-500 mt-1">
                Your recently created short URLs
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent URLs</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your recently created URLs will appear here.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            
            <button
              onClick={() => router.push('/urls')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View All URLs
              <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
