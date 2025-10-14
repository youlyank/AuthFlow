import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import cookieParser from "cookie-parser";
import "express-session"; // Import for type augmentation
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
  rateLimitByIP,
  rateLimitByEmail,
  recordFailedAttempt,
  resetRateLimit,
} from "./auth";
import { generateWebhookSecret } from "./webhooks";
import { loginSchema, registerSchema, mfaVerifySchema, createNotificationSchema, passwordResetRequestSchema, passwordResetSchema, updateTenantSettingsSchema, tenants } from "@shared/schema";
import downloadRoutes from "./download-routes";
import { emailService } from "./email";
import { migrationService } from "./migration";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { randomBytes, createHash } from "crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

// Validate redirect URI to prevent open redirect vulnerability
function validateRedirectUri(redirectUri: string, tenantCustomDomain?: string | null, requestHost?: string): boolean {
  try {
    const url = new URL(redirectUri);
    
    // Only allow http/https protocols (reject javascript:, data:, etc.)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }
    
    // Allow localhost for development
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }
    
    // Allow same origin as the request (e.g., authflow.com if request from authflow.com)
    if (requestHost && url.hostname === requestHost) {
      return true;
    }
    
    // Allow subdomains of the request host (e.g., tenant.authflow.com if request from authflow.com)
    if (requestHost && url.hostname.endsWith('.' + requestHost)) {
      return true;
    }
    
    // Allow tenant's custom domain if provided
    if (tenantCustomDomain && url.hostname === tenantCustomDomain) {
      return true;
    }
    
    // SECURITY: Reject everything else (no arbitrary external domains)
    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

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

// Type augmentation for Express Request and Session
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Extend express-session's SessionData interface
declare module 'express-session' {
  interface SessionData {
    mfaUserId?: string;
    mfaVerified?: boolean;
    tempMfaSecret?: { secret: string; backupCodes: string[] };
    oauth2ConsentChallenge?: string;
    oauth2ClientId?: string;
    oauth2RedirectUri?: string;
    oauth2Scope?: string;
    oauth2CodeChallenge?: string;
    oauth2CodeChallengeMethod?: string;
    oauth2AuthRequest?: any;
    webauthnChallenge?: string;
    webauthnUserId?: string;
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
    const { tenant: tenantSlug } = req.query;
    
    // Check tenant settings if specified
    if (tenantSlug && typeof tenantSlug === "string") {
      const tenant = await storage.getTenantBySlug(tenantSlug);
      if (!tenant || !tenant.isActive) {
        return res.redirect("/auth/login?error=invalid_tenant");
      }
      if (!tenant.allowSocialAuth) {
        return res.redirect("/auth/login?error=social_auth_disabled");
      }
      // Store tenant slug for callback
      res.cookie("oauth_tenant", tenantSlug, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: "lax",
      });
    }
    
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

  // Public endpoint to get tenant branding by slug (for Universal Login)
  app.get("/api/public/tenant/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const tenant = await storage.getTenantBySlug(slug);
      if (!tenant || !tenant.isActive) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // Return only public branding information
      res.json({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
        customDomain: tenant.customDomain,
        allowPasswordAuth: tenant.allowPasswordAuth,
        allowSocialAuth: tenant.allowSocialAuth,
        allowMagicLink: tenant.allowMagicLink,
        requireEmailVerification: tenant.requireEmailVerification,
      });
    } catch (error: any) {
      console.error("Error fetching tenant branding:", error);
      res.status(500).json({ error: "Failed to fetch tenant branding" });
    }
  });

  // Register (with rate limiting)
  app.post("/api/auth/register", 
    rateLimitByIP("register"), 
    rateLimitByEmail("register"), 
    async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const { tenantSlug } = req.body;

      // Check if user exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Get tenant ID from slug if provided
      let tenantId = null;
      if (tenantSlug) {
        const tenant = await storage.getTenantBySlug(tenantSlug);
        if (!tenant || !tenant.isActive) {
          return res.status(400).json({ error: "Invalid tenant" });
        }
        // Enforce tenant auth settings
        if (!tenant.allowPasswordAuth) {
          return res.status(403).json({ error: "Password authentication is disabled for this tenant" });
        }
        tenantId = tenant.id;
      }

      // Hash password and create user
      const passwordHash = await hashPassword(data.password);
      const user = await storage.createUser({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "user",
        tenantId,
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

  // Login (with rate limiting)
  app.post("/api/auth/login", 
    rateLimitByIP("login"), 
    rateLimitByEmail("login"), 
    async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const { tenantSlug, redirectUri } = req.body;
      const ipAddress = req.ip || "unknown";
      
      // Validate redirect URI if provided
      let validatedRedirectUri: string | null = null;
      if (redirectUri && typeof redirectUri === 'string') {
        const tenant = tenantSlug ? await storage.getTenantBySlug(tenantSlug) : null;
        if (validateRedirectUri(redirectUri, tenant?.customDomain, req.get('host'))) {
          validatedRedirectUri = redirectUri;
        }
      }

      // Find user
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.passwordHash) {
        // Record failed attempt for both IP and email
        await recordFailedAttempt(ipAddress, "login");
        await recordFailedAttempt(data.email, "login");
        
        await storage.createLoginHistory({
          email: data.email,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          failureReason: "Invalid credentials",
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify tenant if specified
      if (tenantSlug) {
        const tenant = await storage.getTenantBySlug(tenantSlug);
        if (!tenant || !tenant.isActive) {
          return res.status(401).json({ error: "Invalid tenant" });
        }
        if (user.tenantId !== tenant.id) {
          return res.status(401).json({ error: "User does not belong to this tenant" });
        }
        // Enforce tenant auth settings
        if (!tenant.allowPasswordAuth) {
          return res.status(403).json({ error: "Password authentication is disabled for this tenant" });
        }
      }

      // Verify password
      const isValid = await verifyPassword(data.password, user.passwordHash);
      if (!isValid) {
        // Record failed attempt for both IP and email
        await recordFailedAttempt(ipAddress, "login");
        await recordFailedAttempt(data.email, "login");
        
        await storage.createLoginHistory({
          userId: user.id,
          email: data.email,
          success: false,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          failureReason: "Invalid password",
        });
        
        // ATTACK PROTECTION: Auto-block IP after too many failed attempts FROM SAME IP
        const recentFailedLoginsFromIP = await storage.getRecentFailedLoginsByIP(ipAddress, data.email, 10);
        if (recentFailedLoginsFromIP.length >= 5 && user.tenantId) {
          await autoBlockIP(
            ipAddress, 
            user.tenantId, 
            `${recentFailedLoginsFromIP.length} failed login attempts from this IP`
          );
        }
        
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // ATTACK PROTECTION: Detect suspicious login patterns
      const currentIp = req.ip || "unknown";
      const suspiciousLogin = await detectSuspiciousLogin(user.id, currentIp, user);
      
      // Create security events for each detected anomaly
      if (suspiciousLogin.suspicious) {
        for (const event of suspiciousLogin.events) {
          await createSecurityEvent(
            user.id,
            event.type,
            event.riskScore,
            event.details,
            req
          );
        }
        
        // Log suspicious login for admin review
        console.log(`Suspicious login detected for user ${user.email}:`, suspiciousLogin.events.map(e => e.description).join(', '));
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // In a real implementation, store the userId in session for MFA verification
        return res.json({ 
          requiresMfa: true,
          redirectUri: validatedRedirectUri 
        });
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

      // Reset rate limits on successful login
      await resetRateLimit(ipAddress, "login");
      await resetRateLimit(data.email, "login");

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
        redirectUri: validatedRedirectUri,
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
    // Safely serialize user without sensitive fields
    const { passwordHash, ...safeUser } = req.user;
    res.json({ user: safeUser });
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
          const tenantPlan = await storage.getTenantPlan(tenant.id);
          return {
            ...tenant,
            plan: tenantPlan?.plan.name || "No Plan",
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

  // Password Reset Request (with rate limiting)
  app.post("/api/auth/forgot-password",
    rateLimitByIP("passwordReset"),
    rateLimitByEmail("passwordReset"),
    async (req: Request, res: Response) => {
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
  app.post("/api/auth/reset-password", 
    rateLimitByIP("passwordResetComplete"),
    async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Record failed attempt - user not found
        await recordFailedAttempt(ipAddress, "passwordResetComplete");
        return res.status(400).json({ error: "Invalid request" });
      }

      const resetToken = await storage.getPasswordResetToken(user.id, code);
      if (!resetToken || resetToken.expiresAt < new Date()) {
        // Record failed attempt - invalid/expired token
        await recordFailedAttempt(ipAddress, "passwordResetComplete");
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      // Reset rate limit on success
      await resetRateLimit(ipAddress, "passwordResetComplete");

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
  app.post("/api/auth/verify-email", 
    rateLimitByIP("emailVerify"),
    async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Record failed attempt - user not found
        await recordFailedAttempt(ipAddress, "emailVerify");
        return res.status(400).json({ error: "Invalid request" });
      }

      const verificationToken = await storage.getEmailVerificationToken(user.id, code);
      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        // Record failed attempt - invalid/expired token
        await recordFailedAttempt(ipAddress, "emailVerify");
        return res.status(400).json({ error: "Invalid or expired code" });
      }

      // Reset rate limit on success
      await resetRateLimit(ipAddress, "emailVerify");

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
  app.post("/api/auth/resend-verification", 
    rateLimitByIP("resendVerification"),
    rateLimitByEmail("resendVerification"),
    async (req: Request, res: Response) => {
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
      const { name, slug, customDomain } = req.body;
      
      if (!name || !slug) {
        return res.status(400).json({ error: "Name and slug are required" });
      }
      
      const tenant = await storage.createTenant({
        name,
        slug,
        customDomain: customDomain || null,
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
      const { name, price, type, maxUsers, features } = req.body;
      
      if (!name || price === undefined || !type || !maxUsers) {
        return res.status(400).json({ error: "Name, price, type, and maxUsers are required" });
      }
      
      const plan = await storage.createPlan({
        name,
        type,
        maxUsers: parseInt(maxUsers),
        price: parseInt(price),
        features: features || [],
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
  app.post("/api/user/mfa/totp/verify", 
    rateLimitByIP("mfaVerify"),
    requireAuth, 
    async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      if (!req.session.tempMfaSecret) {
        // Record failed attempt - no setup in progress
        await recordFailedAttempt(ipAddress, "mfaVerify");
        return res.status(400).json({ error: "No MFA setup in progress" });
      }

      const verified = speakeasy.totp.verify({
        secret: req.session.tempMfaSecret.secret,
        encoding: "base32",
        token,
        window: 2,
      });

      if (!verified) {
        // Record failed MFA attempt - invalid code
        await recordFailedAttempt(ipAddress, "mfaVerify");
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Reset rate limit on success
      await resetRateLimit(ipAddress, "mfaVerify");

      // Save backup codes before clearing session
      const backupCodes = req.session.tempMfaSecret.backupCodes;

      // Save MFA secret to database
      await storage.createMfaSecret({
        userId: req.user.id,
        secret: req.session.tempMfaSecret.secret,
        backupCodes,
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
        backupCodes 
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
  app.post("/api/user/mfa/email/verify", 
    rateLimitByIP("mfaVerify"),
    requireAuth, 
    async (req: Request, res: Response) => {
    try {
      const { code, rememberDevice } = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      if (!code) {
        // Record failed attempt - missing code
        await recordFailedAttempt(ipAddress, "mfaVerify");
        return res.status(400).json({ error: "Code required" });
      }

      // Verify OTP
      const token = await storage.getMfaOtpToken(req.user.id, code);
      if (!token) {
        // Record failed MFA attempt - invalid code
        await recordFailedAttempt(ipAddress, "mfaVerify");
        return res.status(401).json({ error: "Invalid or expired code" });
      }

      // Reset rate limit on success
      await resetRateLimit(ipAddress, "mfaVerify");

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
      await storage.deleteNotification(req.params.id, req.user.id);
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

  // ===== Auth0 Migration Endpoint =====

  // Import users from Auth0 export (JSON or CSV)
  app.post("/api/admin/import-users", requireAuth, requireRole(["tenant_admin", "super_admin"]), async (req: Request, res: Response) => {
    try {
      const { data, format = "json", options = {} } = req.body;

      if (!data) {
        return res.status(400).json({ error: "Data is required" });
      }

      // Parse users based on format
      let users;
      try {
        if (format === "csv") {
          users = migrationService.parseCSV(data);
        } else {
          users = migrationService.parseAuth0Export(data);
        }
      } catch (error: any) {
        return res.status(400).json({ error: `Failed to parse ${format.toUpperCase()}: ${error.message}` });
      }

      // Import users with options
      const importOptions = {
        tenantId: req.user.tenantId!,
        defaultRole: options.defaultRole || "user",
        overwriteExisting: options.overwriteExisting || false,
        generatePasswordsIfMissing: options.generatePasswordsIfMissing || false,
      };

      const result = await migrationService.importUsers(users, importOptions);

      await auditLog(req, "users.imported", "user", null, { 
        total: result.total,
        imported: result.imported,
        skipped: result.skipped,
        errorCount: result.errors.length
      });

      res.json({
        message: "Import completed",
        result,
      });
    } catch (error: any) {
      console.error("Error importing users:", error);
      res.status(500).json({ error: "Failed to import users" });
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

  // =======================
  // MAGIC LINK AUTHENTICATION
  // =======================
  
  // Request Magic Link
  app.post("/api/auth/magic-link/request", 
    rateLimitByIP("magicLinkRequest"),
    rateLimitByEmail("magicLinkRequest"),
    async (req: Request, res: Response) => {
    try {
      const { email, tenantSlug } = req.body;

      // Tenant slug is REQUIRED for security (tenant isolation)
      if (!tenantSlug) {
        return res.status(400).json({ error: "tenantSlug is required" });
      }

      // Resolve tenant
      const tenant = await storage.getTenantBySlug(tenantSlug);
      if (!tenant) {
        // Don't reveal if tenant exists
        return res.json({ message: "If the email exists, a magic link has been sent" });
      }

      // Enforce tenant auth settings
      if (!tenant.allowMagicLink) {
        return res.status(403).json({ error: "Magic link authentication is disabled for this tenant" });
      }

      // Find user within tenant scope ONLY
      const user = await storage.getUserByEmail(email, tenant.id);
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: "If the email exists, a magic link has been sent" });
      }

      // Generate token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.createMagicLinkToken({
        userId: user.id,
        email,
        token,
        expiresAt,
      });

      // Send email with magic link
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      await emailService.sendMagicLink(email, token, baseUrl);

      // Note: audit log without req.user since user is not authenticated yet at this point

      res.json({ message: "If the email exists, a magic link has been sent" });
    } catch (error: any) {
      console.error("Magic link request error:", error);
      res.status(500).json({ error: "Failed to send magic link" });
    }
  });

  // Verify Magic Link
  app.post("/api/auth/magic-link/verify", 
    rateLimitByIP("magicLinkVerify"),
    async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const magicLink = await storage.getMagicLinkToken(token);
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
      
      if (!magicLink || magicLink.usedAt) {
        // Record failed attempt
        await recordFailedAttempt(ipAddress, "magicLinkVerify");
        return res.status(400).json({ error: "Invalid or expired magic link" });
      }

      if (new Date() > magicLink.expiresAt) {
        // Record failed attempt
        await recordFailedAttempt(ipAddress, "magicLinkVerify");
        return res.status(400).json({ error: "Magic link has expired" });
      }

      const user = await storage.getUser(magicLink.userId!);
      if (!user) {
        // Record failed attempt
        await recordFailedAttempt(ipAddress, "magicLinkVerify");
        return res.status(404).json({ error: "User not found" });
      }

      // Reset rate limit on success
      await resetRateLimit(ipAddress, "magicLinkVerify");

      // Mark magic link as used
      await storage.markMagicLinkAsUsed(magicLink.id);

      // Generate auth tokens
      const jwtToken = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId || undefined,
      });
      const refreshToken = generateRefreshToken();

      // Create session
      await storage.createSession({
        userId: user.id,
        token: jwtToken,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
        deviceName: req.headers["user-agent"]?.split(" ")[0],
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Set cookie
      res.cookie("token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Note: audit log without req.user since user is logging in at this point

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
        token: jwtToken,
      });
    } catch (error: any) {
      console.error("Magic link verify error:", error);
      res.status(500).json({ error: "Failed to verify magic link" });
    }
  });

  // =======================
  // BRANDING CUSTOMIZATION
  // =======================
  
  // Get Branding for Tenant
  app.get("/api/branding/:tenantId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      
      // Only super_admin or users from same tenant can view branding
      if (req.user.role !== "super_admin" && req.user.tenantId !== tenantId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const branding = await storage.getBrandingByTenantId(tenantId);
      res.json(branding || {});
    } catch (error: any) {
      console.error("Get branding error:", error);
      res.status(500).json({ error: "Failed to get branding" });
    }
  });

  // Update Branding
  app.put("/api/branding/:tenantId", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const brandingData = req.body;

      // Super admins can update any tenant, tenant admins only their own
      if (req.user.role === "tenant_admin" && req.user.tenantId !== tenantId) {
        return res.status(403).json({ error: "Forbidden: Can only update your own tenant's branding" });
      }

      const branding = await storage.upsertBranding(tenantId, brandingData);

      await auditLog(req, "branding_updated", "branding", branding.id, brandingData);

      res.json(branding);
    } catch (error: any) {
      console.error("Update branding error:", error);
      res.status(500).json({ error: "Failed to update branding" });
    }
  });

  // =======================
  // SECURITY EVENTS & RISK ASSESSMENT
  // =======================
  
  // Get Security Events
  app.get("/api/security-events", requireAuth, async (req: Request, res: Response) => {
    try {
      let userId: string;
      
      if (req.user.role === "user") {
        // Regular users can only see their own events
        userId = req.user.id;
      } else {
        // Admins can query specific user, but must verify tenant access
        const requestedUserId = req.query.userId as string;
        if (requestedUserId) {
          const targetUser = await storage.getUser(requestedUserId);
          if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
          }
          // Tenant admins can only view users in their tenant
          if (req.user.role === "tenant_admin" && targetUser.tenantId !== req.user.tenantId) {
            return res.status(403).json({ error: "Forbidden" });
          }
          userId = requestedUserId;
        } else {
          userId = req.user.id;
        }
      }
      
      const events = await storage.getSecurityEvents(userId);
      res.json(events);
    } catch (error: any) {
      console.error("Get security events error:", error);
      res.status(500).json({ error: "Failed to get security events" });
    }
  });

  // Resolve Security Event
  app.post("/api/security-events/:id/resolve", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // First, fetch the event to verify tenant ownership
      const existingEvent = await storage.getSecurityEventById(id);
      
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Verify tenant isolation: tenant admins can only resolve events for users in their tenant
      if (req.user.role === "tenant_admin") {
        if (!existingEvent.userId) {
          return res.status(403).json({ error: "Forbidden: Event has no associated user" });
        }
        
        const eventUser = await storage.getUser(existingEvent.userId);
        if (!eventUser || eventUser.tenantId !== req.user.tenantId) {
          return res.status(403).json({ error: "Forbidden: Cannot resolve events from other tenants" });
        }
      }
      
      const event = await storage.resolveSecurityEvent(id, req.user.id);
      
      await auditLog(req, "security_event_resolved", "security_event", id, { eventType: event.type });
      
      res.json(event);
    } catch (error: any) {
      console.error("Resolve security event error:", error);
      res.status(500).json({ error: "Failed to resolve event" });
    }
  });

  // Create Security Event (internal use)
  async function createSecurityEvent(
    userId: string | null,
    type: string,
    riskScore: number,
    details: any,
    req: Request
  ) {
    try {
      await storage.createSecurityEvent({
        userId,
        type,
        riskScore,
        details,
        ipAddress: req.ip,
        location: req.headers["cf-ipcountry"] as string || "Unknown",
        resolved: false,
      });
    } catch (error) {
      console.error("Failed to create security event:", error);
    }
  }

  // Suspicious Login Detection
  async function detectSuspiciousLogin(
    userId: string, 
    currentIp: string, 
    user: any
  ): Promise<{ suspicious: boolean; events: any[] }> {
    const detectedEvents: any[] = [];
    
    // 1. Check for unusual location (different IP from last login)
    if (user.lastLoginIp && user.lastLoginIp !== currentIp) {
      const ipChanged = !currentIp.startsWith(user.lastLoginIp.split('.')[0]); // Check if subnet changed
      if (ipChanged) {
        detectedEvents.push({
          type: 'unusual_location',
          riskScore: 40,
          details: { previousIp: user.lastLoginIp, currentIp },
          description: 'Login from new location'
        });
      }
    }
    
    // 2. Check for unusual time (login between 2 AM - 5 AM local time is suspicious)
    const hour = new Date().getHours();
    if (hour >= 2 && hour < 5) {
      detectedEvents.push({
        type: 'unusual_time',
        riskScore: 20,
        details: { hour },
        description: 'Login during unusual hours (2 AM - 5 AM)'
      });
    }
    
    // 3. Check for velocity (impossible travel - login from different location too quickly)
    if (user.lastLoginAt) {
      const timeSinceLastLogin = Date.now() - new Date(user.lastLoginAt).getTime();
      const minutesSinceLastLogin = timeSinceLastLogin / (1000 * 60);
      
      // If last login was less than 30 minutes ago and IP changed significantly
      if (minutesSinceLastLogin < 30 && user.lastLoginIp && user.lastLoginIp !== currentIp) {
        detectedEvents.push({
          type: 'velocity_check_failed',
          riskScore: 60,
          details: { 
            minutesSinceLastLogin: Math.round(minutesSinceLastLogin),
            previousIp: user.lastLoginIp,
            currentIp 
          },
          description: 'Impossible travel detected (login from different location too quickly)'
        });
      }
    }
    
    // 4. Check for multiple failed attempts (recent failed login history)
    const recentFailedLogins = await storage.getRecentFailedLogins(user.email, 10);
    if (recentFailedLogins.length >= 3) {
      detectedEvents.push({
        type: 'multiple_failed_attempts',
        riskScore: 50,
        details: { failedAttempts: recentFailedLogins.length },
        description: `${recentFailedLogins.length} failed login attempts detected recently`
      });
    }
    
    return {
      suspicious: detectedEvents.length > 0,
      events: detectedEvents
    };
  }

  // Auto IP Blocking (when rate limit threshold exceeded)
  async function autoBlockIP(
    ipAddress: string, 
    tenantId: string | null, 
    reason: string
  ): Promise<void> {
    try {
      // Only auto-block if tenant exists (don't block platform-wide)
      if (!tenantId) {
        console.log(`Skipping auto-block for IP ${ipAddress} - no tenant context`);
        return;
      }
      
      // Check if IP is already blocked
      const existingRestrictions = await storage.getIpRestrictions(tenantId);
      const alreadyBlocked = existingRestrictions.some(
        r => r.type === 'block' && r.ipAddress === ipAddress && r.isActive
      );
      
      if (alreadyBlocked) {
        console.log(`IP ${ipAddress} already blocked for tenant ${tenantId}`);
        return;
      }
      
      // Create IP block restriction
      await storage.createIpRestriction({
        tenantId,
        type: 'block',
        ipAddress,
        description: `Auto-blocked: ${reason}`,
        isActive: true,
      });
      
      console.log(`Auto-blocked IP ${ipAddress} for tenant ${tenantId}: ${reason}`);
    } catch (error) {
      console.error("Failed to auto-block IP:", error);
    }
  }

  // =======================
  // WEBAUTHN / PASSKEYS
  // =======================
  
  // WebAuthn configuration
  const rpName = 'Authflow';
  const rpID = process.env.RP_ID || 'localhost'; // Replace with your domain in production
  const origin = process.env.ORIGIN || 'http://localhost:5000'; // Replace with your URL

  // Start WebAuthn Registration
  app.post("/api/webauthn/register/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get existing credentials to exclude
      const userCredentials = await storage.listWebauthnCredentials(req.user.id);
      const excludeCredentials = userCredentials.map((cred: any) => ({
        id: cred.credentialId, // Already a base64 string, SimpleWebAuthn will handle conversion
        transports: ['usb', 'ble', 'nfc', 'internal'] as any[],
      }));

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: req.user.id,
        userName: user.email,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      // Store challenge in session for verification
      req.session.webauthnChallenge = options.challenge;

      res.json(options);
    } catch (error: any) {
      console.error("WebAuthn registration start error:", error);
      res.status(500).json({ error: "Failed to start registration" });
    }
  });

  // Verify WebAuthn Registration
  app.post("/api/webauthn/register/verify", requireAuth, async (req: Request, res: Response) => {
    try {
      const { response: credentialResponse, deviceName } = req.body;
      
      if (!req.session?.webauthnChallenge) {
        return res.status(400).json({ error: "No registration in progress" });
      }

      const expectedChallenge = req.session.webauthnChallenge;

      const verification = await verifyRegistrationResponse({
        response: credentialResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Registration verification failed" });
      }

      const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;
      const credentialPublicKey = credential.publicKey;
      const credentialID = credential.id;
      const counter = credential.counter;

      // Store credential
      await storage.createWebauthnCredential({
        userId: req.user.id,
        credentialId: Buffer.from(credentialID).toString('base64'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
        deviceName: deviceName || 'Passkey',
      });

      // Clear challenge
      delete req.session.webauthnChallenge;

      await auditLog(req, "webauthn.registered", "user", req.user.id, { deviceName });

      res.json({ verified: true, message: "Passkey registered successfully" });
    } catch (error: any) {
      console.error("WebAuthn registration verify error:", error);
      res.status(500).json({ error: "Failed to verify registration" });
    }
  });

  // Start WebAuthn Authentication
  app.post("/api/webauthn/authenticate/start", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's credentials
      const userCredentials = await storage.listWebauthnCredentials(user.id);
      
      if (userCredentials.length === 0) {
        return res.status(400).json({ error: "No passkeys registered" });
      }

      const allowCredentials = userCredentials.map((cred: any) => ({
        id: cred.credentialId, // Already a base64 string, SimpleWebAuthn will handle conversion
        transports: ['usb', 'ble', 'nfc', 'internal'] as any[],
      }));

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: 'preferred',
      });

      // Store challenge and userId in session
      req.session.webauthnChallenge = options.challenge;
      req.session.webauthnUserId = user.id;

      res.json(options);
    } catch (error: any) {
      console.error("WebAuthn authentication start error:", error);
      res.status(500).json({ error: "Failed to start authentication" });
    }
  });

  // Verify WebAuthn Authentication
  app.post("/api/webauthn/authenticate/verify", async (req: Request, res: Response) => {
    try {
      const { response: credential, tenantSlug, redirectUri } = req.body;

      if (!req.session.webauthnChallenge || !req.session.webauthnUserId) {
        return res.status(400).json({ error: "No authentication in progress" });
      }

      // Validate redirect URI if provided
      let validatedRedirectUri: string | null = null;
      if (redirectUri && typeof redirectUri === 'string') {
        const tenant = tenantSlug ? await storage.getTenantBySlug(tenantSlug) : null;
        if (validateRedirectUri(redirectUri, tenant?.customDomain, req.get('host'))) {
          validatedRedirectUri = redirectUri;
        }
      }

      const expectedChallenge = req.session.webauthnChallenge;
      const userId = req.session.webauthnUserId;

      // Get the credential from database (credential.id comes from browser as base64url, convert to base64)
      const credentialIdBase64 = Buffer.from(credential.id, 'base64url').toString('base64');
      const dbCredential = await storage.getWebauthnCredentialByCredentialId(credentialIdBase64);
      
      if (!dbCredential || dbCredential.userId !== userId) {
        return res.status(400).json({ error: "Invalid credential" });
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: dbCredential.credentialId, // Already base64 string
          publicKey: Buffer.from(dbCredential.publicKey, 'base64'),
          counter: dbCredential.counter,
        },
      });

      if (!verification.verified) {
        return res.status(400).json({ error: "Authentication verification failed" });
      }

      // Update counter
      await storage.updateWebauthnCounter(
        dbCredential.credentialId,
        verification.authenticationInfo.newCounter
      );

      // Get user for token generation
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
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

      // Clear session data
      delete req.session.webauthnChallenge;
      delete req.session.webauthnUserId;

      await auditLog(req, "user.login", "user", user.id, { method: "webauthn" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
        token,
        redirectUri: validatedRedirectUri,
      });
    } catch (error: any) {
      console.error("WebAuthn authentication verify error:", error);
      res.status(500).json({ error: "Failed to verify authentication" });
    }
  });

  // List user's WebAuthn credentials
  app.get("/api/webauthn/credentials", requireAuth, async (req: Request, res: Response) => {
    try {
      const credentials = await storage.listWebauthnCredentials(req.user.id);
      res.json(credentials);
    } catch (error: any) {
      console.error("List credentials error:", error);
      res.status(500).json({ error: "Failed to list credentials" });
    }
  });

  // Delete WebAuthn credential
  app.delete("/api/webauthn/credentials/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteWebauthnCredential(id);

      await auditLog(req, "webauthn.deleted", "user", req.user.id, { credentialId: id });

      res.json({ message: "Passkey deleted successfully" });
    } catch (error: any) {
      console.error("Delete credential error:", error);
      res.status(500).json({ error: "Failed to delete credential" });
    }
  });

  // =======================
  // IP RESTRICTIONS
  // =======================
  
  // Get IP Restrictions
  app.get("/api/ip-restrictions", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      let tenantId: string;
      
      if (req.user.role === "super_admin") {
        // Super admin can query any tenant, but must provide tenantId
        tenantId = req.query.tenantId as string;
        if (!tenantId) {
          return res.status(400).json({ error: "tenantId required for super admin" });
        }
      } else {
        // Tenant admin can only view their own tenant's restrictions
        tenantId = req.user.tenantId!;
      }
      
      const restrictions = await storage.getIpRestrictions(tenantId);
      res.json(restrictions);
    } catch (error: any) {
      console.error("Get IP restrictions error:", error);
      res.status(500).json({ error: "Failed to get IP restrictions" });
    }
  });

  // Create IP Restriction
  app.post("/api/ip-restrictions", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      let tenantId: string;
      
      if (req.user.role === "super_admin") {
        // Super admin can create for any tenant
        tenantId = req.body.tenantId;
        if (!tenantId) {
          return res.status(400).json({ error: "tenantId required for super admin" });
        }
      } else {
        // Tenant admin can only create for their own tenant
        tenantId = req.user.tenantId!;
      }
      
      const restrictionData = { ...req.body, tenantId };

      const restriction = await storage.createIpRestriction(restrictionData);

      await auditLog(req, "ip_restriction_created", "ip_restriction", restriction.id, restrictionData);

      res.json(restriction);
    } catch (error: any) {
      console.error("Create IP restriction error:", error);
      res.status(500).json({ error: "Failed to create IP restriction" });
    }
  });

  // Delete IP Restriction
  app.delete("/api/ip-restrictions/:id", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteIpRestriction(id);

      await auditLog(req, "ip_restriction_deleted", "ip_restriction", id);

      res.json({ message: "IP restriction deleted" });
    } catch (error: any) {
      console.error("Delete IP restriction error:", error);
      res.status(500).json({ error: "Failed to delete IP restriction" });
    }
  });

  // =======================
  // GDPR COMPLIANCE
  // =======================
  
  // Request Data Export
  app.post("/api/gdpr/export", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const gdprRequest = await storage.createGdprRequest({
        userId,
        tenantId: req.user.tenantId,
        type: "export",
        status: "pending",
      });

      await auditLog(req, "gdpr_export_requested", "gdpr_request", gdprRequest.id);

      res.json({ message: "Data export requested. You will receive an email when ready.", requestId: gdprRequest.id });
    } catch (error: any) {
      console.error("GDPR export error:", error);
      res.status(500).json({ error: "Failed to request data export" });
    }
  });

  // Request Account Deletion
  app.post("/api/gdpr/delete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const gdprRequest = await storage.createGdprRequest({
        userId,
        tenantId: req.user.tenantId,
        type: "deletion",
        status: "pending",
      });

      await auditLog(req, "gdpr_deletion_requested", "gdpr_request", gdprRequest.id);

      res.json({ message: "Account deletion requested. This will be processed within 30 days.", requestId: gdprRequest.id });
    } catch (error: any) {
      console.error("GDPR deletion error:", error);
      res.status(500).json({ error: "Failed to request account deletion" });
    }
  });

  // Get GDPR Requests
  app.get("/api/gdpr/requests", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const requests = await storage.getGdprRequests(userId);
      res.json(requests);
    } catch (error: any) {
      console.error("Get GDPR requests error:", error);
      res.status(500).json({ error: "Failed to get GDPR requests" });
    }
  });

  // =======================
  // PASSWORD BREACH DETECTION
  // =======================
  
  // Check if password has been breached (using k-anonymity with Have I Been Pwned)
  app.post("/api/auth/check-password-breach", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;

      // Hash password with SHA-1
      const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Query Have I Been Pwned API (k-anonymity model)
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const data = await response.text();

      // Check if our hash suffix appears in the results
      const breached = data.split("\n").some(line => line.startsWith(suffix));

      res.json({ breached, safe: !breached });
    } catch (error: any) {
      console.error("Password breach check error:", error);
      // Fail open - don't block registration if API is down
      res.json({ breached: false, safe: true, error: "Unable to check at this time" });
    }
  });

  // =======================
  // ADVANCED ANALYTICS
  // =======================
  
  // Get Advanced Analytics
  app.get("/api/analytics/advanced", requireAuth, requireRole(["super_admin", "tenant_admin"]), async (req: Request, res: Response) => {
    try {
      let tenantId: string | undefined;
      
      if (req.user.role === "super_admin") {
        // Super admin can query any tenant or platform-wide
        tenantId = req.query.tenantId as string | undefined;
      } else {
        // Tenant admin can only view their own tenant
        tenantId = req.user.tenantId!;
      }
      
      const period = (req.query.period as string) || "30d";

      // Calculate date range
      const daysBack = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const analytics = await storage.getAdvancedAnalytics(tenantId, startDate);

      res.json(analytics);
    } catch (error: any) {
      console.error("Get advanced analytics error:", error);
      res.status(500).json({ error: "Failed to get analytics" });
    }
  });

  // =======================
  // DOWNLOAD/EXPORT ROUTES
  // =======================
  app.use("/api", downloadRoutes);

  return httpServer;
}
