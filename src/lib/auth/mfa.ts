import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export class MFAService {
  private static readonly SERVICE_NAME = 'Rovers Suites';

  static generateSecret(email: string): { secret: string; qrCodeUrl: string } {
    const secret = authenticator.generateSecret();
    
    const qrCodeUrl = authenticator.keyuri(
      email,
      this.SERVICE_NAME,
      secret
    );

    return { secret, qrCodeUrl };
  }

  static async generateQRCode(qrCodeUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static verifyToken(token: string, secret: string): boolean {
    try {
      // Set the window option globally for this verification
      authenticator.options = { 
        ...authenticator.options, 
        window: 2 // Allow 2 time windows (60 seconds total)
      };
      
      return authenticator.verify({
        token,
        secret
      });
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      return false;
    }
  }

  static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

// // Current path in backend
// import { MFAService } from '../../lib/auth/mfa.js';
