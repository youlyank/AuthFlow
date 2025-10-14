import { db } from "../server/db";
import * as schema from "../shared/schema";
import * as fs from "fs";

async function exportAllData() {
  console.log("🚀 Starting data export...");

  const data: any = {};

  try {
    // Export all tables
    console.log("📊 Exporting users...");
    data.users = await db.select().from(schema.users);

    console.log("📊 Exporting tenants...");
    data.tenants = await db.select().from(schema.tenants);

    console.log("📊 Exporting plans...");
    data.plans = await db.select().from(schema.plans);

    console.log("📊 Exporting tenant_plans...");
    data.tenantPlans = await db.select().from(schema.tenantPlans);

    console.log("📊 Exporting sessions...");
    data.sessions = await db.select().from(schema.sessions);

    console.log("📊 Exporting oauth_accounts...");
    data.oauthAccounts = await db.select().from(schema.oauthAccounts);

    console.log("📊 Exporting mfa_secrets...");
    data.mfaSecrets = await db.select().from(schema.mfaSecrets);

    console.log("📊 Exporting webauthn_credentials...");
    data.webauthnCredentials = await db.select().from(schema.webauthnCredentials);

    console.log("📊 Exporting trusted_devices...");
    data.trustedDevices = await db.select().from(schema.trustedDevices);

    console.log("📊 Exporting notifications...");
    data.notifications = await db.select().from(schema.notifications);

    console.log("📊 Exporting audit_logs...");
    data.auditLogs = await db.select().from(schema.auditLogs);

    console.log("📊 Exporting login_history...");
    data.loginHistory = await db.select().from(schema.loginHistory);

    console.log("📊 Exporting api_keys...");
    data.apiKeys = await db.select().from(schema.apiKeys);

    console.log("📊 Exporting webhooks...");
    data.webhooks = await db.select().from(schema.webhooks);

    console.log("📊 Exporting webhook_deliveries...");
    data.webhookDeliveries = await db.select().from(schema.webhookDeliveries);

    console.log("📊 Exporting oauth2_clients...");
    data.oauth2Clients = await db.select().from(schema.oauth2Clients);

    console.log("📊 Exporting branding_customizations...");
    data.brandingCustomizations = await db.select().from(schema.brandingCustomizations);

    console.log("📊 Exporting security_events...");
    data.securityEvents = await db.select().from(schema.securityEvents);

    console.log("📊 Exporting ip_restrictions...");
    data.ipRestrictions = await db.select().from(schema.ipRestrictions);

    console.log("📊 Exporting gdpr_requests...");
    data.gdprRequests = await db.select().from(schema.gdprRequests);

    // Save to JSON file
    const exportFile = `authflow_export_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));

    console.log(`\n✅ Export complete!`);
    console.log(`📁 File saved: ${exportFile}`);
    console.log(`📊 Total records exported:`);
    
    Object.keys(data).forEach(table => {
      console.log(`   - ${table}: ${data[table].length} records`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Export failed:", error);
    process.exit(1);
  }
}

exportAllData();
