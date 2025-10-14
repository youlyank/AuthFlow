#!/bin/bash

# Authflow Quick Export Script
# Exports all data for migration to another Replit account

set -e  # Exit on error

echo "🚀 Authflow Quick Export Starting..."
echo "===================================="
echo ""

# Create export directory with timestamp
EXPORT_DIR="authflow_export_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"
cd "$EXPORT_DIR"

echo "📁 Export directory: $EXPORT_DIR"
echo ""

# 1. Export database to JSON
echo "📊 Step 1/5: Exporting database to JSON..."
tsx ../scripts/export-data.ts
echo "✅ Database JSON export complete"
echo ""

# 2. Export database to SQL (if psql available)
if command -v pg_dump &> /dev/null; then
    echo "💾 Step 2/5: Creating SQL database dump..."
    pg_dump $DATABASE_URL > authflow_backup.sql
    echo "✅ SQL dump complete: authflow_backup.sql"
else
    echo "⏭️  Step 2/5: Skipping SQL dump (pg_dump not available)"
fi
echo ""

# 3. Copy source code
echo "📦 Step 3/5: Copying source code..."
mkdir -p code
cp -r ../client code/
cp -r ../server code/
cp -r ../shared code/
cp ../package.json code/
cp ../tsconfig.json code/
cp ../vite.config.ts code/
cp ../tailwind.config.ts code/
cp ../drizzle.config.ts code/
cp ../postcss.config.js code/
cp ../*.md code/ 2>/dev/null || true
echo "✅ Source code copied"
echo ""

# 4. Create secrets template
echo "🔐 Step 4/5: Creating secrets template..."
cat > secrets_template.txt << 'EOF'
# Authflow Secrets for Migration
# Copy actual values from current Repl's Secrets panel

# Database (create new database in new account)
DATABASE_URL=<get from new Repl's database>
PGHOST=<get from new Repl's database>
PGPORT=<get from new Repl's database>
PGUSER=<get from new Repl's database>
PGPASSWORD=<get from new Repl's database>
PGDATABASE=<get from new Repl's database>

# Session (generate new or copy existing)
SESSION_SECRET=<copy from current Repl OR generate new>

# Object Storage (if using)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=<copy from current Repl>
PUBLIC_OBJECT_SEARCH_PATHS=<copy from current Repl>
PRIVATE_OBJECT_DIR=<copy from current Repl>

# Optional: Stripe (if configured)
STRIPE_SECRET_KEY=<copy from current Repl>
VITE_STRIPE_PUBLIC_KEY=<copy from current Repl>

# Optional: OAuth (if configured)
GOOGLE_CLIENT_ID=<copy from current Repl>
GOOGLE_CLIENT_SECRET=<copy from current Repl>
GITHUB_CLIENT_ID=<copy from current Repl>
GITHUB_CLIENT_SECRET=<copy from current Repl>

# Optional: Email/SMS (if configured)
RESEND_API_KEY=<copy from current Repl>
TWILIO_ACCOUNT_SID=<copy from current Repl>
TWILIO_AUTH_TOKEN=<copy from current Repl>
TWILIO_PHONE_NUMBER=<copy from current Repl>
EOF
echo "✅ Secrets template created: secrets_template.txt"
echo ""

# 5. Create migration instructions
echo "📝 Step 5/5: Creating migration instructions..."
cat > MIGRATION_INSTRUCTIONS.md << 'EOF'
# Authflow Migration Instructions

## 📦 What's Included

This export package contains:
- `authflow_export_*.json` - Complete database export (JSON)
- `authflow_backup.sql` - SQL database dump (if available)
- `code/` - Complete source code
- `secrets_template.txt` - Environment variables template
- `MIGRATION_INSTRUCTIONS.md` - This file

## 🚀 Migration Steps

### Step 1: Create New Repl
1. Log into target Replit account
2. Create new Repl (Node.js/TypeScript)
3. Name it "Authflow" (or your choice)

### Step 2: Upload Code
**Option A: Upload ZIP**
1. Compress this export folder to ZIP
2. Upload to new Repl using Upload button
3. Extract files

**Option B: GitHub (Recommended)**
1. Push code to GitHub from current account
2. Import from GitHub in new account

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Setup Database
1. In new Repl, create PostgreSQL database (click "Add Database")
2. Copy DATABASE_URL from new Repl's Secrets panel
3. Update secrets_template.txt with new DATABASE_URL

### Step 5: Push Database Schema
```bash
npm run db:push
```

### Step 6: Import Data
**Option A: From JSON** (create custom import script)
**Option B: From SQL** (if you have authflow_backup.sql)
```bash
psql $DATABASE_URL < authflow_backup.sql
```

### Step 7: Configure All Secrets
1. Open secrets_template.txt
2. Go to new Repl's Secrets panel
3. Add ALL secrets listed in template
4. Use values from old Repl's secrets panel

Required secrets:
- DATABASE_URL (from new database)
- SESSION_SECRET (generate new: `openssl rand -base64 32`)
- Other secrets as needed

### Step 8: Test Application
```bash
npm run dev
```

Verify:
- ✅ App loads without errors
- ✅ Can login with existing users
- ✅ All features work
- ✅ Database data is present

### Step 9: Update OAuth Callbacks (if using)
If using Google/GitHub OAuth:
1. Update redirect URIs in Google/GitHub console
2. Use new Repl domain: `https://your-new-repl.repl.co`

### Step 10: Cleanup
1. Delete export folder from old account
2. Delete secrets_template.txt (after copying secrets)
3. Secure any backup files

## ⚠️ Important Notes

**Security:**
- Generate NEW SESSION_SECRET for production
- Rotate API keys after migration
- Never commit secrets to Git
- Delete backup files after migration

**Database:**
- New database will have different URL
- Import preserves all data and relationships
- Test thoroughly before decommissioning old Repl

**Domains:**
- Update OAuth callback URLs
- Update webhook URLs if using webhooks
- Test all external integrations

## 🐛 Troubleshooting

**Database connection failed:**
- Verify DATABASE_URL in secrets
- Check database is created in new account
- Run `npm run db:push --force` to reset schema

**Missing data after import:**
- Check SQL import completed without errors
- Verify JSON export has all tables
- Re-import if needed

**App crashes on start:**
- Check all required secrets are set
- Verify Node.js version matches
- Check logs for specific errors

## ✅ Migration Checklist

Before decommissioning old Repl:
- [ ] All code uploaded to new Repl
- [ ] All dependencies installed (`npm install`)
- [ ] Database created and schema pushed
- [ ] All data imported successfully
- [ ] All secrets configured
- [ ] Application tested and working
- [ ] OAuth callbacks updated (if applicable)
- [ ] Webhook URLs updated (if applicable)
- [ ] All features verified working
- [ ] Backup files deleted securely

## 📞 Need Help?

If you encounter issues:
1. Check logs: `npm run dev` (look for errors)
2. Verify secrets: `env | grep DATABASE`
3. Test database: `psql $DATABASE_URL`
4. Check package.json dependencies

---

Migration completed successfully? 🎉
Remember to delete old backup files and rotate secrets!
EOF
echo "✅ Migration instructions created"
echo ""

# Create README for the export
cat > README.md << 'EOF'
# Authflow Export Package

This package contains a complete export of your Authflow project for migration to another Replit account.

## 📁 Contents

- Database exports (JSON and SQL)
- Complete source code
- Environment variables template
- Migration instructions

## 🚀 Quick Start

1. Read `MIGRATION_INSTRUCTIONS.md` for detailed steps
2. Create new Repl in target account
3. Upload/import code
4. Setup database and import data
5. Configure secrets
6. Test application

## ⚠️ Security

Keep this export package SECURE:
- Contains database structure
- May contain sensitive data
- Store in safe location
- Delete after successful migration

See `MIGRATION_INSTRUCTIONS.md` for complete guide.
EOF

cd ..

echo ""
echo "============================================"
echo "✅ Export Complete!"
echo "============================================"
echo ""
echo "📁 Export location: $EXPORT_DIR/"
echo ""
echo "📦 Exported:"
echo "   ✅ Database (JSON + SQL)"
echo "   ✅ Source code"
echo "   ✅ Secrets template"
echo "   ✅ Migration instructions"
echo ""
echo "📖 Next steps:"
echo "   1. Review: $EXPORT_DIR/MIGRATION_INSTRUCTIONS.md"
echo "   2. Fill in: $EXPORT_DIR/secrets_template.txt"
echo "   3. Compress: zip -r ${EXPORT_DIR}.zip $EXPORT_DIR"
echo "   4. Transfer to new account"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Keep export secure (contains sensitive data)"
echo "   - Delete after successful migration"
echo "   - Rotate secrets in new account"
echo ""
