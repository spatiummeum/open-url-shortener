import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
          }

          const data = await response.json();
          const { user, tokens } = data;

          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateTokens: (tokens) => {
        set({ tokens });
      },

      updateUser: (user) => {
        set({ user });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        const { tokens } = get();
        if (!tokens?.accessToken) {
          return false;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({ user: data.user, isAuthenticated: true });
            return true;
          } else {
            // Token might be expired, try to refresh
            if (tokens.refreshToken) {
              const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken: tokens.refreshToken }),
              });

              if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                const newTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
                set({ tokens: newTokens });

                // Try to get user profile again with new token
                const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                  headers: {
                    'Authorization': `Bearer ${newTokens.accessToken}`,
                  },
                });

                if (userResponse.ok) {
                  const userData = await userResponse.json();
                  set({ user: userData.user, isAuthenticated: true });
                  return true;
                }
              }
            }

            // If we get here, authentication failed
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);