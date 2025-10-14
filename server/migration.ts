import { storage } from "./storage";
import { hashPassword } from "./auth";

export interface Auth0User {
  email: string;
  email_verified?: boolean;
  name?: string;
  user_id?: string;
  identities?: Array<{
    connection: string;
    provider: string;
    user_id: string;
    isSocial: boolean;
  }>;
  app_metadata?: {
    role?: string;
    roles?: string[];
    authorization?: {
      roles?: string[];
    };
    [key: string]: any;
  };
  user_metadata?: {
    [key: string]: any;
  };
  blocked?: boolean;
  created_at?: string;
  updated_at?: string;
  // Password hash fields (if available from Auth0 export)
  password?: string; // bcrypt hash from Auth0
  passwordHash?: string; // alternative field name
}

export interface Auth0ImportOptions {
  tenantId: string;
  defaultRole?: "user" | "tenant_admin";
  sendWelcomeEmail?: boolean;
  overwriteExisting?: boolean;
  generatePasswordsIfMissing?: boolean;
}

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ email: string; error: string }>;
}

export class Auth0MigrationService {
  async importUsers(users: Auth0User[], options: Auth0ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      total: users.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const auth0User of users) {
      try {
        // Validate required fields
        if (!auth0User.email) {
          result.errors.push({ email: "unknown", error: "Email is required" });
          result.skipped++;
          continue;
        }

        // Check if user already exists
        const existingUser = await storage.getUserByEmail(auth0User.email, options.tenantId);
        if (existingUser && !options.overwriteExisting) {
          result.skipped++;
          continue;
        }

        // Determine password hash
        let passwordHash: string;
        
        if (auth0User.password || auth0User.passwordHash) {
          // Use existing bcrypt hash from Auth0
          // Auth0 uses bcrypt, which is compatible with our system
          passwordHash = auth0User.password || auth0User.passwordHash!;
        } else if (existingUser) {
          // Overwriting existing user - preserve existing password if not provided
          passwordHash = existingUser.passwordHash || "";
        } else if (options.generatePasswordsIfMissing) {
          // New user without password - generate temporary password if allowed
          // WARNING: This password is not communicated to the user!
          // In production, prefer to skip these users and send password reset links instead
          const tempPassword = this.generateSecurePassword();
          passwordHash = await hashPassword(tempPassword);
        } else {
          // New user without password and generatePasswordsIfMissing is false
          result.errors.push({ 
            email: auth0User.email, 
            error: "No password hash provided and generatePasswordsIfMissing is false" 
          });
          result.skipped++;
          continue;
        }

        // Map Auth0 role to Authflow role
        const role = this.mapAuth0Role(auth0User, options.defaultRole);

        // Parse name into firstName and lastName
        const nameParts = (auth0User.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create or update user
        if (existingUser) {
          // Update existing user - preserve existing values if not provided
          const updates: any = {};
          
          // Only update fields if new values are provided
          if (firstName) updates.firstName = firstName;
          if (lastName) updates.lastName = lastName;
          if (auth0User.email_verified !== undefined) {
            updates.emailVerified = auth0User.email_verified;
          }
          
          // Only update role if explicitly provided (not just defaultRole)
          // This prevents privilege downgrades
          if ((auth0User as any).role || auth0User.app_metadata?.role || 
              auth0User.app_metadata?.roles || auth0User.app_metadata?.authorization?.roles) {
            updates.role = role;
          }
          
          // Only update password if provided (prevents forced resets)
          if (auth0User.password || auth0User.passwordHash) {
            updates.passwordHash = passwordHash;
          } else if (options.generatePasswordsIfMissing) {
            // Only generate new password if explicitly requested
            updates.passwordHash = passwordHash;
          }
          
          await storage.updateUser(existingUser.id, updates);
        } else {
          // Create new user
          await storage.createUser({
            email: auth0User.email,
            firstName,
            lastName,
            passwordHash,
            emailVerified: auth0User.email_verified ?? false,
            role,
            tenantId: options.tenantId,
            mfaEnabled: false,
          });
        }

        result.imported++;
      } catch (error: any) {
        result.errors.push({ 
          email: auth0User.email || "unknown", 
          error: error.message 
        });
        result.skipped++;
      }
    }

    return result;
  }

  private mapAuth0Role(
    user: Auth0User & { role?: string }, 
    defaultRole: "user" | "tenant_admin" = "user"
  ): "user" | "tenant_admin" | "super_admin" {
    // 1. Check top-level role field (used by CSV imports)
    if ((user as any).role) {
      return this.normalizeRole((user as any).role);
    }

    // 2. Check app_metadata.role (Auth0 custom)
    if (user.app_metadata?.role) {
      return this.normalizeRole(user.app_metadata.role);
    }
    
    // 3. Check app_metadata.roles array (Auth0 custom)
    if (user.app_metadata?.roles && user.app_metadata.roles.length > 0) {
      // Use the highest privilege role
      if (user.app_metadata.roles.some((r: string) => r.toLowerCase().includes("super") || r.toLowerCase().includes("root"))) {
        return "super_admin";
      }
      if (user.app_metadata.roles.some((r: string) => r.toLowerCase().includes("admin"))) {
        return "tenant_admin";
      }
    }

    // 4. Check app_metadata.authorization.roles (Auth0 default structure)
    if (user.app_metadata?.authorization?.roles && user.app_metadata.authorization.roles.length > 0) {
      // Use the highest privilege role
      if (user.app_metadata.authorization.roles.some((r: string) => r.toLowerCase().includes("super") || r.toLowerCase().includes("root"))) {
        return "super_admin";
      }
      if (user.app_metadata.authorization.roles.some((r: string) => r.toLowerCase().includes("admin"))) {
        return "tenant_admin";
      }
    }

    return defaultRole;
  }

  private normalizeRole(role: string): "user" | "tenant_admin" | "super_admin" {
    const normalized = role.toLowerCase();
    if (normalized.includes("super") || normalized.includes("root")) {
      return "super_admin";
    }
    if (normalized.includes("admin")) {
      return "tenant_admin";
    }
    return "user";
  }

  private generateSecurePassword(): string {
    // Generate a secure 16-character password
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    const crypto = require("crypto");
    const bytes = crypto.randomBytes(16);
    
    for (let i = 0; i < 16; i++) {
      password += chars[bytes[i] % chars.length];
    }
    
    return password;
  }

  parseAuth0Export(jsonData: string): Auth0User[] {
    try {
      const data = JSON.parse(jsonData);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error}`);
    }
  }

  parseCSV(csvData: string): Auth0User[] {
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have header row and at least one data row");
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    const users: Auth0User[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const user: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, "");
        if (value) {
          user[header] = value;
        }
      });

      // Convert string booleans
      if (user.email_verified) {
        user.email_verified = user.email_verified.toLowerCase() === "true";
      }

      users.push(user as Auth0User);
    }

    return users;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }
}

export const migrationService = new Auth0MigrationService();
