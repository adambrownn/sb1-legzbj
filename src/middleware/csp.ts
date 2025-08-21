import { Request, Response, NextFunction } from 'express';
import { generateNonce } from '../lib/security/nonce';

export const setupCSP = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Generate nonce for inline scripts
  const nonce = generateNonce();
  res.locals.nonce = nonce;

  // Define CSP directives
  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Add any trusted external scripts here
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : '',
    ].filter(Boolean),
    'style-src': ["'self'", "'unsafe-inline'"], // Consider restricting unsafe-inline in production
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      // Add your API domains here
      process.env.VITE_API_BASE_URL || '',
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  };

  // Convert directives to string
  const policy = Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');

  // Set CSP header
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Content-Security-Policy', policy);
  } else {
    // Use Report-Only in development
    res.setHeader('Content-Security-Policy-Report-Only', policy);
  }

  next();
};
