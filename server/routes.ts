import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  requireAuth,
  requireRole,
  auditLog,
} from "./auth";
import { loginSchema, registerSchema, mfaVerifySchema, createNotificationSchema } from "@shared/schema";

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  const httpServer = createServer(app);

  // Setup Socket.IO for real-time notifications
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Make io available in routes
  app.set("io", io);

  // ===== Authentication Routes =====

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);

      // Check if user exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "user",
        tenantId: null, // Will be set based on tenant slug if provided
      });

      // Create audit log
      await auditLog(req, "user.created", "user", user.id, { email: user.email });

      res.status(201).json({ message: "Registration successful", userId: user.id });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ error: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        await storage.createLoginHistory({
          email: data.email,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          failureReason: "Invalid credentials",
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(data.password, user.passwordHash);
      if (!isValid) {
        await storage.createLoginHistory({
          userId: user.id,
          email: data.email,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          failureReason: "Invalid password",
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // In a real implementation, store the userId in session for MFA verification
        return res.json({ requiresMfa: true });
      }

      // Generate tokens
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || undefined,
      });
      const refreshToken = generateRefreshToken();

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await storage.createSession({
        userId: user.id,
        token,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        expiresAt,
      });

      // Update last login
      await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
        lastLoginIp: req.ip,
      });

      // Create login history
      await storage.createLoginHistory({
        userId: user.id,
        email: data.email,
        success: true,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    try {
      const token = req.cookies?.token;
      if (token) {
        const session = await storage.getSessionByToken(token);
        if (session) {
          await storage.deleteSession(session.id);
        }
      }

      res.clearCookie("token");
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    res.json({ user: req.user });
  });

  // ===== Super Admin Routes =====

  app.get("/api/super-admin/stats", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const stats = await storage.getSuperAdminStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching super admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/super-admin/tenants/recent", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const tenants = await storage.listTenants(10);
      const tenantsWithCounts = await Promise.all(
        tenants.map(async (tenant) => {
          const users = await storage.listUsers(tenant.id);
          return {
            ...tenant,
            plan: "Starter", // Would come from tenantPlans join
            users: users.length,
            status: tenant.isActive ? "active" : "inactive",
          };
        })
      );
      res.json(tenantsWithCounts);
    } catch (error: any) {
      console.error("Error fetching recent tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  // ===== Tenant Admin Routes =====

  app.get("/api/admin/stats", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const stats = await storage.getTenantAdminStats(req.user.tenantId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching tenant admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users/recent", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const users = await storage.listUsers(req.user.tenantId, 10);
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching recent users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // ===== User Routes =====

  app.get("/api/user/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/user/login-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const history = await storage.getUserLoginHistory(req.user.id);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching login history:", error);
      res.status(500).json({ error: "Failed to fetch login history" });
    }
  });

  // ===== Notification Routes =====

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.markNotificationAsRead(req.params.id, req.user.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      await Promise.all(
        notifications.map(n => storage.markNotificationAsRead(n.id, req.user.id))
      );
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // In a real implementation, delete the notification
      res.json({ message: "Notification deleted" });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Create notification (admin only)
  app.post("/api/notifications", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const data = createNotificationSchema.parse(req.body);

      const notification = await storage.createNotification({
        ...data,
        createdBy: req.user.id,
      });

      // Emit real-time notification via WebSocket
      if (data.userId) {
        io.to(`user:${data.userId}`).emit("notification", notification);
      } else if (data.tenantId) {
        // Broadcast to all users in tenant (would need to implement tenant rooms)
        io.emit("notification", notification);
      }

      await auditLog(req, "notification.created", "notification", notification.id, data);

      res.status(201).json(notification);
    } catch (error: any) {
      console.error("Error creating notification:", error);
      res.status(400).json({ error: error.message || "Failed to create notification" });
    }
  });

  return httpServer;
}
