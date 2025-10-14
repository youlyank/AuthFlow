# Authflow SDK - Integration Examples

Complete examples for integrating Authflow into your application.

## Table of Contents
- [React App](#react-app)
- [Next.js App](#nextjs-app)
- [Vue.js App](#vuejs-app)
- [Express Backend](#express-backend)
- [OAuth2 Integration](#oauth2-integration)
- [WebAuthn Integration](#webauthn-integration)

---

## React App

### Setup

```bash
npm install @authflow/js-sdk
```

### Auth Context Provider

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthflowClient, User, Session } from '@authflow/js-sdk';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authflow = new AuthflowClient({
  domain: import.meta.env.VITE_AUTHFLOW_DOMAIN,
  tenantSlug: import.meta.env.VITE_AUTHFLOW_TENANT,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load session on mount
    const loadSession = async () => {
      const existingSession = authflow.getSession();
      if (existingSession) {
        try {
          const currentUser = await authflow.getCurrentUser();
          setUser(currentUser);
          setSession(existingSession);
        } catch (error) {
          authflow.clearSession();
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    const newSession = await authflow.login({ email, password });
    setUser(newSession.user);
    setSession(newSession);
  };

  const register = async (email: string, password: string, name: string) => {
    const newUser = await authflow.register({ email, password, name });
    setUser(newUser);
  };

  const logout = async () => {
    await authflow.logout();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Login Component

```tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected Route

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## Next.js App

### API Route for OAuth Callback

```typescript
// pages/api/auth/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: process.env.AUTHFLOW_DOMAIN!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'No authorization code' });
  }

  try {
    const tokenResponse = await authflow.exchangeCodeForToken({
      code: code as string,
      clientId: process.env.AUTHFLOW_CLIENT_ID!,
      clientSecret: process.env.AUTHFLOW_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    });

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', `authflow_token=${tokenResponse.access_token}; HttpOnly; Secure; Path=/; Max-Age=86400`);
    
    res.redirect(307, '/dashboard');
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
```

### Server-Side Authentication

```typescript
// lib/auth.ts
import { AuthflowClient } from '@authflow/js-sdk';
import { GetServerSidePropsContext } from 'next';

export async function getAuthenticatedUser(context: GetServerSidePropsContext) {
  const token = context.req.cookies.authflow_token;
  
  if (!token) {
    return null;
  }

  const authflow = new AuthflowClient({
    domain: process.env.AUTHFLOW_DOMAIN!,
  });

  try {
    // Verify token and get user
    const user = await authflow.getCurrentUser();
    return user;
  } catch {
    return null;
  }
}

// Usage in page
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const user = await getAuthenticatedUser(context);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { user },
  };
};
```

---

## Vue.js App

### Auth Plugin

```typescript
// plugins/authflow.ts
import { AuthflowClient } from '@authflow/js-sdk';
import { App } from 'vue';

const authflow = new AuthflowClient({
  domain: import.meta.env.VITE_AUTHFLOW_DOMAIN,
  tenantSlug: import.meta.env.VITE_AUTHFLOW_TENANT,
});

export default {
  install: (app: App) => {
    app.config.globalProperties.$authflow = authflow;
    app.provide('authflow', authflow);
  },
};
```

### Composition API Hook

```typescript
// composables/useAuth.ts
import { ref, onMounted } from 'vue';
import { inject } from 'vue';
import type { AuthflowClient, User } from '@authflow/js-sdk';

export function useAuth() {
  const authflow = inject<AuthflowClient>('authflow')!;
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);

  onMounted(async () => {
    const session = authflow.getSession();
    if (session) {
      try {
        user.value = await authflow.getCurrentUser();
        isAuthenticated.value = true;
      } catch {
        authflow.clearSession();
      }
    }
  });

  const login = async (email: string, password: string) => {
    const session = await authflow.login({ email, password });
    user.value = session.user;
    isAuthenticated.value = true;
  };

  const logout = async () => {
    await authflow.logout();
    user.value = null;
    isAuthenticated.value = false;
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
}
```

---

## Express Backend

### Middleware for API Protection

```typescript
// middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: process.env.AUTHFLOW_DOMAIN!,
});

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No authorization token' });
  }

  try {
    // Verify token with Authflow
    const response = await fetch(`${process.env.AUTHFLOW_DOMAIN}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Invalid token');
    }

    const user = await response.json();
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Usage
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
```

---

## OAuth2 Integration

### Authorization Code Flow with PKCE

```typescript
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: 'https://auth.example.com',
});

// Generate PKCE verifier and challenge
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Start OAuth flow
async function startOAuthFlow() {
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  
  // Store verifier for later
  sessionStorage.setItem('code_verifier', verifier);

  const authUrl = authflow.getOAuth2AuthorizeUrl({
    clientId: 'your-client-id',
    redirectUri: 'https://yourapp.com/callback',
    scope: 'openid profile email',
    state: crypto.randomUUID(),
    codeChallenge: challenge,
    codeChallengeMethod: 'S256',
  });

  window.location.href = authUrl;
}

// Handle callback
async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const verifier = sessionStorage.getItem('code_verifier');

  if (!code || !verifier) {
    throw new Error('Invalid callback');
  }

  const tokenResponse = await authflow.exchangeCodeForToken({
    code,
    clientId: 'your-client-id',
    redirectUri: 'https://yourapp.com/callback',
    codeVerifier: verifier,
  });

  console.log('Access token:', tokenResponse.access_token);
  
  // Get user info
  const user = await authflow.getOAuth2UserInfo();
  console.log('User:', user);
}
```

---

## WebAuthn Integration

### Complete Biometric Authentication Flow

```typescript
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
});

// Register biometric credential
async function registerBiometric() {
  try {
    // First, ensure user is logged in
    if (!authflow.isAuthenticated()) {
      throw new Error('Please login first');
    }

    // Register WebAuthn credential
    const { credential } = await authflow.registerWebAuthn('My Device');
    
    console.log('Biometric registered:', credential);
    alert('Biometric authentication is now enabled!');
  } catch (error: any) {
    console.error('Registration failed:', error);
    
    if (error.message.includes('not supported')) {
      alert('Your browser does not support biometric authentication');
    } else if (error.message.includes('cancelled')) {
      alert('Registration was cancelled');
    } else {
      alert('Failed to register biometric: ' + error.message);
    }
  }
}

// Login with biometric
async function loginWithBiometric() {
  try {
    const session = await authflow.loginWebAuthn();
    console.log('Logged in:', session.user);
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error: any) {
    console.error('Biometric login failed:', error);
    
    if (error.message.includes('not found')) {
      alert('No biometric credentials found. Please register first.');
    } else {
      alert('Biometric login failed: ' + error.message);
    }
  }
}

// List registered credentials
async function listBiometricDevices() {
  const credentials = await authflow.getWebAuthnCredentials();
  
  console.log('Registered devices:');
  credentials.forEach(cred => {
    console.log(`- ${cred.name} (registered ${cred.createdAt})`);
  });
  
  return credentials;
}

// Remove a credential
async function removeBiometricDevice(credentialId: string) {
  await authflow.deleteWebAuthnCredential(credentialId);
  console.log('Credential removed');
}
```

---

## Environment Variables

### .env.local (Next.js/Vite)

```bash
# Authflow Configuration
VITE_AUTHFLOW_DOMAIN=https://auth.example.com
VITE_AUTHFLOW_TENANT=my-company
VITE_AUTHFLOW_CLIENT_ID=your-client-id

# Server-side only
AUTHFLOW_CLIENT_SECRET=your-client-secret
```

### vercel.json (Vercel Deployment)

```json
{
  "env": {
    "AUTHFLOW_DOMAIN": "@authflow-domain",
    "AUTHFLOW_CLIENT_ID": "@authflow-client-id",
    "AUTHFLOW_CLIENT_SECRET": "@authflow-client-secret"
  }
}
```

---

## Testing

### Jest Mock

```typescript
// __mocks__/@authflow/js-sdk.ts
export class AuthflowClient {
  async login() {
    return {
      user: { id: '1', email: 'test@example.com', role: 'user' },
      accessToken: 'mock-token',
      expiresAt: new Date(),
    };
  }

  getUser() {
    return { id: '1', email: 'test@example.com', role: 'user' };
  }

  isAuthenticated() {
    return true;
  }
}
```

---

## Troubleshooting

### Common Issues

**CORS Errors:**
```typescript
// Ensure your Authflow instance allows your domain
// Contact admin to add your domain to allowed origins
```

**Token Expiration:**
```typescript
// Automatically refresh tokens
setInterval(async () => {
  try {
    await authflow.refreshToken();
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
}, 15 * 60 * 1000); // Every 15 minutes
```

**WebAuthn Not Working:**
```typescript
// WebAuthn requires HTTPS (except localhost)
// Check browser support:
if (!window.PublicKeyCredential) {
  console.error('WebAuthn not supported');
}
```
