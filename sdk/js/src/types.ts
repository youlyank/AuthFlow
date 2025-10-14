export interface AuthflowConfig {
  domain: string;
  tenantSlug?: string;
  clientId?: string;
  redirectUri?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  tenantId?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  tenantSlug?: string;
}

export interface MFASetupResponse {
  secret: string;
  qrCode: string;
  backupCodes?: string[];
}

export interface MFAVerifyRequest {
  code: string;
  method: 'totp' | 'email';
  trustDevice?: boolean;
}

export interface MagicLinkRequest {
  email: string;
  tenantSlug: string;
  redirectUrl?: string;
}

export interface WebAuthnCredential {
  id: string;
  name: string;
  createdAt: Date;
}

export interface PasswordResetRequest {
  email: string;
  tenantSlug?: string;
}

export interface PasswordResetComplete {
  token: string;
  newPassword: string;
}

export interface AuthflowError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface OAuth2AuthorizeParams {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state?: string;
  responseType?: 'code' | 'token';
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

export interface OAuth2TokenRequest {
  code: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  codeVerifier?: string;
}

export interface OAuth2TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface APIKeyCreateRequest {
  name: string;
  expiresAt?: string;
  permissions?: string[];
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
}
