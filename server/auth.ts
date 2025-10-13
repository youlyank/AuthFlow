import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET must be set. This is a critical security requirement for the authentication platform."
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex");
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
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
