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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
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

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

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
