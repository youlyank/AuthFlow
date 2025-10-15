/**
 * AuthFlow SolidJS SDK
 * Official SolidJS integration for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/solidjs-sdk
 * 
 * Usage in App.tsx:
 * import { AuthFlowProvider } from '@authflow/solidjs-sdk';
 * 
 * function App() {
 *   return (
 *     <AuthFlowProvider
 *       domain={import.meta.env.VITE_AUTHFLOW_DOMAIN}
 *       clientId={import.meta.env.VITE_AUTHFLOW_CLIENT_ID}
 *       clientSecret={import.meta.env.VITE_AUTHFLOW_CLIENT_SECRET}
 *     >
 *       <Router />
 *     </AuthFlowProvider>
 *   );
 * }
 */

import { createContext, useContext, createSignal, createEffect, ParentComponent, JSX } from 'solid-js';

export interface AuthFlowConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export interface AuthFlowUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tenantId?: string;
}

export interface AuthFlowContextType {
  user: () => AuthFlowUser | null;
  token: () => string | null;
  loading: () => boolean;
  error: () => string | null;
  isAuthenticated: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthFlowContext = createContext<AuthFlowContextType>();

export class AuthFlowClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: AuthFlowConfig) {
    this.domain = config.domain.replace(/\/$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Registration failed');
    return response.json();
  }

  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }

  async verifyToken(token: string): Promise<{ user: AuthFlowUser }> {
    const response = await fetch(`${this.domain}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Token verification failed');
    return response.json();
  }

  async setupMFA(token: string, method: 'totp' | 'email' | 'sms'): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/mfa/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ method })
    });
    if (!response.ok) throw new Error('MFA setup failed');
    return response.json();
  }

  async verifyMFA(token: string, code: string, method: string): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/mfa/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code, method })
    });
    if (!response.ok) throw new Error('MFA verification failed');
    return response.json();
  }

  async logout(token: string): Promise<void> {
    await fetch(`${this.domain}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getOAuthUrl(provider: 'google' | 'github', redirectUri: string): string {
    return `${this.domain}/api/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
}

export const AuthFlowProvider: ParentComponent<AuthFlowConfig> = (props) => {
  const client = new AuthFlowClient({
    domain: props.domain,
    clientId: props.clientId,
    clientSecret: props.clientSecret
  });

  const [user, setUser] = createSignal<AuthFlowUser | null>(null);
  const [token, setToken] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const isAuthenticated = () => !!user();

  // Check for existing token on mount
  createEffect(() => {
    const storedToken = localStorage.getItem('authflow_token');
    if (storedToken) {
      client.verifyToken(storedToken)
        .then(({ user }) => {
          setUser(user);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('authflow_token');
        });
    }
  });

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.login(email, password);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('authflow_token', result.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await client.register(userData);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('authflow_token', result.token);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = token();
    if (currentToken) {
      await client.logout(currentToken);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('authflow_token');
  };

  const value: AuthFlowContextType = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthFlowContext.Provider value={value}>
      {props.children}
    </AuthFlowContext.Provider>
  );
};

export function useAuthFlow(): AuthFlowContextType {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return context;
}

// Protected Route component
export function ProtectedRoute(props: { children: JSX.Element; fallback?: JSX.Element }) {
  const auth = useAuthFlow();
  
  return (
    <>
      {auth.isAuthenticated() ? props.children : (props.fallback || null)}
    </>
  );
}

// Example component usage:
/*
import { useAuthFlow, ProtectedRoute } from '@authflow/solidjs-sdk';
import { createSignal } from 'solid-js';

function LoginPage() {
  const { login, loading, error } = useAuthFlow();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    await login(email(), password());
  }

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email()} 
        onInput={(e) => setEmail(e.currentTarget.value)}
        required 
      />
      <input 
        type="password" 
        value={password()} 
        onInput={(e) => setPassword(e.currentTarget.value)}
        required 
      />
      <button type="submit" disabled={loading()}>
        {loading() ? 'Loading...' : 'Login'}
      </button>
      {error() && <p class="error">{error()}</p>}
    </form>
  );
}

function DashboardPage() {
  const { user, logout } = useAuthFlow();
  
  return (
    <ProtectedRoute fallback={<Navigate href="/login" />}>
      <div>
        <h1>Welcome, {user()?.email}</h1>
        <button onClick={logout}>Logout</button>
      </div>
    </ProtectedRoute>
  );
}
*/

export default AuthFlowClient;
