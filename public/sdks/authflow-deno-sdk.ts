/**
 * AuthFlow Deno SDK
 * Official Deno/Fresh integration for AuthFlow authentication
 * 
 * Installation:
 * import { AuthFlowClient } from "https://deno.land/x/authflow/mod.ts";
 * 
 * Usage:
 * const authflow = new AuthFlowClient({
 *   domain: Deno.env.get("AUTHFLOW_DOMAIN")!,
 *   clientId: Deno.env.get("AUTHFLOW_CLIENT_ID")!,
 *   clientSecret: Deno.env.get("AUTHFLOW_CLIENT_SECRET")!,
 * });
 */

export interface AuthFlowConfig {
  domain: string;
  clientId: string;
  clientSecret: string;
}

export interface AuthFlowUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  tenantId?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthFlowUser;
}

export interface UserResponse {
  user: AuthFlowUser;
}

export class AuthFlowClient {
  private domain: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config: AuthFlowConfig) {
    this.domain = config.domain.replace(/\/$/, "");
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${this.domain}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.domain}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  }

  async verifyToken(token: string): Promise<UserResponse> {
    const response = await fetch(`${this.domain}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    return response.json();
  }

  async setupMFA(
    token: string,
    method: "totp" | "email" | "sms",
  ): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/mfa/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ method }),
    });

    if (!response.ok) {
      throw new Error("MFA setup failed");
    }

    return response.json();
  }

  async verifyMFA(
    token: string,
    code: string,
    method: string,
  ): Promise<any> {
    const response = await fetch(`${this.domain}/api/auth/mfa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code, method }),
    });

    if (!response.ok) {
      throw new Error("MFA verification failed");
    }

    return response.json();
  }

  async logout(token: string): Promise<void> {
    await fetch(`${this.domain}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  getOAuthUrl(provider: "google" | "github", redirectUri: string): string {
    return `${this.domain}/api/auth/oauth/${provider}?redirect_uri=${
      encodeURIComponent(redirectUri)
    }`;
  }
}

// Deno Fresh middleware
export function authflowMiddleware(client: AuthFlowClient) {
  return async (req: Request, ctx: any) => {
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { user } = await client.verifyToken(token);
        ctx.state.authflowUser = user;
      } catch {
        // Continue without user
      }
    }

    return ctx.next();
  };
}

// Helper function for protected routes
export async function requireAuth(
  req: Request,
  client: AuthFlowClient,
): Promise<AuthFlowUser> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const { user } = await client.verifyToken(token);
    return user;
  } catch {
    throw new Response("Invalid token", { status: 401 });
  }
}

// Example Fresh route usage:
/*
// routes/api/profile.ts
import { Handlers } from "$fresh/server.ts";
import { AuthFlowClient, requireAuth } from "https://deno.land/x/authflow/mod.ts";

const authflow = new AuthFlowClient({
  domain: Deno.env.get("AUTHFLOW_DOMAIN")!,
  clientId: Deno.env.get("AUTHFLOW_CLIENT_ID")!,
  clientSecret: Deno.env.get("AUTHFLOW_CLIENT_SECRET")!,
});

export const handler: Handlers = {
  async GET(req) {
    const user = await requireAuth(req, authflow);
    return new Response(JSON.stringify({ user }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};

// routes/api/login.ts
export const handler: Handlers = {
  async POST(req) {
    const { email, password } = await req.json();
    const result = await authflow.login(email, password);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
*/

export default AuthFlowClient;
