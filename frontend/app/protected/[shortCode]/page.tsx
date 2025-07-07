'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PasswordPrompt from '../../../src/components/PasswordPrompt';

export default function ProtectedLinkPage() {
  const params = useParams();
  const router = useRouter();
  const shortCode = params.shortCode as string;
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handlePasswordSuccess = (originalUrl: string) => {
    setIsRedirecting(true);
    // Redirect to the original URL
    window.location.href = originalUrl;
  };

  const handleCancel = () => {
    router.push('/');
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <PasswordPrompt
      shortCode={shortCode}
      onSuccess={handlePasswordSuccess}
      onCancel={handleCancel}
    />
  );
}
