'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing...');

  useEffect(() => {
    setDebugInfo('Setting up hydration listener...');
    
    // Wait for Zustand to hydrate the store from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setDebugInfo('Hydration completed');
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setDebugInfo('Already hydrated');
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          <p className="mt-2 text-xs text-gray-500">{debugInfo}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
