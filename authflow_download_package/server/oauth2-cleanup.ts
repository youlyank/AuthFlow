import { storage } from "./storage";

// Background scheduler for OAuth2 token cleanup
let cleanupSchedulerInterval: NodeJS.Timeout | null = null;

// Delete expired OAuth2 tokens, refresh tokens, and authorization codes
export async function cleanupExpiredOAuth2Tokens(): Promise<void> {
  try {
    const now = new Date();
    
    // Delete expired authorization codes
    const deletedCodes = await storage.deleteExpiredOAuth2AuthorizationCodes(now);
    
    // Delete expired refresh tokens
    const deletedRefreshTokens = await storage.deleteExpiredOAuth2RefreshTokens(now);
    
    // Delete expired access tokens (also deletes associated refresh tokens via cascade)
    const deletedAccessTokens = await storage.deleteExpiredOAuth2AccessTokens(now);
    
    const totalDeleted = deletedCodes + deletedRefreshTokens + deletedAccessTokens;
    
    if (totalDeleted > 0) {
      console.log(
        `OAuth2 cleanup: Deleted ${deletedAccessTokens} access tokens, ` +
        `${deletedRefreshTokens} refresh tokens, ${deletedCodes} authorization codes`
      );
    }
  } catch (error) {
    console.error("Error cleaning up expired OAuth2 tokens:", error);
  }
}

// Start the cleanup scheduler (runs every hour by default)
export function startOAuth2CleanupScheduler(intervalMs = 3600000): void {
  if (cleanupSchedulerInterval) {
    return; // Already running
  }

  console.log("Starting OAuth2 token cleanup scheduler (runs every hour)...");
  
  // Run immediately on startup
  cleanupExpiredOAuth2Tokens().catch((err) =>
    console.error("Error in initial OAuth2 cleanup:", err)
  );
  
  // Then schedule periodic cleanup
  cleanupSchedulerInterval = setInterval(async () => {
    try {
      await cleanupExpiredOAuth2Tokens();
    } catch (error) {
      console.error("Error in OAuth2 cleanup scheduler:", error);
    }
  }, intervalMs);
}

export function stopOAuth2CleanupScheduler(): void {
  if (cleanupSchedulerInterval) {
    clearInterval(cleanupSchedulerInterval);
    cleanupSchedulerInterval = null;
    console.log("Stopped OAuth2 token cleanup scheduler");
  }
}
