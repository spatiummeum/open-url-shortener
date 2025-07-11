'use client';

import { useState } from 'react';
import Link from 'next/link';
import UrlForm from '../src/components/UrlForm';

export default function Home() {
  const [createdUrl, setCreatedUrl] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">
              URL <span className="text-blue-600">Shortener</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create shorter, more manageable links with powerful analytics, 
              custom domains, password protection, and advanced features.
            </p>
          </div>

          {/* Main URL Form */}
          <UrlForm 
            onSuccess={setCreatedUrl}
            className="w-full max-w-2xl mb-12"
          />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Generate short links instantly with our optimized infrastructure.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">Track clicks, locations, devices, and more with comprehensive analytics.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Protection</h3>
              <p className="text-gray-600">Secure your links with password protection and access controls.</p>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
