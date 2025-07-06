import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  checkTokenValidity: () => void;
}

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, tokens) => {
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (updatedUser) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updatedUser },
          });
        }
      },

      updateTokens: (tokens) => {
        set({ tokens });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      checkTokenValidity: () => {
        const { tokens, logout } = get();
        
        if (!tokens?.accessToken) {
          logout();
          return;
        }

        // Check if access token is expired
        if (isTokenExpired(tokens.accessToken)) {
          // If refresh token is also expired, logout
          if (!tokens.refreshToken || isTokenExpired(tokens.refreshToken)) {
            logout();
            return;
          }
          
          // Access token expired but refresh token is valid
          // The API service will handle the refresh automatically
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Check token validity after rehydration
        if (state) {
          state.checkTokenValidity();
        }
      },
    }
  )
);
