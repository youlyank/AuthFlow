# Security Improvements Roadmap

This document tracks security enhancements for future implementation.

## HIGH PRIORITY: User Invitation Flow Redesign

**Current Implementation (Security Risk):**
- Admin invites user → temporary password generated → password emailed
- **Risk**: Passwords transmitted via email (insecure channel)
- **Risk**: Mailbox compromise exposes credentials
- **Risk**: Email transport/logging can capture passwords

**Recommended Solution:**
Replace temporary password emails with secure password-set links:

1. **Invitation Flow:**
   ```
   Admin invites user
   → Generate secure one-time token (like magic link)
   → Email invitation with "Set Password" link
   → User clicks link → Sets own password
   → No password ever transmitted via email
   ```

2. **Implementation:**
   - Add `invitation_tokens` table (userId, token, expiresAt)
   - New endpoint: `/api/auth/invitation/accept` (token + new password)
   - Update invitation email template (remove password, add set-password link)
   - Frontend: Handle invitation acceptance flow

3. **Benefits:**
   - **Zero credential transmission** - No passwords in email
   - **User control** - Users set their own passwords
   - **Audit trail** - Track invitation acceptance
   - **Revocable** - Tokens can be invalidated

**Timeline:** Should be implemented before production deployment

## MEDIUM PRIORITY: Enhanced Rate Limiting

**Current Implementation:**
- Basic rate limiting on authentication endpoints
- IP-based tracking
- Fixed thresholds

**Recommended Enhancements:**
1. Adaptive rate limiting based on user behavior
2. Account-level rate limiting (in addition to IP-based)
3. Exponential backoff with jitter
4. Rate limit bypass for trusted IPs/services

## LOW PRIORITY: Additional Security Hardening

### 1. Email Security Headers
- Add DMARC, SPF, DKIM verification
- Implement email authentication
- Monitor bounce rates and spam reports

### 2. WebAuthn Enhancements
- Platform authenticator preference
- Backup authenticator requirement
- Attestation verification

### 3. Session Security
- Implement session pinning
- Add geolocation-based anomaly detection
- Enhanced device fingerprinting

### 4. Audit Logging Improvements
- Add structured logging
- Implement log aggregation
- Set up real-time alerts for suspicious activity

## Implementation Notes

All security improvements should:
1. Maintain backward compatibility where possible
2. Include comprehensive testing
3. Update documentation
4. Follow OWASP guidelines
5. Be reviewed by security architect

## Current Status

| Feature | Status | Priority | Target |
|---------|--------|----------|--------|
| Invitation Flow Redesign | Documented | HIGH | Pre-production |
| Enhanced Rate Limiting | Planned | MEDIUM | Q1 2025 |
| Email Security Headers | Planned | LOW | Q2 2025 |
| WebAuthn Enhancements | Planned | LOW | Q2 2025 |
| Session Security | Planned | LOW | Q2 2025 |
| Audit Logging | Planned | LOW | Q3 2025 |

---

**Note**: The invitation flow security issue has been identified and documented. The current email service integration is complete and production-ready for all other flows (verification, MFA, magic links, password reset). The invitation flow should be redesigned before production deployment to eliminate password transmission via email.
