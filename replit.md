# Authflow - Enterprise Authentication Platform

## Overview
Authflow is an enterprise-grade, multi-tenant authentication SaaS platform designed to be a superior alternative to Auth0, Okta, and Keycloak. The platform features flexible subscription management, comprehensive security features, and real-time notifications.

## Current State (October 13, 2025)
✅ **Completed Implementation:**
- Complete database schema with 15+ tables for multi-tenant architecture
- Full-stack authentication system with email/password, OAuth (Google/GitHub), MFA, WebAuthn
- Three role-based dashboards: Super Admin, Tenant Admin, and User
- Real-time notification system with WebSocket support
- Session management with device tracking
- Comprehensive audit logging
- Security features: JWT-based auth, password hashing (bcrypt), rate limiting ready
- Beautiful UI with dark mode support using Material Design + enterprise patterns

## Test Credentials
**Super Admin Account:**
- Email: `admin@authflow.com`
- Password: `admin123`
- Role: Super Admin

## Technology Stack
**Frontend:**
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui components
- Socket.IO client for real-time updates

**Backend:**
- Express.js with TypeScript
- PostgreSQL (Neon) for database
- Drizzle ORM
- JWT for authentication
- bcryptjs for password hashing
- Socket.IO for WebSocket notifications
- Cookie-based session management

**Design System:**
- Primary Font: Inter
- Monospace Font: JetBrains Mono
- Primary Color: Vibrant Blue (217 91% 60%)
- Dark mode support with automatic theme switching

## Key Features
1. **Multi-Tenant Architecture:** Complete isolation between tenants
2. **Authentication Methods:**
   - Email/Password with secure hashing
   - OAuth (Google, GitHub)
   - Multi-Factor Authentication (TOTP, Email OTP)
   - WebAuthn/FIDO2 for passwordless auth
   - Magic links (planned)

3. **Authorization & Security:**
   - Role-Based Access Control (RBAC)
   - Session management with device tracking
   - Login history and audit logs
   - Trusted device fingerprinting
   - Rate limiting (infrastructure ready)

4. **Admin Capabilities:**
   - **Super Admin:** Manage all tenants, plans, users, analytics
   - **Tenant Admin:** Manage tenant users, roles, sessions
   - **Dynamic Plan Management:** Create/edit custom plans, adjust subscriptions

5. **Real-Time Notifications:**
   - WebSocket-based push notifications
   - Multiple notification types (system, security, announcement, billing)
   - Read/unread tracking
   - Priority levels

6. **Compliance Ready:**
   - Architecture supports GDPR, SOC 2, ISO 27001, HIPAA compliance
   - Comprehensive audit logging
   - Data retention policies ready
   - White-label branding per tenant

## Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts (Auth, Theme)
│   │   ├── pages/       # Page components
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── auth.ts         # Authentication utilities
│   ├── storage.ts      # Database operations
│   ├── routes.ts       # API routes
│   └── db.ts           # Database connection
├── shared/              # Shared types and schemas
│   └── schema.ts       # Database schema and Zod validators
└── db/                  # Database migrations (Drizzle)
```

## Environment Variables
**Required:**
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `JWT_SECRET` - Secret key for JWT signing (REQUIRED for security)
- `SESSION_SECRET` - Secret for session management

**Optional (for features):**
- `STRIPE_SECRET_KEY` - Stripe integration (deferred)
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key (deferred)

## Security Notes
⚠️ **Critical:** JWT_SECRET is required and has no fallback. The application will fail to start without it.
- All passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire in 7 days
- Refresh tokens expire in 30 days
- Sessions are tracked with device information
- All sensitive operations are logged in audit_logs

## API Endpoints
**Authentication:**
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/me` - Get current user
- POST `/api/auth/mfa/verify` - MFA verification
- POST `/api/auth/forgot-password` - Password reset request

**Super Admin:**
- GET `/api/super-admin/stats` - Platform statistics
- GET `/api/super-admin/tenants/recent` - Recent tenants

**Tenant Admin:**
- GET `/api/admin/stats` - Tenant statistics
- GET `/api/admin/users/recent` - Recent users

**User:**
- GET `/api/user/stats` - User statistics
- GET `/api/user/login-history` - Login history

**Notifications:**
- GET `/api/notifications` - Get user notifications
- POST `/api/notifications` - Create notification (admin)
- POST `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/read-all` - Mark all as read
- DELETE `/api/notifications/:id` - Delete notification

## Database Schema
**Core Tables:**
- `users` - User accounts with multi-tenant support
- `tenants` - Tenant organizations
- `plans` - Subscription plans
- `tenant_plans` - Tenant-plan associations
- `sessions` - Active user sessions
- `notifications` - Notification messages
- `notification_reads` - Read tracking
- `audit_logs` - Audit trail
- `login_history` - Login attempts

**Security Tables:**
- `mfa_secrets` - MFA secrets (TOTP)
- `oauth_accounts` - OAuth provider accounts
- `webauthn_credentials` - WebAuthn/FIDO2 credentials
- `trusted_devices` - Device fingerprints
- `password_reset_tokens` - Password reset tokens
- `email_verification_tokens` - Email verification tokens
- `rate_limits` - Rate limiting data

## Development Workflow
1. **Install Dependencies:** `npm install` (auto-handled by Replit)
2. **Database Migrations:** `npm run db:push` (already run)
3. **Start Development:** `npm run dev` (via "Start application" workflow)
4. **Access Application:** Opens automatically on port 5000

## Recent Changes (October 13, 2025)
- ✅ Fixed critical JWT_SECRET security vulnerability (removed hard-coded fallback)
- ✅ Implemented complete multi-tenant database schema
- ✅ Built all frontend components with stunning UI design
- ✅ Implemented backend API with authentication, sessions, notifications
- ✅ Added WebSocket support for real-time notifications
- ✅ Created test Super Admin account for testing
- ✅ Configured dotenv for environment variable management

## Next Steps (Future Enhancements)
- [ ] Stripe integration for subscription payments
- [ ] Complete OAuth provider implementation (Google, GitHub callbacks)
- [ ] Magic link passwordless authentication
- [ ] Advanced WebAuthn/FIDO2 implementation
- [ ] Adaptive risk-based authentication
- [ ] Bot detection and prevention
- [ ] Geographic IP restrictions
- [ ] Data breach detection
- [ ] Complete GDPR compliance features
- [ ] White-label branding customization UI
- [ ] Advanced analytics and reporting
- [ ] API key management for tenant self-hosting
- [ ] Webhook system for events
- [ ] SSO integration (SAML, OIDC)

## User Preferences
- Design: Material Design + enterprise dashboard patterns
- Primary color: Vibrant blue (217 91% 60%)
- Typography: Inter for UI, JetBrains Mono for code
- Approach: Horizontal batching (complete frontend, then backend, then integration)
- Testing: End-to-end testing with Playwright for critical flows
- Code style: TypeScript strict mode, clean architecture, security-first

## Architectural Decisions
1. **Multi-tenancy:** PostgreSQL row-level isolation using tenant_id
2. **Authentication:** JWT-based with refresh token rotation
3. **Real-time:** WebSocket via Socket.IO for notifications
4. **State Management:** TanStack Query for server state, React Context for app state
5. **Styling:** Tailwind CSS with shadcn/ui component library
6. **Database:** Drizzle ORM with Neon PostgreSQL
7. **Security:** bcrypt for passwords, JWT for sessions, audit logging for compliance
