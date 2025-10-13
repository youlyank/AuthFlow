import crypto from "crypto";
import { storage } from "./storage";

export interface WebhookEvent {
  event: string;
  tenantId: string;
  data: any;
  timestamp: string;
}

// Trigger webhook for an event
export async function triggerWebhook(event: string, tenantId: string, data: any): Promise<void> {
  try {
    // Get all active webhooks for this tenant that subscribe to this event
    const allWebhooks = await storage.listWebhooks(tenantId);
    const webhooks = allWebhooks.filter(
      (webhook) => webhook.isActive && webhook.events.includes(event)
    );

    // Create delivery records for each webhook
    for (const webhook of webhooks) {
      const payload: WebhookEvent = {
        event,
        tenantId,
        data,
        timestamp: new Date().toISOString(),
      };

      await storage.createWebhookDelivery({
        webhookId: webhook.id,
        tenantId,
        event,
        payload,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
      });
    }

    // Process deliveries asynchronously (don't await)
    processWebhookDeliveries().catch((err) =>
      console.error("Error processing webhook deliveries:", err)
    );
  } catch (error) {
    console.error("Error triggering webhook:", error);
  }
}

// Process pending webhook deliveries with atomic claiming
export async function processWebhookDeliveries(): Promise<void> {
  const pendingDeliveries = await storage.getPendingWebhookDeliveries(50);

  for (const delivery of pendingDeliveries) {
    try {
      // Atomically claim this delivery by updating status to "processing"
      // This prevents other workers from processing the same delivery
      const claimed = await storage.claimWebhookDelivery(delivery.id);
      
      if (!claimed) {
        // Another worker already claimed this delivery
        continue;
      }

      await deliverWebhook(delivery);
    } catch (error) {
      console.error(`Error delivering webhook ${delivery.id}:`, error);
      // Mark as failed on uncaught errors
      await storage.updateWebhookDelivery(delivery.id, {
        status: "failed",
        responseBody: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
}

// Deliver a single webhook
async function deliverWebhook(delivery: any): Promise<void> {
  try {
    // Get webhook details
    const webhook = await storage.getWebhook(delivery.webhookId, delivery.tenantId);
    if (!webhook || !webhook.isActive) {
      // Webhook deleted or deactivated - mark as failed
      await storage.updateWebhookDelivery(delivery.id, {
        status: "failed",
        responseStatus: 0,
        responseBody: "Webhook no longer active",
      });
      return;
    }

    // Create timestamp for replay protection
    const timestamp = Date.now().toString();
    const payloadWithTimestamp = JSON.stringify(delivery.payload);
    const signaturePayload = `${timestamp}.${payloadWithTimestamp}`;
    
    // Create HMAC signature with timestamp
    const signature = generateWebhookSignature(signaturePayload, webhook.secret);

    // Send HTTP request
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Timestamp": timestamp,
        "X-Webhook-Event": delivery.event,
        "X-Webhook-Delivery-Id": delivery.id,
      },
      body: payloadWithTimestamp,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await storage.updateWebhookDelivery(delivery.id, {
        status: "success",
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
        deliveredAt: new Date(),
      });
    } else {
      // Failed - retry logic
      await handleWebhookFailure(delivery, response.status, responseBody);
    }
  } catch (error: any) {
    // Network error or timeout - retry
    await handleWebhookFailure(delivery, 0, error.message);
  }
}

// Handle webhook delivery failure with exponential backoff
async function handleWebhookFailure(
  delivery: any,
  status: number,
  responseBody: string
): Promise<void> {
  const attempts = delivery.attempts + 1;

  if (attempts >= delivery.maxAttempts) {
    // Max attempts reached - mark as failed
    await storage.updateWebhookDelivery(delivery.id, {
      status: "failed",
      attempts,
      responseStatus: status,
      responseBody: responseBody.substring(0, 1000),
    });
  } else {
    // Retry with exponential backoff (2^attempts minutes)
    const retryDelayMinutes = Math.pow(2, attempts);
    const nextRetryAt = new Date(Date.now() + retryDelayMinutes * 60 * 1000);

    // CRITICAL: Reset status to "pending" so scheduler can pick it up for retry
    await storage.updateWebhookDelivery(delivery.id, {
      status: "pending",
      attempts,
      responseStatus: status,
      responseBody: responseBody.substring(0, 1000),
      nextRetryAt,
    });
  }
}

// Generate HMAC SHA256 signature for webhook payload
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Verify webhook signature with timestamp (for customers to validate webhooks from Authflow)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string,
  maxAgeSeconds = 300 // 5 minutes
): boolean {
  // Check timestamp is recent to prevent replay attacks
  const webhookTime = parseInt(timestamp);
  const now = Date.now();
  
  if (isNaN(webhookTime) || Math.abs(now - webhookTime) > maxAgeSeconds * 1000) {
    return false; // Timestamp too old or invalid
  }

  // Verify signature
  const signaturePayload = `${timestamp}.${payload}`;
  const expectedSignature = generateWebhookSignature(signaturePayload, secret);
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Generate a random webhook secret
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Background scheduler for webhook retries
let webhookSchedulerInterval: NodeJS.Timeout | null = null;

export function startWebhookScheduler(intervalMs = 60000): void {
  if (webhookSchedulerInterval) {
    return; // Already running
  }

  console.log("Starting webhook delivery scheduler...");
  
  webhookSchedulerInterval = setInterval(async () => {
    try {
      await processWebhookDeliveries();
    } catch (error) {
      console.error("Error in webhook scheduler:", error);
    }
  }, intervalMs);
}

export function stopWebhookScheduler(): void {
  if (webhookSchedulerInterval) {
    clearInterval(webhookSchedulerInterval);
    webhookSchedulerInterval = null;
    console.log("Stopped webhook delivery scheduler");
  }
}
