/**
 * AuthFlow Express.js SDK
 * Official Express/Node.js middleware for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/express-sdk
 * 
 * Usage:
 * import { AuthFlowClient, authflowMiddleware } from '@authflow/express-sdk';
 */

import axios, { AxiosInstance } from 'axios';
import { Request, Response, NextFunction } from 'express';

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

export class AuthFlowClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;
  private httpClient: AxiosInstance;

  constructor(config: AuthFlowConfig) {
    this.domain = config.domain.replace(/\/$/, '');
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.httpClient = axios.create({
      baseURL: this.domain,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<any> {
    const response = await this.httpClient.post('/api/auth/register', userData);
    return response.data;
  }

  async login(email: string, password: string): Promise<any> {
    const response = await this.httpClient.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<{ user: AuthFlowUser }> {
    const response = await this.httpClient.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }

  async setupMFA(token: string, method: 'totp' | 'email' | 'sms'): Promise<any> {
    const response = await this.httpClient.post('/api/auth/mfa/setup', 
      { method },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  }

  async verifyMFA(token: string, code: string, method: string): Promise<any> {
    const response = await this.httpClient.post('/api/auth/mfa/verify',
      { code, method },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  }

  async logout(token: string): Promise<void> {
    await this.httpClient.post('/api/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getOAuthUrl(provider: 'google' | 'github', redirectUri: string): string {
    return `${this.domain}/api/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }
}

// Express middleware
export function authflowMiddleware(client: AuthFlowClient) {
  return async (req: Request & { authflowUser?: AuthFlowUser }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    try {
      const { user } = await client.verifyToken(token);
      req.authflowUser = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Optional middleware (doesn't require auth, but sets user if present)
export function optionalAuthflowMiddleware(client: AuthFlowClient) {
  return async (req: Request & { authflowUser?: AuthFlowUser }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { user } = await client.verifyToken(token);
        req.authflowUser = user;
      } catch (error) {
        // Ignore errors, just don't set user
      }
    }
    next();
  };
}

// Example usage:
/*
import express from 'express';
import { AuthFlowClient, authflowMiddleware } from '@authflow/express-sdk';

const app = express();
const authflow = new AuthFlowClient({
  domain: process.env.AUTHFLOW_DOMAIN!,
  clientId: process.env.AUTHFLOW_CLIENT_ID!,
  clientSecret: process.env.AUTHFLOW_CLIENT_SECRET!
});

app.use(express.json());

// Public routes
app.post('/auth/login', async (req, res) => {
  try {
    const result = await authflow.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: 'Login failed' });
  }
});

// Protected routes
app.get('/api/profile', authflowMiddleware(authflow), (req, res) => {
  res.json({ user: req.authflowUser });
});

app.listen(3000);
*/

export default AuthFlowClient;
