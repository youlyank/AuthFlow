"""Type definitions for Authflow SDK"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Literal


@dataclass
class AuthflowConfig:
    """Configuration for Authflow client"""
    domain: str
    tenant_slug: Optional[str] = None
    client_id: Optional[str] = None
    redirect_uri: Optional[str] = None


@dataclass
class User:
    """User object"""
    id: str
    email: str
    role: Literal['super_admin', 'tenant_admin', 'user']
    email_verified: bool
    mfa_enabled: bool
    created_at: datetime
    name: Optional[str] = None
    tenant_id: Optional[str] = None
    last_login: Optional[datetime] = None


@dataclass
class Session:
    """Session object"""
    user: User
    access_token: str
    expires_at: datetime
    refresh_token: Optional[str] = None


@dataclass
class LoginCredentials:
    """Login credentials"""
    email: str
    password: str
    tenant_slug: Optional[str] = None


@dataclass
class RegisterData:
    """Registration data"""
    email: str
    password: str
    first_name: str
    last_name: str
    tenant_slug: Optional[str] = None


@dataclass
class MFASetupResponse:
    """MFA setup response"""
    secret: str
    qr_code: str
    backup_codes: Optional[List[str]] = None


@dataclass
class MFAVerifyRequest:
    """MFA verification request"""
    code: str
    method: Literal['totp', 'email']
    trust_device: bool = False


@dataclass
class MagicLinkRequest:
    """Magic link request"""
    email: str
    tenant_slug: str
    redirect_url: Optional[str] = None


@dataclass
class PasswordResetRequest:
    """Password reset request"""
    email: str
    tenant_slug: Optional[str] = None


@dataclass
class PasswordResetComplete:
    """Complete password reset"""
    token: str
    new_password: str


@dataclass
class OAuth2AuthorizeParams:
    """OAuth2 authorization parameters"""
    client_id: str
    redirect_uri: str
    scope: Optional[str] = None
    state: Optional[str] = None
    response_type: Literal['code', 'token'] = 'code'
    code_challenge: Optional[str] = None
    code_challenge_method: Literal['S256', 'plain'] = 'S256'


@dataclass
class OAuth2TokenRequest:
    """OAuth2 token request"""
    code: str
    client_id: str
    redirect_uri: str
    client_secret: Optional[str] = None
    code_verifier: Optional[str] = None


@dataclass
class OAuth2TokenResponse:
    """OAuth2 token response"""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: Optional[str] = None
    scope: Optional[str] = None


@dataclass
class APIKeyCreateRequest:
    """API key creation request"""
    name: str
    expires_at: Optional[str] = None
    permissions: List[str] = field(default_factory=list)


@dataclass
class APIKey:
    """API key object"""
    id: str
    name: str
    key: str
    created_at: datetime
    last_used: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AuthflowError(Exception):
    """Authflow API error"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
