# 📦 Authflow Data Export Guide

Complete guide to export all data from your Authflow project for migration to another Replit account.

---

## 🎯 What Can Be Exported

1. **Database Data** - All user records, tenants, sessions, etc.
2. **Code & Files** - Complete project source code
3. **Configuration** - Environment secrets and settings
4. **Schema** - Database structure and migrations

---

## 📊 Method 1: Database JSON Export (Recommended)

### Export All Tables to JSON
Run the custom export script I created:

```bash
tsx scripts/export-data.ts
```

**What it exports:**
- ✅ All 20+ database tables
- ✅ Complete with relationships
- ✅ JSON format for easy migration
- ✅ Single file: `authflow_export_YYYY-MM-DD.json`

**Output Example:**
```
📊 Exporting users...
📊 Exporting tenants...
📊 Exporting sessions...
...
✅ Export complete!
📁 File saved: authflow_export_2025-10-14.json
📊 Total records exported:
   - users: 150 records
   - tenants: 12 records
   - sessions: 45 records
   ...
```

---

## 💾 Method 2: SQL Database Dump

### Full Database Backup
```bash
# Export complete database as SQL
pg_dump $DATABASE_URL > authflow_backup.sql

# Export with compression
pg_dump $DATABASE_URL | gzip > authflow_backup.sql.gz
```

### Export Specific Tables
```bash
# Export only user-related tables
pg_dump $DATABASE_URL -t users -t tenants -t sessions > authflow_users.sql

# Export everything except temporary data
pg_dump $DATABASE_URL \
  --exclude-table-data=sessions \
  --exclude-table-data=notifications \
  > authflow_core.sql
```

---

## 📋 Method 3: CSV Export (Individual Tables)

### Export Tables to CSV
```bash
# Export users
psql $DATABASE_URL -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv

# Export tenants
psql $DATABASE_URL -c "COPY tenants TO STDOUT WITH CSV HEADER" > tenants.csv

# Export all major tables
for table in users tenants plans sessions audit_logs login_history; do
  psql $DATABASE_URL -c "COPY $table TO STDOUT WITH CSV HEADER" > ${table}.csv
done
```

---

## 🗂️ Method 4: Code & Files Export

### Option A: Download as ZIP
1. Click **three dots menu (⋮)** in your Repl
2. Select **"Download as ZIP"**
3. Saves complete project to `authflow.zip`

### Option B: GitHub Export (Best Practice)
```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Export Authflow project for migration"

# Push to GitHub (replace with your repo)
git remote add origin https://github.com/yourusername/authflow.git
git push -u origin main
```

---

## 🔐 Method 5: Export Environment Secrets

### List All Secrets (Names Only)
Create a secrets documentation file:

```bash
# List all environment variables
env | grep -E "DATABASE_URL|SESSION_SECRET|STRIPE|OAUTH|GOOGLE|GITHUB" > secrets_list.txt
```

### Document Secrets Manually
Create `.env.backup` file with actual values (KEEP SECURE!):

```bash
# In your terminal, copy secrets
cat > .env.backup << 'EOF'
DATABASE_URL=your_database_url_here
SESSION_SECRET=your_session_secret_here
STRIPE_SECRET_KEY=your_stripe_key_here
# ... other secrets
EOF
```

**⚠️ SECURITY WARNING:** 
- Never commit `.env.backup` to Git
- Store securely (password manager or encrypted file)
- Delete after migration complete

---

## 📦 Method 6: Complete Project Export (All-in-One)

### Create Complete Backup Script
```bash
#!/bin/bash
# Create backup directory
mkdir -p authflow_backup
cd authflow_backup

# 1. Export database to JSON
tsx ../scripts/export-data.ts

# 2. Export database to SQL
pg_dump $DATABASE_URL > database_backup.sql

# 3. Export schema
npm run db:generate
cp -r drizzle ./

# 4. Copy all code
cp -r ../client ./client
cp -r ../server ./server
cp -r ../shared ./shared
cp ../package.json ./
cp ../tsconfig.json ./
cp ../vite.config.ts ./

# 5. Create secrets template
cat > .env.template << 'EOF'
DATABASE_URL=<new_database_url>
SESSION_SECRET=<generate_new_or_copy>
STRIPE_SECRET_KEY=<if_using_stripe>
EOF

# 6. Create README
cat > README_MIGRATION.md << 'EOF'
# Authflow Migration Package

## Contents
- database_backup.sql - Full SQL dump
- authflow_export_*.json - JSON export
- client/ server/ shared/ - Source code
- drizzle/ - Database migrations
- .env.template - Environment variables template

## Migration Steps
1. Create new Repl in target account
2. Upload all files OR import from GitHub
3. Run: npm install
4. Create new database in new account
5. Update .env with new DATABASE_URL
6. Run: npm run db:push
7. Import data: psql $DATABASE_URL < database_backup.sql
8. Test: npm run dev
EOF

# 7. Create archive
cd ..
tar -czf authflow_complete_backup.tar.gz authflow_backup/

echo "✅ Complete backup created: authflow_complete_backup.tar.gz"
```

---

## 🚀 Quick Export Commands

### Fastest Export (Essential Data Only)
```bash
# 1. Export database data
tsx scripts/export-data.ts

# 2. Download code as ZIP
# (Use Repl menu: Download as ZIP)

# 3. Document secrets
cat > secrets_backup.txt << 'EOF'
DATABASE_URL=...
SESSION_SECRET=...
EOF
```

### Complete Export (Everything)
```bash
# Run all exports
tsx scripts/export-data.ts                           # JSON export
pg_dump $DATABASE_URL > authflow_backup.sql         # SQL dump
git add . && git commit -m "Export project"          # Git backup
# Download as ZIP from Repl menu
```

---

## 📋 Export Checklist

Before migrating, ensure you've exported:

### Database
- [ ] All tables exported to JSON (`tsx scripts/export-data.ts`)
- [ ] SQL dump created (`pg_dump $DATABASE_URL > backup.sql`)
- [ ] Database schema documented (`npm run db:generate`)

### Code
- [ ] Complete project downloaded as ZIP
- [ ] OR: Project pushed to GitHub
- [ ] All custom files included (design_guidelines.md, DEPLOYMENT_GUIDE.md, etc.)

### Configuration
- [ ] All secrets documented (DATABASE_URL, SESSION_SECRET, etc.)
- [ ] Environment variables listed
- [ ] API keys noted (Google OAuth, GitHub OAuth, Stripe, etc.)

### Documentation
- [ ] README.md copied
- [ ] Custom documentation files copied
- [ ] Migration instructions prepared

---

## 🎯 Migration to New Account

### Step 1: Import Code
```bash
# In new Repl
git clone https://github.com/yourusername/authflow.git
# OR upload ZIP file
# OR import from GitHub in Repl UI
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Database
```bash
# In new account, create new PostgreSQL database
# Copy new DATABASE_URL from secrets panel

# Push schema
npm run db:push

# Import data
psql $DATABASE_URL < authflow_backup.sql
# OR import JSON (create custom import script)
```

### Step 4: Configure Secrets
```bash
# In new Repl's secrets panel, add:
# - DATABASE_URL (from new database)
# - SESSION_SECRET (generate new or copy)
# - All other API keys
```

### Step 5: Test
```bash
npm run dev
# Verify all features work
```

---

## 📞 Support

If you encounter issues:
1. Check database connection: `psql $DATABASE_URL`
2. Verify all secrets are set: `env | grep DATABASE`
3. Test migrations: `npm run db:push --force`
4. Check logs for errors

---

## 🔒 Security Notes

**CRITICAL:**
- ⚠️ Never commit `.env` or secrets to Git
- ⚠️ Delete backup files after successful migration
- ⚠️ Rotate API keys and secrets after migration
- ⚠️ Use different SESSION_SECRET in new account
- ⚠️ Update OAuth callback URLs for new domain

---

## ✅ Next Steps

After exporting all data:
1. Create new Repl in target account
2. Import code (GitHub or ZIP)
3. Create new database
4. Import schema and data
5. Configure all secrets
6. Test thoroughly
7. Delete old backups securely
