import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import {
  users,
  tenants,
  plans,
  tenantPlans,
  sessions,
  notifications,
  notificationReads,
  loginHistory,
  auditLogs,
  oauthAccounts,
  mfaSecrets,
  mfaOtpTokens,
  webauthnCredentials,
  trustedDevices,
  emailVerificationTokens,
  passwordResetTokens,
  rateLimits,
  apiKeys,
  oauth2Clients,
  oauth2AuthorizationCodes,
  oauth2AccessTokens,
  oauth2RefreshTokens,
  type InsertUser,
  type InsertTenant,
  type InsertPlan,
  type InsertTenantPlan,
  type InsertSession,
  type InsertNotification,
  type InsertLoginHistory,
  type InsertAuditLog,
  type User,
  type Tenant,
  type Plan,
  type Session,
  type Notification,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId?: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  listUsersByTenant(tenantId: string, limit?: number): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | undefined>;
  deactivateUser(userId: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  listUsers(tenantId?: string, limit?: number): Promise<User[]>;

  // OAuth operations
  getOAuthAccount(provider: string, providerAccountId: string): Promise<any>;
  createOAuthAccount(account: any): Promise<any>;

  // Email verification operations
  createEmailVerificationToken(token: any): Promise<any>;
  getEmailVerificationToken(userId: string, token: string): Promise<any>;
  deleteEmailVerificationToken(id: string): Promise<void>;

  // Password reset operations
  createPasswordResetToken(token: any): Promise<any>;
  getPasswordResetToken(userId: string, token: string): Promise<any>;
  deletePasswordResetToken(id: string): Promise<void>;

  // MFA operations
  createMfaSecret(secret: any): Promise<any>;
  getMfaSecret(userId: string): Promise<any>;
  deleteMfaSecret(userId: string): Promise<void>;
  
  // MFA OTP operations
  createMfaOtpToken(token: any): Promise<any>;
  getMfaOtpToken(userId: string, code: string): Promise<any>;
  deleteMfaOtpToken(userId: string): Promise<void>;
  
  // Trusted device operations
  createTrustedDevice(device: any): Promise<any>;
  getTrustedDevice(userId: string, fingerprint: string): Promise<any>;
  updateTrustedDeviceLastSeen(userId: string, fingerprint: string): Promise<void>;
  listTrustedDevices(userId: string): Promise<any[]>;
  deleteTrustedDevice(id: string): Promise<void>;

  // Tenant operations
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined>;
  listTenants(limit?: number): Promise<Tenant[]>;

  // Plan operations
  getPlan(id: string): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  updatePlan(id: string, data: Partial<Plan>): Promise<Plan | undefined>;
  listPlans(includeInactive?: boolean): Promise<Plan[]>;
  assignPlanToTenant(assignment: any): Promise<any>;

  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, data: Partial<Session>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;
  getTenantSessions(tenantId: string): Promise<any[]>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;

  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(tenantId?: string, limit?: number): Promise<any[]>;

  // Login history
  createLoginHistory(history: InsertLoginHistory): Promise<void>;
  getUserLoginHistory(userId: string, limit?: number): Promise<any[]>;

  // Stats operations
  getSuperAdminStats(): Promise<any>;
  getTenantAdminStats(tenantId: string): Promise<any>;
  getUserStats(userId: string): Promise<any>;

  // API Key operations
  createAPIKey(apiKey: any): Promise<any>;
  getAPIKeyByHash(keyHash: string): Promise<any>;
  listAPIKeys(tenantId: string): Promise<any[]>;
  updateAPIKeyLastUsed(id: string): Promise<void>;
  revokeAPIKey(id: string, tenantId: string): Promise<void>;
  deleteAPIKey(id: string, tenantId: string): Promise<void>;

  // OAuth2 Provider operations
  createOAuth2Client(client: any): Promise<any>;
  getOAuth2Client(clientId: string, tenantId?: string): Promise<any>;
  getOAuth2ClientById(id: string, tenantId?: string): Promise<any>;
  listOAuth2Clients(tenantId: string): Promise<any[]>;
  updateOAuth2Client(id: string, tenantId: string, data: any): Promise<any>;
  deleteOAuth2Client(id: string, tenantId: string): Promise<void>;
  
  createOAuth2AuthorizationCode(code: any): Promise<any>;
  getOAuth2AuthorizationCodeByHash(codeHash: string): Promise<any>;
  deleteOAuth2AuthorizationCode(id: string): Promise<void>;
  cleanupExpiredAuthorizationCodes(): Promise<void>;
  
  createOAuth2AccessToken(token: any): Promise<any>;
  getOAuth2AccessTokenByHash(tokenHash: string): Promise<any>;
  deleteOAuth2AccessToken(id: string): Promise<void>;
  cleanupExpiredAccessTokens(): Promise<void>;
  
  createOAuth2RefreshToken(token: any): Promise<any>;
  getOAuth2RefreshTokenByHash(tokenHash: string): Promise<any>;
  deleteOAuth2RefreshToken(id: string): Promise<void>;
  cleanupExpiredRefreshTokens(): Promise<void>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByEmail(email: string, tenantId?: string): Promise<User | undefined> {
    const conditions = [eq(users.email, email)];
    if (tenantId) {
      conditions.push(eq(users.tenantId, tenantId));
    }
    const [user] = await db.select().from(users).where(and(...conditions)).limit(1);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async listUsers(tenantId?: string, limit = 50): Promise<User[]> {
    const query = tenantId
      ? db.select().from(users).where(eq(users.tenantId, tenantId)).limit(limit)
      : db.select().from(users).limit(limit);
    return query;
  }

  async listUsersByTenant(tenantId: string, limit = 100): Promise<User[]> {
    return db.select().from(users).where(eq(users.tenantId, tenantId)).limit(limit).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set({ role: role as any }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }

  async deactivateUser(userId: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set({ isActive: false }).where(eq(users.id, userId)).returning();
    return updatedUser;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    return tenant;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values(tenant).returning();
    return newTenant;
  }

  async updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | undefined> {
    const [updated] = await db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  }

  async listTenants(limit = 50): Promise<Tenant[]> {
    return db.select().from(tenants).limit(limit).orderBy(desc(tenants.createdAt));
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    return plan;
  }

  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan | undefined> {
    const [updatedPlan] = await db.update(plans).set(data).where(eq(plans.id, id)).returning();
    return updatedPlan;
  }

  async listPlans(includeInactive = false): Promise<Plan[]> {
    if (includeInactive) {
      return db.select().from(plans);
    }
    return db.select().from(plans).where(eq(plans.isActive, true));
  }

  async assignPlanToTenant(assignment: any): Promise<any> {
    const [newAssignment] = await db.insert(tenantPlans).values(assignment).returning();
    return newAssignment;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.token, token)).limit(1);
    return session;
  }

  async updateSession(id: string, data: Partial<Session>): Promise<void> {
    await db.update(sessions).set(data).where(eq(sessions.id, id));
  }

  async deleteSession(id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)))
      .orderBy(desc(sessions.createdAt));
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return session;
  }

  async getTenantSessions(tenantId: string): Promise<any[]> {
    const tenantSessions = await db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        token: sessions.token,
        isActive: sessions.isActive,
        expiresAt: sessions.expiresAt,
        userAgent: sessions.userAgent,
        ipAddress: sessions.ipAddress,
        deviceInfo: sessions.deviceInfo,
        lastActivityAt: sessions.lastActivityAt,
        createdAt: sessions.createdAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(users.tenantId, tenantId), eq(sessions.isActive, true)))
      .orderBy(desc(sessions.lastActivityAt));
    
    return tenantSessions;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const userNotifs = await db
      .select({
        id: notifications.id,
        tenantId: notifications.tenantId,
        userId: notifications.userId,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        link: notifications.link,
        iconUrl: notifications.iconUrl,
        priority: notifications.priority,
        metadata: notifications.metadata,
        createdBy: notifications.createdBy,
        createdAt: notifications.createdAt,
        isRead: sql<boolean>`CASE WHEN ${notificationReads.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, userId)
        )
      )
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return userNotifs as any;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .insert(notificationReads)
      .values({ notificationId, userId })
      .onConflictDoNothing();
  }

  async createAuditLog(log: InsertAuditLog): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  async getAuditLogs(tenantId?: string, limit = 100): Promise<any[]> {
    const query = tenantId
      ? db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId))
      : db.select().from(auditLogs);
    return query.orderBy(desc(auditLogs.createdAt)).limit(limit);
  }

  async createLoginHistory(history: InsertLoginHistory): Promise<void> {
    await db.insert(loginHistory).values(history);
  }

  async getUserLoginHistory(userId: string, limit = 10): Promise<any[]> {
    return db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.createdAt))
      .limit(limit);
  }

  async getSuperAdminStats(): Promise<any> {
    const [tenantCount] = await db.select({ count: count() }).from(tenants);
    const [activeTenantsCount] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.isActive, true));
    const [userCount] = await db.select({ count: count() }).from(users);
    
    // Calculate MAU (Monthly Active Users) - users who logged in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [mauCount] = await db
      .select({ count: count() })
      .from(users)
      .where(sql`${users.lastLoginAt} >= ${thirtyDaysAgo}`);
    
    // Get recent login count for trend
    const [recentLogins] = await db
      .select({ count: count() })
      .from(loginHistory)
      .where(sql`${loginHistory.createdAt} >= ${thirtyDaysAgo}`);

    return {
      totalTenants: tenantCount.count,
      activeTenants: activeTenantsCount.count,
      totalUsers: userCount.count,
      monthlyActiveUsers: mauCount.count,
      recentLogins: recentLogins.count,
      totalRevenue: 0,
      revenueGrowth: 0,
    };
  }

  async getTenantAdminStats(tenantId: string): Promise<any> {
    const [userCount] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId));

    const [activeUserCount] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true)));

    const [sessionCount] = await db
      .select({ count: count() })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(users.tenantId, tenantId), eq(sessions.isActive, true)));

    // MFA adoption rate
    const [mfaEnabledCount] = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.mfaEnabled, true)));

    // Recent logins (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [recentLoginCount] = await db
      .select({ count: count() })
      .from(loginHistory)
      .innerJoin(users, eq(loginHistory.userId, users.id))
      .where(and(eq(users.tenantId, tenantId), sql`${loginHistory.createdAt} >= ${sevenDaysAgo}`));

    return {
      totalUsers: userCount.count,
      activeUsers: activeUserCount.count,
      totalRoles: 3,
      activeSessions: sessionCount.count,
      mfaAdoption: userCount.count > 0 ? Math.round((Number(mfaEnabledCount.count) / Number(userCount.count)) * 100) : 0,
      recentLogins: recentLoginCount.count,
    };
  }

  async getUserStats(userId: string): Promise<any> {
    const [totalSessions] = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.userId, userId));

    const [activeSessions] = await db
      .select({ count: count() })
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.isActive, true)));

    const [loginCount] = await db
      .select({ count: count() })
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId));

    // Get recent login history for trend
    const recentLogins = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.createdAt))
      .limit(5);

    const user = await this.getUser(userId);

    return {
      totalSessions: totalSessions.count,
      activeSessions: activeSessions.count,
      totalLogins: loginCount.count,
      mfaEnabled: user?.mfaEnabled || false,
      lastLoginAt: user?.lastLoginAt,
      recentLogins,
    };
  }

  async getOAuthAccount(provider: string, providerAccountId: string): Promise<any> {
    const [account] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId)
        )
      )
      .limit(1);
    return account;
  }

  async createOAuthAccount(account: any): Promise<any> {
    const [newAccount] = await db.insert(oauthAccounts).values(account).returning();
    return newAccount;
  }

  async createEmailVerificationToken(token: any): Promise<any> {
    const [newToken] = await db.insert(emailVerificationTokens).values(token).returning();
    return newToken;
  }

  async getEmailVerificationToken(userId: string, token: string): Promise<any> {
    const [verificationToken] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, userId),
          eq(emailVerificationTokens.token, token)
        )
      )
      .limit(1);
    return verificationToken;
  }

  async deleteEmailVerificationToken(id: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
  }

  async createPasswordResetToken(token: any): Promise<any> {
    const [newToken] = await db.insert(passwordResetTokens).values(token).returning();
    return newToken;
  }

  async getPasswordResetToken(userId: string, token: string): Promise<any> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, userId),
          eq(passwordResetTokens.token, token)
        )
      )
      .limit(1);
    return resetToken;
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
  }

  async createMfaSecret(secret: any): Promise<any> {
    const [newSecret] = await db.insert(mfaSecrets).values(secret).returning();
    return newSecret;
  }

  async getMfaSecret(userId: string): Promise<any> {
    const [secret] = await db.select().from(mfaSecrets).where(eq(mfaSecrets.userId, userId)).limit(1);
    return secret;
  }

  async deleteMfaSecret(userId: string): Promise<void> {
    await db.delete(mfaSecrets).where(eq(mfaSecrets.userId, userId));
  }

  async createMfaOtpToken(token: any): Promise<any> {
    const [newToken] = await db.insert(mfaOtpTokens).values(token).returning();
    return newToken;
  }

  async getMfaOtpToken(userId: string, code: string): Promise<any> {
    const [token] = await db
      .select()
      .from(mfaOtpTokens)
      .where(and(
        eq(mfaOtpTokens.userId, userId),
        eq(mfaOtpTokens.code, code),
        sql`${mfaOtpTokens.expiresAt} > NOW()`
      ))
      .limit(1);
    return token;
  }

  async deleteMfaOtpToken(userId: string): Promise<void> {
    await db.delete(mfaOtpTokens).where(eq(mfaOtpTokens.userId, userId));
  }

  async createTrustedDevice(device: any): Promise<any> {
    // Check for existing device with same fingerprint
    const existing = await this.getTrustedDevice(device.userId, device.fingerprint);
    
    if (existing) {
      // Update existing device instead of creating duplicate
      const [updated] = await db
        .update(trustedDevices)
        .set({ 
          isTrusted: device.isTrusted,
          deviceName: device.deviceName,
          lastSeenAt: new Date(),
        })
        .where(eq(trustedDevices.id, existing.id))
        .returning();
      return updated;
    }
    
    // Set timestamps for new device
    const now = new Date();
    const [newDevice] = await db.insert(trustedDevices).values({
      ...device,
      createdAt: now,
      lastSeenAt: now,
    }).returning();
    return newDevice;
  }

  async getTrustedDevice(userId: string, fingerprint: string): Promise<any> {
    const [device] = await db
      .select()
      .from(trustedDevices)
      .where(and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.fingerprint, fingerprint),
        eq(trustedDevices.isTrusted, true)
      ))
      .limit(1);
    return device;
  }
  
  async updateTrustedDeviceLastSeen(userId: string, fingerprint: string): Promise<void> {
    await db
      .update(trustedDevices)
      .set({ lastSeenAt: new Date() })
      .where(and(
        eq(trustedDevices.userId, userId),
        eq(trustedDevices.fingerprint, fingerprint)
      ));
  }

  async listTrustedDevices(userId: string): Promise<any[]> {
    return db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.userId, userId))
      .orderBy(desc(trustedDevices.lastSeenAt));
  }

  async deleteTrustedDevice(id: string): Promise<void> {
    await db.delete(trustedDevices).where(eq(trustedDevices.id, id));
  }

  // API Key operations
  async createAPIKey(apiKey: any): Promise<any> {
    const [newKey] = await db.insert(apiKeys).values(apiKey).returning();
    return newKey;
  }

  async getAPIKeyByHash(keyHash: string): Promise<any> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(
        eq(apiKeys.keyHash, keyHash),
        eq(apiKeys.isActive, true),
        sql`(${apiKeys.expiresAt} IS NULL OR ${apiKeys.expiresAt} > NOW())`
      ))
      .limit(1);
    return key;
  }

  async listAPIKeys(tenantId: string): Promise<any[]> {
    return db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.tenantId, tenantId))
      .orderBy(desc(apiKeys.createdAt));
  }

  async updateAPIKeyLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async revokeAPIKey(id: string, tenantId: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(
        eq(apiKeys.id, id),
        eq(apiKeys.tenantId, tenantId)
      ));
  }

  async deleteAPIKey(id: string, tenantId: string): Promise<void> {
    await db.delete(apiKeys).where(and(
      eq(apiKeys.id, id),
      eq(apiKeys.tenantId, tenantId)
    ));
  }

  // OAuth2 Provider operations
  async createOAuth2Client(client: any): Promise<any> {
    const [newClient] = await db.insert(oauth2Clients).values(client).returning();
    return newClient;
  }

  async getOAuth2Client(clientId: string, tenantId?: string): Promise<any> {
    const conditions = [eq(oauth2Clients.clientId, clientId)];
    if (tenantId) {
      conditions.push(eq(oauth2Clients.tenantId, tenantId));
    }
    
    const [client] = await db
      .select()
      .from(oauth2Clients)
      .where(and(...conditions))
      .limit(1);
    return client;
  }

  async getOAuth2ClientById(id: string, tenantId?: string): Promise<any> {
    const conditions = [eq(oauth2Clients.id, id)];
    if (tenantId) {
      conditions.push(eq(oauth2Clients.tenantId, tenantId));
    }
    
    const [client] = await db
      .select()
      .from(oauth2Clients)
      .where(and(...conditions))
      .limit(1);
    return client;
  }

  async listOAuth2Clients(tenantId: string): Promise<any[]> {
    return db
      .select()
      .from(oauth2Clients)
      .where(eq(oauth2Clients.tenantId, tenantId))
      .orderBy(desc(oauth2Clients.createdAt));
  }

  async updateOAuth2Client(id: string, tenantId: string, data: any): Promise<any> {
    const [updated] = await db
      .update(oauth2Clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(oauth2Clients.id, id),
        eq(oauth2Clients.tenantId, tenantId)
      ))
      .returning();
    return updated;
  }

  async deleteOAuth2Client(id: string, tenantId: string): Promise<void> {
    // Cascade delete handled by database foreign keys
    await db.delete(oauth2Clients).where(and(
      eq(oauth2Clients.id, id),
      eq(oauth2Clients.tenantId, tenantId)
    ));
  }

  async createOAuth2AuthorizationCode(code: any): Promise<any> {
    const [newCode] = await db.insert(oauth2AuthorizationCodes).values(code).returning();
    return newCode;
  }

  async getOAuth2AuthorizationCodeByHash(codeHash: string): Promise<any> {
    const [authCode] = await db
      .select()
      .from(oauth2AuthorizationCodes)
      .where(and(
        eq(oauth2AuthorizationCodes.codeHash, codeHash),
        sql`${oauth2AuthorizationCodes.expiresAt} > NOW()`
      ))
      .limit(1);
    return authCode;
  }

  async deleteOAuth2AuthorizationCode(id: string): Promise<void> {
    await db.delete(oauth2AuthorizationCodes).where(eq(oauth2AuthorizationCodes.id, id));
  }

  async cleanupExpiredAuthorizationCodes(): Promise<void> {
    await db.delete(oauth2AuthorizationCodes)
      .where(sql`${oauth2AuthorizationCodes.expiresAt} <= NOW()`);
  }

  async createOAuth2AccessToken(token: any): Promise<any> {
    const [newToken] = await db.insert(oauth2AccessTokens).values(token).returning();
    return newToken;
  }

  async getOAuth2AccessTokenByHash(tokenHash: string): Promise<any> {
    const [accessToken] = await db
      .select()
      .from(oauth2AccessTokens)
      .where(and(
        eq(oauth2AccessTokens.tokenHash, tokenHash),
        sql`${oauth2AccessTokens.expiresAt} > NOW()`
      ))
      .limit(1);
    return accessToken;
  }

  async deleteOAuth2AccessToken(id: string): Promise<void> {
    await db.delete(oauth2AccessTokens).where(eq(oauth2AccessTokens.id, id));
  }

  async cleanupExpiredAccessTokens(): Promise<void> {
    await db.delete(oauth2AccessTokens)
      .where(sql`${oauth2AccessTokens.expiresAt} <= NOW()`);
  }

  async createOAuth2RefreshToken(token: any): Promise<any> {
    const [newToken] = await db.insert(oauth2RefreshTokens).values(token).returning();
    return newToken;
  }

  async getOAuth2RefreshTokenByHash(tokenHash: string): Promise<any> {
    const [refreshToken] = await db
      .select()
      .from(oauth2RefreshTokens)
      .where(and(
        eq(oauth2RefreshTokens.tokenHash, tokenHash),
        sql`${oauth2RefreshTokens.expiresAt} > NOW()`
      ))
      .limit(1);
    return refreshToken;
  }

  async deleteOAuth2RefreshToken(id: string): Promise<void> {
    await db.delete(oauth2RefreshTokens).where(eq(oauth2RefreshTokens.id, id));
  }

  async cleanupExpiredRefreshTokens(): Promise<void> {
    await db.delete(oauth2RefreshTokens)
      .where(sql`${oauth2RefreshTokens.expiresAt} <= NOW()`);
  }
}

export const storage = new DbStorage();
