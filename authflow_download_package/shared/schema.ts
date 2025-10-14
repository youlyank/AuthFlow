import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["super_admin", "tenant_admin", "user"]);
export const planTypeEnum = pgEnum("plan_type", [
  "starter",
  "pro",
  "enterprise",
  "custom",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "system",
  "security",
  "announcement",
  "marketing",
  "billing",
]);
export const mfaMethodEnum = pgEnum("mfa_method", ["email", "totp", "sms"]);

// Webhook event types
export const webhookEventEnum = pgEnum("webhook_event", [
  "user.created",
  "user.updated",
  "user.deleted",
  "user.login",
  "user.logout",
  "user.password_reset",
  "user.email_verified",
  "session.created",
  "session.expired",
  "mfa.enabled",
  "mfa.disabled",
  "subscription.updated",
]);

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "processing",
  "success",
  "failed",
]);

// Tenants table
export const tenants = pgTable("tenants", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  isActive: boolean("is_active").notNull().default(true),
  // Authentication settings
  allowPasswordAuth: boolean("allow_password_auth").notNull().default(true),
  allowSocialAuth: boolean("allow_social_auth").notNull().default(true),
  allowMagicLink: boolean("allow_magic_link").notNull().default(true),
  requireEmailVerification: boolean("require_email_verification")
    .notNull()
    .default(true),
  requireMfa: boolean("require_mfa").notNull().default(false),
  sessionTimeout: integer("session_timeout").notNull().default(86400), // seconds, default 24h
  // Domain settings
  customDomain: text("custom_domain"),
  allowedDomains: jsonb("allowed_domains").default(sql`'[]'::jsonb`), // email domains for signup
  // Feature toggles
  features: jsonb("features")
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: planTypeEnum("type").notNull(),
  maxUsers: integer("max_users").notNull(),
  price: integer("price").notNull(), // in cents
  features: jsonb("features")
    .notNull()
    .default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tenant Plans (associates tenants with plans)
export const tenantPlans = pgTable(
  "tenant_plans",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    planId: varchar("plan_id")
      .notNull()
      .references(() => plans.id),
    customPrice: integer("custom_price"), // Super admin can override price
    customMaxUsers: integer("custom_max_users"), // Super admin can override user limit
    stripeSubscriptionId: text("stripe_subscription_id"),
    isActive: boolean("is_active").notNull().default(true),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("tenant_plans_tenant_id_idx").on(table.tenantId),
  }),
);

// Users table (multi-tenant with tenant_id isolation)
export const users = pgTable(
  "users",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }), // null for super admins
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    avatarUrl: text("avatar_url"),
    role: roleEnum("role").notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    emailVerified: boolean("email_verified").notNull().default(false),
    mfaEnabled: boolean("mfa_enabled").notNull().default(false),
    mfaMethod: mfaMethodEnum("mfa_method"),
    lastLoginAt: timestamp("last_login_at"),
    lastLoginIp: text("last_login_ip"),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
    emailTenantIdx: index("users_email_tenant_idx").on(
      table.email,
      table.tenantId,
    ),
  }),
);

// OAuth Accounts (for Google, GitHub social login)
export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // 'google', 'github'
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("oauth_accounts_user_id_idx").on(table.userId),
    providerIdx: index("oauth_accounts_provider_idx").on(
      table.provider,
      table.providerAccountId,
    ),
  }),
);

// MFA Secrets (for TOTP authenticator apps)
export const mfaSecrets = pgTable("mfa_secrets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  secret: text("secret").notNull(),
  backupCodes: jsonb("backup_codes")
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// MFA OTP Tokens (for email/SMS OTP codes)
export const mfaOtpTokens = pgTable(
  "mfa_otp_tokens",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("mfa_otp_tokens_user_id_idx").on(table.userId),
  }),
);

// WebAuthn Credentials (for passwordless/FIDO2)
export const webauthnCredentials = pgTable(
  "webauthn_credentials",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull().unique(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull().default(0),
    deviceName: text("device_name"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("webauthn_credentials_user_id_idx").on(table.userId),
  }),
);

// Sessions (for session management with device tracking)
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    refreshToken: text("refresh_token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    deviceType: text("device_type"),
    deviceName: text("device_name"),
    location: text("location"),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    tokenIdx: index("sessions_token_idx").on(table.token),
  }),
);

// Trusted Devices (for device fingerprinting)
export const trustedDevices = pgTable(
  "trusted_devices",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fingerprint: text("fingerprint").notNull(),
    deviceName: text("device_name"),
    isTrusted: boolean("is_trusted").notNull().default(false),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("trusted_devices_user_id_idx").on(table.userId),
    fingerprintIdx: index("trusted_devices_fingerprint_idx").on(
      table.fingerprint,
    ),
  }),
);

// Login History
export const loginHistory = pgTable(
  "login_history",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    email: text("email").notNull(),
    success: boolean("success").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: text("location"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("login_history_user_id_idx").on(table.userId),
    createdAtIdx: index("login_history_created_at_idx").on(table.createdAt),
  }),
);

// Audit Logs (comprehensive logging)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    changes: jsonb("changes").default(sql`'{}'::jsonb`),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("audit_logs_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  }),
);

// Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }), // null for broadcast
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    iconUrl: text("icon_url"),
    priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high'
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdBy: varchar("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("notifications_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);

// Notification Reads (to track who has read notifications)
export const notificationReads = pgTable(
  "notification_reads",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    notificationId: varchar("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").notNull().defaultNow(),
  },
  (table) => ({
    notificationUserIdx: index("notification_reads_notification_user_idx").on(
      table.notificationId,
      table.userId,
    ),
  }),
);

// Rate Limiting (track login attempts for brute force protection)
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    identifier: text("identifier").notNull(), // IP or email
    action: text("action").notNull(), // 'login', 'register', etc.
    attempts: integer("attempts").notNull().default(1),
    windowStart: timestamp("window_start").notNull().defaultNow(),
    blockedUntil: timestamp("blocked_until"),
  },
  (table) => ({
    identifierActionIdx: index("rate_limits_identifier_action_idx").on(
      table.identifier,
      table.action,
    ),
  }),
);

// API Keys (for enterprise self-hosting)
export const apiKeys = pgTable(
  "api_keys",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    keyHash: text("key_hash").notNull().unique(), // Hash of actual API key, never store plaintext!
    keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification (e.g., "ak_live_")
    permissions: jsonb("permissions")
      .notNull()
      .default(sql`'[]'::jsonb`),
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdBy: varchar("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("api_keys_tenant_id_idx").on(table.tenantId),
    keyHashIdx: index("api_keys_key_hash_idx").on(table.keyHash),
  }),
);

// OAuth2 Clients (apps that use Authflow as identity provider)
export const oauth2Clients = pgTable(
  "oauth2_clients",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id").references(() => tenants.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecretHash: text("client_secret_hash").notNull(), // Hashed secret, never store plaintext!
    redirectUris: text("redirect_uris").array().notNull().default(sql`ARRAY[]::text[]`),
    grantTypes: text("grant_types").array().notNull().default(sql`ARRAY['authorization_code']::text[]`),
    responseTypes: text("response_types").array().notNull().default(sql`ARRAY['code']::text[]`),
    scopes: text("scopes").array().notNull().default(sql`ARRAY['openid', 'profile', 'email']::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    logoUri: text("logo_uri"),
    policyUri: text("policy_uri"),
    tosUri: text("tos_uri"),
    createdBy: varchar("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("oauth2_clients_tenant_id_idx").on(table.tenantId),
    clientIdIdx: index("oauth2_clients_client_id_idx").on(table.clientId),
  }),
);

// OAuth2 Authorization Codes
export const oauth2AuthorizationCodes = pgTable(
  "oauth2_authorization_codes",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    codeHash: text("code_hash").notNull().unique(), // Hash of the actual code
    clientId: text("client_id").notNull(), // Public client ID, not UUID
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    redirectUri: text("redirect_uri").notNull(),
    scopes: text("scopes").array().notNull().default(sql`ARRAY[]::text[]`),
    codeChallenge: text("code_challenge"),
    codeChallengeMethod: text("code_challenge_method"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    codeHashIdx: index("oauth2_authorization_codes_code_hash_idx").on(table.codeHash),
    clientIdIdx: index("oauth2_authorization_codes_client_id_idx").on(table.clientId),
  }),
);

// OAuth2 Access Tokens
export const oauth2AccessTokens = pgTable(
  "oauth2_access_tokens",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tokenHash: text("token_hash").notNull().unique(), // Hash of the actual token
    clientId: text("client_id").notNull(), // Public client ID, not UUID
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    scopes: text("scopes").array().notNull().default(sql`ARRAY[]::text[]`),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index("oauth2_access_tokens_token_hash_idx").on(table.tokenHash),
    clientIdIdx: index("oauth2_access_tokens_client_id_idx").on(table.clientId),
  }),
);

// OAuth2 Refresh Tokens
export const oauth2RefreshTokens = pgTable(
  "oauth2_refresh_tokens",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tokenHash: text("token_hash").notNull().unique(), // Hash of the actual token
    accessTokenId: varchar("access_token_id").references(() => oauth2AccessTokens.id, {
      onDelete: "cascade",
    }),
    clientId: text("client_id").notNull(), // Public client ID, not UUID
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    scopes: text("scopes").array().notNull().default(sql`ARRAY[]::text[]`),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: index("oauth2_refresh_tokens_token_hash_idx").on(table.tokenHash),
    clientIdIdx: index("oauth2_refresh_tokens_client_id_idx").on(table.clientId),
  }),
);

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
});
export const insertTenantPlanSchema = createInsertSchema(tenantPlans).omit({
  id: true,
  createdAt: true,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOAuthAccountSchema = createInsertSchema(oauthAccounts).omit({
  id: true,
  createdAt: true,
});
export const insertMfaSecretSchema = createInsertSchema(mfaSecrets).omit({
  id: true,
  createdAt: true,
});
export const insertWebAuthnCredentialSchema = createInsertSchema(
  webauthnCredentials,
).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  lastActivityAt: true,
});
export const insertTrustedDeviceSchema = createInsertSchema(
  trustedDevices,
).omit({ id: true, createdAt: true, lastSeenAt: true });
export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  createdAt: true,
});
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export const insertEmailVerificationTokenSchema = createInsertSchema(
  emailVerificationTokens,
).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(
  passwordResetTokens,
).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationReadSchema = createInsertSchema(
  notificationReads,
).omit({ id: true, readAt: true });
export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({
  id: true,
  windowStart: true,
});
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});
export const insertOAuth2ClientSchema = createInsertSchema(oauth2Clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertOAuth2AuthorizationCodeSchema = createInsertSchema(oauth2AuthorizationCodes).omit({
  id: true,
  createdAt: true,
});
export const insertOAuth2AccessTokenSchema = createInsertSchema(oauth2AccessTokens).omit({
  id: true,
  createdAt: true,
});
export const insertOAuth2RefreshTokenSchema = createInsertSchema(oauth2RefreshTokens).omit({
  id: true,
  createdAt: true,
});

// Insert Types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type InsertTenantPlan = z.infer<typeof insertTenantPlanSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOAuthAccount = z.infer<typeof insertOAuthAccountSchema>;
export type InsertMfaSecret = z.infer<typeof insertMfaSecretSchema>;
export type InsertWebAuthnCredential = z.infer<
  typeof insertWebAuthnCredentialSchema
>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertEmailVerificationToken = z.infer<
  typeof insertEmailVerificationTokenSchema
>;
export type InsertPasswordResetToken = z.infer<
  typeof insertPasswordResetTokenSchema
>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationRead = z.infer<
  typeof insertNotificationReadSchema
>;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertOAuth2Client = z.infer<typeof insertOAuth2ClientSchema>;
export type InsertOAuth2AuthorizationCode = z.infer<typeof insertOAuth2AuthorizationCodeSchema>;
export type InsertOAuth2AccessToken = z.infer<typeof insertOAuth2AccessTokenSchema>;
export type InsertOAuth2RefreshToken = z.infer<typeof insertOAuth2RefreshTokenSchema>;

// Select Types
export type Tenant = typeof tenants.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type TenantPlan = typeof tenantPlans.$inferSelect;
export type User = typeof users.$inferSelect;
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type MfaSecret = typeof mfaSecrets.$inferSelect;
export type WebAuthnCredential = typeof webauthnCredentials.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type EmailVerificationToken =
  typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationRead = typeof notificationReads.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type OAuth2Client = typeof oauth2Clients.$inferSelect;
export type OAuth2AuthorizationCode = typeof oauth2AuthorizationCodes.$inferSelect;
export type OAuth2AccessToken = typeof oauth2AccessTokens.$inferSelect;
export type OAuth2RefreshToken = typeof oauth2RefreshTokens.$inferSelect;

// Webhooks table
export const webhooks = pgTable(
  "webhooks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    events: text("events").array().notNull().default(sql`'{}'::text[]`), // array of event types
    secret: text("secret").notNull(), // for signature verification (HMAC SHA256)
    isActive: boolean("is_active").notNull().default(true),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("webhooks_tenant_id_idx").on(table.tenantId),
  }),
);

// Webhook deliveries table (for tracking delivery attempts)
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    webhookId: varchar("webhook_id")
      .notNull()
      .references(() => webhooks.id, { onDelete: "cascade" }),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    payload: jsonb("payload").notNull(),
    responseStatus: integer("response_status"),
    responseBody: text("response_body"),
    status: webhookDeliveryStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    nextRetryAt: timestamp("next_retry_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    webhookIdIdx: index("webhook_deliveries_webhook_id_idx").on(table.webhookId),
    tenantIdIdx: index("webhook_deliveries_tenant_id_idx").on(table.tenantId),
    statusIdx: index("webhook_deliveries_status_idx").on(table.status),
  }),
);

// Insert Schemas
export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookDeliverySchema = createInsertSchema(webhookDeliveries).omit({
  id: true,
  createdAt: true,
});

// Insert Types
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type InsertWebhookDelivery = z.infer<typeof insertWebhookDeliverySchema>;

// Select Types
export type Webhook = typeof webhooks.$inferSelect;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;

// Extended schemas for forms
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  tenantSlug: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  tenantSlug: z.string().optional(),
});

export const mfaVerifySchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const createNotificationSchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(["system", "security", "announcement", "marketing", "billing"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  link: z.string().optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const updateTenantSettingsSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .optional(),
  allowPasswordAuth: z.boolean().optional(),
  allowSocialAuth: z.boolean().optional(),
  allowMagicLink: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  requireMfa: z.boolean().optional(),
  sessionTimeout: z.number().int().min(300).max(2592000).optional(),
  customDomain: z.string().optional().or(z.literal("")),
  allowedDomains: z.array(z.string()).optional(),
  features: z.record(z.boolean()).optional(),
});

// Magic Link Tokens (for passwordless authentication)
export const magicLinkTokens = pgTable("magic_link_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// IP Restrictions (geographic and whitelist/blacklist)
export const ipRestrictionTypeEnum = pgEnum("ip_restriction_type", [
  "allow",
  "block",
]);

export const ipRestrictions = pgTable(
  "ip_restrictions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: ipRestrictionTypeEnum("type").notNull(),
    ipAddress: text("ip_address"), // single IP or CIDR notation
    countryCode: text("country_code"), // ISO 3166-1 alpha-2 code
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("ip_restrictions_tenant_id_idx").on(table.tenantId),
  }),
);

// Security Events (for risk-based authentication)
export const securityEventTypeEnum = pgEnum("security_event_type", [
  "suspicious_login",
  "unusual_location",
  "multiple_failed_attempts",
  "password_breach_detected",
  "unusual_device",
  "unusual_time",
  "velocity_check_failed",
]);

export const securityEvents = pgTable(
  "security_events",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .references(() => users.id, { onDelete: "cascade" }),
    type: securityEventTypeEnum("type").notNull(),
    riskScore: integer("risk_score").notNull().default(0), // 0-100
    details: jsonb("details").notNull().default(sql`'{}'::jsonb`),
    ipAddress: text("ip_address"),
    location: text("location"),
    resolved: boolean("resolved").notNull().default(false),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: varchar("resolved_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("security_events_user_id_idx").on(table.userId),
    createdAtIdx: index("security_events_created_at_idx").on(table.createdAt),
  }),
);

// GDPR Data Export Requests
export const gdprRequestTypeEnum = pgEnum("gdpr_request_type", [
  "export",
  "deletion",
]);

export const gdprRequestStatusEnum = pgEnum("gdpr_request_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const gdprRequests = pgTable(
  "gdpr_requests",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: varchar("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: gdprRequestTypeEnum("type").notNull(),
    status: gdprRequestStatusEnum("status").notNull().default("pending"),
    dataUrl: text("data_url"), // S3 URL for export data
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"), // For export links
  },
  (table) => ({
    userIdIdx: index("gdpr_requests_user_id_idx").on(table.userId),
  }),
);

// SAML Configurations (for enterprise SSO)
export const samlConfigurations = pgTable(
  "saml_configurations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entityId: text("entity_id").notNull(),
    ssoUrl: text("sso_url").notNull(), // Identity Provider Single Sign-On URL
    certificate: text("certificate").notNull(), // X.509 certificate
    signRequests: boolean("sign_requests").notNull().default(false),
    encryptAssertions: boolean("encrypt_assertions").notNull().default(false),
    nameIdFormat: text("name_id_format")
      .notNull()
      .default("urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("saml_configurations_tenant_id_idx").on(table.tenantId),
  }),
);

// Branding Customization (white-label)
export const brandingCustomizations = pgTable(
  "branding_customizations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    primaryColor: text("primary_color").default("#2563eb"),
    secondaryColor: text("secondary_color").default("#64748b"),
    accentColor: text("accent_color").default("#0ea5e9"),
    fontFamily: text("font_family").default("Inter"),
    customCss: text("custom_css"),
    loginPageTitle: text("login_page_title"),
    loginPageSubtitle: text("login_page_subtitle"),
    emailFooter: text("email_footer"),
    privacyPolicyUrl: text("privacy_policy_url"),
    termsOfServiceUrl: text("terms_of_service_url"),
    supportEmail: text("support_email"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("branding_customizations_tenant_id_idx").on(
      table.tenantId,
    ),
  }),
);

// Insert schemas for new tables
export const insertMagicLinkTokenSchema = createInsertSchema(magicLinkTokens).omit({
  id: true,
  createdAt: true,
});

export const insertIpRestrictionSchema = createInsertSchema(ipRestrictions).omit({
  id: true,
  createdAt: true,
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({
  id: true,
  createdAt: true,
});

export const insertGdprRequestSchema = createInsertSchema(gdprRequests).omit({
  id: true,
  requestedAt: true,
});

export const insertSamlConfigSchema = createInsertSchema(samlConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandingCustomizationSchema = createInsertSchema(brandingCustomizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select types for new tables
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type IpRestriction = typeof ipRestrictions.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type GdprRequest = typeof gdprRequests.$inferSelect;
export type SamlConfiguration = typeof samlConfigurations.$inferSelect;
export type BrandingCustomization = typeof brandingCustomizations.$inferSelect;

// Insert types for new tables
export type InsertMagicLinkToken = z.infer<typeof insertMagicLinkTokenSchema>;
export type InsertIpRestriction = z.infer<typeof insertIpRestrictionSchema>;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type InsertGdprRequest = z.infer<typeof insertGdprRequestSchema>;
export type InsertSamlConfig = z.infer<typeof insertSamlConfigSchema>;
export type InsertBrandingCustomization = z.infer<typeof insertBrandingCustomizationSchema>;

// Form schemas
export const magicLinkRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  tenantSlug: z.string().optional(),
});

export type MagicLinkRequestInput = z.infer<typeof magicLinkRequestSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
