# Email Service Setup - Authflow

## Overview
Authflow uses **Resend** for production-ready email delivery. The email service is already fully implemented and integrated with all authentication flows.

## Email Flows Implemented

✅ **Email Verification** - 6-digit code sent during registration  
✅ **Password Reset** - Secure 6-digit reset code  
✅ **MFA Authentication** - Time-based OTP codes for multi-factor auth  
✅ **Magic Links** - Passwordless authentication links  
✅ **User Invitations** - Welcome emails with temporary credentials  

## Production Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your domain or use the sandbox domain for testing

### 2. Get API Key

1. Navigate to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it (e.g., "Authflow Production")
4. Copy the API key (starts with `re_`)

### 3. Configure Environment Variables

Add these secrets to your Replit or VPS deployment:

```bash
# Required for email delivery
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Optional: Custom sender email (requires verified domain)
EMAIL_FROM="Authflow <noreply@yourdomain.com>"
```

**Without configuration:**
- Development: Most emails logged to console (invitation emails require RESEND_API_KEY)
- Production: Error thrown immediately (RESEND_API_KEY required, no silent failures)

**With configuration:**
- All emails delivered via Resend
- Professional branded templates used
- Error handling with fallback logging

### 4. Domain Verification (Production)

For production deployments with custom sender addresses:

1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification (usually < 24 hours)
4. Update `EMAIL_FROM` with your verified domain

**Sandbox Mode:**
- Uses `onboarding@resend.dev` sender
- Only delivers to verified recipient addresses
- Perfect for development/testing

## Email Templates

All emails use professional HTML templates with:

- **Responsive Design** - Mobile and desktop friendly
- **Authflow Branding** - Consistent brand colors (#3b82f6)
- **Security Best Practices** - Clear expiration times and warnings
- **Accessibility** - High contrast, readable fonts

### Template Preview

**Verification Email:**
```
Subject: Verify Your Email - Authflow
Content: 6-digit code, expires in 15 minutes
```

**Password Reset:**
```
Subject: Reset Your Password - Authflow
Content: 6-digit code with security warning, expires in 15 minutes
```

**MFA Code:**
```
Subject: Your Security Code - Authflow
Content: 6-digit OTP, expires in 10 minutes
```

**Magic Link:**
```
Subject: Sign In to Authflow - Magic Link
Content: One-click sign-in button, expires in 15 minutes
```

## Testing Email Delivery

### Development Mode (No API Key)
```bash
# Start server without RESEND_API_KEY
npm run dev

# Emails will be logged to console:
═══════════════════════════════════════════
📧 EMAIL SIMULATED (No API key)
═══════════════════════════════════════════
To: user@example.com
Subject: Verify Your Email - Authflow
───────────────────────────────────────────
[Email content displayed here]
═══════════════════════════════════════════
```

### Production Mode (With API Key)
```bash
# Set environment variables
export RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
export EMAIL_FROM="Authflow <noreply@yourdomain.com>"

# Start server
npm run dev

# Emails will be delivered via Resend
# Check Resend dashboard for delivery status
```

### Test Endpoints

**1. Registration (Email Verification)**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

**2. Password Reset**
```bash
curl -X POST http://localhost:5000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**3. Magic Link**
```bash
curl -X POST http://localhost:5000/api/auth/magic-link/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "tenantSlug": "your-tenant"
  }'
```

**4. MFA Email OTP**
```bash
# First enable MFA via /api/auth/mfa/setup
# Then request code:
curl -X POST http://localhost:5000/api/auth/mfa/request-code \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT" \
  -d '{}'
```

## Error Handling

The email service has robust error handling:

**Development (No API Key):**
- Logs email to console
- No errors thrown
- Perfect for testing without Resend account

**Production (With API Key):**
- Attempts delivery via Resend
- Logs detailed error messages
- Throws error if delivery fails (prevents silent failures)

**Common Errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| `No email service configured` | Missing `RESEND_API_KEY` in production | Add API key to environment |
| `Email delivery failed` | Invalid API key or Resend API error | Check API key, verify domain |
| `Invalid sender address` | Using unverified domain | Use sandbox or verify domain |

## Rate Limits

**Resend Free Tier:**
- 100 emails/day
- 3,000 emails/month
- Perfect for development and small deployments

**Resend Pro:**
- 50,000 emails/month ($20/mo)
- Dedicated IP available
- Priority support

**Production Recommendations:**
- Monitor email volume in Resend dashboard
- Upgrade tier as user base grows
- Implement email queueing for high volume

## Security Features

⚠️ **Temporary Passwords for Invitations** - Currently emailed (security improvement planned - see SECURITY_IMPROVEMENTS.md)  
✅ **Expiration Times** - All codes/links expire (10-15 minutes)  
✅ **URL Validation** - Magic links and login URLs validated to prevent phishing  
✅ **Protocol Enforcement** - Only HTTP/HTTPS protocols allowed  
✅ **Redacted Logging** - Sensitive data (OTPs, tokens) redacted in development logs  
✅ **User Warnings** - Security notices in password reset emails  
✅ **Audit Logging** - All email sends logged in audit trail  

### Security Hardening

**1. Sensitive Data Protection**
- OTP codes and magic link tokens are automatically redacted in development logs
- Logs show partial codes (e.g., `123***`) instead of full values
- Magic link URLs redacted to `***REDACTED***` in console output
- Production mode never logs sensitive email content

**2. Phishing Prevention**
- All magic link base URLs validated before use
- Only `http://` and `https://` protocols accepted
- URL parsing ensures proper format and prevents injection
- Login URLs in invitation emails validated identically

**3. Production Deployment**
```bash
# Always set NODE_ENV in production to disable verbose logging
NODE_ENV=production

# Configure proper email sender domain
EMAIL_FROM="Authflow <noreply@yourdomain.com>"

# Use verified Resend domain to prevent spoofing
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

**4. Log Security**
- Development logs redact OTPs: `Verification code: 123***`
- Magic links redacted: `https://app.example.com/auth/magic-link?token=***REDACTED***`
- **Invitation emails NEVER logged** (contain passwords, require RESEND_API_KEY even in dev)
- Production: RESEND_API_KEY required, throws error if missing (never logs emails)
- Production logs: No email content logged, only metadata
- Never log full credentials in any environment

## Production Checklist

Before deploying to production:

- [ ] Create Resend account
- [ ] Generate API key
- [ ] Set `RESEND_API_KEY` environment variable
- [ ] Set `NODE_ENV=production` to disable verbose logging
- [ ] Verify domain (or use sandbox for testing)
- [ ] Set `EMAIL_FROM` with verified sender address
- [ ] Verify URL validation is enabled (automatic in email service)
- [ ] Test all email flows (verification, reset, MFA, magic link)
- [ ] Confirm logs redact sensitive data (OTPs, tokens)
- [ ] Monitor Resend dashboard for delivery status
- [ ] Configure rate limits based on expected volume
- [ ] Set up email analytics/monitoring
- [ ] Review and configure CORS/CSP for magic link domains

## Customization

### Changing Email Templates

Edit templates in `server/email.ts`:

```typescript
// Example: Customize verification email
async sendVerificationEmail(to: string, code: string): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `;
  
  await this.sendEmail(to, "Your Subject", html);
}
```

### Changing Brand Colors

Update the primary color in email templates:

```css
/* Current: Authflow blue */
color: #3b82f6;
border-color: #3b82f6;

/* Change to your brand color */
color: #your-color;
border-color: #your-color;
```

### Adding New Email Types

1. Create method in `EmailService` class
2. Design HTML template
3. Call from routes where needed

Example:
```typescript
async sendWelcomeEmail(to: string, name: string): Promise<void> {
  const html = `<!-- Your template -->`;
  await this.sendEmail(to, "Welcome!", html);
}
```

## Support

**Resend Documentation:** https://resend.com/docs  
**Resend Dashboard:** https://resend.com/emails  
**API Status:** https://resend.com/status  

## Summary

✅ **Ready for Production** - Email service fully integrated with Resend  
✅ **All Auth Flows** - Verification, MFA, password reset, magic links working  
✅ **Professional Templates** - Branded, responsive HTML emails  
✅ **Development Friendly** - Console logging with redaction  
✅ **Enterprise Ready** - Error handling, rate limiting, URL validation  
⚠️ **Security Note** - Invitation flow uses temporary passwords (see SECURITY_IMPROVEMENTS.md for recommended redesign)

**Next Steps:**
1. Get Resend API key
2. Set environment variables
3. Test email delivery
4. **Consider**: Implement password-set link flow instead of temporary passwords
5. Deploy to production! 🚀
