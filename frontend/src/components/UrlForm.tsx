'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, GlobeAltIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { urlApi } from '../services/apiService';

interface UrlFormProps {
  onSuccess?: (result: any) => void;
  className?: string;
}

export default function UrlForm({ onSuccess, className = '' }: UrlFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    originalUrl: '',
    customCode: '',
    title: '',
    description: '',
    password: '',
    expiresAt: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Check user plan capabilities
  const canUsePasswordProtection = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
  const canUseCustomCode = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.originalUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(formData.originalUrl);
    } catch {
      setError('Please enter a valid URL (including http:// or https://)');
      return;
    }

    // Check plan restrictions
    if (formData.password && !canUsePasswordProtection) {
      setError('Password protection is available for PRO and ENTERPRISE plans only');
      return;
    }

    if (formData.customCode && !canUseCustomCode) {
      setError('Custom codes are available for PRO and ENTERPRISE plans only');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data
      const submitData: any = {
        originalUrl: formData.originalUrl.trim(),
      };

      if (formData.customCode.trim()) {
        submitData.customCode = formData.customCode.trim();
      }

      if (formData.title.trim()) {
        submitData.title = formData.title.trim();
      }

      if (formData.description.trim()) {
        submitData.description = formData.description.trim();
      }

      if (formData.password.trim()) {
        submitData.password = formData.password.trim();
      }

      if (formData.expiresAt) {
        submitData.expiresAt = formData.expiresAt;
      }

      const response = await urlApi.createUrl(submitData);
      setResult(response);
      
      if (onSuccess) {
        onSuccess(response);
      }

      // Reset form
      setFormData({
        originalUrl: '',
        customCode: '',
        title: '',
        description: '',
        password: '',
        expiresAt: '',
      });
      setShowAdvanced(false);

    } catch (err: any) {
      console.error('URL creation error:', err);
      
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 401) {
        setError('Please sign in to use advanced features');
      } else if (err.response?.status === 403) {
        setError('This feature is not available in your current plan');
      } else {
        setError('Failed to create short URL. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.shortUrl) {
      try {
        await navigator.clipboard.writeText(result.shortUrl);
        // TODO: Add toast notification
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const resetForm = () => {
    setResult(null);
    setError('');
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-xl p-6 ${className}`}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">URL Created Successfully!</h3>
          
          {result.hasPassword && (
            <div className="flex items-center justify-center gap-2 text-yellow-600 text-sm mb-4">
              <LockClosedIcon className="w-4 h-4" />
              <span>This URL is password protected</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={result.shortUrl}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Link
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={resetForm}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create Another URL
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-xl p-6 ${className}`}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div>
          <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Long URL <span className="text-red-500">*</span>
          </label>
          <input
            id="originalUrl"
            type="url"
            value={formData.originalUrl}
            onChange={(e) => handleInputChange('originalUrl', e.target.value)}
            placeholder="https://example.com/very-long-url"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            required
          />
        </div>

        {/* Advanced Options Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Custom Code */}
              <div>
                <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="w-4 h-4 inline mr-1" />
                  Custom Code
                  {!canUseCustomCode && <span className="text-xs text-gray-500 ml-2">(PRO feature)</span>}
                </label>
                <input
                  id="customCode"
                  type="text"
                  value={formData.customCode}
                  onChange={(e) => handleInputChange('customCode', e.target.value)}
                  placeholder="my-custom-link"
                  disabled={!canUseCustomCode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Descriptive title for your link"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of this link"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
                />
              </div>

              {/* Password Protection */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  <LockClosedIcon className="w-4 h-4 inline mr-1" />
                  Password Protection
                  {!canUsePasswordProtection && <span className="text-xs text-gray-500 ml-2">(PRO feature)</span>}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Leave empty for no password"
                    disabled={!canUsePasswordProtection}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  {canUsePasswordProtection && formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="w-4 h-4 inline mr-1" />
                  Expiration Date (optional)
                </label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.originalUrl.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Short URL'
          )}
        </button>

        {/* Plan upgrade message */}
        {!user && (
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>
              <span className="font-medium">Sign up</span> for advanced features like custom codes and password protection
            </p>
          </div>
        )}
      </form>
    </motion.div>
  );
}
