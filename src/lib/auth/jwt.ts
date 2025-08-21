import jwt from 'jsonwebtoken';
import { UserRoleType } from '@/types/auth';
import { TokenBlacklistService } from './token-blacklist';

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRoleType;
  mfaVerified: boolean;
  mfaRequired?: boolean; // NEW: Indicates if MFA is needed
  jti?: string; // JWT ID for tracking tokens
  tokenType?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

const tokenBlacklist = TokenBlacklistService.getInstance();

/**
 * Generate a unique token identifier
 */
const generateTokenId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const generateTokens = async (payload: Omit<TokenPayload, 'jti' | 'tokenType' | 'iat' | 'exp'>) => {
  try {
    // Generate unique IDs for both tokens
    const accessTokenId = generateTokenId();
    const refreshTokenId = generateTokenId();

    const accessPayload: TokenPayload = {
      ...payload,
      tokenType: 'access',
      jti: accessTokenId
    };

    const refreshPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      tokenType: 'refresh' as const,
      jti: refreshTokenId
    };

    const accessToken = jwt.sign(accessPayload, JWT_SECRET, { 
      expiresIn: ACCESS_TOKEN_EXPIRY 
    });

    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { 
      expiresIn: REFRESH_TOKEN_EXPIRY 
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new Error('Failed to generate authentication tokens');
  }
};

export const verifyToken = async (token: string, isRefreshToken = false): Promise<TokenPayload | null> => {
  try {
    // First check if token is blacklisted
    const isBlacklisted = await tokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      console.warn('Attempted to use blacklisted token');
      return null;
    }

    const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret) as TokenPayload;
    
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const payload = await verifyToken(refreshToken, true);
    if (!payload || !payload.userId) {
      throw new Error('Invalid refresh token');
    }

    // Blacklist the old refresh token
    await tokenBlacklist.blacklistToken(refreshToken);

    // Generate new tokens with preserved MFA status
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      mfaVerified: payload.mfaVerified || false
    });

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Failed to refresh token');
  }
};

export const invalidateToken = async (token: string) => {
  try {
    await tokenBlacklist.blacklistToken(token);
  } catch (error) {
    console.error('Error invalidating token:', error);
    throw new Error('Failed to invalidate token');
  }
};

// Utility function to decode token without verification (for debugging)
export const decodeTokenUnsafe = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};
