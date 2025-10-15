# AuthFlow Next.js SDK

Official Next.js SDK for AuthFlow authentication platform. Optimized for Next.js 13+ with App Router, Server Components, and Server Actions.

## Installation

```bash
npm install @authflow/nextjs
# or
yarn add @authflow/nextjs
# or
pnpm add @authflow/nextjs
```

## Quick Start

### 1. Configure Environment Variables

```bash
# .env.local
AUTHFLOW_DOMAIN=https://your-authflow-instance.com
AUTHFLOW_TENANT_SLUG=your-tenant
AUTHFLOW_SECRET=your-secret-key # For session encryption
```

### 2. Create Auth Route Handler (App Router)

```typescript
// app/api/auth/[...authflow]/route.ts
import { handleAuth } from '@authflow/nextjs';

export const { GET, POST } = handleAuth();
```

### 3. Wrap App with Provider

```typescript
// app/layout.tsx
import { AuthflowProvider } from '@authflow/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AuthflowProvider>{children}</AuthflowProvider>
      </body>
    </html>
  );
}
```

### 4. Use in Components

```typescript
// app/page.tsx
'use client';

import { useAuth } from '@authflow/nextjs';

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={() => login()}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome {user?.email}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

## Features

### ✅ Next.js-Specific Features
- App Router support (Next.js 13+)
- Server Components & Server Actions
- API Route Handlers
- Middleware for protected routes
- Edge Runtime compatible
- ISR & SSG support
- Automatic session management
- TypeScript support

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Passkeys
- OAuth2/OIDC flows
- Social login (Google, GitHub, Microsoft)

## App Router (Next.js 13+)

### Server Components

```typescript
// app/dashboard/page.tsx
import { getSession } from '@authflow/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Welcome {session.user.email}</h1>
      <p>User ID: {session.user.id}</p>
    </div>
  );
}
```

### Client Components

```typescript
'use client';

import { useAuth } from '@authflow/nextjs';

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>{user?.email}</h1>
      <button onClick={() => updateProfile({ name: 'New Name' })}>
        Update Profile
      </button>
    </div>
  );
}
```

### Server Actions

```typescript
// app/actions/auth.ts
'use server';

import { login, logout } from '@authflow/nextjs/server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  try {
    await login({ email, password });
    redirect('/dashboard');
  } catch (error) {
    return { error: 'Login failed' };
  }
}

export async function logoutAction() {
  await logout();
  redirect('/');
}

// app/login/page.tsx
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  return (
    <form action={loginAction}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Middleware

### Protected Routes

```typescript
// middleware.ts
import { withAuth } from '@authflow/nextjs/middleware';

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Protect all routes under /dashboard
      if (req.nextUrl.pathname.startsWith('/dashboard')) {
        return !!token;
      }
      
      // Protect admin routes
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.roles?.includes('admin') ?? false;
      }
      
      return true;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### Custom Middleware

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@authflow/nextjs/middleware';

export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

## API Routes

### Custom Auth API

```typescript
// app/api/me/route.ts
import { getSession } from '@authflow/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ user: session.user });
}
```

### Protected API Route

```typescript
// app/api/admin/route.ts
import { withApiAuth } from '@authflow/nextjs';
import { NextResponse } from 'next/server';

export const GET = withApiAuth(async (req, { session }) => {
  if (!session.user.roles?.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  return NextResponse.json({ data: 'Admin data' });
}, {
  requiredRoles: ['admin'],
});
```

## Pages Router (Next.js 12)

### getServerSideProps

```typescript
import { getSession } from '@authflow/nextjs';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context.req);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      user: session.user,
    },
  };
};

export default function DashboardPage({ user }: any) {
  return <div>Welcome {user.email}</div>;
}
```

### API Routes (Pages Router)

```typescript
// pages/api/me.ts
import { withApiAuth } from '@authflow/nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default withApiAuth(
  async (req: NextApiRequest, res: NextApiResponse, session) => {
    res.json({ user: session.user });
  }
);
```

## Hooks

### useAuth

```typescript
'use client';

import { useAuth } from '@authflow/nextjs';

export default function MyComponent() {
  const {
    // State
    user,
    isAuthenticated,
    isLoading,
    
    // Methods
    login,
    logout,
    register,
    
    // Error
    error,
  } = useAuth();
  
  return (
    // Your component
  );
}
```

### useSession

```typescript
'use client';

import { useSession } from '@authflow/nextjs';

export default function SessionInfo() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Not logged in</div>;
  
  return <div>Logged in as {session.user.email}</div>;
}
```

## Multi-Factor Authentication

### TOTP Setup

```typescript
'use client';

import { useMFA } from '@authflow/nextjs';
import { useState } from 'react';
import QRCode from 'qrcode.react';

export default function MFASettings() {
  const { enableMFATOTP, verifyMFATOTP } = useMFA();
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  
  const handleEnable = async () => {
    const { qrCode } = await enableMFATOTP();
    setQrCode(qrCode);
  };
  
  const handleVerify = async () => {
    await verifyMFATOTP(code);
    alert('TOTP enabled!');
  };
  
  return (
    <div>
      {!qrCode ? (
        <button onClick={handleEnable}>Enable TOTP</button>
      ) : (
        <>
          <QRCode value={qrCode} />
          <input value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={handleVerify}>Verify</button>
        </>
      )}
    </div>
  );
}
```

## OAuth / Social Login

### OAuth Callback

```typescript
// app/api/auth/callback/route.ts
import { handleOAuthCallback } from '@authflow/nextjs';

export async function GET(request: Request) {
  return handleOAuthCallback(request);
}
```

### Client-Side OAuth

```typescript
'use client';

import { useOAuth } from '@authflow/nextjs';

export default function SocialLogin() {
  const { loginWithGoogle, loginWithGitHub } = useOAuth();
  
  return (
    <div>
      <button onClick={loginWithGoogle}>Sign in with Google</button>
      <button onClick={loginWithGitHub}>Sign in with GitHub</button>
    </div>
  );
}
```

## WebAuthn / Passkeys

```typescript
'use client';

import { useWebAuthn } from '@authflow/nextjs';

export default function PasskeyAuth() {
  const { registerPasskey, authenticateWithPasskey } = useWebAuthn();
  
  return (
    <div>
      <button onClick={registerPasskey}>Register Passkey</button>
      <button onClick={authenticateWithPasskey}>Login with Passkey</button>
    </div>
  );
}
```

## Edge Runtime

```typescript
// app/api/auth/edge/route.ts
export const runtime = 'edge';

import { getSession } from '@authflow/nextjs/edge';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getSession(request);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  return NextResponse.json({ user: session.user });
}
```

## Static Site Generation (SSG)

```typescript
import { getSession } from '@authflow/nextjs';

export default async function StaticPage() {
  // This runs at build time
  return (
    <div>
      <h1>Static Content</h1>
      <p>Auth handled client-side</p>
    </div>
  );
}

// Add client-side auth check
'use client';

export function ClientAuthCheck() {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please login</p>;
  }
  
  return <p>Protected content</p>;
}
```

## Incremental Static Regeneration (ISR)

```typescript
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ISRPage() {
  const session = await getSession();
  
  return (
    <div>
      <h1>ISR Page</h1>
      {session && <p>Welcome {session.user.email}</p>}
    </div>
  );
}
```

## Configuration

```typescript
// authflow.config.ts
import { AuthflowConfig } from '@authflow/nextjs';

export default {
  domain: process.env.AUTHFLOW_DOMAIN,
  tenantSlug: process.env.AUTHFLOW_TENANT_SLUG,
  secret: process.env.AUTHFLOW_SECRET,
  
  // Session
  session: {
    cookie: {
      name: 'authflow-session',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  },
  
  // Callbacks
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      return session;
    },
  },
  
  // Pages
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
} as AuthflowConfig;
```

## TypeScript

```typescript
// types/next-auth.d.ts
import { DefaultSession } from '@authflow/nextjs';

declare module '@authflow/nextjs' {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession['user'];
  }
}
```

## Migration from Auth0

```typescript
// Before (Auth0)
import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0';

export const getServerSideProps = withPageAuthRequired();

export default function DashboardPage({ user }: any) {
  return <div>Welcome {user.email}</div>;
}

// After (AuthFlow)
import { getSession } from '@authflow/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return <div>Welcome {session.user.email}</div>;
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/nextjs
- **GitHub**: https://github.com/authflow/authflow-nextjs
- **Issues**: https://github.com/authflow/authflow-nextjs/issues
- **npm**: https://www.npmjs.com/package/@authflow/nextjs

## Requirements

- Next.js 12+ (13+ recommended for App Router)
- React 18+
- Node.js 16+

## License

MIT
