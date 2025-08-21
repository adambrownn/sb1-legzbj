import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth/jwt.js'; // 🔧 FIXED: Added .js
import { UserRoleType } from '../types/auth.js'; // 🔧 FIXED: Added .js

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRoleType;
        mfaVerified?: boolean;
      };
    }
  }
}

// 🔧 FIXED: Middleware to verify JWT token
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    console.log('🔧 AUTH MIDDLEWARE: ===== AUTHENTICATION DEBUG =====');
    console.log('🔧 AUTH MIDDLEWARE: Request path:', req.path);
    console.log('🔧 AUTH MIDDLEWARE: Request method:', req.method);
    console.log('🔧 AUTH MIDDLEWARE: Auth header exists:', !!authHeader);
    console.log('🔧 AUTH MIDDLEWARE: Token extracted:', token ? 'YES' : 'NO');
    console.log('🔧 AUTH MIDDLEWARE: Token length:', token?.length);

    if (!token) {
      console.log('🔧 AUTH MIDDLEWARE: ❌ REJECTING - No token provided');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication token is required' 
      });
    }

    console.log('🔧 AUTH MIDDLEWARE: Calling verifyToken function...');
    
    let decoded;
    try {
      // 🔧 FIXED: Handle both sync and async verifyToken
      const result = verifyToken(token);
      decoded = result instanceof Promise ? await result : result;
      
      console.log('🔧 AUTH MIDDLEWARE: ✅ JWT verification successful');
      console.log('🔧 AUTH MIDDLEWARE: Decoded payload:', {
        userId: decoded?.userId,
        email: decoded?.email,
        role: decoded?.role,
        mfaVerified: decoded?.mfaVerified,
      });
    } catch (jwtError: any) {
      console.error('🔧 AUTH MIDDLEWARE: ❌ JWT verification failed:', jwtError);
      console.error('🔧 AUTH MIDDLEWARE: JWT error details:', {
        name: jwtError?.name,
        message: jwtError?.message
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    if (!decoded) {
      console.log('🔧 AUTH MIDDLEWARE: ❌ REJECTING - verifyToken returned null/undefined');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid or expired token' 
      });
    }

    if (!decoded.email) {
      console.log('🔧 AUTH MIDDLEWARE: ❌ REJECTING - No email in token payload');
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid token payload' 
      });
    }

    // 🔧 FIXED: User attachment debugging
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      mfaVerified: decoded.mfaVerified || false
    };
    
    console.log('🔧 AUTH MIDDLEWARE: ✅ SUCCESS - User attached to request');
    console.log('🔧 AUTH MIDDLEWARE: Final req.user:', {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    });
    console.log('🔧 AUTH MIDDLEWARE: ===== AUTHENTICATION COMPLETE =====');
    
    next();
  } catch (error: any) {
    console.error('🔧 AUTH MIDDLEWARE: ❌ FATAL ERROR:', error);
    console.error('🔧 AUTH MIDDLEWARE: Error stack:', error?.stack);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication'
    });
  }
};

// Middleware to check if user has required role
export const requireRole = (allowedRoles: UserRoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to verify MFA if enabled
export const requireMFA = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  if (req.user.mfaVerified !== true) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'MFA verification required'
    });
  }

  next();
};
