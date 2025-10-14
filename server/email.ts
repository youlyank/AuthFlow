import { randomBytes } from "crypto";
import { Resend } from "resend";

// Initialize Resend client (will be null if no API key)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email service - Production ready with Resend
export class EmailService {
  async sendEmail(to: string, subject: string, html: string, sensitiveData?: { code?: string; link?: string; password?: string }): Promise<void> {
    // In production, Resend is REQUIRED - never log, never simulate
    if (process.env.NODE_ENV === "production") {
      if (!resend) {
        throw new Error("PRODUCTION ERROR: RESEND_API_KEY is required for email delivery in production");
      }
      
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Authflow <onboarding@resend.dev>",
          to,
          subject,
          html,
        });
      } catch (error) {
        console.error("Failed to send email:", error);
        throw new Error(`Email delivery failed: ${error}`);
      }
      return;
    }

    // Development mode: log with redaction OR send via Resend if configured
    // NEVER log invitation emails (they contain passwords)
    if (sensitiveData?.password) {
      if (!resend) {
        throw new Error("Invitation emails require RESEND_API_KEY - cannot simulate emails with passwords");
      }
      // Send via Resend without logging
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Authflow <onboarding@resend.dev>",
          to,
          subject,
          html,
        });
        console.log(`📧 INVITATION EMAIL SENT (not logged for security): ${to}`);
      } catch (error) {
        console.error("Resend error:", error);
        throw error;
      }
      return;
    }

    // For non-password emails, log with redaction in development
    let logContent = html.replace(/<[^>]*>/g, "");
    
    // Redact sensitive data for security
    if (sensitiveData?.code) {
      const redacted = sensitiveData.code.substring(0, 3) + "***";
      logContent = logContent.replace(new RegExp(sensitiveData.code, 'g'), redacted);
    }
    if (sensitiveData?.link) {
      const urlObj = new URL(sensitiveData.link);
      const redacted = `${urlObj.origin}/auth/magic-link?token=***REDACTED***`;
      logContent = logContent.replace(new RegExp(sensitiveData.link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), redacted);
    }
    
    console.log(`
═══════════════════════════════════════════════════════════
📧 EMAIL ${resend ? "SENT" : "SIMULATED (No API key)"}
═══════════════════════════════════════════════════════════
To: ${to}
Subject: ${subject}
───────────────────────────────────────────────────────────
${logContent}
═══════════════════════════════════════════════════════════
    `);
    
    // If Resend is configured, actually send in development too
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Authflow <onboarding@resend.dev>",
          to,
          subject,
          html,
        });
      } catch (error) {
        console.error("Resend error:", error);
      }
    }
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .code-box { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering with Authflow. To complete your registration, please use the verification code below:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, "Verify Your Email - Authflow", html, { code });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .code-box { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Reset Your Password</h2>
              <p>We received a request to reset your password. Use the code below to proceed:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code will expire in 15 minutes.</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, "Reset Your Password - Authflow", html, { code });
  }

  async sendMFACode(to: string, code: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .code-box { background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; font-family: 'Courier New', monospace; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Your Security Code</h2>
              <p>Use this code to complete your login:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't attempt to log in, please secure your account immediately.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail(to, "Your Security Code - Authflow", html, { code });
  }

  async sendMagicLink(to: string, token: string, baseUrl: string): Promise<void> {
    // Validate and sanitize baseUrl to prevent phishing attacks
    try {
      const url = new URL(baseUrl);
      // Only allow http/https protocols
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
      // Use validated URL for magic link
      const magicLink = `${url.origin}/auth/magic-link?token=${token}`;
    
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Sign In to Authflow</h2>
              <p>Click the button below to securely sign in to your account:</p>
              <div style="text-align: center;">
                <a href="${magicLink}" class="button">Sign In to Authflow</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${magicLink}</p>
              <p>This link will expire in 15 minutes.</p>
              <p>If you didn't request this link, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

      await this.sendEmail(to, "Sign In to Authflow - Magic Link", html, { link: magicLink });
    } catch (error) {
      throw new Error(`Invalid magic link URL: ${error}`);
    }
  }

  async sendSecureInvitationEmail(to: string, name: string, invitationLink: string): Promise<void> {
    // Validate invitationLink to prevent phishing
    try {
      const url = new URL(invitationLink);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
      const validatedLink = url.toString();
    
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Welcome to Authflow!</h2>
              <p>Hi ${name},</p>
              <p>You've been invited to join Authflow. Click the button below to set your password and activate your account:</p>
              <div style="text-align: center;">
                <a href="${validatedLink}" class="button">Set Password & Activate Account</a>
              </div>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This invitation link will expire in 24 hours.<br>
                For your security, you'll set your own password during activation.
              </div>
              <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>Sent by Authflow | Enterprise Authentication Platform</p>
              <p style="font-size: 12px; color: #9ca3af;">This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
      `;
      
      await this.sendEmail(to, "Welcome to Authflow - Set Your Password", html);
    } catch (error) {
      console.error("Invalid invitation link URL:", error);
      throw new Error("Invalid invitation link format");
    }
  }

  async sendInvitationEmail(to: string, name: string, loginUrl: string, email: string, tempPassword: string): Promise<void> {
    // Validate loginUrl to prevent phishing
    try {
      const url = new URL(loginUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
      // Use validated URL
      const validatedLoginUrl = url.toString();
    
      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 3px solid #3b82f6; }
            .button { display: inline-block; padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .credentials-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential { padding: 10px 0; }
            .credential-label { font-weight: 600; color: #6b7280; font-size: 14px; }
            .credential-value { font-family: 'Courier New', monospace; color: #111827; font-size: 16px; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #3b82f6; margin: 0;">🔒 Authflow</h1>
            </div>
            <div style="padding: 30px 0;">
              <h2>Welcome to Authflow!</h2>
              <p>Hi ${name},</p>
              <p>You've been invited to join Authflow. Here are your credentials to get started:</p>
              <div class="credentials-box">
                <div class="credential">
                  <div class="credential-label">Email</div>
                  <div class="credential-value">${email}</div>
                </div>
                <div class="credential">
                  <div class="credential-label">Temporary Password</div>
                  <div class="credential-value">${tempPassword}</div>
                </div>
              </div>
              <p><strong>Important:</strong> Please change your password after your first login for security.</p>
              <div style="text-align: center;">
                <a href="${validatedLoginUrl}" class="button">Sign In to Authflow</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Authflow. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

      await this.sendEmail(to, "Welcome to Authflow - Your Account is Ready", html, { password: tempPassword });
    } catch (error) {
      throw new Error(`Invalid login URL: ${error}`);
    }
  }

  generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    const bytes = randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % digits.length];
    }
    return otp;
  }

  generateToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
  }
}

export const emailService = new EmailService();
