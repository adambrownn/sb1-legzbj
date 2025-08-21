import rateLimit from 'express-rate-limit';
import { UserRole } from '../types/auth';

// Different rate limits based on user role
const RATE_LIMITS = {
  [UserRole.ADMIN]: 1000, // 1000 requests per 15 minutes
  [UserRole.HOST]: 500,   // 500 requests per 15 minutes
  [UserRole.GUEST]: 200,  // 200 requests per 15 minutes
  DEFAULT: 50,            // 50 requests per 15 minutes for unauthenticated users
};

// Rate limit window in minutes
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Create a dynamic rate limiter based on user role
export const createRateLimiter = (endpoint: string) => {
  return rateLimit({
    windowMs: WINDOW_MS,
    // Get max requests based on user role
    max: (req: any) => {
      const userRole = req.user?.role;
      return userRole ? RATE_LIMITS[userRole] : RATE_LIMITS.DEFAULT;
    },
    message: {
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    // Store key by IP and user ID if available
    keyGenerator: (req: any) => {
      const userId = req.user?.userId;
      return userId ? `${endpoint}:${userId}` : `${endpoint}:${req.ip}`;
    },
  });
};

// Create specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter('auth');
export const propertyRateLimiter = createRateLimiter('property');
export const bookingRateLimiter = createRateLimiter('booking');
export const userRateLimiter = createRateLimiter('user');
