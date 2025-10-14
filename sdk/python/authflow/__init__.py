"""
Authflow Python SDK
Official Python client for Authflow Authentication Platform
"""

from .client import AuthflowClient
from .types import (
    AuthflowConfig,
    User,
    Session,
    LoginCredentials,
    RegisterData,
    MFASetupResponse,
    MFAVerifyRequest,
    MagicLinkRequest,
    PasswordResetRequest,
    PasswordResetComplete,
    OAuth2AuthorizeParams,
    OAuth2TokenRequest,
    OAuth2TokenResponse,
    APIKeyCreateRequest,
    APIKey,
)

__version__ = "1.0.0"
__all__ = [
    "AuthflowClient",
    "AuthflowConfig",
    "User",
    "Session",
    "LoginCredentials",
    "RegisterData",
    "MFASetupResponse",
    "MFAVerifyRequest",
    "MagicLinkRequest",
    "PasswordResetRequest",
    "PasswordResetComplete",
    "OAuth2AuthorizeParams",
    "OAuth2TokenRequest",
    "OAuth2TokenResponse",
    "APIKeyCreateRequest",
    "APIKey",
]
