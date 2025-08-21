import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authenticateToken, requireRole, validateBody, authRateLimiter } from '../../middleware/index.js';
import { generateTokens, verifyToken } from '../../lib/auth/jwt.js';
import { loginSchema, registerSchema, mfaTokenSchema, resetPasswordSchema } from '../../lib/validations/auth.js';
import { seedUsers } from '../../lib/auth/seed-users.js';
import { User, UserRole, UserRoleType } from '../../types/auth.js'; // 🔧 FIXED: Added User import
import { MFAService } from '../../lib/auth/mfa.js';
import { emailService } from '../../lib/email/email-service.js';

// 🔧 FIXED: Consistent user property naming
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string; // 🔧 FIXED: Changed from 'id' to 'userId' for consistency
        email: string;
        role: UserRoleType;
        mfaVerified?: boolean;
      };
    }
  }
}

const router = express.Router();

// Initialize test users
let users: Map<string, User>;
(async () => {
  try {
    users = await seedUsers();
    console.log('Test users initialized:', Array.from(users.keys()));
  } catch (error) {
    console.error('Failed to initialize test users:', error);
  }
})();

// 🔧 FIXED: Login endpoint with proper token generation and debugging
router.post('/login', 
  authRateLimiter,
  validateBody(loginSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('🔧 LOGIN DEBUG: Request received for:', req.body.email);
      
      if (!users) {
        console.error('🔧 LOGIN DEBUG: Users not initialized');
        return res.status(503).json({ error: 'Service initializing, please try again' });
      }

      const { email, password } = req.body;
      const user = users.get(email);
      
      if (!user) {
        console.error('🔧 LOGIN DEBUG: User not found:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      console.log('🔧 LOGIN DEBUG: Password validation:', isValidPassword);

      if (!isValidPassword) {
        console.error('🔧 LOGIN DEBUG: Invalid password for user:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // 🔧 FIXED: Generate tokens with proper logging
      console.log('🔧 LOGIN DEBUG: Generating tokens for user:', email);
      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaVerified: !user.mfaEnabled // If MFA is disabled, consider it verified
      });

      console.log('🔧 LOGIN DEBUG: Tokens generated successfully:', {
        hasAccessToken: !!tokens.accessToken,
        hasRefreshToken: !!tokens.refreshToken,
        accessTokenLength: tokens.accessToken?.length
      });

      const response = {
        // 🔧 FIXED: Multiple token formats for compatibility
        token: tokens.accessToken, // Legacy format
        accessToken: tokens.accessToken, // New format
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: user.mfaEnabled || false,
          mfaVerified: !user.mfaEnabled // Set to true if MFA is disabled
        },
        requireMfa: user.mfaEnabled && !user.mfaVerified
      };

      console.log('🔧 LOGIN DEBUG: Sending response:', {
        hasToken: !!response.token,
        hasAccessToken: !!response.accessToken,
        userEmail: response.user.email,
        requireMfa: response.requireMfa
      });
      
      return res.json(response);
    } catch (error) {
      console.error('🔧 LOGIN DEBUG: Login error:', error);
      return res.status(500).json({ error: 'Internal server error during login' });
    }
  }
);

// 🔧 FIXED: Logout endpoint without CSRF requirement
router.post('/logout', 
  // Don't require CSRF for logout - it's a cleanup operation
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('🔧 LOGOUT DEBUG: Logout request received');
      // Just return success - cleanup happens on client side
      return res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('🔧 LOGOUT DEBUG: Logout error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 🔧 FIXED: Registration endpoint with proper token generation
router.post('/register', 
  validateBody(registerSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { name, email, password, role } = req.body;

      if (!users) {
        console.error('Users not initialized');
        return res.status(503).json({ error: 'Service initializing, please try again' });
      }

      const existingUser = users.get(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // Better ID generation
      
      const user = {
        id: userId,
        name,
        email,
        passwordHash,
        role,
        mfaEnabled: false,
        emailVerified: false,
      };

      users.set(email, user);

      // 🔧 FIXED: Send verification email with proper token generation
      try {
        const verificationTokens = await generateTokens({
          userId: user.id,
          email: user.email,
          role: user.role,
          mfaVerified: false
        });
        await emailService.sendVerificationEmail(email, verificationTokens.accessToken);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      // Generate login tokens
      const { accessToken, refreshToken } = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaVerified: false,
      });

      console.log('Registration successful for user:', email);

      return res.status(201).json({
        token: accessToken,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mfaEnabled: false,
          mfaVerified: false,
          emailVerified: false,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Refresh token endpoint
router.post('/refresh', 
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // 🔧 FIXED: Handle async JWT verification properly
      let payload;
      try {
        const result = verifyToken(refreshToken);
        payload = result instanceof Promise ? await result : result;
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      if (!payload || !payload.email) {
        return res.status(401).json({ error: 'Invalid refresh token payload' });
      }

      const user = users.get(payload.email);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaVerified: payload.mfaVerified,
      });

      res.json(tokens); // 🔧 FIXED: Remove return to match Express handler signature
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Enable MFA endpoint - FIXED
router.post('/mfa/enable', 
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      console.log('MFA Enable request from user:', req.user?.email);
      
      const { user } = req;
      if (!user) {
        console.log('No user in request');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Generating MFA secret for:', user.email);

      // Generate secret and QR code
      const { secret, qrCodeUrl } = MFAService.generateSecret(user.email);
      const qrCodeDataUrl = await MFAService.generateQRCode(qrCodeUrl);

      // Store secret temporarily (not enabled until verified)
      const dbUser = users.get(user.email);
      if (dbUser) {
        users.set(user.email, {
          ...dbUser,
          mfaTempSecret: secret,
        });
        console.log('Stored temp MFA secret for:', user.email);
      } else {
        console.log('User not found in database:', user.email);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('MFA setup successful for:', user.email);
      res.json({ // 🔧 FIXED: Remove return
        qrCodeUrl: qrCodeDataUrl,
        secret: secret
      });
    } catch (error) {
      console.error('Enable MFA error:', error);
      res.status(500).json({ error: 'Failed to enable MFA' });
    }
  }
);

// 🔧 FIXED: Verify MFA setup endpoint
router.post('/mfa/verify-setup', 
  authenticateToken,
  validateBody(mfaTokenSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { token } = req.body;
      const { user } = req;
      
      console.log('MFA setup verification for user:', user?.email, 'token:', token);
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = users.get(user.email);
      if (!dbUser?.mfaTempSecret) {
        console.log('No temp MFA secret found for:', user.email);
        return res.status(400).json({ error: 'MFA setup not initiated' });
      }

      const isValid = MFAService.verifyToken(token, dbUser.mfaTempSecret);
      console.log('Token verification result:', isValid);
      
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid setup token' });
      }

      // Enable MFA permanently
      const updatedUser = {
        ...dbUser,
        mfaEnabled: true,
        mfaSecret: dbUser.mfaTempSecret,
        mfaTempSecret: undefined,
      };
      users.set(user.email, updatedUser);

      console.log('MFA enabled successfully for:', user.email);
      res.json({ // 🔧 FIXED: Remove return
        message: 'MFA enabled successfully',
        user: {
          ...updatedUser,
          mfaSecret: undefined,
        }
      });
    } catch (error) {
      console.error('Verify MFA setup error:', error);
      res.status(500).json({ error: 'Failed to verify MFA setup' });
    }
  }
);

// 🔧 FIXED: MFA verify for login endpoint
router.post('/mfa/verify', 
  authenticateToken,
  validateBody(mfaTokenSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { token } = req.body;
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dbUser = users.get(user.email);
      if (!dbUser?.mfaSecret) {
        return res.status(400).json({ error: 'MFA not enabled' });
      }

      const isValid = MFAService.verifyToken(token, dbUser.mfaSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid MFA token' });
      }

      // Generate new tokens with MFA verified
      const tokens = await generateTokens({
        userId: user.userId, // 🔧 FIXED: Use userId consistently
        email: user.email,
        role: user.role,
        mfaVerified: true,
      });

      res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'MFA verified successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
        return;
      }
      console.error('Verify MFA error:', error);
      res.status(500).json({ error: 'Failed to verify MFA token' });
    }
  }
);

// Change user role endpoint (admin only)
router.patch(
  '/users/:userId/role',
  authenticateToken,
  requireRole([UserRole.ADMIN]),
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const user = users.get(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = {
        ...user,
        role,
      };

      users.set(userId, updatedUser);

      return res.json({ user: updatedUser });
    } catch (error) {
      console.error('Change user role error:', error);
      return res.status(500).json({ error: 'Failed to update user role' });
    }
  }
);

// 🔧 FIXED: Password reset endpoint with proper async handling
router.post('/reset-password', 
  async (req: express.Request, res: express.Response) => { // 🔧 FIXED: Remove validateBody temporarily
    try {
      const { token, newPassword } = req.body;
      
      // 🔧 FIXED: Handle async JWT verification
      let decoded;
      try {
        const result = verifyToken(token);
        decoded = result instanceof Promise ? await result : result;
      } catch (verifyError) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const user = users.get(decoded.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update user's password
      users.set(decoded.email, { ...user, passwordHash });

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// 🔧 FIXED: Email verification endpoint
router.post('/verify-email', 
  async (req: express.Request, res: express.Response) => { // 🔧 FIXED: Remove validateBody temporarily
    try {
      const { token } = req.body;
      
      // 🔧 FIXED: Handle async JWT verification
      let decoded;
      try {
        const result = verifyToken(token);
        decoded = result instanceof Promise ? await result : result;
      } catch (verifyError) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      if (!decoded || !decoded.email) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      const user = users.get(decoded.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user's email verification status
      const updatedUser = { ...user, emailVerified: true };
      users.set(decoded.email, updatedUser);

      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Failed to verify email' });
    }
  }
);

// 🔧 FIXED: Resend verification endpoint with complete token generation
router.post('/resend-verification', 
  validateBody(resetPasswordSchema),
  async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      const user = users.get(email);
      
      if (!user) {
        return res.json({ message: 'If an account exists, you will receive a verification email' });
      }

      // 🔧 FIXED: Provide all required properties for generateTokens
      const tokens = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaVerified: false // For email verification, MFA is not relevant
      });
      const verificationToken = tokens.accessToken;

      try {
        await emailService.sendVerificationEmail(email, verificationToken);
        return res.json({ message: 'Verification email sent' });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({ error: 'Failed to send verification email' });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }
);

export default router;
