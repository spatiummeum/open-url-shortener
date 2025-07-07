'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { stripeService } from '../services/stripeService';

interface PaymentStatusProps {
  onClose?: () => void;
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ onClose }) => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'canceled' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const payment = searchParams.get('payment');
    
    if (payment === 'success') {
      setStatus('success');
      setMessage('Payment successful! Your subscription has been activated.');
      
      // Refresh subscription data after successful payment
      const timeoutId = setTimeout(() => {
        window.location.reload();
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    } else if (payment === 'canceled') {
      setStatus('canceled');
      setMessage('Payment was canceled. You can try again anytime.');
    } else if (payment) {
      setStatus('error');
      setMessage('There was an issue processing your payment. Please try again.');
    }
  }, [searchParams]);

  if (status === 'loading') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return (
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20" role="img" aria-label="Success icon">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'canceled':
        return (
          <svg className="w-16 h-16 text-yellow-500 mx-auto" fill="currentColor" viewBox="0 0 20 20" role="img" aria-label="Warning icon">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20" role="img" aria-label="Error icon">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'canceled':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className={`max-w-md w-full mx-4 p-6 rounded-lg border-2 ${getStatusColor()}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-status-title"
      >
        <div className="text-center">
          {getStatusIcon()}
          
          <h3 
            id="payment-status-title"
            className="text-xl font-semibold mt-4 mb-2"
          >
            {status === 'success' && 'Payment Successful!'}
            {status === 'canceled' && 'Payment Canceled'}
            {status === 'error' && 'Payment Error'}
          </h3>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-center">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            )}
            
            {status === 'success' && (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Go to Dashboard
              </button>
            )}
            
            {(status === 'canceled' || status === 'error') && (
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;
