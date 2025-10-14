# Authflow Deployment Guide

## Exporting Your Project to Git

1. **Push to GitHub** using the Git pane in Replit or Git CLI:
   ```bash
   git add .
   git commit -m "Export Authflow project"
   git push origin main
   ```

2. **What gets exported:**
   - All source code (client/, server/, shared/)
   - Configuration files (package.json, tsconfig.json, etc.)
   - Database schema (shared/schema.ts)

3. **What does NOT get exported (you'll need to reconfigure):**
   - Environment variables/secrets (DATABASE_URL, JWT_SECRET, etc.)
   - PostgreSQL database data
   - Object storage bucket data

---

## Importing Project Back into Replit

### Method 1: Rapid Import
Simply prefix your GitHub URL with `replit.com/`:
```
https://replit.com/github.com/yourusername/authflow
```

### Method 2: Guided Import
Visit: `https://replit.com/import` and paste your GitHub repository URL.

---

## Required Environment Variables & Secrets

After importing, you **MUST** configure these secrets in Replit:

### 1. **Database Secrets (Auto-created by Replit)**
When you create a PostgreSQL database in Replit, these are automatically generated:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGUSER` - Database username
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name
- `PGPORT` - Database port

**Action Required:** Click "Create PostgreSQL Database" in Replit tools

### 2. **Session & Authentication Secrets (MUST MANUALLY ADD)**

#### Required Secrets:
```
SESSION_SECRET = <random-string-32-chars>
JWT_SECRET = <random-string-32-chars>
```

**How to generate secure secrets:**
```bash
# In Replit Shell, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command **twice** to get two different random strings:
- First one → `SESSION_SECRET`
- Second one → `JWT_SECRET`

### 3. **Email Service (REQUIRED for production)**
For Resend email integration:
```
RESEND_API_KEY = <your-resend-api-key>
```

**How to get:**
1. Sign up at https://resend.com
2. Get your API key from dashboard
3. Add it to Replit Secrets

### 4. **OAuth Providers (Optional - if using social login)**

#### Google OAuth:
```
GOOGLE_CLIENT_ID = <your-google-client-id>
GOOGLE_CLIENT_SECRET = <your-google-client-secret>
```

#### GitHub OAuth:
```
GITHUB_CLIENT_ID = <your-github-client-id>
GITHUB_CLIENT_SECRET = <your-github-client-secret>
```

### 5. **Object Storage (Auto-created by Replit)**
If using object storage, these are automatically generated:
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`
- `PRIVATE_OBJECT_DIR`
- `PUBLIC_OBJECT_SEARCH_PATHS`

**Action Required:** Enable Object Storage in Replit tools (if needed)

---

## Step-by-Step Setup After Import

### Step 1: Create Database
1. Open "All Tools" → "Database" in Replit
2. Click "Create PostgreSQL Database"
3. Wait for auto-configuration (DATABASE_URL and PG* secrets created automatically)

### Step 2: Add Required Secrets
1. Open "All Tools" → "Secrets" in Replit
2. Click "New Secret" and add:

**SESSION_SECRET:**
```bash
# Generate in Shell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and add as SESSION_SECRET
```

**JWT_SECRET:**
```bash
# Generate in Shell:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output and add as JWT_SECRET
```

**RESEND_API_KEY:**
```
Get from https://resend.com → Add as RESEND_API_KEY
```

### Step 3: Push Database Schema
Run in Replit Shell:
```bash
npm run db:push
```

This creates all tables (users, tenants, sessions, etc.) in your PostgreSQL database.

### Step 4: Install Dependencies
```bash
npm install
```

### Step 5: Start Application
```bash
npm run dev
```

Or use the "Start application" workflow in Replit.

---

## Creating Test Super Admin Account

After the app starts, you need to create a super admin user. Two options:

### Option 1: Via API (Recommended)
Use the signup endpoint with a special flag (you'll need to modify the signup route temporarily to allow super admin creation).

### Option 2: Via Database
Run this SQL in the Database tool:
```sql
INSERT INTO users (email, password, role, tenant_id, mfa_enabled, created_at)
VALUES (
  'admin@authflow.com',
  '$2a$10$YourHashedPasswordHere',  -- bcrypt hash of 'admin123'
  'super_admin',
  NULL,
  false,
  NOW()
);
```

**To generate the bcrypt hash:**
```javascript
// Run in Replit Shell:
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));"
```

---

## Optional Configurations

### OAuth Setup (Google)
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-repl-name.replit.app/api/auth/google/callback`
4. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Replit Secrets

### OAuth Setup (GitHub)
1. Go to https://github.com/settings/developers
2. Create OAuth App
3. Add callback URL: `https://your-repl-name.replit.app/api/auth/github/callback`
4. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to Replit Secrets

---

## Verification Checklist

After setup, verify everything works:

- [ ] Database connected (check workflow logs for "serving on port 5000")
- [ ] Can access homepage (should load without errors)
- [ ] Can create account / login
- [ ] Sessions persist (refresh page, still logged in)
- [ ] Email sending works (password reset, MFA codes)
- [ ] OAuth providers work (if configured)

---

## Troubleshooting

### "Authentication required" errors
- **Cause:** Missing `JWT_SECRET` or `SESSION_SECRET`
- **Fix:** Add both secrets to Replit Secrets

### "Database connection failed"
- **Cause:** Database not created or `DATABASE_URL` missing
- **Fix:** Create PostgreSQL database in Replit tools

### "Email sending failed"
- **Cause:** Missing `RESEND_API_KEY` or invalid key
- **Fix:** Add valid Resend API key to secrets

### OAuth login not working
- **Cause:** Missing OAuth client ID/secret or wrong callback URL
- **Fix:** Add OAuth secrets and verify callback URL matches your Replit domain

---

## Production Deployment (Publishing)

Once everything works in development:

1. Click "Publish" button in Replit (formerly "Deploy")
2. Replit automatically handles:
   - Building the application
   - Setting up hosting
   - Configuring TLS/HTTPS
   - Health checks
3. Your app will be available at `https://your-repl-name.replit.app`

**For custom domains:**
- Configure in Replit Deployments settings
- Update OAuth callback URLs to use custom domain

---

## Summary

**Minimum Required Secrets:**
1. `SESSION_SECRET` (generate with crypto.randomBytes)
2. `JWT_SECRET` (generate with crypto.randomBytes)
3. `RESEND_API_KEY` (get from resend.com)
4. Database secrets (auto-created by Replit)

**Optional Secrets:**
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (for Google login)
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` (for GitHub login)

**One-time Setup:**
1. Import project from GitHub
2. Create PostgreSQL database
3. Add required secrets
4. Run `npm run db:push`
5. Start the app

That's it! Your Authflow instance will be fully operational.
