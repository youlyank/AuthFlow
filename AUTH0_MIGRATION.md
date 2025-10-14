# Auth0 to Authflow Migration Guide

## Overview
This guide helps you migrate users from Auth0 to Authflow. The migration tool supports bulk user import from Auth0 exports, preserving password hashes, roles, and user metadata.

## Features

✅ **Bulk User Import** - Import thousands of users in one operation  
✅ **Password Hash Migration** - Compatible with Auth0's bcrypt hashes (no password resets needed)  
✅ **Role Mapping** - Automatically maps Auth0 roles to Authflow roles  
✅ **Metadata Preservation** - Maintains user metadata and custom fields  
✅ **Multiple Formats** - Supports both JSON and CSV formats  
✅ **Error Handling** - Detailed error reporting for failed imports  
✅ **Audit Trail** - All imports logged in audit system  

## Prerequisites

1. **Admin Access**: You need tenant_admin or super_admin role
2. **Auth0 Export**: Download your users from Auth0
3. **Tenant ID**: Know which tenant to import users into

## Step 1: Export Users from Auth0

### Option A: Auth0 Dashboard (Small exports)

1. Log in to Auth0 Dashboard
2. Navigate to **User Management > Users**
3. Click **Export Users** button
4. Select fields to export
5. Download JSON file

### Option B: Auth0 Management API (Large exports)

For bulk exports (>1000 users), use the Management API:

```bash
# Get Auth0 API token
curl --request POST \
  --url https://YOUR_DOMAIN.auth0.com/oauth/token \
  --header 'content-type: application/json' \
  --data '{
    "client_id":"YOUR_CLIENT_ID",
    "client_secret":"YOUR_CLIENT_SECRET",
    "audience":"https://YOUR_DOMAIN.auth0.com/api/v2/",
    "grant_type":"client_credentials"
  }'

# Export users (with password hashes if available)
curl --request GET \
  --url 'https://YOUR_DOMAIN.auth0.com/api/v2/users' \
  --header 'authorization: Bearer YOUR_ACCESS_TOKEN' \
  > auth0_users.json
```

## Step 2: Prepare Export Data

### JSON Format (Recommended)

Auth0 exports in this format:

```json
[
  {
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": true,
    "user_id": "auth0|123456",
    "identities": [...],
    "app_metadata": {
      "role": "admin",
      "roles": ["admin", "moderator"]
    },
    "user_metadata": {
      "preferences": {...}
    },
    "password": "$2a$10$...", // bcrypt hash (if available)
    "created_at": "2023-01-15T10:30:00.000Z"
  }
]
```

### CSV Format (Alternative)

Create CSV with these columns:

```csv
email,name,email_verified,role,password
user1@example.com,John Doe,true,admin,$2a$10$...
user2@example.com,Jane Smith,true,user,
```

**Required columns:** `email`  
**Optional columns:** `name`, `email_verified`, `role`, `password`, `passwordHash`

## Step 3: Import Users to Authflow

### Using API

**Endpoint:** `POST /api/admin/import-users`

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**

```json
{
  "data": "[... Auth0 JSON export ...]",
  "format": "json",
  "options": {
    "defaultRole": "user",
    "overwriteExisting": false,
    "generatePasswordsIfMissing": true
  }
}
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultRole` | `"user"` \| `"tenant_admin"` | `"user"` | Default role for users without role metadata |
| `overwriteExisting` | `boolean` | `false` | Update existing users if email matches |
| `generatePasswordsIfMissing` | `boolean` | `false` | Generate temporary passwords for users without hashes |

### Example: Import from JSON

```bash
# Read Auth0 export
AUTH0_DATA=$(cat auth0_users.json)

# Import to Authflow
curl -X POST http://localhost:5000/api/admin/import-users \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": \"$(echo $AUTH0_DATA | jq -c)\",
    \"format\": \"json\",
    \"options\": {
      \"defaultRole\": \"user\",
      \"overwriteExisting\": false,
      \"generatePasswordsIfMissing\": true
    }
  }"
```

### Example: Import from CSV

```bash
# Read CSV export
CSV_DATA=$(cat auth0_users.csv)

# Import to Authflow
curl -X POST http://localhost:5000/api/admin/import-users \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": \"$CSV_DATA\",
    \"format\": \"csv\",
    \"options\": {
      \"defaultRole\": \"user\"
    }
  }"
```

### Response Format

```json
{
  "message": "Import completed",
  "result": {
    "total": 150,
    "imported": 145,
    "skipped": 3,
    "errors": [
      {
        "email": "invalid@example.com",
        "error": "Invalid email format"
      },
      {
        "email": "duplicate@example.com",
        "error": "User already exists"
      }
    ]
  }
}
```

## Password Hash Migration

### Auth0 Compatible Hashes

Auth0 uses bcrypt for password hashing, which is **100% compatible** with Authflow:

- **No password resets needed** if you have password hashes
- Users can log in with their existing passwords
- Same security level maintained

### With Password Hashes

If your Auth0 export includes password hashes:

```json
{
  "email": "user@example.com",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
}
```

**Result:** User imported with existing password hash (seamless migration)

### Without Password Hashes

If Auth0 export doesn't include hashes (common for social logins):

**Recommended Approach:** Set `generatePasswordsIfMissing: false`
- Users without hashes are skipped during import
- After import, send password reset links to skipped users
- More secure - users create their own passwords
- No credential transmission via email

**Alternative (Not Recommended):** Set `generatePasswordsIfMissing: true`
- Generates temporary passwords internally
- **WARNING:** Generated passwords are not communicated to users
- Users will be unable to log in until you manually send password reset links
- Only use for testing migrations
- **For production:** Use password reset flow instead

## Role Mapping

Auth0 roles are automatically mapped to Authflow roles:

### Automatic Mapping

| Auth0 Role | Authflow Role |
|------------|---------------|
| Contains "super" or "root" | `super_admin` |
| Contains "admin" | `tenant_admin` |
| All others | `user` (or defaultRole) |

### Custom Role Mapping

Auth0 stores roles in `app_metadata`:

```json
{
  "app_metadata": {
    "role": "admin",          // Single role
    "roles": ["admin", "mod"] // Array of roles
  }
}
```

Migration tool checks both fields and uses the **highest privilege** role found.

### Override Default Role

```json
{
  "options": {
    "defaultRole": "tenant_admin"  // Users without roles become tenant_admin
  }
}
```

## Handling Edge Cases

### Duplicate Emails

**Default Behavior:** Skip existing users

```json
{
  "skipped": 5,
  "errors": [
    {"email": "existing@example.com", "error": "User already exists"}
  ]
}
```

**Update Existing:** Set `overwriteExisting: true`

```json
{
  "options": {
    "overwriteExisting": true  // Updates existing users instead of skipping
  }
}
```

### Missing Email Verification

Users without `email_verified` field default to `false`:

```json
{
  "email": "user@example.com",
  "email_verified": false  // Default if not provided
}
```

### Name Parsing

Auth0 `name` field is split into `firstName` and `lastName`:

```
"John Doe" → firstName: "John", lastName: "Doe"
"Alice" → firstName: "Alice", lastName: ""
```

## Testing Migration

### Test with Small Batch First

```json
{
  "data": "[{\"email\":\"test@example.com\",\"name\":\"Test User\"}]",
  "format": "json",
  "options": {
    "defaultRole": "user",
    "generatePasswordsIfMissing": true
  }
}
```

### Verify Import

1. Check response for errors
2. Verify user can log in
3. Confirm role assignment
4. Check audit logs:
   ```bash
   GET /api/admin/audit-logs?action=users.imported
   ```

### Rollback if Needed

If import fails or has issues:

1. Users are in audit trail
2. Can delete specific imported users
3. Or use Replit rollback feature (see DOWNLOAD_INSTRUCTIONS.md)

## Production Migration Checklist

- [ ] Export all users from Auth0 (with password hashes if possible)
- [ ] Test import with 5-10 sample users
- [ ] Verify test users can log in with existing passwords
- [ ] Check role assignments are correct
- [ ] Review error logs for any issues
- [ ] Import remaining users in batches (500-1000 at a time)
- [ ] Monitor import results for each batch
- [ ] Send welcome emails or password reset links to users without hashes
- [ ] Update Auth0 configuration to redirect to Authflow
- [ ] Monitor login attempts and errors
- [ ] Keep Auth0 active for 1-2 weeks as fallback
- [ ] Deactivate Auth0 after successful migration

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Email is required` | Missing email field | Ensure all records have email |
| `User already exists` | Duplicate email | Set `overwriteExisting: true` or skip |
| `No password hash provided` | Missing password | Set `generatePasswordsIfMissing: true` |
| `Invalid JSON format` | Malformed JSON | Validate JSON syntax |
| `Failed to parse CSV` | Invalid CSV structure | Check CSV format and headers |

## Security Considerations

1. **Password Hashes**: Auth0 bcrypt hashes are secure and compatible
2. **API Authentication**: Migration endpoint requires admin JWT token
3. **Audit Logging**: All imports logged with user count and errors
4. **Rate Limiting**: Endpoint protected by rate limiting
5. **Temporary Passwords**: Use secure 16-character passwords (if generated)

## Performance Tips

1. **Batch Size**: Import 500-1000 users per request for optimal performance
2. **Large Migrations**: Split >5000 users into multiple batches
3. **Parallel Processing**: Can run multiple import requests if needed
4. **Database Load**: Monitor during large imports

## Support

**Documentation:**
- AUTH0_MIGRATION.md (this file)
- AUTHFLOW_USER_GUIDE.md (full features)
- SECURITY_IMPROVEMENTS.md (security enhancements)

**API Reference:**
- Endpoint: `POST /api/admin/import-users`
- Auth: Required (tenant_admin or super_admin)
- Rate Limit: Standard admin rate limits apply

**Troubleshooting:**
1. Check import response for detailed errors
2. Review audit logs: `/api/admin/audit-logs`
3. Test with small batch first
4. Verify Auth0 export format matches examples

## Example: Complete Migration

```bash
#!/bin/bash
# Auth0 to Authflow Migration Script

# 1. Export from Auth0
echo "Exporting users from Auth0..."
curl --request GET \
  --url "https://YOUR_DOMAIN.auth0.com/api/v2/users" \
  --header "authorization: Bearer $AUTH0_TOKEN" \
  > auth0_export.json

# 2. Import to Authflow
echo "Importing to Authflow..."
IMPORT_RESULT=$(curl -X POST http://localhost:5000/api/admin/import-users \
  -H "Authorization: Bearer $AUTHFLOW_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"data\": \"$(cat auth0_export.json | jq -c)\",
    \"format\": \"json\",
    \"options\": {
      \"defaultRole\": \"user\",
      \"overwriteExisting\": false,
      \"generatePasswordsIfMissing\": true
    }
  }")

# 3. Show results
echo "Import completed:"
echo $IMPORT_RESULT | jq '.result'

# 4. Check for errors
ERROR_COUNT=$(echo $IMPORT_RESULT | jq '.result.errors | length')
if [ $ERROR_COUNT -gt 0 ]; then
  echo "Errors encountered:"
  echo $IMPORT_RESULT | jq '.result.errors'
fi

echo "Migration complete! Imported: $(echo $IMPORT_RESULT | jq '.result.imported') users"
```

## Summary

✅ **Simple Migration** - One API call to import all users  
✅ **Password Preservation** - No forced password resets  
✅ **Role Mapping** - Automatic Auth0 to Authflow role conversion  
✅ **Error Handling** - Detailed error reports for troubleshooting  
✅ **Audit Trail** - Full logging of migration activity  
✅ **Production Ready** - Tested for large-scale migrations  

**Next Steps:**
1. Export users from Auth0
2. Test with small batch
3. Import all users
4. Verify login functionality
5. Switch production traffic to Authflow 🚀
