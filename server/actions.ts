import { storage } from "./storage";

export interface ActionContext {
  event: string;
  userId?: string;
  tenantId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ActionResult {
  allow: boolean;
  message?: string;
  metadata?: Record<string, any>;
}

export type ActionHandler = (context: ActionContext) => Promise<ActionResult>;

// Built-in actions registry
const actionsRegistry: Map<string, ActionHandler> = new Map();

/**
 * Register a custom action handler
 */
export function registerAction(event: string, handler: ActionHandler): void {
  actionsRegistry.set(event, handler);
  console.log(`✅ Registered action handler for event: ${event}`);
}

/**
 * Execute actions for a given event
 */
export async function executeActions(context: ActionContext): Promise<ActionResult> {
  const handler = actionsRegistry.get(context.event);
  
  if (!handler) {
    // No handler registered, allow by default
    return { allow: true };
  }

  try {
    const result = await handler(context);
    console.log(`Action executed for ${context.event}:`, result);
    return result;
  } catch (error: any) {
    console.error(`Error executing action for ${context.event}:`, error);
    // On error, deny by default for security
    return {
      allow: false,
      message: "Action execution failed",
    };
  }
}

// ========================================
// BUILT-IN ACTION EXAMPLES
// ========================================

/**
 * Example: Block registration from specific email domains
 */
registerAction("pre-register", async (context) => {
  const blockedDomains = ["tempmail.com", "throwaway.email"];
  const emailDomain = context.email?.split("@")[1]?.toLowerCase();
  
  if (emailDomain && blockedDomains.includes(emailDomain)) {
    return {
      allow: false,
      message: "Registration from this email domain is not allowed",
    };
  }
  
  return { allow: true };
});

/**
 * Example: Require approval for new user registrations
 */
registerAction("post-register", async (context) => {
  if (context.userId && context.tenantId) {
    // Could create a pending approval record here
    console.log(`New user ${context.userId} registered, awaiting approval`);
  }
  
  return { allow: true };
});

/**
 * Example: Block login from suspicious IPs
 */
registerAction("pre-login", async (context) => {
  const blockedIPs = ["192.0.2.0", "198.51.100.0"]; // Example IPs
  
  if (context.ipAddress && blockedIPs.includes(context.ipAddress)) {
    return {
      allow: false,
      message: "Login from this IP address is blocked",
    };
  }
  
  return { allow: true };
});

/**
 * Example: Log all successful logins
 */
registerAction("post-login", async (context) => {
  console.log(`User ${context.userId} logged in from ${context.ipAddress}`);
  
  // Could send notification, update analytics, etc.
  
  return { allow: true };
});

/**
 * Example: Require MFA for admin users
 */
registerAction("pre-login-check", async (context) => {
  if (context.userId && context.metadata?.role === "tenant_admin") {
    const user = await storage.getUser(context.userId);
    
    if (!user?.mfaEnabled) {
      return {
        allow: false,
        message: "MFA is required for admin users",
      };
    }
  }
  
  return { allow: true };
});

/**
 * Example: Enrich user data after registration
 */
registerAction("post-register-enrich", async (context) => {
  if (context.userId) {
    // Could fetch additional data, assign default roles, etc.
    console.log(`Enriching user data for ${context.userId}`);
  }
  
  return { allow: true };
});

// ========================================
// WEBHOOK-BASED ACTIONS
// ========================================

/**
 * Execute webhook-based action
 */
export async function executeWebhookAction(
  event: string,
  context: ActionContext
): Promise<ActionResult> {
  if (!context.tenantId) {
    return { allow: true }; // No tenant, skip webhook
  }

  // Get webhooks for this tenant and event
  const webhooks = await storage.listWebhooks(context.tenantId);
  const matchingWebhooks = webhooks.filter(w => 
    w.isActive && w.events?.includes(event)
  );

  if (matchingWebhooks.length === 0) {
    return { allow: true }; // No webhooks configured
  }

  // Execute webhooks (fire and forget for post-actions, await for pre-actions)
  const isPreAction = event.startsWith("pre-");
  
  for (const webhook of matchingWebhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Authflow-Signature": webhook.secret || "",
          "X-Authflow-Event": event,
        },
        body: JSON.stringify(context),
      });

      if (isPreAction && !response.ok) {
        // For pre-actions, block if webhook fails
        return {
          allow: false,
          message: "Webhook validation failed",
        };
      }

      if (isPreAction) {
        const result = await response.json();
        if (result.allow === false) {
          return {
            allow: false,
            message: result.message || "Blocked by webhook",
          };
        }
      }
    } catch (error: any) {
      console.error(`Webhook execution failed for ${webhook.url}:`, error);
      
      if (isPreAction) {
        // For pre-actions, fail closed (deny by default)
        return {
          allow: false,
          message: "Webhook execution failed",
        };
      }
    }
  }

  return { allow: true };
}

/**
 * Combined action execution (built-in + webhooks)
 */
export async function executeAllActions(context: ActionContext): Promise<ActionResult> {
  // Execute built-in actions first
  const builtinResult = await executeActions(context);
  if (!builtinResult.allow) {
    return builtinResult;
  }

  // Then execute webhook-based actions
  const webhookResult = await executeWebhookAction(context.event, context);
  if (!webhookResult.allow) {
    return webhookResult;
  }

  return { allow: true };
}
