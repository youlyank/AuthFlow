/**
 * AuthFlow Remix SDK
 * Official Remix integration for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/remix-sdk
 * 
 * Usage in app/root.tsx:
 * import { AuthFlowProvider } from '@authflow/remix-sdk';
 * 
 * export default function App() {
 *   return (
 *     <AuthFlowProvider
 *       domain={ENV.AUTHFLOW_DOMAIN}
 *       clientId={ENV.AUTHFLOW_CLIENT_ID}
 *       clientSecret={ENV.AUTHFLOW_CLIENT_SECRET}
 *     >
 *       <Outlet />
 *     </AuthFlowProvider>
 *   );
 * }
 */

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { json, redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

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
  user: AuthFlowUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthFlowContext = createContext<AuthFlowContextType | undefined>(undefined);

export class AuthFlowClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: AuthFlowConfig) {
    this.domain = config.domain.replace(/\/$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async register(userData: any): Promise<any> {
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

  async setupMFA(token: string, method: string): Promise<any> {
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

  async logout(token: string): Promise<void> {
    await fetch(`${this.domain}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

// Provider Component
export function AuthFlowProvider({
  children,
  domain,
  clientId,
  clientSecret
}: AuthFlowConfig & { children: ReactNode }) {
  const [user, setUser] = useState<AuthFlowUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const client = new AuthFlowClient({ domain, clientId, clientSecret });

  useEffect(() => {
    const storedToken = localStorage.getItem('authflow_token');
    if (storedToken) {
      client.verifyToken(storedToken)
        .then(({ user }) => {
          setUser(user);
          setToken(storedToken);
        })
        .catch(() => {
          localStorage.removeItem('authflow_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const result = await client.login(email, password);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('authflow_token', result.token);
  };

  const register = async (userData: any) => {
    const result = await client.register(userData);
    setToken(result.token);
    setUser(result.user);
    localStorage.setItem('authflow_token', result.token);
  };

  const logout = async () => {
    if (token) {
      await client.logout(token);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('authflow_token');
  };

  return (
    <AuthFlowContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow() {
  const context = useContext(AuthFlowContext);
  if (!context) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return context;
}

// Server-side utilities
export async function requireAuth(request: Request, client: AuthFlowClient) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw redirect('/login');
  }

  const token = authHeader.substring(7);
  try {
    const { user } = await client.verifyToken(token);
    return user;
  } catch {
    throw redirect('/login');
  }
}

export function createAuthFlowLoader(client: AuthFlowClient) {
  return async ({ request }: LoaderFunctionArgs) => {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { user } = await client.verifyToken(token);
        return json({ user });
      } catch {
        return json({ user: null });
      }
    }
    
    return json({ user: null });
  };
}

// Example route usage:
/*
// app/routes/_protected.tsx
import { LoaderFunctionArgs } from '@remix-run/node';
import { requireAuth, AuthFlowClient } from '@authflow/remix-sdk';

const client = new AuthFlowClient({
  domain: process.env.AUTHFLOW_DOMAIN!,
  clientId: process.env.AUTHFLOW_CLIENT_ID!,
  clientSecret: process.env.AUTHFLOW_CLIENT_SECRET!
});

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request, client);
  return json({ user });
}

// app/routes/login.tsx
import { useAuthFlow } from '@authflow/remix-sdk';

export default function Login() {
  const { login, loading } = useAuthFlow();
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await login(
      formData.get('email') as string,
      formData.get('password') as string
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>Login</button>
    </form>
  );
}
*/

export default AuthFlowClient;
