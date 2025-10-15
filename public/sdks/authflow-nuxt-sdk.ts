/**
 * AuthFlow Nuxt SDK
 * Official Nuxt 3 integration for AuthFlow authentication
 * 
 * Installation:
 * npm install @authflow/nuxt-sdk
 * 
 * Setup nuxt.config.ts:
 * export default defineNuxtConfig({
 *   modules: ['@authflow/nuxt-sdk'],
 *   authflow: {
 *     domain: process.env.AUTHFLOW_DOMAIN,
 *     clientId: process.env.AUTHFLOW_CLIENT_ID,
 *     clientSecret: process.env.AUTHFLOW_CLIENT_SECRET,
 *   }
 * });
 */

import { ref, computed } from 'vue';
import { defineNuxtPlugin, defineNuxtRouteMiddleware, navigateTo, useCookie, useRuntimeConfig } from '#app';

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

// Composable
export function useAuthFlow() {
  const config = useRuntimeConfig();
  const client = new AuthFlowClient(config.public.authflow as AuthFlowConfig);
  
  const tokenCookie = useCookie('authflow_token');
  const user = ref<AuthFlowUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  const login = async (email: string, password: string) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await client.login(email, password);
      tokenCookie.value = result.token;
      user.value = result.user;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const register = async (userData: any) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await client.register(userData);
      tokenCookie.value = result.token;
      user.value = result.user;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    if (tokenCookie.value) {
      await client.logout(tokenCookie.value);
    }
    tokenCookie.value = null;
    user.value = null;
  };

  const checkAuth = async () => {
    if (tokenCookie.value) {
      try {
        const { user: userData } = await client.verifyToken(tokenCookie.value);
        user.value = userData;
      } catch {
        tokenCookie.value = null;
      }
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  };
}

// Nuxt plugin
export default defineNuxtPlugin(() => {
  return {
    provide: {
      authflow: useAuthFlow
    }
  };
});

// Middleware for protected routes
export const authflowMiddleware = defineNuxtRouteMiddleware(async () => {
  const { user, checkAuth } = useAuthFlow();
  
  await checkAuth();
  
  if (!user.value) {
    return navigateTo('/login');
  }
});

// Example page usage:
/*
// pages/protected.vue
<script setup lang="ts">
definePageMeta({
  middleware: 'authflow'
});

const { user, logout } = useAuthFlow();
</script>

<template>
  <div>
    <h1>Welcome, {{ user?.email }}</h1>
    <button @click="logout">Logout</button>
  </div>
</template>

// pages/login.vue
<script setup lang="ts">
const { login, loading, error } = useAuthFlow();
const email = ref('');
const password = ref('');

async function handleLogin() {
  await login(email.value, password.value);
  navigateTo('/');
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" required />
    <input v-model="password" type="password" required />
    <button type="submit" :disabled="loading">Login</button>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>
*/
