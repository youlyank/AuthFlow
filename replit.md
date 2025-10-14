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
- **Authentication:** JWT-based with refresh token rotation, bcrypt for password hashing, and comprehensive session management with device tracking. Supports Email/Password, OAuth (Google/GitHub), MFA (TOTP, Email OTP), WebAuthn/FIDO2, and Magic Links.
- **Authorization:** Role-Based Access Control (RBAC) with three distinct dashboards (Super Admin, Tenant Admin, User), API Key Management with permission-based access, and centralized enforcement.
- **Multi-Tenancy:** Achieved via row-level isolation in PostgreSQL using a `tenant_id` column.
- **Real-time Features:** WebSocket-based push notifications using Socket.IO for various event types (system, security, announcement, billing) with read/unread tracking and priority levels.
- **OAuth2/OIDC Provider:** Full implementation including Authorization, Token, UserInfo, JWKS, and Discovery endpoints, PKCE support, consent screens, client management, and scheduled token cleanup.
- **Webhook System:** Production-ready with event registration, atomic delivery, HMAC signing for security, exponential backoff for retries, and a scheduled retry processor.
- **Security:** Comprehensive audit logging, login history, trusted device fingerprinting, rate limiting, password breach detection (Have I Been Pwned integration), IP restrictions, and GDPR compliance tools. All secrets are hashed (bcrypt for passwords, SHA-256 for OAuth2 client secrets and API keys).

## External Dependencies
- **Database:** PostgreSQL (specifically Neon for cloud deployment)
- **ORM:** Drizzle ORM
- **Real-time Communication:** Socket.IO
- **Authentication:** Google OAuth, GitHub OAuth, Have I Been Pwned API (for password breach detection)
- **Payment Processing (Deferred):** Stripe (integration planned but currently deferred)