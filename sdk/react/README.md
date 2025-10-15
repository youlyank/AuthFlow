# AuthFlow React SDK

Official React SDK for AuthFlow authentication platform. Optimized for React 18+ with hooks, context, and modern patterns.

## Installation

```bash
npm install @authflow/react
# or
yarn add @authflow/react
# or
pnpm add @authflow/react
```

## Quick Start

```typescript
import { AuthflowProvider, useAuth } from '@authflow/react';

// Wrap your app with AuthflowProvider
function App() {
  return (
    <AuthflowProvider
      domain="https://your-authflow-instance.com"
      tenantSlug="your-tenant"
    >
      <MainApp />
    </AuthflowProvider>
  );
}

// Use in components
function LoginForm() {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };
  
  if (isAuthenticated) {
    return <p>Welcome {user?.email}</p>;
  }
  
  return (
    <form onSubmit={handleSubmit}>
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

## Features

### ✅ React-Specific Features
- Custom Hooks (useAuth, useMFA, useOAuth, useSession)
- Higher-Order Components (HOCs)
- Protected Route components
- Context API integration
- Suspense support
- Server Components ready (React 18+)
- TypeScript support

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Passkeys
- OAuth2/OIDC flows
- Social login (Google, GitHub, Microsoft)

## Hooks

### useAuth

```typescript
import { useAuth } from '@authflow/react';

function ProfilePage() {
  const {
    // State
    isAuthenticated,
    isLoading,
    user,
    
    // Methods
    login,
    logout,
    register,
    updateProfile,
    
    // Error handling
    error,
    clearError,
  } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <LoginForm />;
  
  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### useMFA

```typescript
import { useMFA } from '@authflow/react';

function MFASettings() {
  const {
    enableMFATOTP,
    verifyMFATOTP,
    disableMFA,
    mfaMethods,
    isEnabled,
  } = useMFA();
  
  const [qrCode, setQrCode] = useState('');
  
  const handleEnableTOTP = async () => {
    const { secret, qrCode } = await enableMFATOTP();
    setQrCode(qrCode);
  };
  
  return (
    <div>
      {isEnabled ? (
        <button onClick={disableMFA}>Disable MFA</button>
      ) : (
        <button onClick={handleEnableTOTP}>Enable TOTP</button>
      )}
      {qrCode && <img src={qrCode} alt="QR Code" />}
    </div>
  );
}
```

### useOAuth

```typescript
import { useOAuth } from '@authflow/react';

function SocialLogin() {
  const {
    loginWithGoogle,
    loginWithGitHub,
    loginWithMicrosoft,
    isLoading,
  } = useOAuth();
  
  return (
    <div>
      <button onClick={loginWithGoogle} disabled={isLoading}>
        Sign in with Google
      </button>
      <button onClick={loginWithGitHub} disabled={isLoading}>
        Sign in with GitHub
      </button>
      <button onClick={loginWithMicrosoft} disabled={isLoading}>
        Sign in with Microsoft
      </button>
    </div>
  );
}
```

### useSession

```typescript
import { useSession } from '@authflow/react';

function SessionInfo() {
  const {
    session,
    expiresAt,
    refreshSession,
    isExpiringSoon, // True if expires in < 5 minutes
  } = useSession();
  
  useEffect(() => {
    if (isExpiringSoon) {
      refreshSession();
    }
  }, [isExpiringSoon]);
  
  return (
    <div>
      <p>Session expires: {new Date(expiresAt).toLocaleString()}</p>
      <button onClick={refreshSession}>Refresh Session</button>
    </div>
  );
}
```

## Components

### ProtectedRoute

```typescript
import { ProtectedRoute } from '@authflow/react';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

### AuthGuard

```typescript
import { AuthGuard } from '@authflow/react';

function AdminSection() {
  return (
    <AuthGuard
      requiredRoles={['admin', 'moderator']}
      fallback={<AccessDenied />}
      loadingFallback={<Spinner />}
    >
      <AdminContent />
    </AuthGuard>
  );
}
```

### LoginButton / LogoutButton

```typescript
import { LoginButton, LogoutButton } from '@authflow/react';

function NavBar() {
  return (
    <nav>
      <LoginButton
        onSuccess={(session) => console.log('Logged in:', session)}
        onError={(error) => console.error('Login failed:', error)}
      >
        Login
      </LoginButton>
      
      <LogoutButton
        onSuccess={() => console.log('Logged out')}
      >
        Logout
      </LogoutButton>
    </nav>
  );
}
```

## Higher-Order Components

### withAuth

```typescript
import { withAuth } from '@authflow/react';

interface Props {
  user: User;
  logout: () => void;
}

function ProfileComponent({ user, logout }: Props) {
  return (
    <div>
      <h1>{user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default withAuth(ProfileComponent);
```

### withMFA

```typescript
import { withMFA } from '@authflow/react';

function MFAComponent({ enableMFA, mfaMethods }: any) {
  return (
    <div>
      <button onClick={enableMFA}>Enable MFA</button>
      <p>Active methods: {mfaMethods.join(', ')}</p>
    </div>
  );
}

export default withMFA(MFAComponent);
```

## React Router Integration

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@authflow/react';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## TypeScript Support

```typescript
import { AuthflowProvider, useAuth, User, AuthSession } from '@authflow/react';

// Extend User type with custom fields
interface CustomUser extends User {
  customField: string;
}

// Use with generic
function MyComponent() {
  const { user } = useAuth<CustomUser>();
  
  return <div>{user?.customField}</div>;
}

// Typed callbacks
const handleLogin = async (credentials: LoginCredentials): Promise<AuthSession> => {
  const { login } = useAuth();
  return await login(credentials);
};
```

## Suspense Support

```typescript
import { Suspense } from 'react';
import { AuthBoundary } from '@authflow/react';

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AuthBoundary>
        <MainApp />
      </AuthBoundary>
    </Suspense>
  );
}
```

## Error Boundaries

```typescript
import { AuthErrorBoundary } from '@authflow/react';

function App() {
  return (
    <AuthErrorBoundary
      onError={(error) => console.error('Auth error:', error)}
      fallback={<ErrorPage />}
    >
      <MainApp />
    </AuthErrorBoundary>
  );
}
```

## Multi-Factor Authentication

### TOTP Setup

```typescript
import { useMFA } from '@authflow/react';
import QRCode from 'qrcode.react';

function TOTPSetup() {
  const { enableMFATOTP, verifyMFATOTP } = useMFA();
  const [setup, setSetup] = useState<{ secret: string; qrCode: string } | null>(null);
  const [code, setCode] = useState('');
  
  const handleEnable = async () => {
    const result = await enableMFATOTP();
    setSetup(result);
  };
  
  const handleVerify = async () => {
    await verifyMFATOTP(code);
    alert('TOTP enabled successfully!');
  };
  
  return (
    <div>
      {!setup ? (
        <button onClick={handleEnable}>Enable TOTP</button>
      ) : (
        <div>
          <QRCode value={setup.qrCode} />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
          />
          <button onClick={handleVerify}>Verify</button>
        </div>
      )}
    </div>
  );
}
```

## OAuth Callback Handling

```typescript
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@authflow/react';

function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code && state) {
      handleOAuthCallback({ code, state })
        .then(() => {
          // Redirect to dashboard
          window.location.href = '/dashboard';
        })
        .catch((error) => {
          console.error('OAuth callback failed:', error);
        });
    }
  }, [searchParams]);
  
  return <div>Processing login...</div>;
}
```

## WebAuthn / Passkeys

```typescript
import { useWebAuthn } from '@authflow/react';

function PasskeySetup() {
  const { registerPasskey, authenticateWithPasskey, hasPasskey } = useWebAuthn();
  
  const handleRegister = async () => {
    try {
      await registerPasskey();
      alert('Passkey registered successfully!');
    } catch (error) {
      console.error('Passkey registration failed:', error);
    }
  };
  
  const handleLogin = async () => {
    try {
      const session = await authenticateWithPasskey();
      console.log('Logged in with passkey:', session.user);
    } catch (error) {
      console.error('Passkey authentication failed:', error);
    }
  };
  
  return (
    <div>
      {hasPasskey ? (
        <button onClick={handleLogin}>Login with Passkey</button>
      ) : (
        <button onClick={handleRegister}>Register Passkey</button>
      )}
    </div>
  );
}
```

## Form Integration

### React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { useAuth } from '@authflow/react';

interface LoginForm {
  email: string;
  password: string;
}

function LoginPage() {
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  
  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { required: 'Email is required' })}
        type="email"
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input
        {...register('password', { required: 'Password is required' })}
        type="password"
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Formik

```typescript
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '@authflow/react';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too short').required('Required'),
});

function LoginPage() {
  const { login } = useAuth();
  
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={LoginSchema}
      onSubmit={async (values) => {
        await login(values);
      }}
    >
      {({ errors, touched }) => (
        <Form>
          <Field name="email" type="email" placeholder="Email" />
          {errors.email && touched.email && <div>{errors.email}</div>}
          
          <Field name="password" type="password" placeholder="Password" />
          {errors.password && touched.password && <div>{errors.password}</div>}
          
          <button type="submit">Login</button>
        </Form>
      )}
    </Formik>
  );
}
```

## Configuration

```typescript
<AuthflowProvider
  domain="https://auth.example.com"
  tenantSlug="my-app"
  
  // Optional settings
  cacheLocation="localStorage" // or 'memory', 'sessionStorage'
  
  // Redirect URIs
  redirectUri={window.location.origin}
  
  // Token refresh
  autoRefresh={true}
  refreshThreshold={300} // Refresh 5 minutes before expiry
  
  // Error handling
  onError={(error) => console.error('Auth error:', error)}
  
  // Success callbacks
  onLogin={(session) => console.log('Logged in:', session)}
  onLogout={() => console.log('Logged out')}
>
  <App />
</AuthflowProvider>
```

## Migration from Auth0

```typescript
// Before (Auth0)
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

<Auth0Provider
  domain="your-domain.auth0.com"
  clientId="client-id"
  redirectUri={window.location.origin}
>
  <App />
</Auth0Provider>

function LoginButton() {
  const { loginWithRedirect } = useAuth0();
  return <button onClick={() => loginWithRedirect()}>Login</button>;
}

// After (AuthFlow)
import { AuthflowProvider, useAuth } from '@authflow/react';

<AuthflowProvider
  domain="https://your-authflow-instance.com"
  tenantSlug="your-tenant"
>
  <App />
</AuthflowProvider>

function LoginButton() {
  const { login } = useAuth();
  return <button onClick={() => login({ email, password })}>Login</button>;
}
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/react
- **GitHub**: https://github.com/authflow/authflow-react
- **Issues**: https://github.com/authflow/authflow-react/issues
- **npm**: https://www.npmjs.com/package/@authflow/react

## Requirements

- React 16.8+ (Hooks required)
- React 18+ recommended for Suspense/Concurrent features

## License

MIT
