import { useMutation } from '@tanstack/react-query';
import api from '../lib/api/axios-config';
import { UserRoleType } from '@/types/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: UserRoleType;
    mfaEnabled?: boolean;
  };
}

export const useAuth = () => {
  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      // Store the token
      localStorage.setItem('token', data.token);
      // You might want to update your global state here
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/logout');
      localStorage.removeItem('token');
      // Clear any global state here
    },
  });

  return {
    login,
    logout,
    isAuthenticated: !!localStorage.getItem('token'),
  };
};
