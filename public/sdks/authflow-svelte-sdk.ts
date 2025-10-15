/**
 * AuthFlow Svelte/SvelteKit SDK
 * Official Svelte integration for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/svelte-sdk
 * 
 * SvelteKit Usage:
 * // src/hooks.server.ts
 * import { authflowHook } from '@authflow/svelte-sdk/server';
 * 
 * export const handle = authflowHook({
 *   domain: import.meta.env.VITE_AUTHFLOW_DOMAIN,
 *   clientId: import.meta.env.VITE_AUTHFLOW_CLIENT_ID,
 *   clientSecret: import.meta.env.AUTHFLOW_CLIENT_SECRET
 * });
 */

import { writable, derived, type Readable } from 'svelte/store';
import type { Handle } from '@sveltejs/kit';

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

export interface AuthFlowState {
  user: AuthFlowUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

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

// Svelte 5 Runes-based store
export function createAuthFlowStore(client: AuthFlowClient) {
  const state = $state<AuthFlowState>({
    user: null,
    token: null,
    loading: false,
    error: null
  });

  return {
    get user() { return state.user; },
    get token() { return state.token; },
    get loading() { return state.loading; },
    get error() { return state.error; },
    get isAuthenticated() { return !!state.user; },

    async login(email: string, password: string) {
      state.loading = true;
      state.error = null;
      try {
        const result = await client.login(email, password);
        state.token = result.token;
        state.user = result.user;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authflow_token', result.token);
        }
      } catch (error: any) {
        state.error = error.message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    async register(userData: any) {
      state.loading = true;
      state.error = null;
      try {
        const result = await client.register(userData);
        state.token = result.token;
        state.user = result.user;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('authflow_token', result.token);
        }
      } catch (error: any) {
        state.error = error.message;
        throw error;
      } finally {
        state.loading = false;
      }
    },

    async logout() {
      if (state.token) {
        await client.logout(state.token);
      }
      state.user = null;
      state.token = null;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authflow_token');
      }
    },

    async checkAuth() {
      if (typeof localStorage === 'undefined') return;
      const token = localStorage.getItem('authflow_token');
      if (token) {
        try {
          const { user } = await client.verifyToken(token);
          state.user = user;
          state.token = token;
        } catch (error) {
          localStorage.removeItem('authflow_token');
        }
      }
    }
  };
}

// SvelteKit Server Hook
export function authflowHook(config: AuthFlowConfig): Handle {
  const client = new AuthFlowClient(config);

  return async ({ event, resolve }) => {
    const authHeader = event.request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { user } = await client.verifyToken(token);
        event.locals.authflowUser = user;
      } catch (error) {
        // Token invalid, continue without user
      }
    }

    return resolve(event);
  };
}

// Example Svelte 5 component usage:
/*
<script lang="ts">
  import { createAuthFlowStore, AuthFlowClient } from '@authflow/svelte-sdk';

  const client = new AuthFlowClient({
    domain: import.meta.env.VITE_AUTHFLOW_DOMAIN,
    clientId: import.meta.env.VITE_AUTHFLOW_CLIENT_ID,
    clientSecret: import.meta.env.VITE_AUTHFLOW_CLIENT_SECRET
  });

  const auth = createAuthFlowStore(client);

  let email = $state('');
  let password = $state('');

  async function handleLogin() {
    await auth.login(email, password);
  }
</script>

{#if auth.isAuthenticated}
  <p>Welcome, {auth.user?.email}!</p>
  <button onclick={() => auth.logout()}>Logout</button>
{:else}
  <form onsubmit={handleLogin}>
    <input bind:value={email} type="email" />
    <input bind:value={password} type="password" />
    <button type="submit" disabled={auth.loading}>Login</button>
  </form>
{/if}
*/
