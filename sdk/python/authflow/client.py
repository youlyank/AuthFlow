"""Authflow Python Client"""

import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode
import requests

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
    AuthflowError,
)


class AuthflowClient:
    """Authflow Authentication Client"""

    def __init__(self, config: AuthflowConfig):
        """
        Initialize Authflow client
        
        Args:
            config: AuthflowConfig object with domain and optional tenant_slug
        """
        self.config = config
        self.session: Optional[Session] = None
        self._requests_session = requests.Session()

    @property
    def base_url(self) -> str:
        """Get base API URL"""
        return f"{self.config.domain}/api"

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> Any:
        """
        Make an HTTP request to the API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            data: Request body data
            headers: Additional headers
            
        Returns:
            Response data (JSON decoded)
            
        Raises:
            AuthflowError: If request fails
        """
        url = f"{self.base_url}{endpoint}"
        req_headers = {
            "Content-Type": "application/json",
            **(headers or {}),
        }

        if self.session and self.session.access_token:
            req_headers["Authorization"] = f"Bearer {self.session.access_token}"

        try:
            response = self._requests_session.request(
                method=method,
                url=url,
                json=data,
                headers=req_headers,
            )

            if not response.ok:
                error_data = response.json() if response.text else {}
                raise AuthflowError(
                    error_data.get("error", f"Request failed with status {response.status_code}"),
                    response.status_code
                )

            # Handle empty responses
            if response.status_code == 204 or not response.text:
                return {}

            return response.json()

        except requests.RequestException as e:
            raise AuthflowError(f"Request failed: {str(e)}")

    def _save_session(self, session: Session) -> None:
        """Save session to instance"""
        self.session = session

    def _clear_session(self) -> None:
        """Clear current session"""
        self.session = None

    # ==================
    # SESSION MANAGEMENT
    # ==================

    def get_session(self) -> Optional[Session]:
        """Get current session"""
        return self.session

    def get_user(self) -> Optional[User]:
        """Get current user from session"""
        return self.session.user if self.session else None

    def is_authenticated(self) -> bool:
        """Check if user is authenticated"""
        return self.session is not None and self.session.user is not None

    # ==================
    # AUTHENTICATION
    # ==================

    def register(self, data: RegisterData) -> User:
        """
        Register a new user
        
        Args:
            data: Registration data (email, password, name, etc.)
            
        Returns:
            Created user object
        """
        response = self._request(
            "POST",
            "/auth/register",
            {
                "email": data.email,
                "password": data.password,
                "firstName": data.first_name,
                "lastName": data.last_name,
                "tenantSlug": data.tenant_slug or self.config.tenant_slug,
            },
        )
        return self._dict_to_user(response)

    def login(self, credentials: LoginCredentials) -> Session:
        """
        Login user and create session
        
        Args:
            credentials: Login credentials (email, password)
            
        Returns:
            Session object with user and tokens
        """
        response = self._request(
            "POST",
            "/auth/login",
            {
                "email": credentials.email,
                "password": credentials.password,
                "tenantSlug": credentials.tenant_slug or self.config.tenant_slug,
            },
        )

        session = Session(
            user=self._dict_to_user(response["user"]),
            access_token=response["token"],
            refresh_token=response.get("refreshToken"),
            expires_at=datetime.now() + timedelta(days=1),
        )

        self._save_session(session)
        return session

    def logout(self) -> None:
        """Logout current user and end session"""
        try:
            self._request("POST", "/auth/logout")
        finally:
            self._clear_session()

    def get_current_user(self) -> User:
        """
        Get current authenticated user
        
        Returns:
            User object
        """
        response = self._request("GET", "/auth/me")
        user = self._dict_to_user(response)
        
        if self.session:
            self.session.user = user
            self._save_session(self.session)
        
        return user

    def refresh_token(self) -> Session:
        """
        Refresh access token using refresh token
        
        Returns:
            New session with refreshed tokens
        """
        if not self.session or not self.session.refresh_token:
            raise AuthflowError("No refresh token available")

        response = self._request(
            "POST",
            "/auth/refresh",
            {"refreshToken": self.session.refresh_token},
        )

        session = Session(
            user=self.session.user,
            access_token=response["token"],
            refresh_token=response["refreshToken"],
            expires_at=datetime.now() + timedelta(days=1),
        )

        self._save_session(session)
        return session

    # ==================
    # MFA
    # ==================

    def setup_mfa(self, method: str = 'totp') -> MFASetupResponse:
        """
        Setup MFA for current user
        
        Args:
            method: MFA method ('totp' or 'email')
            
        Returns:
            MFA setup response with secret and QR code
        """
        response = self._request("POST", f"/auth/mfa/setup/{method}")
        return MFASetupResponse(
            secret=response["secret"],
            qr_code=response["qrCode"],
            backup_codes=response.get("backupCodes"),
        )

    def verify_mfa(self, data: MFAVerifyRequest) -> Session:
        """
        Verify MFA code
        
        Args:
            data: MFA verification request
            
        Returns:
            Session object
        """
        response = self._request(
            "POST",
            f"/auth/mfa/verify/{data.method}",
            {
                "code": data.code,
                "trustDevice": data.trust_device,
            },
        )

        session = Session(
            user=self._dict_to_user(response["user"]),
            access_token=response["token"],
            expires_at=datetime.now() + timedelta(days=1),
        )

        self._save_session(session)
        return session

    def disable_mfa(self) -> None:
        """Disable MFA for current user"""
        self._request("POST", "/auth/mfa/disable")

    # ==================
    # MAGIC LINKS
    # ==================

    def request_magic_link(self, data: MagicLinkRequest) -> Dict[str, str]:
        """
        Request a magic link for passwordless login
        
        Args:
            data: Magic link request data
            
        Returns:
            Success message
        """
        return self._request(
            "POST",
            "/auth/magic-link/request",
            {
                "email": data.email,
                "tenantSlug": data.tenant_slug,
                "redirectUrl": data.redirect_url,
            },
        )

    def verify_magic_link(self, token: str) -> Session:
        """
        Verify magic link token
        
        Args:
            token: Magic link token
            
        Returns:
            Session object
        """
        response = self._request(
            "POST",
            "/auth/magic-link/verify",
            {"token": token},
        )

        session = Session(
            user=self._dict_to_user(response["user"]),
            access_token=response["token"],
            expires_at=datetime.now() + timedelta(days=1),
        )

        self._save_session(session)
        return session

    # ==================
    # PASSWORD RESET
    # ==================

    def request_password_reset(self, data: PasswordResetRequest) -> Dict[str, str]:
        """
        Request password reset link
        
        Args:
            data: Password reset request
            
        Returns:
            Success message
        """
        return self._request(
            "POST",
            "/auth/forgot-password",
            {
                "email": data.email,
                "tenantSlug": data.tenant_slug or self.config.tenant_slug,
            },
        )

    def reset_password(self, data: PasswordResetComplete) -> Dict[str, str]:
        """
        Complete password reset
        
        Args:
            data: Password reset completion data
            
        Returns:
            Success message
        """
        return self._request(
            "POST",
            "/auth/reset-password",
            {
                "token": data.token,
                "newPassword": data.new_password,
            },
        )

    # ==================
    # OAUTH2 / OIDC
    # ==================

    def get_oauth2_authorize_url(self, params: OAuth2AuthorizeParams) -> str:
        """
        Generate OAuth2 authorization URL
        
        Args:
            params: OAuth2 authorization parameters
            
        Returns:
            Authorization URL string
        """
        query_params = {
            "client_id": params.client_id,
            "redirect_uri": params.redirect_uri,
            "response_type": params.response_type,
        }

        if params.scope:
            query_params["scope"] = params.scope
        if params.state:
            query_params["state"] = params.state
        if params.code_challenge:
            query_params["code_challenge"] = params.code_challenge
            query_params["code_challenge_method"] = params.code_challenge_method

        return f"{self.config.domain}/oauth2/authorize?{urlencode(query_params)}"

    def exchange_code_for_token(self, data: OAuth2TokenRequest) -> OAuth2TokenResponse:
        """
        Exchange authorization code for access token
        
        Args:
            data: Token exchange request
            
        Returns:
            OAuth2 token response
        """
        response = self._request(
            "POST",
            "/oauth2/token",
            {
                "grant_type": "authorization_code",
                "code": data.code,
                "client_id": data.client_id,
                "client_secret": data.client_secret,
                "redirect_uri": data.redirect_uri,
                "code_verifier": data.code_verifier,
            },
        )

        return OAuth2TokenResponse(
            access_token=response["access_token"],
            token_type=response["token_type"],
            expires_in=response["expires_in"],
            refresh_token=response.get("refresh_token"),
            scope=response.get("scope"),
        )

    def get_oauth2_user_info(self) -> User:
        """
        Get user info from OAuth2 token
        
        Returns:
            User object
        """
        response = self._request("GET", "/oauth2/userinfo")
        return self._dict_to_user(response)

    # ==================
    # API KEYS
    # ==================

    def create_api_key(self, data: APIKeyCreateRequest) -> APIKey:
        """
        Create a new API key
        
        Args:
            data: API key creation request
            
        Returns:
            Created API key
        """
        response = self._request(
            "POST",
            "/api-keys",
            {
                "name": data.name,
                "expiresAt": data.expires_at,
                "permissions": data.permissions,
            },
        )
        return self._dict_to_api_key(response)

    def list_api_keys(self) -> List[APIKey]:
        """
        List all API keys
        
        Returns:
            List of API keys
        """
        response = self._request("GET", "/api-keys")
        return [self._dict_to_api_key(key) for key in response]

    def delete_api_key(self, key_id: str) -> None:
        """
        Delete an API key
        
        Args:
            key_id: API key ID
        """
        self._request("DELETE", f"/api-keys/{key_id}")

    # ==================
    # UNIVERSAL LOGIN
    # ==================

    def get_universal_login_url(self, tenant_slug: str, return_to: Optional[str] = None) -> str:
        """
        Get universal login page URL
        
        Args:
            tenant_slug: Tenant slug
            return_to: Optional return URL
            
        Returns:
            Login URL
        """
        params = {"tenant": tenant_slug}
        if return_to:
            params["redirect_uri"] = return_to
        
        return f"{self.config.domain}/auth/universal-login?{urlencode(params)}"

    def get_universal_register_url(self, tenant_slug: str, return_to: Optional[str] = None) -> str:
        """
        Get universal registration page URL
        
        Args:
            tenant_slug: Tenant slug
            return_to: Optional return URL
            
        Returns:
            Registration URL
        """
        params = {"tenant": tenant_slug}
        if return_to:
            params["redirect_uri"] = return_to
        
        return f"{self.config.domain}/auth/universal-register?{urlencode(params)}"

    # ==================
    # UTILITIES
    # ==================

    def check_password_breach(self, password: str) -> Dict[str, bool]:
        """
        Check if password has been breached (Have I Been Pwned)
        
        Args:
            password: Password to check
            
        Returns:
            Dict with 'breached' and 'safe' flags
        """
        return self._request(
            "POST",
            "/auth/check-password-breach",
            {"password": password},
        )

    # ==================
    # HELPER METHODS
    # ==================

    def _dict_to_user(self, data: Dict[str, Any]) -> User:
        """Convert dict to User object"""
        return User(
            id=data["id"],
            email=data["email"],
            role=data["role"],
            email_verified=data["emailVerified"],
            mfa_enabled=data["mfaEnabled"],
            created_at=self._parse_datetime(data["createdAt"]),
            name=data.get("name"),
            tenant_id=data.get("tenantId"),
            last_login=self._parse_datetime(data.get("lastLogin")) if data.get("lastLogin") else None,
        )

    def _dict_to_api_key(self, data: Dict[str, Any]) -> APIKey:
        """Convert dict to APIKey object"""
        return APIKey(
            id=data["id"],
            name=data["name"],
            key=data["key"],
            created_at=self._parse_datetime(data["createdAt"]),
            last_used=self._parse_datetime(data.get("lastUsed")) if data.get("lastUsed") else None,
            expires_at=self._parse_datetime(data.get("expiresAt")) if data.get("expiresAt") else None,
        )

    @staticmethod
    def _parse_datetime(date_str: str) -> datetime:
        """Parse ISO datetime string"""
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            return datetime.now()
