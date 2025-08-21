import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// 🔧 FIXED: Extend AxiosRequestConfig to include retry flag
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with default config
// 🔧 OPTIONAL: Add request timeout configuration per endpoint
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // 🔧 OPTIONAL: Retry configuration
  validateStatus: (status) => {
    // Don't throw errors for these status codes, let components handle them
    return status < 500;
  }
});

// Request interceptor with better error handling
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage with preference order
    const accessToken = localStorage.getItem('accessToken');
    const fallbackToken = localStorage.getItem('token');
    const token = accessToken || fallbackToken;
    
    console.log('🔧 AXIOS DEBUG: Request to:', config.url);
    console.log('🔧 AXIOS DEBUG: Method:', config.method?.toUpperCase());
    
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔧 AXIOS DEBUG: Auth header added:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('🔧 AXIOS DEBUG: No auth token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('🔧 AXIOS DEBUG: Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// 🔧 FIXED: Response interceptor with proper error handling
api.interceptors.response.use(
  (response) => {
    console.log('🔧 AXIOS DEBUG: Successful response from:', response.config?.url);
    return response;
  },
  async (error: AxiosError) => {
    console.error('🔧 AXIOS DEBUG: Response error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    const originalRequest = error.config;

    // 🔧 FIXED: Null check for originalRequest
    if (!originalRequest) {
      console.error('🔧 AXIOS DEBUG: No original request config available');
      return Promise.reject(error);
    }

    // 🔧 FIXED: Specific 401 handling with MFA exclusions
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 🔧 FIXED: Exclude specific endpoints from auto-refresh
      const excludedPaths = [
        '/api/auth/login',
        '/api/auth/register', 
        '/api/auth/mfa/',
        '/api/auth/logout'
      ];

      const shouldExclude = excludedPaths.some(path => 
        originalRequest.url?.includes(path)
      );

      if (shouldExclude) {
        console.log('🔧 AXIOS DEBUG: Skipping refresh for excluded endpoint:', originalRequest.url);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        console.log('🔧 AXIOS DEBUG: Attempting token refresh...');
        
        // 🔧 FIXED: Use a separate axios instance to avoid interceptor loops
        const refreshResponse = await axios.create({
          baseURL: api.defaults.baseURL,
          timeout: 5000
        }).post('/api/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // 🔧 FIXED: Update tokens in localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('token', accessToken); // Keep for backward compatibility
          console.log('🔧 AXIOS DEBUG: New access token stored');
        }

        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
          console.log('🔧 AXIOS DEBUG: New refresh token stored');
        }

        // 🔧 FIXED: Update original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        console.log('🔧 AXIOS DEBUG: Retrying original request with new token');
        return api(originalRequest);

      } catch (refreshError: any) {
        console.error('🔧 AXIOS DEBUG: Token refresh failed:', refreshError);
        
        // 🔧 FIXED: Clean up tokens
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        console.log('🔧 AXIOS DEBUG: Tokens cleared due to refresh failure');
        
        // 🔧 FIXED: Use proper SPA navigation instead of hard redirect
        // Let the calling component handle the auth error appropriately
        const authError = new Error('Authentication expired');
        authError.name = 'AUTH_EXPIRED';
        return Promise.reject(authError);
      }
    }

    // 🔧 FIXED: Handle other error types
    if (error.response?.status === 403) {
      console.log('🔧 AXIOS DEBUG: Forbidden access - insufficient permissions');
    }

    if (error.response?.status === 429) {
      console.log('🔧 AXIOS DEBUG: Rate limit exceeded');
    }

    return Promise.reject(error);
  }
);

export default api;
