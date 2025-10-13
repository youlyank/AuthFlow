import { randomBytes } from "crypto";

// Email service - can be extended with Resend, SendGrid, etc.
export class EmailService {
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    // In development, log to console
    if (process.env.NODE_ENV !== "production") {
      console.log(`
═══════════════════════════════════════════════════════════
📧 EMAIL SENT
═══════════════════════════════════════════════════════════
To: ${to}
Subject: ${subject}
───────────────────────────────────────────────────────────
${html.replace(/<[^>]*>/g, "")}
═══════════════════════════════════════════════════════════
      `);
      return;
    }

    // In production, use email service
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "noreply@authflow.com",
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email failed: ${await response.text()}`);
      }
    } else {
      throw new Error("No email service configured");
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

    await this.sendEmail(to, "Verify Your Email - Authflow", html);
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

    await this.sendEmail(to, "Reset Your Password - Authflow", html);
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

    await this.sendEmail(to, "Your Security Code - Authflow", html);
  }

  async sendMagicLink(to: string, token: string, baseUrl: string): Promise<void> {
    const magicLink = `${baseUrl}/auth/magic-link?token=${token}`;
    
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

    await this.sendEmail(to, "Sign In to Authflow - Magic Link", html);
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
