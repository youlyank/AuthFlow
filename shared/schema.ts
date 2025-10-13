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
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["super_admin", "tenant_admin", "user"]);
export const planTypeEnum = pgEnum("plan_type", ["starter", "pro", "enterprise", "custom"]);
export const notificationTypeEnum = pgEnum("notification_type", ["system", "security", "announcement", "marketing", "billing"]);
export const mfaMethodEnum = pgEnum("mfa_method", ["email", "totp", "sms"]);

// Tenants table
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: planTypeEnum("type").notNull(),
  maxUsers: integer("max_users").notNull(),
  price: integer("price").notNull(), // in cents
  features: jsonb("features").notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tenant Plans (associates tenants with plans)
export const tenantPlans = pgTable("tenant_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => plans.id),
  customPrice: integer("custom_price"), // Super admin can override price
  customMaxUsers: integer("custom_max_users"), // Super admin can override user limit
  stripeSubscriptionId: text("stripe_subscription_id"),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index("tenant_plans_tenant_id_idx").on(table.tenantId),
}));

// Users table (multi-tenant with tenant_id isolation)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null for super admins
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
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  tenantIdIdx: index("users_tenant_id_idx").on(table.tenantId),
  emailTenantIdx: index("users_email_tenant_idx").on(table.email, table.tenantId),
}));

// OAuth Accounts (for Google, GitHub social login)
export const oauthAccounts = pgTable("oauth_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google', 'github'
  providerAccountId: text("provider_account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("oauth_accounts_user_id_idx").on(table.userId),
  providerIdx: index("oauth_accounts_provider_idx").on(table.provider, table.providerAccountId),
}));

// MFA Secrets (for TOTP authenticator apps)
export const mfaSecrets = pgTable("mfa_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  secret: text("secret").notNull(),
  backupCodes: jsonb("backup_codes").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// WebAuthn Credentials (for passwordless/FIDO2)
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceName: text("device_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("webauthn_credentials_user_id_idx").on(table.userId),
}));

// Sessions (for session management with device tracking)
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
}, (table) => ({
  userIdIdx: index("sessions_user_id_idx").on(table.userId),
  tokenIdx: index("sessions_token_idx").on(table.token),
}));

// Trusted Devices (for device fingerprinting)
export const trustedDevices = pgTable("trusted_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  deviceName: text("device_name"),
  isTrusted: boolean("is_trusted").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("trusted_devices_user_id_idx").on(table.userId),
  fingerprintIdx: index("trusted_devices_fingerprint_idx").on(table.fingerprint),
}));

// Login History
export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  success: boolean("success").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index("login_history_user_id_idx").on(table.userId),
  createdAtIdx: index("login_history_created_at_idx").on(table.createdAt),
}));

// Audit Logs (comprehensive logging)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  changes: jsonb("changes").default(sql`'{}'::jsonb`),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index("audit_logs_tenant_id_idx").on(table.tenantId),
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Email Verification Tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // null for broadcast
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  iconUrl: text("icon_url"),
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high'
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index("notifications_tenant_id_idx").on(table.tenantId),
  userIdIdx: index("notifications_user_id_idx").on(table.userId),
  createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
}));

// Notification Reads (to track who has read notifications)
export const notificationReads = pgTable("notification_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationId: varchar("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at").notNull().defaultNow(),
}, (table) => ({
  notificationUserIdx: index("notification_reads_notification_user_idx").on(table.notificationId, table.userId),
}));

// Rate Limiting (track login attempts for brute force protection)
export const rateLimits = pgTable("rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // IP or email
  action: text("action").notNull(), // 'login', 'register', etc.
  attempts: integer("attempts").notNull().default(1),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  blockedUntil: timestamp("blocked_until"),
}, (table) => ({
  identifierActionIdx: index("rate_limits_identifier_action_idx").on(table.identifier, table.action),
}));

// API Keys (for enterprise self-hosting)
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  permissions: jsonb("permissions").notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index("api_keys_tenant_id_idx").on(table.tenantId),
  keyIdx: index("api_keys_key_idx").on(table.key),
}));

// Insert Schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlanSchema = createInsertSchema(plans).omit({ id: true, createdAt: true });
export const insertTenantPlanSchema = createInsertSchema(tenantPlans).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOAuthAccountSchema = createInsertSchema(oauthAccounts).omit({ id: true, createdAt: true });
export const insertMfaSecretSchema = createInsertSchema(mfaSecrets).omit({ id: true, createdAt: true });
export const insertWebAuthnCredentialSchema = createInsertSchema(webauthnCredentials).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true, lastActivityAt: true });
export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({ id: true, createdAt: true, lastSeenAt: true });
export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({ id: true, createdAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertNotificationReadSchema = createInsertSchema(notificationReads).omit({ id: true, readAt: true });
export const insertRateLimitSchema = createInsertSchema(rateLimits).omit({ id: true, windowStart: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });

// Insert Types
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type InsertTenantPlan = z.infer<typeof insertTenantPlanSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOAuthAccount = z.infer<typeof insertOAuthAccountSchema>;
export type InsertMfaSecret = z.infer<typeof insertMfaSecretSchema>;
export type InsertWebAuthnCredential = z.infer<typeof insertWebAuthnCredentialSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertNotificationRead = z.infer<typeof insertNotificationReadSchema>;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

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
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationRead = typeof notificationReads.$inferSelect;
export type RateLimit = typeof rateLimits.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
