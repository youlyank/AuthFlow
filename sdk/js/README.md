# @authflow/js-sdk

Official JavaScript/TypeScript SDK for Authflow Authentication Platform

## Installation

```bash
npm install @authflow/js-sdk
```

## Quick Start

```typescript
import { AuthflowClient } from '@authflow/js-sdk';

// Initialize the client
const authflow = new AuthflowClient({
  domain: 'https://your-authflow-instance.com',
  tenantSlug: 'your-tenant', // Optional: set default tenant
});

// Register a new user
const user = await authflow.register({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  name: 'John Doe',
});

// Login
const session = await authflow.login({
  email: 'user@example.com',
  password: 'SecurePassword123!',
});

// Check authentication status
if (authflow.isAuthenticated()) {
  const user = authflow.getUser();
  console.log('Logged in as:', user.email);
}

// Logout
await authflow.logout();
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- MFA (TOTP & Email OTP)
- Magic Links (passwordless)
- WebAuthn/FIDO2 (biometric)
- OAuth2/OIDC flows

### ✅ Session Management
- Automatic session persistence
- Token refresh
- Secure storage (localStorage)

### ✅ TypeScript Support
- Full TypeScript definitions
- IntelliSense support
- Type-safe API

## API Reference

### Authentication

#### `register(data)`
Register a new user account.

```typescript
const user = await authflow.register({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  name: 'John Doe',
  tenantSlug: 'my-company', // Optional
});
```

#### `login(credentials)`
Authenticate a user and create a session.

```typescript
const session = await authflow.login({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  tenantSlug: 'my-company', // Optional
});
```

#### `logout()`
End the current session.

```typescript
await authflow.logout();
```

#### `getCurrentUser()`
Get the current authenticated user.

```typescript
const user = await authflow.getCurrentUser();
```

### Multi-Factor Authentication (MFA)

#### `setupMFA(method)`
Setup MFA for the current user.

```typescript
// Setup TOTP (Google Authenticator)
const { secret, qrCode } = await authflow.setupMFA('totp');

// Setup Email OTP
const result = await authflow.setupMFA('email');
```

#### `verifyMFA(data)`
Verify an MFA code.

```typescript
const session = await authflow.verifyMFA({
  code: '123456',
  method: 'totp',
  trustDevice: true, // Remember this device
});
```

#### `disableMFA()`
Disable MFA for the current user.

```typescript
await authflow.disableMFA();
```

### Magic Links (Passwordless)

#### `requestMagicLink(data)`
Request a magic link for passwordless login.

```typescript
await authflow.requestMagicLink({
  email: 'user@example.com',
  tenantSlug: 'my-company',
  redirectUrl: 'https://myapp.com/callback',
});
```

#### `verifyMagicLink(token)`
Verify a magic link token.

```typescript
const session = await authflow.verifyMagicLink(token);
```

### WebAuthn (Biometric)

#### `registerWebAuthn(name)`
Register a biometric credential.

```typescript
const { credential } = await authflow.registerWebAuthn('My iPhone');
```

#### `loginWebAuthn()`
Login using biometric authentication.

```typescript
const session = await authflow.loginWebAuthn();
```

#### `getWebAuthnCredentials()`
List registered WebAuthn credentials.

```typescript
const credentials = await authflow.getWebAuthnCredentials();
```

#### `deleteWebAuthnCredential(id)`
Delete a WebAuthn credential.

```typescript
await authflow.deleteWebAuthnCredential(credentialId);
```

### Password Reset

#### `requestPasswordReset(data)`
Request a password reset link.

```typescript
await authflow.requestPasswordReset({
  email: 'user@example.com',
  tenantSlug: 'my-company',
});
```

#### `resetPassword(data)`
Complete the password reset process.

```typescript
await authflow.resetPassword({
  token: 'reset-token',
  newPassword: 'NewSecurePassword123!',
});
```

### OAuth2 / OIDC

#### `getOAuth2AuthorizeUrl(params)`
Generate an OAuth2 authorization URL.

```typescript
const authUrl = authflow.getOAuth2AuthorizeUrl({
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  scope: 'openid profile email',
  state: 'random-state',
});

// Redirect user to authUrl
window.location.href = authUrl;
```

#### `exchangeCodeForToken(data)`
Exchange authorization code for access token.

```typescript
const tokenResponse = await authflow.exchangeCodeForToken({
  code: authorizationCode,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  redirectUri: 'https://yourapp.com/callback',
});
```

#### `getOAuth2UserInfo()`
Get user info from OAuth2 token.

```typescript
const user = await authflow.getOAuth2UserInfo();
```

### Universal Login

#### `getUniversalLoginUrl(tenantSlug, returnTo)`
Get the hosted login page URL.

```typescript
const loginUrl = authflow.getUniversalLoginUrl(
  'my-company',
  'https://myapp.com/dashboard'
);

// Redirect to hosted login
window.location.href = loginUrl;
```

#### `getUniversalRegisterUrl(tenantSlug, returnTo)`
Get the hosted registration page URL.

```typescript
const registerUrl = authflow.getUniversalRegisterUrl(
  'my-company',
  'https://myapp.com/dashboard'
);
```

### API Keys

#### `createAPIKey(data)`
Create a new API key.

```typescript
const apiKey = await authflow.createAPIKey({
  name: 'Production API Key',
  expiresAt: '2024-12-31',
  permissions: ['read', 'write'],
});
```

#### `listAPIKeys()`
List all API keys.

```typescript
const apiKeys = await authflow.listAPIKeys();
```

#### `deleteAPIKey(id)`
Delete an API key.

```typescript
await authflow.deleteAPIKey(apiKeyId);
```

### Session Management

#### `getSession()`
Get the current session.

```typescript
const session = authflow.getSession();
if (session) {
  console.log('Access token:', session.accessToken);
  console.log('Expires at:', session.expiresAt);
}
```

#### `getUser()`
Get the current user from session.

```typescript
const user = authflow.getUser();
if (user) {
  console.log('User:', user.email);
}
```

#### `isAuthenticated()`
Check if user is authenticated.

```typescript
if (authflow.isAuthenticated()) {
  // User is logged in
}
```

#### `refreshToken()`
Manually refresh the access token.

```typescript
const newSession = await authflow.refreshToken();
```

### Utilities

#### `checkPasswordBreach(password)`
Check if a password has been breached (Have I Been Pwned).

```typescript
const { breached, safe } = await authflow.checkPasswordBreach('password123');
if (breached) {
  console.warn('This password has been compromised!');
}
```

## Usage Examples

### React Example

```tsx
import { useState, useEffect } from 'react';
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
});

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const session = await authflow.login({ email, password });
      console.log('Logged in:', session.user);
      // Redirect to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Next.js Example

```typescript
// pages/api/auth/callback.ts
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: process.env.AUTHFLOW_DOMAIN!,
});

export default async function handler(req, res) {
  const { code } = req.query;

  try {
    const tokenResponse = await authflow.exchangeCodeForToken({
      code: code as string,
      clientId: process.env.AUTHFLOW_CLIENT_ID!,
      clientSecret: process.env.AUTHFLOW_CLIENT_SECRET!,
      redirectUri: `${process.env.APP_URL}/api/auth/callback`,
    });

    // Store token in session
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}
```

### Vue.js Example

```vue
<template>
  <div>
    <button @click="loginWithBiometric">Login with Biometric</button>
  </div>
</template>

<script>
import { AuthflowClient } from '@authflow/js-sdk';

export default {
  data() {
    return {
      authflow: new AuthflowClient({
        domain: 'https://auth.example.com',
        tenantSlug: 'my-app',
      }),
    };
  },
  methods: {
    async loginWithBiometric() {
      try {
        const session = await this.authflow.loginWebAuthn();
        console.log('Logged in with biometric:', session.user);
        this.$router.push('/dashboard');
      } catch (error) {
        console.error('Biometric login failed:', error);
      }
    },
  },
};
</script>
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Authflow Example</title>
</head>
<body>
  <form id="login-form">
    <input type="email" id="email" placeholder="Email" required />
    <input type="password" id="password" placeholder="Password" required />
    <button type="submit">Login</button>
  </form>

  <script type="module">
    import { AuthflowClient } from 'https://cdn.skypack.dev/@authflow/js-sdk';

    const authflow = new AuthflowClient({
      domain: 'https://auth.example.com',
      tenantSlug: 'my-app',
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const session = await authflow.login({ email, password });
        alert(`Welcome, ${session.user.name}!`);
        // Redirect or update UI
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  </script>
</body>
</html>
```

## Error Handling

All SDK methods throw errors on failure. Use try/catch:

```typescript
try {
  await authflow.login({ email, password });
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    console.error('Wrong email or password');
  } else if (error.message.includes('MFA required')) {
    // Redirect to MFA page
  } else {
    console.error('Login error:', error);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import { AuthflowClient, User, Session, MFASetupResponse } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
});

// TypeScript will provide IntelliSense and type checking
const user: User = authflow.getUser()!;
const session: Session | null = authflow.getSession();
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

WebAuthn requires HTTPS in production.

## License

MIT

## Support

- Documentation: https://docs.authflow.dev
- GitHub: https://github.com/authflow/js-sdk
- Issues: https://github.com/authflow/js-sdk/issues
