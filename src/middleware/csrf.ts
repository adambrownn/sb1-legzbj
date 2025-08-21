import csrf from 'csurf';
import { Request, Response, NextFunction } from 'express';

// Configure CSRF protection
const csrfProtection = csrf({
  cookie: {
    key: '_csrf',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
  }
});

// Middleware to handle CSRF errors
export const handleCSRFError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  // Handle CSRF token validation errors
  res.status(403).json({
    error: 'Forbidden',
    message: 'Invalid or missing CSRF token'
  });
};

// Middleware to set CSRF token cookie
export const setCSRFToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Set CSRF token in cookie if not present
  if (!req.cookies._csrf) {
    res.cookie('XSRF-TOKEN', req.csrfToken(), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: false // Allow JavaScript access for SPA
    });
  }
  next();
};

export { csrfProtection };
