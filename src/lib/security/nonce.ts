import crypto from 'crypto';

// Generate a random nonce for CSP
export const generateNonce = (): string => {
  return crypto.randomBytes(16).toString('base64');
};

// Validate a nonce
export const validateNonce = (nonce: string): boolean => {
  if (!nonce || typeof nonce !== 'string') {
    return false;
  }

  // Check if it's a valid base64 string of correct length
  const base64Regex = /^[A-Za-z0-9+/]{22}==$/;
  return base64Regex.test(nonce);
};
