import {
  AuthflowConfig,
  User,
  Session,
  LoginCredentials,
  RegisterData,
  MFASetupResponse,
  MFAVerifyRequest,
  MagicLinkRequest,
  WebAuthnCredential,
  PasswordResetRequest,
  PasswordResetComplete,
  OAuth2AuthorizeParams,
  OAuth2TokenRequest,
  OAuth2TokenResponse,
  APIKeyCreateRequest,
  APIKey,
  AuthflowError,
} from './types';

export class AuthflowClient {
  private config: AuthflowConfig;
  private session: Session | null = null;

  constructor(config: AuthflowConfig) {
    this.config = config;
    this.loadSession();
  }

  private get baseUrl(): string {
    return `${this.config.domain}/api`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.session?.accessToken) {
      headers['Authorization'] = `Bearer ${this.session.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error: AuthflowError = await response.json().catch(() => ({
        error: 'Request failed',
        statusCode: response.status,
      }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }

    // Handle empty responses (204 No Content, or empty body)
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    // If no content or not JSON, return empty object
    if (
      response.status === 204 ||
      contentLength === '0' ||
      !contentType?.includes('application/json')
    ) {
      return {} as T;
    }

    // Check if there's actually content to parse
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // ==================
  // SESSION MANAGEMENT
  // ==================

  private saveSession(session: Session): void {
    this.session = session;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authflow_session', JSON.stringify(session));
    }
  }

  private loadSession(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('authflow_session');
      if (saved) {
        try {
          this.session = JSON.parse(saved);
        } catch {
          this.clearSession();
        }
      }
    }
  }

  private clearSession(): void {
    this.session = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authflow_session');
    }
  }

  public getSession(): Session | null {
    return this.session;
  }

  public getUser(): User | null {
    return this.session?.user || null;
  }

  public isAuthenticated(): boolean {
    return !!this.session?.user;
  }

  // ==================
  // AUTHENTICATION
  // ==================

  async register(data: RegisterData): Promise<User> {
    const user = await this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        tenantSlug: data.tenantSlug || this.config.tenantSlug,
      }),
    });
    return user;
  }

  async login(credentials: LoginCredentials): Promise<Session> {
    const response = await this.request<{ user: User; token: string; refreshToken?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        ...credentials,
        tenantSlug: credentials.tenantSlug || this.config.tenantSlug,
      }),
    });

    const session: Session = {
      user: response.user,
      accessToken: response.token,
      refreshToken: response.refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    this.saveSession(session);
    return session;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<User> {
    const user = await this.request<User>('/auth/me');
    if (this.session) {
      this.session.user = user;
      this.saveSession(this.session);
    }
    return user;
  }

  async refreshToken(): Promise<Session> {
    if (!this.session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<{ token: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.session.refreshToken }),
    });

    const session: Session = {
      ...this.session,
      accessToken: response.token,
      refreshToken: response.refreshToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.saveSession(session);
    return session;
  }

  // ==================
  // MFA
  // ==================

  async setupMFA(method: 'totp' | 'email' = 'totp'): Promise<MFASetupResponse> {
    return this.request<MFASetupResponse>(`/auth/mfa/setup/${method}`, {
      method: 'POST',
    });
  }

  async verifyMFA(data: MFAVerifyRequest): Promise<Session> {
    const response = await this.request<{ user: User; token: string }>(`/auth/mfa/verify/${data.method}`, {
      method: 'POST',
      body: JSON.stringify({
        code: data.code,
        trustDevice: data.trustDevice,
      }),
    });

    const session: Session = {
      user: response.user,
      accessToken: response.token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.saveSession(session);
    return session;
  }

  async disableMFA(): Promise<void> {
    await this.request('/auth/mfa/disable', { method: 'POST' });
  }

  // ==================
  // MAGIC LINKS
  // ==================

  async requestMagicLink(data: MagicLinkRequest): Promise<{ message: string }> {
    return this.request('/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyMagicLink(token: string): Promise<Session> {
    const response = await this.request<{ user: User; token: string }>('/auth/magic-link/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });

    const session: Session = {
      user: response.user,
      accessToken: response.token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.saveSession(session);
    return session;
  }

  // ==================
  // WEBAUTHN
  // ==================

  async registerWebAuthn(name: string): Promise<{ credential: WebAuthnCredential }> {
    const options = await this.request<any>('/auth/webauthn/register/begin', {
      method: 'POST',
    });

    // Use @simplewebauthn/browser for client-side WebAuthn
    const { startRegistration } = await import('@simplewebauthn/browser');
    const attResp = await startRegistration(options);

    return this.request('/auth/webauthn/register/complete', {
      method: 'POST',
      body: JSON.stringify({ attResp, name }),
    });
  }

  async loginWebAuthn(): Promise<Session> {
    const options = await this.request<any>('/auth/webauthn/login/begin', {
      method: 'POST',
    });

    const { startAuthentication } = await import('@simplewebauthn/browser');
    const asseResp = await startAuthentication(options);

    const response = await this.request<{ user: User; token: string }>('/auth/webauthn/login/complete', {
      method: 'POST',
      body: JSON.stringify({ asseResp }),
    });

    const session: Session = {
      user: response.user,
      accessToken: response.token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    this.saveSession(session);
    return session;
  }

  async getWebAuthnCredentials(): Promise<WebAuthnCredential[]> {
    return this.request('/auth/webauthn/credentials');
  }

  async deleteWebAuthnCredential(id: string): Promise<void> {
    await this.request(`/auth/webauthn/credentials/${id}`, { method: 'DELETE' });
  }

  // ==================
  // PASSWORD RESET
  // ==================

  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: PasswordResetComplete): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================
  // OAUTH2 / OIDC
  // ==================

  getOAuth2AuthorizeUrl(params: OAuth2AuthorizeParams): string {
    const url = new URL(`${this.config.domain}/oauth2/authorize`);
    url.searchParams.set('client_id', params.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('response_type', params.responseType || 'code');
    
    if (params.scope) url.searchParams.set('scope', params.scope);
    if (params.state) url.searchParams.set('state', params.state);
    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', params.codeChallengeMethod || 'S256');
    }

    return url.toString();
  }

  async exchangeCodeForToken(data: OAuth2TokenRequest): Promise<OAuth2TokenResponse> {
    return this.request('/oauth2/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: data.code,
        client_id: data.clientId,
        client_secret: data.clientSecret,
        redirect_uri: data.redirectUri,
        code_verifier: data.codeVerifier,
      }),
    });
  }

  async getOAuth2UserInfo(): Promise<User> {
    return this.request('/oauth2/userinfo');
  }

  // ==================
  // API KEYS
  // ==================

  async createAPIKey(data: APIKeyCreateRequest): Promise<APIKey> {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listAPIKeys(): Promise<APIKey[]> {
    return this.request('/api-keys');
  }

  async deleteAPIKey(id: string): Promise<void> {
    await this.request(`/api-keys/${id}`, { method: 'DELETE' });
  }

  // ==================
  // UNIVERSAL LOGIN
  // ==================

  getUniversalLoginUrl(tenantSlug: string, returnTo?: string): string {
    const url = new URL(`${this.config.domain}/login/${tenantSlug}`);
    if (returnTo) {
      url.searchParams.set('returnTo', returnTo);
    }
    return url.toString();
  }

  getUniversalRegisterUrl(tenantSlug: string, returnTo?: string): string {
    const url = new URL(`${this.config.domain}/register/${tenantSlug}`);
    if (returnTo) {
      url.searchParams.set('returnTo', returnTo);
    }
    return url.toString();
  }

  // ==================
  // UTILITIES
  // ==================

  async checkPasswordBreach(password: string): Promise<{ breached: boolean; safe: boolean }> {
    return this.request('/auth/check-password-breach', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
}
