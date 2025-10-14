#!/bin/bash

# Authflow Secrets Export Script
# Creates a template for documenting environment variables

echo "🔐 Authflow Secrets Export"
echo "=========================="
echo ""

# Create secrets backup file
cat > secrets_backup.template.txt << 'EOF'
# Authflow Environment Secrets Backup
# IMPORTANT: Fill in actual values, keep this file SECURE!
# Date exported: $(date)

# Database
DATABASE_URL=<copy from current Repl secrets>
PGHOST=<copy from current Repl secrets>
PGPORT=<copy from current Repl secrets>
PGUSER=<copy from current Repl secrets>
PGPASSWORD=<copy from current Repl secrets>
PGDATABASE=<copy from current Repl secrets>

# Authentication
SESSION_SECRET=<copy from current Repl secrets>

# Stripe (if using)
STRIPE_SECRET_KEY=<copy from current Repl secrets>
VITE_STRIPE_PUBLIC_KEY=<copy from current Repl secrets>

# Google OAuth (if using)
GOOGLE_CLIENT_ID=<copy from current Repl secrets>
GOOGLE_CLIENT_SECRET=<copy from current Repl secrets>

# GitHub OAuth (if using)
GITHUB_CLIENT_ID=<copy from current Repl secrets>
GITHUB_CLIENT_SECRET=<copy from current Repl secrets>

# Email Service (if configured)
RESEND_API_KEY=<copy from current Repl secrets>

# SMS Service (if configured)
TWILIO_ACCOUNT_SID=<copy from current Repl secrets>
TWILIO_AUTH_TOKEN=<copy from current Repl secrets>
TWILIO_PHONE_NUMBER=<copy from current Repl secrets>

# Object Storage (Replit)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=<copy from current Repl secrets>
PUBLIC_OBJECT_SEARCH_PATHS=<copy from current Repl secrets>
PRIVATE_OBJECT_DIR=<copy from current Repl secrets>

# Instructions:
# 1. Copy actual values from current Repl's Secrets panel
# 2. Replace <copy from...> with real values
# 3. Store this file SECURELY (password manager, encrypted)
# 4. In new Repl, add all these to Secrets panel
# 5. DELETE this file after successful migration
EOF

echo "✅ Created: secrets_backup.template.txt"
echo ""
echo "Next steps:"
echo "1. Open secrets_backup.template.txt"
echo "2. Fill in actual values from your Replit Secrets panel"
echo "3. Save securely (DO NOT commit to Git!)"
echo "4. Use these values when setting up new Repl"
echo ""
echo "⚠️  SECURITY WARNING:"
echo "   - Keep this file PRIVATE"
echo "   - Delete after migration complete"
echo "   - Consider rotating secrets after migration"
