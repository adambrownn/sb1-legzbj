import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type EmailTemplate = 'password-reset' | 'email-verification';

export interface EmailData {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, any>;
}

export class EmailService {
  private static instance: EmailService;
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async loadTemplate(template: EmailTemplate): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(template)) {
      return this.templateCache.get(template)!;
    }

    const templatePath = path.join(__dirname, '..', '..', 'templates', 'email', `${template}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    this.templateCache.set(template, compiledTemplate);
    return compiledTemplate;
  }

  async sendEmail({ to, subject, template, context }: EmailData): Promise<void> {
    try {
      const compiledTemplate = await this.loadTemplate(template);
      const html = compiledTemplate(context);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@rovers.com',
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: {
        resetLink,
      },
    });
  }

  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;
    await this.sendEmail({
      to,
      subject: 'Verify Your Email',
      template: 'email-verification',
      context: {
        verificationLink,
      },
    });
  }
}

export const emailService = EmailService.getInstance();
