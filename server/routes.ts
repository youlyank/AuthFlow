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
import { loginSchema, registerSchema, mfaVerifySchema, createNotificationSchema, passwordResetRequestSchema, passwordResetSchema } from "@shared/schema";
import { emailService } from "./email";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

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
