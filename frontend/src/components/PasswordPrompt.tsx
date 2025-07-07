'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { urlApi } from '../services/apiService';

interface PasswordPromptProps {
  shortCode: string;
  onSuccess: (originalUrl: string) => void;
  onCancel?: () => void;
}

export default function PasswordPrompt({ shortCode, onSuccess, onCancel }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await urlApi.verifyPassword(shortCode, password);
      if (response.success && response.originalUrl) {
        onSuccess(response.originalUrl);
      }
    } catch (err: any) {
      console.error('Password verification failed:', err);
      if (err.response?.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4"
          >
            <LockClosedIcon className="w-8 h-8 text-yellow-600" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Protected Link
          </h1>
          <p className="text-gray-600">
            This link is password protected. Please enter the password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="Enter password"
                autoFocus
                autoComplete="off"
              />
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
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Access Link'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Link: <span className="font-mono text-gray-700">/{shortCode}</span>
        </div>
      </motion.div>
    </div>
  );
}
