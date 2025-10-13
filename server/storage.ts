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
  webauthnCredentials,
  trustedDevices,
  emailVerificationTokens,
  passwordResetTokens,
  rateLimits,
  apiKeys,
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
  updateSession(id: string, data: Partial<Session>): Promise<void>;
  deleteSession(id: string): Promise<void>;
  getUserSessions(userId: string): Promise<Session[]>;

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

    return {
      totalTenants: tenantCount.count,
      activeTenants: activeTenantsCount.count,
      totalUsers: userCount.count,
      totalRevenue: 0,
      monthlyActiveUsers: 0,
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

    return {
      totalUsers: userCount.count,
      activeUsers: activeUserCount.count,
      totalRoles: 3,
      activeSessions: sessionCount.count,
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

    const user = await this.getUser(userId);

    return {
      totalSessions: totalSessions.count,
      activeSessions: activeSessions.count,
      mfaEnabled: user?.mfaEnabled || false,
      lastLoginAt: user?.lastLoginAt,
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
}

export const storage = new DbStorage();
