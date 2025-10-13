# Authflow Architecture - Licensable Authentication Product

## Business Model
**Product Type:** B2B Authentication Platform (License-based)
- Companies purchase licenses to integrate Authflow into their applications
- Deployment: Cloud-hosted (our infrastructure) OR self-hosted (customer infrastructure)
- Revenue: License fees based on MAU, feature tiers, or enterprise contracts

## Core Architecture Components

### 1. Custom OAuth2/OIDC Provider (Build Our Own!)

#### **OAuth2 Server Implementation** (PRIORITY 1)
**Purpose:** Make Authflow the identity provider for customer applications
- **What we're building:** Complete OAuth2 2.0 + OpenID Connect 1.0 server
- **Why custom:** Full control, no dependencies, optimized for our multi-tenant architecture
- **Implementation:**
  - Authorization endpoint (`/oauth2/authorize`)
  - Token endpoint (`/oauth2/token`)
  - UserInfo endpoint (`/oauth2/userinfo`)
  - JWKS endpoint (`/.well-known/jwks.json`)
  - Discovery endpoint (`/.well-known/openid-configuration`)
  - Support: authorization_code, client_credentials, refresh_token flows
  - Custom scopes per tenant

#### **Our Own Advanced Auth Features** (PRIORITY 2-4)
**Purpose:** Complete authentication capabilities
- **Passwordless (Priority 2):**
  - Magic Links via email (we build this)
  - WebAuthn/FIDO2 using `@simplewebauthn/server`
  - SMS OTP integration
  
- **Permissions System (Priority 3):**
  - Extended RBAC (already have basic)
  - Attribute-based access control (ABAC)
  - Custom permission rules per tenant
  - Resource-based permissions
  
- **API Gateway & Rate Limiting (Priority 4):**
  - Built-in rate limiting middleware
  - API key validation
  - Request throttling per tenant
  - DDoS protection

### 2. License & API Key Management

#### **API Key System**
```typescript
// Database schema already exists (apiKeys table)
// Implementation needed:

1. API Key Generation
   - Generate secure random keys (32+ bytes)
   - Associate with tenant + permissions
   - Set expiration dates
   - Track usage (MAU, request counts)

2. API Key Validation Middleware
   - Validate key on every request
   - Check expiration
   - Enforce rate limits
   - Track usage metrics

3. Admin UI for Key Management
   - Tenant admins can generate keys
   - View usage analytics
   - Rotate/revoke keys
   - Set permissions per key
```

#### **Usage Tracking & MAU**
```typescript
// Track Monthly Active Users for licensing
1. User Activity Tracking
   - Record unique users per tenant per month
   - Track authentication events
   - Calculate MAU for billing

2. License Enforcement
   - Check MAU against license limits
   - Alert on approaching limits
   - Block/throttle over-limit usage

3. Analytics Dashboard
   - MAU trends
   - Authentication method breakdown
   - Geographic distribution
   - Device/browser analytics
```

### 3. SDK Architecture

#### **JavaScript/TypeScript SDK**
```typescript
// @authflow/js-sdk
import Authflow from '@authflow/js-sdk';

const auth = new Authflow({
  apiKey: 'af_live_xxx',
  domain: 'auth.myapp.com', // customer's custom domain
});

// Easy integration
await auth.login(email, password);
await auth.loginWithOAuth('google');
await auth.logout();
await auth.getCurrentUser();
```

#### **Python SDK**
```python
# authflow-python
from authflow import Authflow

auth = Authflow(
    api_key='af_live_xxx',
    domain='auth.myapp.com'
)

# Backend integration
user = auth.verify_token(request.headers['Authorization'])
auth.create_user(email='user@example.com', password='...')
```

### 4. Webhook System

#### **Event Types**
```typescript
// Events customers can subscribe to:
- user.created
- user.updated
- user.deleted
- user.login
- user.logout
- user.password_reset
- user.email_verified
- session.created
- session.expired
- mfa.enabled
- mfa.disabled
- subscription.updated (for billing)
```

#### **Webhook Implementation**
```typescript
// Database schema needed:
webhooks {
  id: uuid
  tenantId: uuid
  url: string
  events: string[] // array of event types
  secret: string // for signature verification
  isActive: boolean
}

webhook_deliveries {
  id: uuid
  webhookId: uuid
  event: string
  payload: jsonb
  responseStatus: int
  deliveredAt: timestamp
}
```

### 5. Deployment Architecture

#### **Microservices Structure**
```
┌─────────────────────────────────────┐
│         Load Balancer (NGINX)       │
└─────────────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼───────────┐      ┌────────▼──────┐
│  Ory Hydra    │      │  Our API      │
│ (OAuth2/OIDC) │      │ (Express.js)  │
└───┬───────────┘      └────────┬──────┘
    │                           │
    │         ┌─────────────────┼──────────┐
    │         │                 │          │
┌───▼─────────▼───┐    ┌────────▼──────┐  │
│   Ory Kratos    │    │  PostgreSQL   │  │
│ (Auth Flows)    │    │   Database    │  │
└─────────────────┘    └───────────────┘  │
                                          │
                       ┌──────────────────▼┐
                       │   Ory Oathkeeper  │
                       │   (API Gateway)   │
                       └───────────────────┘
```

#### **Docker Compose for Self-Hosting**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    
  hydra:
    image: oryd/hydra:v2.2
    depends_on: [postgres]
    
  kratos:
    image: oryd/kratos:v1.1
    depends_on: [postgres]
    
  authflow-api:
    build: .
    depends_on: [postgres, hydra, kratos]
    
  nginx:
    image: nginx:alpine
    depends_on: [authflow-api, hydra]
```

## Implementation Priority

### Phase 1: Core Infrastructure (Week 1-2)
1. ✅ Implement API Key Management system
2. ✅ Build usage tracking & MAU analytics
3. ✅ Create webhook delivery system
4. ✅ Deploy Ory Hydra (OAuth2/OIDC provider)

### Phase 2: Customer Integration (Week 3-4)
5. ✅ Build JavaScript/TypeScript SDK
6. ✅ Build Python SDK
7. ✅ Create comprehensive API documentation
8. ✅ Build integration quick-start guides

### Phase 3: Advanced Auth (Week 5-6)
9. ✅ Integrate Ory Kratos (Magic Links, WebAuthn)
10. ✅ Migrate auth flows to Kratos
11. ✅ Build custom UI for Kratos flows

### Phase 4: Deployment (Week 7-8)
12. ✅ Docker containerization
13. ✅ Kubernetes deployment configs
14. ✅ Self-hosting documentation
15. ✅ Cloud deployment automation

## Technical Decisions

### Why Ory Stack?
1. **Open-source** - Can self-host, no vendor lock-in
2. **Battle-tested** - Used by major companies
3. **OAuth2/OIDC compliant** - Industry standard
4. **Microservices** - Can integrate incrementally
5. **API-first** - Easy to customize UI

### Authentication Flow
```
Customer App → Authflow SDK → Our API → Ory Hydra → OAuth2 Flow
                                ↓
                           Ory Kratos (user management)
                                ↓
                           PostgreSQL
```

### Data Isolation
- Multi-tenant with row-level security
- Separate database per enterprise customer (optional)
- API keys scoped to tenant
- Audit logs per tenant

## Next Steps
1. Start with Ory Hydra deployment (OAuth2/OIDC provider)
2. Build API key management system
3. Create JavaScript SDK
4. Implement webhook system
5. Add usage tracking for MAU
