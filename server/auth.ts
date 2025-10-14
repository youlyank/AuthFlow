import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { rsaKeys } from "./keys";

// Using RSA asymmetric signing for enterprise-grade security
console.log("🔐 JWT signing with RSA-4096 asymmetric keys (kid:", rsaKeys.kid + ")");

const JWT_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_IN = "30d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, rsaKeys.privateKey, { 
    algorithm: "RS256",
    expiresIn: JWT_EXPIRES_IN,
    keyid: rsaKeys.kid, // Include key ID in JWT header
  });
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, rsaKeys.publicKey, {
    algorithms: ["RS256"], // Only accept RS256 for security
  }) as JwtPayload;
}

// OAuth2 Token Generation and Hashing
export function generateOAuth2Secret(): string {
  return randomBytes(32).toString("hex"); // 64 character hex string
}

export function generateOAuth2Code(): string {
  return randomBytes(32).toString("base64url"); // URL-safe base64
}

export function generateOAuth2Token(): string {
  return randomBytes(48).toString("base64url"); // Longer for access/refresh tokens
}

export function hashOAuth2Secret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifyOAuth2Secret(secret: string, hash: string): boolean {
  return hashOAuth2Secret(secret) === hash;
}

// API Key Generation and Hashing
export function generateAPIKey(prefix: string = "ak_live"): { key: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(32).toString("hex");
  const key = `${prefix}_${randomPart}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const keyPrefix = key.substring(0, 16); // First 16 chars for display
  
  return { key, keyHash, keyPrefix };
}

export function hashAPIKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function verifyAPIKey(key: string, hash: string): boolean {
  return hashAPIKey(key) === hash;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for API key authentication
    if (authHeader?.startsWith("Bearer ak_")) {
      const apiKey = authHeader.substring(7);
      const keyHash = hashAPIKey(apiKey);
      const apiKeyRecord = await storage.getAPIKeyByHash(keyHash);
      
      if (!apiKeyRecord) {
        return res.status(401).json({ error: "Invalid or revoked API key" });
      }
      
      // Double-check isActive (storage query already filters, but be explicit)
      if (!apiKeyRecord.isActive) {
        return res.status(401).json({ error: "API key has been revoked" });
      }
      
      // Double-check expiration
      if (apiKeyRecord.expiresAt && new Date() > new Date(apiKeyRecord.expiresAt)) {
        return res.status(401).json({ error: "API key has expired" });
      }
      
      // Get the tenant admin user for this API key
      const user = apiKeyRecord.createdBy 
        ? await storage.getUser(apiKeyRecord.createdBy)
        : null;
        
      if (!user) {
        return res.status(401).json({ error: "API key owner not found" });
      }
      
      // Verify user is still active
      if (!user.isActive) {
        return res.status(401).json({ error: "API key owner account is deactivated" });
      }
      
      // Store API key permissions on request for downstream enforcement
      req.user = user;
      req.user.apiKeyPermissions = apiKeyRecord.permissions;
      
      // Update last used timestamp (non-blocking)
      storage.updateAPIKeyLastUsed(apiKeyRecord.id).catch(err => 
        console.error("Failed to update API key last used:", err)
      );
      
      return next();
    }
    
    // Regular JWT token authentication
    const token = authHeader?.replace("Bearer ", "") || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = verifyToken(token);
    const user = await storage.getUser(payload.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid session" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(roles: string[], apiKeyPermission?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // If authenticated via API key, enforce permissions FIRST
    if (req.user.apiKeyPermissions) {
      const permissions = req.user.apiKeyPermissions as string[];
      
      // API keys must have explicit permission unless wildcard
      if (!permissions.includes("*")) {
        if (!apiKeyPermission) {
          // No permission defined for this route - deny API key access
          return res.status(403).json({ 
            error: "API keys cannot access this endpoint",
            message: "This route requires JWT authentication"
          });
        }
        
        if (!permissions.includes(apiKeyPermission)) {
          return res.status(403).json({ 
            error: "Insufficient API key permissions",
            required: apiKeyPermission,
            granted: permissions
          });
        }
      }
      // If we reach here, API key has valid permission (wildcard or explicit)
    }

    // Check role (applies to both JWT and API key auth after permission check)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Note: requireAPIKeyPermission is deprecated - use requireRole(roles, apiKeyPermission) instead
// Centralized permission enforcement is now handled in requireRole() middleware

// ==================== RATE LIMITING ====================

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  register: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  passwordReset: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 30 },
  passwordResetComplete: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  acceptInvitation: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  mfaVerify: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 15 },
  magicLinkRequest: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 30 },
  magicLinkVerify: { maxAttempts: 10, windowMinutes: 15, blockMinutes: 15 },
  emailVerify: { maxAttempts: 10, windowMinutes: 60, blockMinutes: 15 },
  resendVerification: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 30 },
};

/**
 * Rate limit middleware factory
 * Usage: app.post("/api/auth/login", rateLimitByIP("login"), async (req, res) => {...})
 */
export function rateLimitByIP(action: keyof typeof RATE_LIMIT_CONFIG) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || "unknown";
    await checkRateLimit(identifier, action, req, res, next);
  };
}

/**
 * Rate limit by email (for login/register)
 */
export function rateLimitByEmail(action: keyof typeof RATE_LIMIT_CONFIG) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.body.email || "unknown";
    await checkRateLimit(identifier, action, req, res, next);
  };
}

/**
 * Check if request should be rate limited (internal function)
 * Returns error response if blocked, otherwise continues
 */
async function checkRateLimit(
  identifier: string, // IP or email
  action: keyof typeof RATE_LIMIT_CONFIG,
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const config = RATE_LIMIT_CONFIG[action];
    const now = new Date();
    
    // Get existing rate limit record
    const rateLimit = await storage.getRateLimit(identifier, action);
    
    // Check if currently blocked
    if (rateLimit?.blockedUntil && now < new Date(rateLimit.blockedUntil)) {
      const minutesRemaining = Math.ceil(
        (new Date(rateLimit.blockedUntil).getTime() - now.getTime()) / 60000
      );
      return res.status(429).json({
        error: "Too many attempts. Please try again later.",
        retryAfter: minutesRemaining,
        blockedUntil: rateLimit.blockedUntil,
      });
    }
    
    // Check if within rate limit window
    if (rateLimit?.windowStart) {
      const windowAge = (now.getTime() - new Date(rateLimit.windowStart).getTime()) / 60000;
      
      if (windowAge < config.windowMinutes) {
        // Still within window - check attempt count
        if (rateLimit.attempts >= config.maxAttempts) {
          // Block the identifier
          const blockedUntil = new Date(now.getTime() + config.blockMinutes * 60000);
          await storage.updateRateLimit(identifier, action, {
            blockedUntil,
            attempts: rateLimit.attempts + 1,
          });
          
          return res.status(429).json({
            error: `Too many ${action} attempts. Account temporarily blocked.`,
            retryAfter: config.blockMinutes,
            blockedUntil,
          });
        }
      } else {
        // Window expired - reset attempts
        await storage.updateRateLimit(identifier, action, {
          attempts: 0,
          windowStart: now,
          blockedUntil: null,
        });
      }
    }
    
    // Rate limit check passed
    next();
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Don't block on rate limit errors - fail open for availability
    next();
  }
}

/**
 * Record a failed attempt (e.g., wrong password)
 */
export async function recordFailedAttempt(
  identifier: string,
  action: keyof typeof RATE_LIMIT_CONFIG
) {
  try {
    const config = RATE_LIMIT_CONFIG[action];
    const now = new Date();
    
    const existing = await storage.getRateLimit(identifier, action);
    
    if (!existing) {
      // Create new rate limit record
      await storage.createRateLimit({
        identifier,
        action,
        attempts: 1,
        windowStart: now,
      });
    } else {
      // Check if window expired
      const windowAge = (now.getTime() - new Date(existing.windowStart).getTime()) / 60000;
      
      if (windowAge >= config.windowMinutes) {
        // Reset window
        await storage.updateRateLimit(identifier, action, {
          attempts: 1,
          windowStart: now,
          blockedUntil: null,
        });
      } else {
        // Increment attempts
        const newAttempts = existing.attempts + 1;
        const updates: any = { attempts: newAttempts };
        
        // Check if should block
        if (newAttempts >= config.maxAttempts) {
          updates.blockedUntil = new Date(now.getTime() + config.blockMinutes * 60000);
        }
        
        await storage.updateRateLimit(identifier, action, updates);
      }
    }
  } catch (error) {
    console.error("Failed to record rate limit attempt:", error);
  }
}

/**
 * Reset rate limit on successful action (e.g., successful login)
 */
export async function resetRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMIT_CONFIG
) {
  try {
    const existing = await storage.getRateLimit(identifier, action);
    if (existing) {
      await storage.updateRateLimit(identifier, action, {
        attempts: 0,
        windowStart: new Date(),
        blockedUntil: null,
      });
    }
  } catch (error) {
    console.error("Failed to reset rate limit:", error);
  }
}

// ==================== END RATE LIMITING ====================

export async function auditLog(
  req: Request,
  action: string,
  entity: string,
  entityId?: string,
  changes?: any
) {
  const user = req.user;
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"];

  await storage.createAuditLog({
    tenantId: user?.tenantId,
    userId: user?.id,
    action,
    entity,
    entityId,
    changes,
    ipAddress,
    userAgent,
  });
}
