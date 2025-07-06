'use client';

import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

export function AuthDebug() {
  const authState = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div>Authenticated: {authState.isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User: {authState.user ? authState.user.email : 'None'}</div>
      <div>Tokens: {authState.tokens ? 'Present' : 'None'}</div>
      <div>Loading: {authState.isLoading ? 'Yes' : 'No'}</div>
      <div>LocalStorage: {typeof window !== 'undefined' && localStorage.getItem('auth-store') ? 'Present' : 'None'}</div>
    </div>
  );
}
