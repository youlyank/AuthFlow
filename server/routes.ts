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
  verifyToken,
  requireAuth,
  requireRole,
  auditLog,
  generateOAuth2Code,
  generateOAuth2Token,
  generateOAuth2Secret,
  hashOAuth2Secret,
  verifyOAuth2Secret,
  generateAPIKey,
} from "./auth";
import { generateWebhookSecret } from "./webhooks";
import { loginSchema, registerSchema, mfaVerifySchema, createNotificationSchema, passwordResetRequestSchema, passwordResetSchema, updateTenantSettingsSchema } from "@shared/schema";
import { emailService } from "./email";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes, createHash } from "crypto";

// Device fingerprinting with better security
function generateDeviceFingerprint(userId: string, userAgent: string, ip: string): string {
  // Create deterministic but secure fingerprint using configurable salt
  const salt = process.env.DEVICE_FINGERPRINT_SALT || 'authflow-default-salt';
  const data = `${userId}:${userAgent}:${ip}:${salt}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 64);
}

// Check if trusted device is expired (30 days default)
function isTrustedDeviceExpired(lastSeenAt: Date | null, expiryDays: number = 30): boolean {
  if (!lastSeenAt) return true;
  const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
  return (Date.now() - lastSeenAt.getTime()) > expiryMs;
}

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

  // Setup Socket.IO for real-time notifications with authentication
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.REPLIT_DOMAINS?.split(',') || ["http://localhost:5000"],
      credentials: true,
    },
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract auth token from cookie header
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error("Authentication required"));
      }

      // Parse cookies manually (since socket.io doesn't have req object)
      const cookies: Record<string, string> = {};
      cookieHeader.split(';').forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      });

      // Get the actual auth token (set by /api/auth/login and OAuth flows)
      const token = cookies['token'];
      if (!token) {
        return next(new Error("No authentication token"));
      }

      // Verify JWT token and get user
      const decoded = verifyToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid token"));
      }

      const user = await storage.getUser(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error("User not found or inactive"));
      }

      // Attach authenticated user to socket for use in event handlers
      socket.data.user = user;
      next();
    } catch (error) {
      console.error("Socket.IO auth error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    console.log(`Client connected: ${socket.id} (User: ${user.id}, Tenant: ${user.tenantId})`);

    // Automatically join user's own notification room (authenticated)
    socket.join(`user:${user.id}`);

    // Reject any manual join requests - users can only receive their own notifications
    socket.on("join", (userId: string) => {
      console.warn(`Rejected join attempt for user ${userId} from ${user.id}`);
      socket.emit("error", { message: "Cannot join other users' notification channels" });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id} (User: ${user.id})`);
    });
  });

  // Make io available in routes
  app.set("io", io);

  // ===== Authentication Routes =====

  // OAuth Routes
  app.get("/api/auth/oauth/:provider", async (req: Request, res: Response) => {
    const { provider } = req.params;
    
    // Generate CSRF state token
    const state = generateRefreshToken(); // Cryptographically strong random token
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minute expiration

    // Store state in session/cookie or database
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000, // 10 minutes
      sameSite: "lax",
    });
    
    if (provider === "google") {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID || "demo"}&` +
        `redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent("openid email profile")}&` +
        `access_type=offline&` +
        `state=${state}&` +
        `prompt=consent`;
      return res.redirect(googleAuthUrl);
    }
    
    if (provider === "github") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${process.env.GITHUB_CLIENT_ID || "demo"}&` +
        `redirect_uri=${encodeURIComponent(`${req.protocol}://${req.get("host")}/api/auth/oauth/github/callback`)}&` +
        `scope=${encodeURIComponent("read:user user:email")}&` +
        `state=${state}`;
      return res.redirect(githubAuthUrl);
    }
    
    res.status(400).json({ error: "Unsupported provider" });
  });

  // OAuth Callbacks
  app.get("/api/auth/oauth/:provider/callback", async (req: Request, res: Response) => {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`/auth/login?error=${error}`);
      }

      // Validate CSRF state
      const storedState = req.cookies?.oauth_state;
      if (!storedState || storedState !== state) {
        console.error("OAuth CSRF validation failed:", { storedState, receivedState: state });
        return res.redirect("/auth/login?error=csrf_validation_failed");
      }

      // Clear the state cookie after validation
      res.clearCookie("oauth_state");

      if (!code) {
        return res.redirect("/auth/login?error=no_code");
      }

      let userInfo: any;
      let oauthData: any;

      if (provider === "google") {
        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/oauth/google/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenResponse.ok) {
          return res.redirect("/auth/login?error=token_exchange_failed");
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
          return res.redirect("/auth/login?error=user_info_failed");
        }

        userInfo = await userResponse.json();
        oauthData = {
          provider: "google",
          providerAccountId: userInfo.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
        };
      } else if (provider === "github") {
        // Exchange code for token
        const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            code,
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect_uri: `${req.protocol}://${req.get("host")}/api/auth/oauth/github/callback`,
          }),
        });

        if (!tokenResponse.ok) {
          return res.redirect("/auth/login?error=token_exchange_failed");
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userResponse.ok) {
          return res.redirect("/auth/login?error=user_info_failed");
        }

        userInfo = await userResponse.json();
        oauthData = {
          provider: "github",
          providerAccountId: userInfo.id.toString(),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        };
      } else {
        return res.redirect("/auth/login?error=unsupported_provider");
      }

      // Check if OAuth account exists
      const existingOAuth = await storage.getOAuthAccount(oauthData.provider, oauthData.providerAccountId);
      
      let user;
      if (existingOAuth) {
        // User exists, get user
        user = await storage.getUser(existingOAuth.userId);
      } else {
        // Check if user with email exists
        const email = userInfo.email || `${oauthData.provider}.${oauthData.providerAccountId}@authflow.local`;
        const existingUser = await storage.getUserByEmail(email);
        
        if (existingUser) {
          // Link OAuth to existing user
          user = existingUser;
          await storage.createOAuthAccount({
            userId: user.id,
            ...oauthData,
          });
        } else {
          // Create new user
          const names = (userInfo.name || "").split(" ");
          user = await storage.createUser({
            email,
            firstName: userInfo.given_name || names[0] || "User",
            lastName: userInfo.family_name || names.slice(1).join(" ") || "",
            avatarUrl: userInfo.picture || userInfo.avatar_url,
            emailVerified: true, // OAuth emails are verified
            role: "user",
          });

          // Create OAuth account
          await storage.createOAuthAccount({
            userId: user.id,
            ...oauthData,
          });

          await auditLog(req, "user.created", "user", user.id, { email: user.email, provider: oauthData.provider });
        }
      }

      if (!user || !user.isActive) {
        return res.redirect("/auth/login?error=account_inactive");
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
        email: user.email,
        success: true,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Redirect based on role
      const redirectMap = {
        super_admin: "/super-admin",
        tenant_admin: "/admin",
        user: "/dashboard",
      };
      const redirectTo = redirectMap[user.role as keyof typeof redirectMap] || "/dashboard";
      
      res.redirect(redirectTo);
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      res.redirect("/auth/login?error=oauth_failed");
    }
  });

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

      // Generate verification code
      const verificationCode = emailService.generateOTP(6);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationCode,
        expiresAt,
      });

      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationCode);

      // Create audit log
      await auditLog(req, "user.created", "user", user.id, { email: user.email });

      res.status(201).json({ message: "Registration successful. Please check your email for verification code.", userId: user.id });
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
        sameSite: "lax",
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
      // Sanitize sensitive fields
      const sanitizedUsers = users.map(user => ({
        ...user,
        passwordHash: undefined,
      }));
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Error fetching recent users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Password Reset Request
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const data = passwordResetRequestSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      
      // Don't reveal if user exists or not (security)
      if (user) {
        // Generate reset code
        const resetCode = emailService.generateOTP(6);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        await storage.createPasswordResetToken({
          userId: user.id,
          token: resetCode,
          expiresAt,
        });

        // Send reset email
        await emailService.sendPasswordResetEmail(user.email, resetCode);

        await auditLog(req, "password_reset.requested", "user", user.id);
      }

      res.json({ message: "If an account exists with this email, a reset code has been sent." });
    } catch (error: any) {
      console.error("Password reset request error:", error);
      res.status(400).json({ error: error.message || "Request failed" });
    }
  });

  // Password Reset with Code
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const resetToken = await storage.getPasswordResetToken(user.id, code);
      if (!resetToken || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      // Update password
      const passwordHash = await hashPassword(newPassword);
      await storage.updateUser(user.id, { passwordHash });

      // Delete used token
      await storage.deletePasswordResetToken(resetToken.id);

      await auditLog(req, "password.reset", "user", user.id);

      res.json({ message: "Password reset successful" });
    } catch (error: any) {
      console.error("Password reset error:", error);
      res.status(400).json({ error: error.message || "Reset failed" });
    }
  });

  // Email Verification
  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const verificationToken = await storage.getEmailVerificationToken(user.id, code);
      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      // Mark email as verified
      await storage.updateUser(user.id, { emailVerified: true });

      // Delete used token
      await storage.deleteEmailVerificationToken(verificationToken.id);

      await auditLog(req, "email.verified", "user", user.id);

      res.json({ message: "Email verified successfully" });
    } catch (error: any) {
      console.error("Email verification error:", error);
      res.status(400).json({ error: error.message || "Verification failed" });
    }
  });

  // Resend Verification Code
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ error: "Email already verified" });
      }

      // Generate new code
      const verificationCode = emailService.generateOTP(6);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationCode,
        expiresAt,
      });

      await emailService.sendVerificationEmail(user.email, verificationCode);

      res.json({ message: "Verification code sent" });
    } catch (error: any) {
      console.error("Resend verification error:", error);
      res.status(400).json({ error: error.message || "Request failed" });
    }
  });

  // ===== Super Admin Tenant Management =====
  
  // Create tenant
  app.post("/api/super-admin/tenants", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const { name, slug, domain } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }
      
      const tenant = await storage.createTenant({
        name,
        slug,
        domain: domain || null,
      });
      
      await auditLog(req, "tenant.created", "tenant", tenant.id, { name, slug });
      
      res.status(201).json(tenant);
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      res.status(400).json({ error: error.message || "Failed to create tenant" });
    }
  });

  // Update tenant
  app.patch("/api/super-admin/tenants/:id", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const tenant = await storage.updateTenant(id, updates);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      await auditLog(req, "tenant.updated", "tenant", id, updates);
      
      res.json(tenant);
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      res.status(400).json({ error: error.message || "Failed to update tenant" });
    }
  });

  // Get all tenants (with pagination)
  app.get("/api/super-admin/tenants", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tenants = await storage.listTenants(limit);
      
      const tenantsWithDetails = await Promise.all(
        tenants.map(async (tenant) => {
          const users = await storage.listUsers(tenant.id);
          return {
            ...tenant,
            userCount: users.length,
            status: tenant.isActive ? "active" : "suspended",
          };
        })
      );
      
      res.json(tenantsWithDetails);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  // ===== Super Admin Plan Management =====
  
  // Create plan
  app.post("/api/super-admin/plans", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const { name, price, currency, interval, features } = req.body;
      
      if (!name || price === undefined) {
        return res.status(400).json({ error: "Name and price are required" });
      }
      
      const plan = await storage.createPlan({
        name,
        price: parseInt(price),
        currency: currency || "USD",
        interval: interval || "monthly",
        features: features || {},
      });
      
      await auditLog(req, "plan.created", "plan", plan.id, { name, price });
      
      res.status(201).json(plan);
    } catch (error: any) {
      console.error("Error creating plan:", error);
      res.status(400).json({ error: error.message || "Failed to create plan" });
    }
  });

  // Get all plans
  app.get("/api/super-admin/plans", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const showAll = req.query.all === "true";
      const plans = await storage.listPlans(showAll);
      res.json(plans);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  });

  // Update plan
  app.patch("/api/super-admin/plans/:id", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const plan = await storage.updatePlan(id, updates);
      
      if (!plan) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      await auditLog(req, "plan.updated", "plan", id, updates);
      
      res.json(plan);
    } catch (error: any) {
      console.error("Error updating plan:", error);
      res.status(400).json({ error: error.message || "Failed to update plan" });
    }
  });

  // Assign plan to tenant
  app.post("/api/super-admin/tenants/:tenantId/plan", requireAuth, requireRole(["super_admin"]), async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const { planId, customPrice } = req.body;
      
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }
      
      const assignment = await storage.assignPlanToTenant({
        tenantId,
        planId,
        customPrice: customPrice || null,
      });
      
      await auditLog(req, "tenant.plan_assigned", "tenant", tenantId, { planId, customPrice });
      
      res.status(201).json(assignment);
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      res.status(400).json({ error: error.message || "Failed to assign plan" });
    }
  });

  // ===== Tenant Admin Routes =====

  // Get tenant settings
  app.get("/api/tenant-admin/settings", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }
      
      const tenant = await storage.getTenant(req.user.tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      res.json(tenant);
    } catch (error: any) {
      console.error("Error fetching tenant settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Update tenant settings
  app.patch("/api/tenant-admin/settings", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }

      // Validate request body
      const validated = updateTenantSettingsSchema.parse(req.body);

      const updateData: Partial<typeof tenants.$inferSelect> = {};
      
      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.logoUrl !== undefined) updateData.logoUrl = validated.logoUrl || null;
      if (validated.primaryColor !== undefined) updateData.primaryColor = validated.primaryColor;
      if (validated.allowPasswordAuth !== undefined) updateData.allowPasswordAuth = validated.allowPasswordAuth;
      if (validated.allowSocialAuth !== undefined) updateData.allowSocialAuth = validated.allowSocialAuth;
      if (validated.allowMagicLink !== undefined) updateData.allowMagicLink = validated.allowMagicLink;
      if (validated.requireEmailVerification !== undefined) updateData.requireEmailVerification = validated.requireEmailVerification;
      if (validated.requireMfa !== undefined) updateData.requireMfa = validated.requireMfa;
      if (validated.sessionTimeout !== undefined) updateData.sessionTimeout = validated.sessionTimeout;
      if (validated.customDomain !== undefined) updateData.customDomain = validated.customDomain || null;
      if (validated.allowedDomains !== undefined) updateData.allowedDomains = validated.allowedDomains;
      if (validated.features !== undefined) updateData.features = validated.features;

      const updated = await storage.updateTenant(req.user.tenantId, updateData);
      
      await auditLog(req, "tenant.settings_updated", "tenant", req.user.tenantId, updateData);
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating tenant settings:", error);
      res.status(400).json({ error: error.message || "Failed to update settings" });
    }
  });

  // List all users in tenant
  app.get("/api/tenant-admin/users", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }
      
      const users = await storage.listUsersByTenant(req.user.tenantId);
      // Sanitize sensitive fields
      const sanitizedUsers = users.map(user => ({
        ...user,
        passwordHash: undefined,
      }));
      res.json(sanitizedUsers);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Invite/create user in tenant
  app.post("/api/tenant-admin/users/invite", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }

      const { email, role, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user already exists in this tenant
      const existingUser = await storage.getUserByEmail(email, req.user.tenantId);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists in this tenant" });
      }

      // Generate secure temporary password
      const tempPassword = randomBytes(16).toString("base64").slice(0, 12) + "!A1";
      const hashedPassword = await hashPassword(tempPassword);

      const newUser = await storage.createUser({
        tenantId: req.user.tenantId,
        email,
        passwordHash: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        role: role || "user",
        isActive: true,
        emailVerified: false,
      });

      // Send invitation email
      await emailService.sendInvitationEmail(
        email,
        firstName || email,
        `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/login`,
        email,
        tempPassword
      );

      await auditLog(req, "user.invited", "user", newUser.id, { email, role });

      res.status(201).json({ ...newUser, passwordHash: undefined });
    } catch (error: any) {
      console.error("Error inviting user:", error);
      res.status(400).json({ error: error.message || "Failed to invite user" });
    }
  });

  // Update user role
  app.patch("/api/tenant-admin/users/:userId/role", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !["user", "tenant_admin"].includes(role)) {
        return res.status(400).json({ error: "Valid role required (user or tenant_admin)" });
      }

      // Verify user belongs to same tenant
      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user.tenantId) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      
      await auditLog(req, "user.role_updated", "user", userId, { role });
      
      // Sanitize sensitive fields
      res.json({ 
        id: updatedUser?.id,
        email: updatedUser?.email,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        role: updatedUser?.role,
        isActive: updatedUser?.isActive,
        emailVerified: updatedUser?.emailVerified,
        mfaEnabled: updatedUser?.mfaEnabled,
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(400).json({ error: error.message || "Failed to update user role" });
    }
  });

  // Deactivate/remove user
  app.delete("/api/tenant-admin/users/:userId", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Verify user belongs to same tenant
      const user = await storage.getUser(userId);
      if (!user || user.tenantId !== req.user.tenantId) {
        return res.status(404).json({ error: "User not found" });
      }

      // Cannot deactivate yourself
      if (userId === req.user.id) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }

      await storage.deactivateUser(userId);
      
      await auditLog(req, "user.deactivated", "user", userId, {});
      
      res.json({ message: "User deactivated successfully" });
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      res.status(400).json({ error: error.message || "Failed to deactivate user" });
    }
  });

  // List all sessions in tenant
  app.get("/api/tenant-admin/sessions", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }
      
      const sessions = await storage.getTenantSessions(req.user.tenantId);
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Revoke a session
  app.delete("/api/tenant-admin/sessions/:sessionId", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      // Verify session belongs to same tenant
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      
      const user = await storage.getUser(session.userId);
      if (!user || user.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.deleteSession(sessionId);
      
      await auditLog(req, "session.revoked", "session", sessionId, { userId: session.userId });
      
      res.json({ message: "Session revoked successfully" });
    } catch (error: any) {
      console.error("Error revoking session:", error);
      res.status(400).json({ error: error.message || "Failed to revoke session" });
    }
  });

  // ===== MFA/TOTP Routes =====

  // Generate TOTP secret and QR code
  app.post("/api/user/mfa/totp/setup", requireAuth, async (req: Request, res: Response) => {
    try {
      const secret = speakeasy.generateSecret({
        name: `Authflow (${req.user.email})`,
        issuer: "Authflow",
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Store secret temporarily (will be confirmed on verify)
      req.session.tempMfaSecret = {
        secret: secret.base32,
        backupCodes,
      };

      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        backupCodes,
      });
    } catch (error: any) {
      console.error("Error setting up TOTP:", error);
      res.status(500).json({ error: "Failed to setup TOTP" });
    }
  });

  // Verify and enable TOTP
  app.post("/api/user/mfa/totp/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!req.session.tempMfaSecret) {
        return res.status(400).json({ error: "No MFA setup in progress" });
      }

      const verified = speakeasy.totp.verify({
        secret: req.session.tempMfaSecret.secret,
        encoding: "base32",
        token,
        window: 2,
      });

      if (!verified) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Save MFA secret to database
      await storage.createMfaSecret({
        userId: req.user.id,
        secret: req.session.tempMfaSecret.secret,
        backupCodes: req.session.tempMfaSecret.backupCodes,
      });

      // Enable MFA on user account
      await storage.updateUser(req.user.id, {
        mfaEnabled: true,
        mfaMethod: "totp",
      });

      // Clear temp secret
      delete req.session.tempMfaSecret;

      await auditLog(req, "mfa.enabled", "user", req.user.id, { method: "totp" });

      res.json({ 
        message: "TOTP enabled successfully",
        backupCodes: req.session.tempMfaSecret?.backupCodes 
      });
    } catch (error: any) {
      console.error("Error verifying TOTP:", error);
      res.status(500).json({ error: "Failed to verify TOTP" });
    }
  });

  // Disable TOTP
  app.post("/api/user/mfa/totp/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Verify password
      const user = await storage.getUser(req.user.id);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Disable MFA
      await storage.updateUser(req.user.id, {
        mfaEnabled: false,
        mfaMethod: null,
      });

      await storage.deleteMfaSecret(req.user.id);

      await auditLog(req, "mfa.disabled", "user", req.user.id, {});

      res.json({ message: "TOTP disabled successfully" });
    } catch (error: any) {
      console.error("Error disabling TOTP:", error);
      res.status(500).json({ error: "Failed to disable TOTP" });
    }
  });

  // ===== Email OTP MFA Routes =====

  // Enable Email OTP MFA and send initial code
  app.post("/api/user/mfa/email/enable", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate OTP code
      const code = emailService.generateOTP(6);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Delete old tokens
      await storage.deleteMfaOtpToken(req.user.id);

      // Create new OTP token
      await storage.createMfaOtpToken({
        userId: req.user.id,
        code,
        expiresAt,
      });

      // Send OTP code via email
      await emailService.sendMFACode(user.email, code);

      await auditLog(req, "mfa.email_setup_initiated", "user", req.user.id, {});

      res.json({ message: "OTP sent to your email" });
    } catch (error: any) {
      console.error("Error enabling email OTP:", error);
      res.status(500).json({ error: "Failed to enable email OTP" });
    }
  });

  // Verify Email OTP and complete setup
  app.post("/api/user/mfa/email/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const { code, rememberDevice } = req.body;

      if (!code) {
        return res.status(400).json({ error: "Code required" });
      }

      // Verify OTP
      const token = await storage.getMfaOtpToken(req.user.id, code);
      if (!token) {
        return res.status(401).json({ error: "Invalid or expired code" });
      }

      // Enable MFA on user account
      await storage.updateUser(req.user.id, {
        mfaEnabled: true,
        mfaMethod: "email",
      });

      // Delete used token
      await storage.deleteMfaOtpToken(req.user.id);

      // Remember device if requested
      if (rememberDevice) {
        const userAgent = req.headers["user-agent"] || "Unknown";
        const deviceFingerprint = generateDeviceFingerprint(req.user.id, userAgent, req.ip || "");
        
        await storage.createTrustedDevice({
          userId: req.user.id,
          fingerprint: deviceFingerprint,
          deviceName: userAgent.substring(0, 100),
          isTrusted: true,
        });
      }

      await auditLog(req, "mfa.enabled", "user", req.user.id, { method: "email", rememberDevice });

      res.json({ message: "Email OTP enabled successfully" });
    } catch (error: any) {
      console.error("Error verifying email OTP:", error);
      res.status(500).json({ error: "Failed to verify email OTP" });
    }
  });

  // Send Email OTP code (checks trusted devices first)
  app.post("/api/user/mfa/email/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if device is trusted and not expired
      const userAgent = req.headers["user-agent"] || "Unknown";
      const deviceFingerprint = generateDeviceFingerprint(req.user.id, userAgent, req.ip || "");
      const trustedDevice = await storage.getTrustedDevice(req.user.id, deviceFingerprint);

      if (trustedDevice && trustedDevice.isTrusted) {
        // Check if device trust is expired (30 days)
        if (isTrustedDeviceExpired(trustedDevice.lastSeenAt)) {
          // Trust expired, require new OTP
          await storage.deleteTrustedDevice(trustedDevice.id);
        } else {
          // Update last seen and skip OTP for trusted device
          await storage.updateTrustedDeviceLastSeen(req.user.id, deviceFingerprint);
          return res.json({ message: "Trusted device - OTP not required", trusted: true });
        }
      }

      // Generate OTP code
      const code = emailService.generateOTP(6);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Delete old tokens
      await storage.deleteMfaOtpToken(req.user.id);

      // Create new OTP token
      await storage.createMfaOtpToken({
        userId: req.user.id,
        code,
        expiresAt,
      });

      // Send OTP code via email
      await emailService.sendMFACode(user.email, code);

      res.json({ message: "OTP sent to your email", trusted: false });
    } catch (error: any) {
      console.error("Error sending email OTP:", error);
      res.status(500).json({ error: "Failed to send email OTP" });
    }
  });

  // Disable Email OTP MFA
  app.post("/api/user/mfa/email/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: "Password required" });
      }

      // Verify password
      const user = await storage.getUser(req.user.id);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const validPassword = await verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // Disable MFA
      await storage.updateUser(req.user.id, {
        mfaEnabled: false,
        mfaMethod: null,
      });

      // Delete any pending OTP tokens
      await storage.deleteMfaOtpToken(req.user.id);
      
      // Remove all trusted devices for this user
      const trustedDevices = await storage.listTrustedDevices(req.user.id);
      for (const device of trustedDevices) {
        await storage.deleteTrustedDevice(device.id);
      }

      await auditLog(req, "mfa.disabled", "user", req.user.id, {});

      res.json({ message: "Email OTP disabled successfully" });
    } catch (error: any) {
      console.error("Error disabling email OTP:", error);
      res.status(500).json({ error: "Failed to disable email OTP" });
    }
  });

  // ===== Trusted Devices Routes =====

  // List user's trusted devices
  app.get("/api/user/trusted-devices", requireAuth, async (req: Request, res: Response) => {
    try {
      const devices = await storage.listTrustedDevices(req.user.id);
      res.json(devices);
    } catch (error: any) {
      console.error("Error fetching trusted devices:", error);
      res.status(500).json({ error: "Failed to fetch trusted devices" });
    }
  });

  // Remove a trusted device
  app.delete("/api/user/trusted-devices/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verify the device belongs to the user
      const devices = await storage.listTrustedDevices(req.user.id);
      const device = devices.find(d => d.id === id);
      
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      await storage.deleteTrustedDevice(id);
      await auditLog(req, "trusted_device.removed", "user", req.user.id, { deviceId: id });
      
      res.json({ message: "Trusted device removed successfully" });
    } catch (error: any) {
      console.error("Error removing trusted device:", error);
      res.status(500).json({ error: "Failed to remove trusted device" });
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

  // ===== API Key Management Endpoints =====

  // Create API Key (Tenant Admin Only)
  app.post("/api/admin/api-keys", requireAuth, requireRole(["tenant_admin", "super_admin"], "api_keys:write"), async (req: Request, res: Response) => {
    try {
      const { name, permissions, expiresAt } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Generate API key
      const { key, keyHash, keyPrefix } = generateAPIKey();

      // Create API key record
      const apiKey = await storage.createAPIKey({
        tenantId: req.user.tenantId,
        name,
        keyHash,
        keyPrefix,
        permissions: permissions || [],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user.id,
      });

      await auditLog(req, "api_key.created", "api_key", apiKey.id, { name });

      // Return the actual key only once (won't be shown again)
      res.status(201).json({
        id: apiKey.id,
        name: apiKey.name,
        key, // Only returned on creation!
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      });
    } catch (error: any) {
      console.error("Error creating API key:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  // List API Keys
  app.get("/api/admin/api-keys", requireAuth, requireRole(["tenant_admin", "super_admin"], "api_keys:read"), async (req: Request, res: Response) => {
    try {
      const apiKeys = await storage.listAPIKeys(req.user.tenantId!);

      // Don't return key hash, only prefix for identification
      const sanitized = apiKeys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        permissions: k.permissions,
        isActive: k.isActive,
        expiresAt: k.expiresAt,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      }));

      res.json(sanitized);
    } catch (error: any) {
      console.error("Error listing API keys:", error);
      res.status(500).json({ error: "Failed to list API keys" });
    }
  });

  // Revoke API Key
  app.put("/api/admin/api-keys/:id/revoke", requireAuth, requireRole(["tenant_admin", "super_admin"], "api_keys:write"), async (req: Request, res: Response) => {
    try {
      await storage.revokeAPIKey(req.params.id, req.user.tenantId!);
      await auditLog(req, "api_key.revoked", "api_key", req.params.id);
      res.json({ message: "API key revoked" });
    } catch (error: any) {
      console.error("Error revoking API key:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });

  // Delete API Key
  app.delete("/api/admin/api-keys/:id", requireAuth, requireRole(["tenant_admin", "super_admin"], "api_keys:write"), async (req: Request, res: Response) => {
    try {
      await storage.deleteAPIKey(req.params.id, req.user.tenantId!);
      await auditLog(req, "api_key.deleted", "api_key", req.params.id);
      res.json({ message: "API key deleted" });
    } catch (error: any) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  // ===== Webhook Management Endpoints =====

  // Create Webhook
  app.post("/api/admin/webhooks", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:write"), async (req: Request, res: Response) => {
    try {
      const { url, events, description } = req.body;

      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: "URL and events array are required" });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Generate webhook secret
      const secret = generateWebhookSecret();

      const webhook = await storage.createWebhook({
        tenantId: req.user.tenantId,
        url,
        events,
        secret,
        description: description || null,
        isActive: true,
      });

      await auditLog(req, "webhook.created", "webhook", webhook.id, { url, events });

      res.status(201).json({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret, // Only returned on creation
        description: webhook.description,
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      });
    } catch (error: any) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ error: "Failed to create webhook" });
    }
  });

  // List Webhooks
  app.get("/api/admin/webhooks", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:read"), async (req: Request, res: Response) => {
    try {
      const webhooks = await storage.listWebhooks(req.user.tenantId!);

      // Don't return secret in list
      const sanitized = webhooks.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        description: w.description,
        isActive: w.isActive,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }));

      res.json(sanitized);
    } catch (error: any) {
      console.error("Error listing webhooks:", error);
      res.status(500).json({ error: "Failed to list webhooks" });
    }
  });

  // Get Webhook
  app.get("/api/admin/webhooks/:id", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:read"), async (req: Request, res: Response) => {
    try {
      const webhook = await storage.getWebhook(req.params.id, req.user.tenantId!);

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      // Don't return secret after creation
      const { secret, ...webhookData } = webhook;

      res.json(webhookData);
    } catch (error: any) {
      console.error("Error getting webhook:", error);
      res.status(500).json({ error: "Failed to get webhook" });
    }
  });

  // Update Webhook
  app.put("/api/admin/webhooks/:id", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:write"), async (req: Request, res: Response) => {
    try {
      const { url, events, description, isActive } = req.body;

      const updateData: any = {};
      if (url !== undefined) {
        try {
          new URL(url);
          updateData.url = url;
        } catch {
          return res.status(400).json({ error: "Invalid URL format" });
        }
      }
      if (events !== undefined) updateData.events = events;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;

      const webhook = await storage.updateWebhook(req.params.id, req.user.tenantId!, updateData);

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      await auditLog(req, "webhook.updated", "webhook", webhook.id, updateData);

      // Don't return secret
      const { secret, ...webhookData } = webhook;
      res.json(webhookData);
    } catch (error: any) {
      console.error("Error updating webhook:", error);
      res.status(500).json({ error: "Failed to update webhook" });
    }
  });

  // Delete Webhook
  app.delete("/api/admin/webhooks/:id", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:write"), async (req: Request, res: Response) => {
    try {
      await storage.deleteWebhook(req.params.id, req.user.tenantId!);
      await auditLog(req, "webhook.deleted", "webhook", req.params.id);
      res.json({ message: "Webhook deleted" });
    } catch (error: any) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  // Regenerate Webhook Secret
  app.post("/api/admin/webhooks/:id/regenerate-secret", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:write"), async (req: Request, res: Response) => {
    try {
      const newSecret = generateWebhookSecret();
      
      const webhook = await storage.updateWebhook(req.params.id, req.user.tenantId!, {
        secret: newSecret,
      });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      await auditLog(req, "webhook.secret_regenerated", "webhook", webhook.id);

      res.json({
        secret: newSecret,
        message: "Secret regenerated successfully",
      });
    } catch (error: any) {
      console.error("Error regenerating webhook secret:", error);
      res.status(500).json({ error: "Failed to regenerate secret" });
    }
  });

  // List Webhook Deliveries
  app.get("/api/admin/webhooks/:id/deliveries", requireAuth, requireRole(["tenant_admin", "super_admin"], "webhooks:read"), async (req: Request, res: Response) => {
    try {
      const deliveries = await storage.listWebhookDeliveries(req.params.id, req.user.tenantId!, 100);
      res.json(deliveries);
    } catch (error: any) {
      console.error("Error listing webhook deliveries:", error);
      res.status(500).json({ error: "Failed to list deliveries" });
    }
  });

  // ===== OAuth2/OIDC Provider Endpoints =====

  // Sanitize OAuth2 client for API response (whitelist approach)
  function sanitizeOAuth2Client(client: any): any {
    return {
      id: client.id,
      clientId: client.clientId,
      name: client.name,
      description: client.description,
      redirectUris: client.redirectUris,
      tenantId: client.tenantId,
    };
  }

  // Create OAuth2 Client
  app.post("/api/admin/oauth2/clients", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      // Validate tenantId exists
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }

      const { name, redirectUris, description } = req.body;

      if (!name || !redirectUris || !Array.isArray(redirectUris) || redirectUris.length === 0) {
        return res.status(400).json({ error: "Name and at least one redirect URI are required" });
      }

      const clientId = randomBytes(16).toString("hex");
      const clientSecret = randomBytes(32).toString("hex");
      const clientSecretHash = hashOAuth2Secret(clientSecret);

      const client = await storage.createOAuth2Client({
        clientId,
        clientSecretHash,
        name,
        description: description || null,
        redirectUris,
        tenantId: req.user.tenantId,
      });

      // Return sanitized client + one-time secret
      res.json({
        ...sanitizeOAuth2Client(client),
        clientSecret, // Return plaintext secret only on creation
      });
    } catch (error: any) {
      console.error("Error creating OAuth2 client:", error);
      res.status(500).json({ error: "Failed to create OAuth2 client" });
    }
  });

  // List OAuth2 Clients
  app.get("/api/admin/oauth2/clients", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      // Validate tenantId exists
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }

      const clients = await storage.listOAuth2Clients(req.user.tenantId);
      
      // Sanitize all clients using whitelist
      const sanitizedClients = clients.map(sanitizeOAuth2Client);
      
      res.json(sanitizedClients);
    } catch (error: any) {
      console.error("Error listing OAuth2 clients:", error);
      res.status(500).json({ error: "Failed to list OAuth2 clients" });
    }
  });

  // Delete OAuth2 Client
  app.delete("/api/admin/oauth2/clients/:id", requireAuth, requireRole(["tenant_admin"]), async (req: Request, res: Response) => {
    try {
      // Validate tenantId exists
      if (!req.user.tenantId) {
        return res.status(403).json({ error: "Tenant ID required" });
      }

      await storage.deleteOAuth2Client(req.params.id, req.user.tenantId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting OAuth2 client:", error);
      res.status(500).json({ error: "Failed to delete OAuth2 client" });
    }
  });

  // OAuth2 Authorization Endpoint - Redirects to consent screen
  app.get("/oauth2/authorize", requireAuth, async (req: Request, res: Response) => {
    try {
      const {
        client_id,
        redirect_uri,
        response_type,
        scope,
        state,
        code_challenge,
        code_challenge_method,
      } = req.query;

      // Validate required parameters
      if (!client_id || !redirect_uri || !response_type) {
        return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters" });
      }

      // Verify client exists and tenant owns it
      const client = await storage.getOAuth2Client(client_id as string);
      if (!client) {
        return res.status(400).json({ error: "invalid_client", error_description: "Client not found" });
      }

      // Verify tenant ownership
      if (client.tenantId !== req.user.tenantId) {
        return res.status(403).json({ error: "forbidden", error_description: "Client belongs to different tenant" });
      }

      // Verify redirect URI matches registered URIs
      if (!client.redirectUris.includes(redirect_uri as string)) {
        return res.status(400).json({ error: "invalid_request", error_description: "Invalid redirect_uri" });
      }

      // Store authorization request in session for integrity
      const authRequestId = randomBytes(32).toString("hex");
      req.session.oauth2AuthRequest = {
        id: authRequestId,
        clientId: client_id as string,
        redirectUri: redirect_uri as string,
        responseType: response_type as string,
        scope: scope as string || "openid profile email",
        state: state as string || null,
        codeChallenge: code_challenge as string || null,
        codeChallengeMethod: code_challenge_method as string || null,
        userId: req.user.id,
        tenantId: req.user.tenantId,
      };

      // Redirect to consent screen with session ID
      const consentUrl = new URL("/oauth2/consent", `${req.protocol}://${req.get("host")}`);
      consentUrl.searchParams.set("request_id", authRequestId);

      res.redirect(consentUrl.toString());
    } catch (error: any) {
      console.error("OAuth2 authorization error:", error);
      res.status(500).json({ error: "server_error", error_description: "Authorization failed" });
    }
  });

  // Get OAuth2 Authorization Request (for consent screen)
  app.get("/api/oauth2/auth-request/:request_id", requireAuth, async (req: Request, res: Response) => {
    try {
      const authRequest = req.session.oauth2AuthRequest;
      
      if (!authRequest || authRequest.id !== req.params.request_id) {
        return res.status(404).json({ error: "Authorization request not found or expired" });
      }

      // Verify user owns this request
      if (authRequest.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get client info
      const client = await storage.getOAuth2Client(authRequest.clientId);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      // Return request info with client details
      res.json({
        clientId: authRequest.clientId,
        clientName: client.name,
        clientDescription: client.description,
        scope: authRequest.scope,
        redirectUri: authRequest.redirectUri,
      });
    } catch (error: any) {
      console.error("Error getting auth request:", error);
      res.status(500).json({ error: "Failed to get authorization request" });
    }
  });

  // Handle OAuth2 Consent
  app.post("/api/oauth2/consent", requireAuth, async (req: Request, res: Response) => {
    try {
      const { request_id, approved } = req.body;

      // Retrieve authorization request from session
      const authRequest = req.session.oauth2AuthRequest;
      
      if (!authRequest || authRequest.id !== request_id) {
        return res.status(400).json({ error: "invalid_request", error_description: "Authorization request not found or expired" });
      }

      // Verify user owns this request
      if (authRequest.userId !== req.user.id) {
        return res.status(403).json({ error: "forbidden" });
      }

      // Verify client still exists and tenant ownership
      const client = await storage.getOAuth2Client(authRequest.clientId);
      if (!client || client.tenantId !== authRequest.tenantId) {
        return res.status(400).json({ error: "invalid_client" });
      }

      // Verify redirect URI still valid
      if (!client.redirectUris.includes(authRequest.redirectUri)) {
        return res.status(400).json({ error: "invalid_redirect_uri" });
      }

      const redirectUrl = new URL(authRequest.redirectUri);

      // If user denied consent
      if (!approved) {
        redirectUrl.searchParams.set("error", "access_denied");
        redirectUrl.searchParams.set("error_description", "User denied authorization");
        if (authRequest.state) redirectUrl.searchParams.set("state", authRequest.state);
        
        // Clear session
        delete req.session.oauth2AuthRequest;
        
        return res.json({ redirect_url: redirectUrl.toString() });
      }

      // Generate authorization code
      const code = generateOAuth2Code();
      const codeHash = hashOAuth2Secret(code);

      // Store authorization code with 10 minute expiry
      await storage.createOAuth2AuthorizationCode({
        codeHash,
        clientId: authRequest.clientId,
        userId: authRequest.userId,
        redirectUri: authRequest.redirectUri,
        scopes: authRequest.scope.split(" ").filter(Boolean),
        codeChallenge: authRequest.codeChallenge,
        codeChallengeMethod: authRequest.codeChallengeMethod,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      // Redirect back to client with code
      redirectUrl.searchParams.set("code", code);
      if (authRequest.state) redirectUrl.searchParams.set("state", authRequest.state);

      // Clear session
      delete req.session.oauth2AuthRequest;

      res.json({ redirect_url: redirectUrl.toString() });
    } catch (error: any) {
      console.error("OAuth2 consent error:", error);
      res.status(500).json({ error: "server_error" });
    }
  });

  // OAuth2 Token Endpoint
  app.post("/oauth2/token", async (req: Request, res: Response) => {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret,
        refresh_token,
        code_verifier,
      } = req.body;

      if (!grant_type) {
        return res.status(400).json({ error: "invalid_request", error_description: "grant_type required" });
      }

      if (grant_type === "authorization_code") {
        // Verify required parameters
        if (!code || !redirect_uri || !client_id) {
          return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters" });
        }

        // Get client and verify secret
        const client = await storage.getOAuth2Client(client_id);
        if (!client) {
          return res.status(400).json({ error: "invalid_client" });
        }

        if (!verifyOAuth2Secret(client_secret, client.clientSecretHash)) {
          return res.status(400).json({ error: "invalid_client", error_description: "Invalid client credentials" });
        }

        // Get and verify authorization code
        const codeHash = hashOAuth2Secret(code);
        const authCode = await storage.getOAuth2AuthorizationCodeByHash(codeHash);

        if (!authCode) {
          return res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired code" });
        }

        // Verify redirect URI matches
        if (authCode.redirectUri !== redirect_uri) {
          return res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
        }

        // Verify PKCE if present
        if (authCode.codeChallenge) {
          if (!code_verifier) {
            return res.status(400).json({ error: "invalid_request", error_description: "code_verifier required" });
          }
          
          const computedChallenge = authCode.codeChallengeMethod === "S256" 
            ? createHash("sha256").update(code_verifier).digest("base64url")
            : code_verifier;

          if (computedChallenge !== authCode.codeChallenge) {
            return res.status(400).json({ error: "invalid_grant", error_description: "PKCE validation failed" });
          }
        }

        // Generate tokens
        const accessToken = generateOAuth2Token();
        const refreshToken = generateOAuth2Token();

        const accessTokenHash = hashOAuth2Secret(accessToken);
        const refreshTokenHash = hashOAuth2Secret(refreshToken);

        // Store tokens
        const tokenRecord = await storage.createOAuth2AccessToken({
          tokenHash: accessTokenHash,
          clientId: client_id,
          userId: authCode.userId,
          scopes: authCode.scopes,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        });

        await storage.createOAuth2RefreshToken({
          tokenHash: refreshTokenHash,
          accessTokenId: tokenRecord.id,
          clientId: client_id,
          userId: authCode.userId,
          scopes: authCode.scopes,
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
        });

        // Delete used authorization code
        await storage.deleteOAuth2AuthorizationCode(authCode.id);

        // Return tokens
        res.json({
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: refreshToken,
          scope: authCode.scopes.join(" "),
        });

      } else if (grant_type === "refresh_token") {
        if (!refresh_token || !client_id || !client_secret) {
          return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters" });
        }

        // Verify client
        const client = await storage.getOAuth2Client(client_id);
        if (!client || !verifyOAuth2Secret(client_secret, client.clientSecretHash)) {
          return res.status(400).json({ error: "invalid_client" });
        }

        // Get refresh token
        const refreshTokenHash = hashOAuth2Secret(refresh_token);
        const storedToken = await storage.getOAuth2RefreshTokenByHash(refreshTokenHash);

        if (!storedToken) {
          return res.status(400).json({ error: "invalid_grant", error_description: "Invalid refresh token" });
        }

        // Generate new access token
        const newAccessToken = generateOAuth2Token();
        const newAccessTokenHash = hashOAuth2Secret(newAccessToken);

        await storage.createOAuth2AccessToken({
          tokenHash: newAccessTokenHash,
          clientId: client_id,
          userId: storedToken.userId,
          scopes: storedToken.scopes,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        });

        res.json({
          access_token: newAccessToken,
          token_type: "Bearer",
          expires_in: 3600,
          scope: storedToken.scopes.join(" "),
        });

      } else {
        res.status(400).json({ error: "unsupported_grant_type" });
      }
    } catch (error: any) {
      console.error("OAuth2 token error:", error);
      res.status(500).json({ error: "server_error", error_description: "Token issuance failed" });
    }
  });

  // OAuth2 UserInfo Endpoint
  app.get("/oauth2/userinfo", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "invalid_token" });
      }

      const token = authHeader.substring(7);
      const tokenHash = hashOAuth2Secret(token);

      // Get and verify access token
      const accessToken = await storage.getOAuth2AccessTokenByHash(tokenHash);
      if (!accessToken) {
        return res.status(401).json({ error: "invalid_token" });
      }

      // Get user info
      const user = await storage.getUser(accessToken.userId);
      if (!user) {
        return res.status(404).json({ error: "user_not_found" });
      }

      // Return user info based on scopes
      const userInfo: any = {
        sub: user.id,
      };

      if (accessToken.scopes.includes("profile")) {
        userInfo.name = `${user.firstName} ${user.lastName}`;
        userInfo.given_name = user.firstName;
        userInfo.family_name = user.lastName;
      }

      if (accessToken.scopes.includes("email")) {
        userInfo.email = user.email;
        userInfo.email_verified = user.emailVerified;
      }

      res.json(userInfo);
    } catch (error: any) {
      console.error("OAuth2 userinfo error:", error);
      res.status(500).json({ error: "server_error" });
    }
  });

  // JWKS Endpoint (JSON Web Key Set)
  app.get("/.well-known/jwks.json", (req: Request, res: Response) => {
    // TODO: Implement proper JWKS with RSA keys
    // For now, return empty set (JWT validation will use shared secret)
    res.json({
      keys: []
    });
  });

  // OpenID Connect Discovery Endpoint
  app.get("/.well-known/openid-configuration", (req: Request, res: Response) => {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    
    res.json({
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth2/authorize`,
      token_endpoint: `${baseUrl}/oauth2/token`,
      userinfo_endpoint: `${baseUrl}/oauth2/userinfo`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256", "HS256"],
      scopes_supported: ["openid", "profile", "email"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
      claims_supported: ["sub", "name", "given_name", "family_name", "email", "email_verified"],
      code_challenge_methods_supported: ["S256", "plain"],
      grant_types_supported: ["authorization_code", "refresh_token"],
    });
  });

  return httpServer;
}
