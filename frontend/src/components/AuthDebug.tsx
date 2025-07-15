'use client';

import { useAuthStore } from '../store/authStore';

export default function AuthDebug() {
  const { user, tokens, isAuthenticated } = useAuthStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm opacity-80 z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user?.email || 'None'}</div>
        <div>Plan: {user?.plan || 'None'}</div>
        <div>Token: {tokens?.accessToken ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}