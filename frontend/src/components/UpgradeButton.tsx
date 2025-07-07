'use client';

import React from 'react';
import { stripeService } from '../services/stripeService';

interface UpgradeButtonProps {
  plan: 'pro' | 'enterprise';
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  plan,
  className = '',
  children,
  disabled = false,
  variant = 'primary'
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await stripeService.redirectToCheckout(plan);
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Failed to start upgrade process. Please try again.');
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (disabled || loading) {
      return `${baseClasses} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
      case 'secondary':
        return `${baseClasses} bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-500`;
      case 'outline':
        return `${baseClasses} border-2 border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-500`;
      default:
        return `${baseClasses} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
    }
  };

  return (
    <div>
      <button
        onClick={handleUpgrade}
        disabled={disabled || loading}
        className={`${getButtonClasses()} ${className}`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          children || `Upgrade to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default UpgradeButton;
