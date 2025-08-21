import { UserRole } from '../store/auth-store';
import { verifyToken } from './jwt';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    mfaVerified?: boolean;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Invalid token');
  }

  req.user = payload;
  next();
};

export const requireMFA = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  if (!req.user) {
    throw new Error('Unauthorized');
  }

  if (req.user.role === 'host' || req.user.role === 'admin') {
    if (!req.user.mfaVerified) {
      throw new Error('MFA verification required');
    }
  }

  next();
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!req.user) {
      throw new Error('Unauthorized');
    }

    if (!roles.includes(req.user.role)) {
      throw new Error('Forbidden');
    }

    next();
  };
};
