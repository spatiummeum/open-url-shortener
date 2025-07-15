'use client';

import { useState } from 'react';
import Link from 'next/link';
import UrlForm from '../src/components/UrlForm';

export default function Home() {
  const [createdUrl, setCreatedUrl] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30"></div>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-success-500/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          {/* Header */}
          <div className="text-center mb-12 scroll-fade">
            <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 mb-6 text-balance">
              URL <span className="text-gradient-modern bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">Shortener</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty leading-relaxed">
              Create shorter, more manageable links with powerful analytics, 
              custom domains, password protection, and advanced features powered by modern technology.
            </p>
          </div>

          {/* Main URL Form */}
          <UrlForm 
            onSuccess={setCreatedUrl}
            className="w-full max-w-2xl mb-12"
          />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center card-modern p-6 backdrop-blur-sm hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-balance">Lightning Fast</h3>
              <p className="text-gray-600 text-pretty">Generate short links instantly with our optimized infrastructure.</p>
            </div>

            <div className="text-center card-modern p-6 backdrop-blur-sm hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-balance">Detailed Analytics</h3>
              <p className="text-gray-600 text-pretty">Track clicks, locations, devices, and more with comprehensive analytics.</p>
            </div>

            <div className="text-center card-modern p-6 backdrop-blur-sm hover-lift">
              <div className="w-16 h-16 bg-gradient-to-br from-warning-100 to-warning-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 text-balance">Password Protection</h3>
              <p className="text-gray-600 text-pretty">Secure your links with password protection and access controls.</p>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-8 py-4 glass-modern text-gray-900 font-semibold rounded-xl border border-white/30 hover:bg-white/80 transition-all duration-300 backdrop-blur-sm hover-scale focus-ring-modern"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:shadow-glow transition-all duration-300 btn-modern focus-ring-modern hover:scale-105"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
