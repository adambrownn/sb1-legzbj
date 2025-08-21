import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { format, parseISO } from 'date-fns';
import { logger } from '../utils/logger';
import type { Booking, BookingModification } from '../types/booking';

interface NotificationConfig {
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  sms: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private emailTransporter!: nodemailer.Transporter;
  private twilioClient!: twilio.Twilio;

  private constructor() {
    this.initializeEmailTransporter();
    this.initializeTwilioClient();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private initializeEmailTransporter() {
    const config = this.getConfig();
    this.emailTransporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass,
      },
    });
  }

  private initializeTwilioClient() {
    const config = this.getConfig();
    this.twilioClient = twilio(config.sms.accountSid, config.sms.authToken);
  }

  private getConfig(): NotificationConfig {
    // In a real app, this would come from environment variables or a config service
    return {
      email: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || 'user@example.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      },
      sms: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || 'AC123',
        authToken: process.env.TWILIO_AUTH_TOKEN || 'auth123',
        fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890',
      },
    };
  }

  public async sendBookingModificationNotification({
    booking,
    modifications
  }: {
    booking: Booking;
    modifications: BookingModification;
  }): Promise<void> {
    try {
      // Prepare notification content
      const subject = `Booking Modified - ${booking.id}`;
      let message = `Your booking has been modified.\n\n`;
      message += `Booking ID: ${booking.id}\n`;

      if (modifications.checkIn) {
        message += `Check-in: ${format(parseISO(modifications.checkIn), 'PPP')}\n`;
      }

      if (modifications.checkOut) {
        message += `Check-out: ${format(parseISO(modifications.checkOut), 'PPP')}\n`;
      }

      if (modifications.guestCount) {
        message += `Guest Count: ${modifications.guestCount}\n`;
      }

      // Send email notification
      await this.sendEmail({
        to: booking.email,
        subject,
        text: message,
      });

      // Send SMS notification
      if (booking.phone) {
        const smsMessage = `Your booking ${booking.id} has been modified. Please check your email for details.`;
        await this.sendSMS({
          to: booking.phone,
          message: smsMessage,
        });
      }

      logger.info('Booking modification notifications sent', {
        bookingId: booking.id,
        userId: booking.userId,
        modifications,
      });
    } catch (error) {
      logger.error('Failed to send booking modification notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId: booking.id,
        userId: booking.userId,
      });
      throw error;
    }
  }

  public async sendBookingCancellationNotification({
    booking,
    refundAmount
  }: {
    booking: Booking;
    refundAmount: number;
  }): Promise<void> {
    try {
      // Prepare notification content
      const subject = `Booking Cancelled - ${booking.id}`;
      const message = `
        Your booking has been cancelled.

        Booking ID: ${booking.id}
        Refund Amount: $${refundAmount.toFixed(2)}

        The refund will be processed to your original payment method.
        Please allow 5-7 business days for the refund to appear in your account.
      `;

      // Send email notification
      await this.sendEmail({
        to: booking.email,
        subject,
        text: message,
      });

      // Send SMS notification
      if (booking.phone) {
        const smsMessage = `Your booking ${booking.id} has been cancelled. A refund of $${refundAmount.toFixed(2)} will be processed. Please check your email for details.`;
        await this.sendSMS({
          to: booking.phone,
          message: smsMessage,
        });
      }

      logger.info('Booking cancellation notifications sent', {
        bookingId: booking.id,
        userId: booking.userId,
        refundAmount,
      });
    } catch (error) {
      logger.error('Failed to send booking cancellation notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        bookingId: booking.id,
        userId: booking.userId,
      });
      throw error;
    }
  }

  private async sendEmail({
    to,
    subject,
    text,
  }: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'bookings@example.com',
        to,
        subject,
        text,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
        subject,
      });
      throw error;
    }
  }

  private async sendSMS({
    to,
    message,
  }: {
    to: string;
    message: string;
  }): Promise<void> {
    try {
      const config = this.getConfig();
      await this.twilioClient.messages.create({
        body: message,
        from: config.sms.fromNumber,
        to,
      });
    } catch (error) {
      logger.error('Failed to send SMS', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to,
      });
      throw error;
    }
  }
}
