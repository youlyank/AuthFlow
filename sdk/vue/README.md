# AuthFlow Vue SDK

Official Vue SDK for AuthFlow authentication platform. Optimized for Vue 3+ with Composition API, composables, and plugins.

## Installation

```bash
npm install @authflow/vue
# or
yarn add @authflow/vue
# or
pnpm add @authflow/vue
```

## Quick Start

### 1. Install Plugin

```typescript
// main.ts
import { createApp } from 'vue';
import { createAuthflow } from '@authflow/vue';
import App from './App.vue';

const app = createApp(App);

const authflow = createAuthflow({
  domain: 'https://your-authflow-instance.com',
  tenantSlug: 'your-tenant',
});

app.use(authflow);
app.mount('#app');
```

### 2. Use in Components

```vue
<template>
  <div>
    <div v-if="isAuthenticated">
      <p>Welcome {{ user?.email }}</p>
      <button @click="logout">Logout</button>
    </div>
    
    <form v-else @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit" :disabled="isLoading">Login</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@authflow/vue';

const { login, logout, isAuthenticated, user, isLoading } = useAuth();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await login({ email: email.value, password: password.value });
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>
```

## Features

### ✅ Vue-Specific Features
- Composition API composables (useAuth, useMFA, useOAuth)
- Plugin system integration
- Reactive refs and computed properties
- Router integration with navigation guards
- Pinia/Vuex store modules
- TypeScript support
- Vue 2 & Vue 3 compatible

### ✅ Authentication Methods
- Email/Password authentication
- Multi-Factor Authentication (TOTP, Email OTP, SMS OTP)
- Magic Links (passwordless)
- WebAuthn/Passkeys
- OAuth2/OIDC flows
- Social login (Google, GitHub, Microsoft)

## Composables

### useAuth

```vue
<script setup lang="ts">
import { useAuth } from '@authflow/vue';

const {
  // Reactive state
  isAuthenticated,
  isLoading,
  user,
  error,
  
  // Methods
  login,
  logout,
  register,
  updateProfile,
  
  // Computed
  hasRole,
} = useAuth();

// Check if user has a specific role
const isAdmin = hasRole('admin');
</script>
```

### useMFA

```vue
<template>
  <div>
    <div v-if="isEnabled">
      <p>MFA is enabled</p>
      <button @click="disableMFA">Disable MFA</button>
    </div>
    
    <div v-else>
      <button @click="enableTOTP">Enable TOTP</button>
    </div>
    
    <img v-if="qrCode" :src="qrCode" alt="QR Code" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMFA } from '@authflow/vue';

const { enableMFATOTP, disableMFA, isEnabled, mfaMethods } = useMFA();

const qrCode = ref('');

const enableTOTP = async () => {
  const result = await enableMFATOTP();
  qrCode.value = result.qrCode;
};
</script>
```

### useOAuth

```vue
<template>
  <div>
    <button @click="loginWithGoogle" :disabled="isLoading">
      Sign in with Google
    </button>
    <button @click="loginWithGitHub" :disabled="isLoading">
      Sign in with GitHub
    </button>
  </div>
</template>

<script setup lang="ts">
import { useOAuth } from '@authflow/vue';

const {
  loginWithGoogle,
  loginWithGitHub,
  loginWithMicrosoft,
  isLoading,
} = useOAuth();
</script>
```

### useWebAuthn

```vue
<template>
  <div>
    <button v-if="hasPasskey" @click="loginWithPasskey">
      Login with Passkey
    </button>
    <button v-else @click="registerPasskey">
      Register Passkey
    </button>
  </div>
</template>

<script setup lang="ts">
import { useWebAuthn } from '@authflow/vue';

const {
  registerPasskey,
  authenticateWithPasskey,
  hasPasskey,
} = useWebAuthn();

const loginWithPasskey = async () => {
  const session = await authenticateWithPasskey();
  console.log('Logged in with passkey:', session.user);
};
</script>
```

## Vue Router Integration

### Navigation Guards

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthGuard } from '@authflow/vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView },
    {
      path: '/dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: AdminView,
      meta: { requiresAuth: true, roles: ['admin'] },
    },
  ],
});

// Apply auth guard
useAuthGuard(router);

export default router;
```

### Custom Guard

```typescript
import { useAuth } from '@authflow/vue';

router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, user } = useAuth();
  
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next('/login');
  } else if (to.meta.roles) {
    const hasRequiredRole = to.meta.roles.some(
      (role: string) => user.value?.roles.includes(role)
    );
    
    if (hasRequiredRole) {
      next();
    } else {
      next('/unauthorized');
    }
  } else {
    next();
  }
});
```

## Pinia Store Integration

```typescript
// stores/auth.ts
import { defineStore } from 'pinia';
import { useAuth } from '@authflow/vue';

export const useAuthStore = defineStore('auth', () => {
  const authflow = useAuth();
  
  return {
    // State
    isAuthenticated: authflow.isAuthenticated,
    user: authflow.user,
    isLoading: authflow.isLoading,
    
    // Actions
    login: authflow.login,
    logout: authflow.logout,
    register: authflow.register,
  };
});

// Usage in components
<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
```

## Vuex Store Module

```typescript
// store/modules/auth.ts
import { Module } from 'vuex';
import { authflowInstance } from '@authflow/vue';

const authModule: Module<any, any> = {
  namespaced: true,
  
  state: {
    user: null,
    isAuthenticated: false,
  },
  
  mutations: {
    SET_USER(state, user) {
      state.user = user;
      state.isAuthenticated = !!user;
    },
  },
  
  actions: {
    async login({ commit }, credentials) {
      const session = await authflowInstance.login(credentials);
      commit('SET_USER', session.user);
    },
    
    async logout({ commit }) {
      await authflowInstance.logout();
      commit('SET_USER', null);
    },
  },
};

export default authModule;
```

## Components

### Protected Component

```vue
<template>
  <AuthGuard>
    <SecretContent />
  </AuthGuard>
</template>

<script setup lang="ts">
import { AuthGuard } from '@authflow/vue';
import SecretContent from './SecretContent.vue';
</script>
```

### Role-Based Component

```vue
<template>
  <RoleGuard :roles="['admin', 'moderator']">
    <AdminPanel />
  </RoleGuard>
</template>

<script setup lang="ts">
import { RoleGuard } from '@authflow/vue';
import AdminPanel from './AdminPanel.vue';
</script>
```

### Login/Logout Buttons

```vue
<template>
  <LoginButton @success="handleLoginSuccess" @error="handleError">
    Login
  </LoginButton>
  
  <LogoutButton @success="handleLogoutSuccess">
    Logout
  </LogoutButton>
</template>

<script setup lang="ts">
import { LoginButton, LogoutButton } from '@authflow/vue';

const handleLoginSuccess = (session) => {
  console.log('Logged in:', session.user);
};

const handleLogoutSuccess = () => {
  console.log('Logged out');
};

const handleError = (error) => {
  console.error('Error:', error);
};
</script>
```

## Directives

### v-auth

```vue
<template>
  <!-- Show only if authenticated -->
  <div v-auth>
    <p>Welcome {{ user?.email }}</p>
  </div>
  
  <!-- Show only if not authenticated -->
  <div v-auth:guest>
    <a href="/login">Login</a>
  </div>
  
  <!-- Show only if user has specific role -->
  <button v-auth:role="'admin'">Delete</button>
  
  <!-- Show only if user has any of the roles -->
  <div v-auth:roles="['admin', 'moderator']">
    Admin/Moderator content
  </div>
</template>
```

## Multi-Factor Authentication

### TOTP Setup

```vue
<template>
  <div>
    <div v-if="!qrCode">
      <button @click="enableTOTP">Enable TOTP</button>
    </div>
    
    <div v-else>
      <img :src="qrCode" alt="QR Code" />
      <input v-model="code" placeholder="Enter 6-digit code" />
      <button @click="verify">Verify</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMFA } from '@authflow/vue';

const { enableMFATOTP, verifyMFATOTP } = useMFA();

const qrCode = ref('');
const code = ref('');

const enableTOTP = async () => {
  const result = await enableMFATOTP();
  qrCode.value = result.qrCode;
};

const verify = async () => {
  await verifyMFATOTP(code.value);
  alert('TOTP enabled successfully!');
};
</script>
```

## Form Validation

### VeeValidate Integration

```vue
<template>
  <Form @submit="onSubmit" :validation-schema="schema">
    <Field name="email" type="email" placeholder="Email" />
    <ErrorMessage name="email" />
    
    <Field name="password" type="password" placeholder="Password" />
    <ErrorMessage name="password" />
    
    <button type="submit">Login</button>
  </Form>
</template>

<script setup lang="ts">
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { useAuth } from '@authflow/vue';

const { login } = useAuth();

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

const onSubmit = async (values: any) => {
  await login(values);
};
</script>
```

## OAuth Callback Handler

```vue
<template>
  <div>Processing login...</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@authflow/vue';

const route = useRoute();
const router = useRouter();
const { handleOAuthCallback } = useAuth();

onMounted(async () => {
  const code = route.query.code as string;
  const state = route.query.state as string;
  
  if (code && state) {
    try {
      await handleOAuthCallback({ code, state });
      router.push('/dashboard');
    } catch (error) {
      console.error('OAuth callback failed:', error);
      router.push('/login');
    }
  }
});
</script>
```

## TypeScript Support

```typescript
import { User, AuthSession } from '@authflow/vue';

// Extend User type
interface CustomUser extends User {
  customField: string;
}

// Use with composable
const { user } = useAuth<CustomUser>();

// user is typed as Ref<CustomUser | null>
console.log(user.value?.customField);
```

## Options API (Vue 2)

```vue
<template>
  <div>
    <div v-if="$auth.isAuthenticated">
      <p>Welcome {{ $auth.user.email }}</p>
      <button @click="logout">Logout</button>
    </div>
    
    <form v-else @submit.prevent="login">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
      password: '',
    };
  },
  
  methods: {
    async login() {
      try {
        await this.$auth.login({
          email: this.email,
          password: this.password,
        });
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    
    async logout() {
      await this.$auth.logout();
    },
  },
};
</script>
```

## Configuration

```typescript
// main.ts
import { createAuthflow } from '@authflow/vue';

const authflow = createAuthflow({
  domain: 'https://auth.example.com',
  tenantSlug: 'my-app',
  
  // Optional settings
  cacheLocation: 'localStorage', // or 'sessionStorage', 'memory'
  
  // Redirect URIs
  redirectUri: window.location.origin,
  
  // Token refresh
  autoRefresh: true,
  refreshThreshold: 300, // Refresh 5 minutes before expiry
  
  // Router integration
  router: router, // Automatically set up navigation guards
  
  // Error handling
  onError: (error) => console.error('Auth error:', error),
  
  // Success callbacks
  onLogin: (session) => console.log('Logged in:', session),
  onLogout: () => console.log('Logged out'),
});

app.use(authflow);
```

## Migration from Auth0

```typescript
// Before (Auth0)
import { createAuth0 } from '@auth0/auth0-vue';

const auth0 = createAuth0({
  domain: 'your-domain.auth0.com',
  clientId: 'client-id',
  redirectUri: window.location.origin,
});

app.use(auth0);

// In component
import { useAuth0 } from '@auth0/auth0-vue';

const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

// After (AuthFlow)
import { createAuthflow } from '@authflow/vue';

const authflow = createAuthflow({
  domain: 'https://your-authflow-instance.com',
  tenantSlug: 'your-tenant',
});

app.use(authflow);

// In component
import { useAuth } from '@authflow/vue';

const { login, logout, isAuthenticated, user } = useAuth();
```

## Support

- **Documentation**: https://docs.authflow.dev
- **API Reference**: https://docs.authflow.dev/api/vue
- **GitHub**: https://github.com/authflow/authflow-vue
- **Issues**: https://github.com/authflow/authflow-vue/issues
- **npm**: https://www.npmjs.com/package/@authflow/vue

## Requirements

- Vue 3.0+ (Vue 2.7+ also supported)
- TypeScript 4.5+ (optional but recommended)

## License

MIT
