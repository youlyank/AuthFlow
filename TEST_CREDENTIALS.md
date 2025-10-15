# 🔐 AuthFlow Test Credentials

## Quick Start Testing

### Method 1: Register New Accounts (Recommended)

1. **Super Admin Account**:
   - Go to `/register`
   - Email: `superadmin@test.com`
   - Password: `SuperAdmin123!`
   - First Name: `Super`
   - Last Name: `Admin`
   - After registration, you'll need to manually promote to super_admin role via database

2. **Tenant Admin Account**:
   - Go to `/register`
   - Email: `admin@test.com`
   - Password: `Admin123!`
   - First Name: `Tenant`
   - Last Name: `Admin`
   - Role will be set based on tenant

3. **Regular User Account**:
   - Go to `/register`
   - Email: `user@test.com`
   - Password: `User123!`
   - First Name: `Test`
   - Last Name: `User`

### Method 2: Use Demo Credentials (if seeded)

Based on the codebase reference:
- **Email**: `admin@authflow.com`
- **Password**: `admin123`

## What to Test

### 🎨 Landing Page (Current View)
- ✅ Glassmorphic navigation
- ✅ Animated hero section with gradient text
- ✅ Bento grid authentication methods
- ✅ Pricing comparison table
- ✅ Developer code showcase
- ✅ Modern footer

### 🔐 Authentication Flows
1. **Email/Password Login** (`/login`)
2. **Registration** (`/register`)
3. **OAuth** (Google/GitHub if configured)
4. **Magic Links** (passwordless)

### 🛡️ Security Features
1. **MFA Setup** (`/security`)
   - TOTP (Authenticator app)
   - Email OTP
   - SMS OTP (if Twilio configured)

2. **WebAuthn/Passkeys** (`/passkeys`)
   - Register biometric authentication
   - Test passwordless login

3. **Trusted Devices** (`/security`)
   - View device fingerprints
   - Manage trusted devices

### 📊 Dashboard Testing

#### Super Admin Dashboard (`/super-admin`)
- Platform-wide statistics
- Revenue & growth charts (Area chart)
- Tenant distribution (Pie chart)
- Real-time activity (Bar chart)
- Recent tenants table

#### Tenant Admin Dashboard (`/admin` or `/dashboard`)
- User management metrics
- User growth chart
- Authentication activity
- MFA adoption stats
- Recent users table

#### User Dashboard (`/dashboard`)
- Personal account metrics
- Active sessions
- Security status
- Login history
- Quick action cards

### 🔑 API Key Management
Test at `/api-keys`:
- Create API keys
- Set permissions
- Test key-based authentication
- Revoke keys

### 🪝 Webhooks
Test at `/webhooks`:
- Register webhook endpoints
- Configure event types
- View delivery logs
- Test retry mechanism

### 📱 Real-time Features
- WebSocket notifications (bell icon)
- Live updates
- Event types: system, security, billing

### 🔄 OAuth2/OIDC Provider
If acting as identity provider:
- Client management
- Authorization flow
- Token generation
- JWKS endpoint

### 📚 API Documentation
- Visit `/api-docs` for interactive Swagger UI
- Test all endpoints
- View request/response schemas

### 🌐 Multi-tenancy
- Create tenant via super admin
- Invite users to tenant
- Test row-level isolation

## Testing Checklist

### Visual Testing
- [ ] Light/Dark mode toggle
- [ ] Glassmorphism effects
- [ ] Chart animations
- [ ] Responsive layouts (mobile/tablet/desktop)
- [ ] Hover effects on cards
- [ ] Gradient text animation

### Functional Testing
- [ ] User registration
- [ ] Email/password login
- [ ] MFA enrollment & verification
- [ ] Passkey registration
- [ ] API key creation & usage
- [ ] Webhook delivery
- [ ] Real-time notifications
- [ ] Session management
- [ ] Password reset flow

### Security Testing
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Password breach detection (HIBP)
- [ ] JWT token validation
- [ ] Role-based access control

## Quick SQL Commands (Development Database Only)

### Promote user to Super Admin:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'superadmin@test.com';
```

### Check all users:
```sql
SELECT id, email, role, "firstName", "lastName" FROM users;
```

### View sessions:
```sql
SELECT * FROM sessions WHERE "userId" = (SELECT id FROM users WHERE email = 'your@email.com');
```

## Need Help?

- Check `/api-docs` for API reference
- View browser console for errors
- Check server logs for backend issues
- Review login history for auth debugging
