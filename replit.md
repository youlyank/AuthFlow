# Authflow - Enterprise Authentication Platform

## Overview
Authflow is a licensable B2B authentication product designed as a superior alternative to existing solutions like Auth0, Okta, and Keycloak. It offers comprehensive authentication-as-a-product that companies can integrate into their applications, deployable either on Authflow's cloud infrastructure or self-hosted. The platform aims to provide a robust, white-label, and cost-effective authentication solution, generating revenue through license fees based on MAU, feature tiers, or enterprise contracts. It includes sophisticated features like multi-tenancy, various authentication methods (Email/Password, OAuth, MFA, WebAuthn, Magic Links), robust authorization, real-time notifications, and extensive compliance support.

## User Preferences
- Design: Material Design + enterprise dashboard patterns
- Primary color: Vibrant blue (217 91% 60%)
- Typography: Inter for UI, JetBrains Mono for code
- Approach: Horizontal batching (complete frontend, then backend, then integration)
- Testing: End-to-end testing with Playwright for critical flows
- Code style: TypeScript strict mode, clean architecture, security-first

## System Architecture
Authflow is built as a full-stack application with a React-based frontend and an Express.js backend.

**UI/UX Decisions:**
- **Design System:** Utilizes Material Design principles combined with enterprise dashboard patterns.
- **Color Scheme:** Vibrant blue (217 91% 60%) as the primary color.
- **Typography:** Inter for general UI text and JetBrains Mono for monospace (code) elements.
- **Theming:** Full dark mode support with automatic theme switching.
- **Components:** Uses shadcn/ui components atop Tailwind CSS for a modern and consistent look.

**Technical Implementations:**
- **Frontend:** React with TypeScript, Wouter for routing, TanStack Query for data fetching, Tailwind CSS, shadcn/ui, and Socket.IO client for real-time updates.
- **Backend:** Express.js with TypeScript, PostgreSQL (Neon) for data storage, Drizzle ORM, JWT for authentication, bcryptjs for password hashing, and Socket.IO for WebSocket notifications.
- **Authentication:** JWT-based with refresh token rotation, bcrypt for password hashing, and comprehensive session management with device tracking. Supports Email/Password, OAuth (Google/GitHub), MFA (TOTP, Email OTP, SMS OTP via Twilio), WebAuthn/FIDO2, and Magic Links.
- **Authorization:** Role-Based Access Control (RBAC) with three distinct dashboards (Super Admin, Tenant Admin, User), API Key Management with permission-based access, and centralized enforcement.
- **Multi-Tenancy:** Achieved via row-level isolation in PostgreSQL using a `tenant_id` column.
- **Real-time Features:** WebSocket-based push notifications using Socket.IO for various event types (system, security, announcement, billing) with read/unread tracking and priority levels.
- **OAuth2/OIDC Provider:** Full implementation including Authorization, Token, UserInfo, JWKS, and Discovery endpoints, PKCE support, consent screens, client management, and scheduled token cleanup.
- **Webhook System:** Production-ready with event registration, atomic delivery, HMAC signing for security, exponential backoff for retries, and a scheduled retry processor.
- **Actions/Hooks System:** Pluggable authentication flow customization allowing tenants to inject custom logic at key points (pre-register, post-register, pre-login, post-login, etc.) via built-in handlers and webhook-based actions.
- **Security:** Comprehensive audit logging, login history, trusted device fingerprinting, rate limiting, password breach detection (Have I Been Pwned integration), IP restrictions, and GDPR compliance tools. All secrets are hashed (bcrypt for passwords, SHA-256 for OAuth2 client secrets and API keys).
- **API Documentation:** Interactive OpenAPI/Swagger documentation available at `/api-docs` endpoint for all API endpoints.
- **SDKs:** Official client libraries for multiple languages:
  - **Python SDK:** Full-featured with authentication, MFA, WebAuthn, OAuth2, and API key support
  - **JavaScript/TypeScript SDK:** Browser and Node.js compatible with session management
  - **Go SDK:** Type-safe client with comprehensive authentication methods
  - **PHP SDK:** PSR-4 compliant with Composer support
  - **Ruby SDK:** Gem-based client for Rails and Ruby applications

## External Dependencies
- **Database:** PostgreSQL (specifically Neon for cloud deployment)
- **ORM:** Drizzle ORM
- **Real-time Communication:** Socket.IO
- **Authentication:** Google OAuth, GitHub OAuth, Have I Been Pwned API (for password breach detection)
- **SMS Service:** Twilio (optional, for SMS OTP and phone verification - gracefully degrades if not configured)
- **Payment Processing (Deferred):** Stripe (integration planned but currently deferred)

## Recent Updates (October 2025)
- ✅ **Complete UI/UX Redesign** - Implemented 2025 design trends with glassmorphism, bento grids, animated gradients, and modern dark mode
- ✅ **Landing Page Makeover** - Modern SaaS landing with hero section, feature showcase, pricing comparison, and developer code examples
- ✅ **Dashboard Redesign** - All three dashboards (Super Admin, Tenant Admin, User) rebuilt with enterprise analytics, Recharts visualizations, and modern metric cards
- ✅ **CSS Enhancement** - Added glassmorphic effects, bento grid system, micro-animations (float, glow, slide-up), and refined dark mode palette
- ✅ **Documentation Hub** - Comprehensive documentation system at `/docs` with 7 main sections:
  - Documentation Landing (`/docs`) - Hub with quick links, tutorials, and popular resources
  - Quickstart Guide (`/docs/quickstart`) - 4-step integration guide with multi-language code examples
  - Migration Guide (`/docs/migration`) - Complete Auth0/Okta to AuthFlow migration guide with zero-downtime strategies
  - SDK Documentation (`/docs/sdks`) - Client library docs for Python, JS, Go, PHP, Ruby with feature matrix
  - SDK Roadmap (`/docs/sdk-roadmap`) - Transparent roadmap showing path from 5 to 26 SDKs by end of 2025 (Auth0 has 30+)
  - Architecture Guide (`/docs/architecture`) - System design, components, and technical concepts
  - API Reference (`/docs/api`) - REST API documentation gateway linking to interactive Swagger UI
- ✅ **Accurate Competitive Positioning** (October 15, 2025):
  - Updated pricing comparison with verified Auth0 2025 data (Free: 25K MAU but limited features, Essentials: $35/mo, Professional: $240/mo)
  - All savings claims verified: "Save up to 85% on costs" based on actual calculator outputs
  - SDK roadmap shows honest gap: Currently 5 SDKs vs Auth0's 30+, with plan to reach 26 by end of 2025
  - Pricing calculator assumes businesses need at least Essentials tier for production features (MFA/RBAC)
- ✅ Fixed JavaScript SDK field mappings (firstName/lastName alignment with API)
- ✅ Implemented SMS integration with Twilio for MFA and phone verification
- ✅ Built Actions/Hooks system for custom authentication logic
- ✅ Created comprehensive OpenAPI/Swagger API documentation
- ✅ Added client SDKs for Go, PHP, and Ruby
- ✅ Database schema updated with phone number and phone verification fields
- ✅ All webhook delivery systems operational