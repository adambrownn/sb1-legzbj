import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useRewardsStore } from './rewards-store';
import { User, UserRoleType } from '@/types/auth';
import api from '../api/axios-config';

export type UserRole = UserRoleType;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isMfaEnabled: boolean;
  isMfaVerified: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ requireMfa: boolean }>;
  register: (data: { name: string; email: string; password: string; role: UserRoleType }) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  enableMfa: () => Promise<{ secret: string; qrCodeUrl: string }>;
  verifyMfaSetup: (token: string) => Promise<void>;
  verifyMfa: (token: string) => Promise<void>;
  changeUserRole: (userId: string, newRole: UserRoleType) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isMfaEnabled: false,
      isMfaVerified: false,

      login: async (credentials) => {
        try {
          console.log('🔧 AUTH DEBUG: Starting login for:', credentials.email);
          
          const { data } = await api.post('/api/auth/login', credentials);
          console.log('🔧 AUTH DEBUG: Login response received:', {
            hasUser: !!data.user,
            hasToken: !!data.token,
            hasAccessToken: !!data.accessToken,
            hasRefreshToken: !!data.refreshToken,
            userEmail: data.user?.email
          });
          
          if (!data.user) {
            throw new Error('Invalid response: missing user data');
          }

          // 🔧 FIXED: Store user data first
          set({
            user: data.user,
            isAuthenticated: true,
            isMfaEnabled: data.user.mfaEnabled || false,
            isMfaVerified: data.user.mfaVerified || false,
          });
          
          console.log('🔧 AUTH DEBUG: User state updated successfully');

          // 🔧 FIXED: Handle token storage with extensive logging
          let tokenStored = false;
          
          if (data.accessToken) {
            console.log('🔧 AUTH DEBUG: Storing accessToken:', data.accessToken.substring(0, 20) + '...');
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('token', data.accessToken); // Backward compatibility
            tokenStored = true;
          }
          
          if (data.token && !data.accessToken) {
            console.log('🔧 AUTH DEBUG: Storing legacy token:', data.token.substring(0, 20) + '...');
            localStorage.setItem('token', data.token);
            localStorage.setItem('accessToken', data.token);
            tokenStored = true;
          }
          
          if (data.refreshToken) {
            console.log('🔧 AUTH DEBUG: Storing refreshToken');
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          // 🔧 FIXED: Verify tokens were actually stored
          const storedToken = localStorage.getItem('accessToken');
          const storedRefresh = localStorage.getItem('refreshToken');
          
          console.log('🔧 AUTH DEBUG: Token storage verification:', {
            tokenStored,
            hasStoredToken: !!storedToken,
            hasStoredRefresh: !!storedRefresh,
            storedTokenPreview: storedToken ? storedToken.substring(0, 20) + '...' : 'none'
          });

          if (!tokenStored) {
            console.error('🔧 AUTH DEBUG: No tokens were stored - this is the problem!');
            throw new Error('Authentication failed: no tokens received');
          }

          return {
            requireMfa: data.user.mfaEnabled && !data.user.mfaVerified
          };
        } catch (error: any) {
          console.error('🔧 AUTH DEBUG: Login error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
        }
      },

      register: async (userData) => {
        try {
          console.log('Attempting registration with:', userData.email);
          
          const { data } = await api.post('/api/auth/register', userData);
          
          if (data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isMfaEnabled: data.user.mfaEnabled || false,
              isMfaVerified: data.user.mfaVerified || false,
            });

            // Handle tokens after registration
            if (data.accessToken) {
              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('token', data.accessToken);
            }
            if (data.refreshToken) {
              localStorage.setItem('refreshToken', data.refreshToken);
            }
            if (data.token && !data.accessToken) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('accessToken', data.token);
            }
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          throw new Error(error.response?.data?.error || error.response?.data?.message || 'Registration failed');
        }
      },

      logout: async () => {
        try {
          console.log('🔧 AUTH DEBUG: Starting logout');
          
          // 🔧 FIXED: Don't fail if logout API fails - clean up locally
          try {
            await api.post('/api/auth/logout');
            console.log('🔧 AUTH DEBUG: Server logout successful');
          } catch (error) {
            console.warn('🔧 AUTH DEBUG: Server logout failed, proceeding with local cleanup:', error);
          }
        } catch (error) {
          console.error('🔧 AUTH DEBUG: Logout error:', error);
        } finally {
          // 🔧 FIXED: Always clean up local state regardless of server response
          console.log('🔧 AUTH DEBUG: Cleaning up local auth state');
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            isAuthenticated: false,
            isMfaEnabled: false,
            isMfaVerified: false,
          });
          
          console.log('🔧 AUTH DEBUG: Logout cleanup completed');
        }
      },

      refreshSession: async () => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const { data } = await api.post('/api/auth/refresh', { refreshToken });
          
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('token', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          if (data.user) {
            set({ user: data.user });
          }
        } catch (error) {
          console.error('Session refresh failed:', error);
          get().logout();
          throw new Error('Session refresh failed');
        }
      },

      enableMfa: async () => {
        const { user } = get();
        console.log('🔧 DEBUG: enableMfa called with user:', user);
        
        if (!user) {
          console.error('🔧 DEBUG: No user found in auth store');
          throw new Error('Not authenticated');
        }

        try {
          console.log('🔧 DEBUG: Making API request to /api/auth/mfa/enable');
          const { data } = await api.post('/api/auth/mfa/enable');
          console.log('🔧 DEBUG: API response received:', data);
          
          return { 
            secret: data.secret, 
            qrCodeUrl: data.qrCodeUrl 
          };
        } catch (error: any) {
          console.error('🔧 DEBUG: API request failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
          });
          throw new Error(error.response?.data?.error || 'Failed to enable MFA');
        }
      },

      verifyMfaSetup: async (token: string) => {
        const { user } = get();
        if (!user) {
          throw new Error('Not authenticated');
        }

        try {
          const { data } = await api.post('/api/auth/mfa/verify-setup', { token });
          
          // Update user state
          set(state => ({
            ...state,
            user: { ...state.user!, mfaEnabled: true, mfaVerified: true },
            isMfaEnabled: true,
            isMfaVerified: true
          }));
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'MFA setup verification failed');
        }
      },

      verifyMfa: async (token) => {
        const { user } = get();
        if (!user) {
          throw new Error('Not authenticated');
        }

        try {
          // For setup verification, use the setup endpoint
          if (!user.mfaEnabled) {
            return await get().verifyMfaSetup(token);
          }

          // For login verification
          const { data } = await api.post('/api/auth/mfa/verify', { token });
          
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('token', data.accessToken);
          }
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          
          set({ isMfaVerified: true });
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'MFA verification failed');
        }
      },

      changeUserRole: async (userId, newRole) => {
        const { user } = get();
        if (!user) {
          throw new Error('Not authenticated');
        }

        try {
          await api.patch(`/api/auth/users/${userId}/role`, { role: newRole });
        } catch (error) {
          throw new Error('Failed to change user role');
        }
      },

      requestPasswordReset: async (email) => {
        try {
          await api.post('/api/auth/request-password-reset', { email });
        } catch (error) {
          console.error('Password reset request error:', error);
          throw error;
        }
      },

      resetPassword: async (token, newPassword) => {
        try {
          await api.post('/api/auth/reset-password', { token, newPassword });
        } catch (error) {
          console.error('Password reset error:', error);
          throw error;
        }
      },

      verifyEmail: async (token) => {
        try {
          const { data } = await api.post('/api/auth/verify-email', { token });
          if (data.user) {
            set({ user: data.user });
          }
        } catch (error) {
          console.error('Email verification error:', error);
          throw error;
        }
      },

      resendVerificationEmail: async (email) => {
        try {
          await api.post('/api/auth/resend-verification', { email });
        } catch (error) {
          console.error('Resend verification error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isMfaEnabled: state.isMfaEnabled,
        isMfaVerified: state.isMfaVerified,
      }),
    }
  )
);