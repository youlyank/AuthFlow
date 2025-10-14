# Authflow Python SDK

Official Python client for Authflow Authentication Platform

## Installation

```bash
pip install authflow
```

## Quick Start

```python
from authflow import AuthflowClient, AuthflowConfig, LoginCredentials, RegisterData

# Initialize the client
authflow = AuthflowClient(
    AuthflowConfig(
        domain="https://your-authflow-instance.com",
        tenant_slug="your-tenant"  # Optional: set default tenant
    )
)

# Register a new user
user = authflow.register(
    RegisterData(
        email="user@example.com",
        password="SecurePassword123!",
        first_name="John",
        last_name="Doe"
    )
)

# Login
session = authflow.login(
    LoginCredentials(
        email="user@example.com",
        password="SecurePassword123!"
    )
)

# Check authentication status
if authflow.is_authenticated():
    user = authflow.get_user()
    print(f"Logged in as: {user.email}")

# Logout
authflow.logout()
```

## Features

### ✅ Authentication Methods
- Email/Password authentication
- MFA (TOTP & Email OTP)
- Magic Links (passwordless)
- OAuth2/OIDC flows

### ✅ Session Management
- Automatic session handling
- Token refresh
- Secure token storage

### ✅ Type Hints
- Full type annotations
- IDE autocomplete support
- Type-safe API

## Usage Examples

### Django Example

```python
from django.http import HttpResponse
from authflow import AuthflowClient, AuthflowConfig, LoginCredentials

# Initialize client (typically in settings or as a singleton)
authflow = AuthflowClient(
    AuthflowConfig(
        domain="https://auth.example.com",
        tenant_slug="my-app"
    )
)

def login_view(request):
    if request.method == "POST":
        try:
            session = authflow.login(
                LoginCredentials(
                    email=request.POST["email"],
                    password=request.POST["password"]
                )
            )
            
            # Store session in Django session
            request.session["authflow_token"] = session.access_token
            request.session["authflow_user"] = session.user.id
            
            return HttpResponse("Login successful!")
        except Exception as e:
            return HttpResponse(f"Login failed: {str(e)}", status=400)
    
    return HttpResponse("POST email and password")
```

### Flask Example

```python
from flask import Flask, request, jsonify, session
from authflow import AuthflowClient, AuthflowConfig, LoginCredentials

app = Flask(__name__)
app.secret_key = "your-secret-key"

# Initialize Authflow client
authflow = AuthflowClient(
    AuthflowConfig(
        domain="https://auth.example.com",
        tenant_slug="my-app"
    )
)

@app.route("/login", methods=["POST"])
def login():
    try:
        auth_session = authflow.login(
            LoginCredentials(
                email=request.json["email"],
                password=request.json["password"]
            )
        )
        
        # Store session
        session["authflow_token"] = auth_session.access_token
        session["user_id"] = auth_session.user.id
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": auth_session.user.id,
                "email": auth_session.user.email
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/logout", methods=["POST"])
def logout():
    authflow.logout()
    session.clear()
    return jsonify({"message": "Logged out successfully"})

if __name__ == "__main__":
    app.run(debug=True)
```

### FastAPI Example

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from authflow import AuthflowClient, AuthflowConfig, LoginCredentials

app = FastAPI()

# Initialize Authflow client
authflow = AuthflowClient(
    AuthflowConfig(
        domain="https://auth.example.com",
        tenant_slug="my-app"
    )
)

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
async def login(credentials: LoginRequest):
    try:
        session = authflow.login(
            LoginCredentials(
                email=credentials.email,
                password=credentials.password
            )
        )
        
        return {
            "access_token": session.access_token,
            "user": {
                "id": session.user.id,
                "email": session.user.email,
                "role": session.user.role
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/me")
async def get_current_user():
    if not authflow.is_authenticated():
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = authflow.get_user()
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role
    }

@app.post("/logout")
async def logout():
    authflow.logout()
    return {"message": "Logged out successfully"}
```

## API Reference

### Authentication

#### `register(data: RegisterData) -> User`
Register a new user account.

```python
from authflow import RegisterData

user = authflow.register(
    RegisterData(
        email="user@example.com",
        password="SecurePassword123!",
        first_name="John",
        last_name="Doe",
        tenant_slug="my-company"  # Optional
    )
)
```

#### `login(credentials: LoginCredentials) -> Session`
Authenticate a user and create a session.

```python
from authflow import LoginCredentials

session = authflow.login(
    LoginCredentials(
        email="user@example.com",
        password="SecurePassword123!",
        tenant_slug="my-company"  # Optional
    )
)
```

#### `logout() -> None`
End the current session.

```python
authflow.logout()
```

#### `get_current_user() -> User`
Get the current authenticated user.

```python
user = authflow.get_current_user()
print(f"User: {user.email}")
```

### Multi-Factor Authentication (MFA)

#### `setup_mfa(method: str = 'totp') -> MFASetupResponse`
Setup MFA for the current user.

```python
# Setup TOTP (Google Authenticator)
mfa_setup = authflow.setup_mfa('totp')
print(f"Secret: {mfa_setup.secret}")
print(f"QR Code: {mfa_setup.qr_code}")

# Setup Email OTP
mfa_setup = authflow.setup_mfa('email')
```

#### `verify_mfa(data: MFAVerifyRequest) -> Session`
Verify an MFA code.

```python
from authflow import MFAVerifyRequest

session = authflow.verify_mfa(
    MFAVerifyRequest(
        code="123456",
        method="totp",
        trust_device=True  # Remember this device
    )
)
```

#### `disable_mfa() -> None`
Disable MFA for the current user.

```python
authflow.disable_mfa()
```

### Magic Links (Passwordless)

#### `request_magic_link(data: MagicLinkRequest) -> dict`
Request a magic link for passwordless login.

```python
from authflow import MagicLinkRequest

result = authflow.request_magic_link(
    MagicLinkRequest(
        email="user@example.com",
        tenant_slug="my-company",
        redirect_url="https://myapp.com/callback"
    )
)
```

#### `verify_magic_link(token: str) -> Session`
Verify a magic link token.

```python
session = authflow.verify_magic_link("token-from-email")
```

### Password Reset

#### `request_password_reset(data: PasswordResetRequest) -> dict`
Request a password reset link.

```python
from authflow import PasswordResetRequest

authflow.request_password_reset(
    PasswordResetRequest(
        email="user@example.com",
        tenant_slug="my-company"
    )
)
```

#### `reset_password(data: PasswordResetComplete) -> dict`
Complete the password reset process.

```python
from authflow import PasswordResetComplete

authflow.reset_password(
    PasswordResetComplete(
        token="reset-token",
        new_password="NewSecurePassword123!"
    )
)
```

### OAuth2 / OIDC

#### `get_oauth2_authorize_url(params: OAuth2AuthorizeParams) -> str`
Generate an OAuth2 authorization URL.

```python
from authflow import OAuth2AuthorizeParams

auth_url = authflow.get_oauth2_authorize_url(
    OAuth2AuthorizeParams(
        client_id="your-client-id",
        redirect_uri="https://yourapp.com/callback",
        scope="openid profile email",
        state="random-state"
    )
)

# Redirect user to auth_url
```

#### `exchange_code_for_token(data: OAuth2TokenRequest) -> OAuth2TokenResponse`
Exchange authorization code for access token.

```python
from authflow import OAuth2TokenRequest

token_response = authflow.exchange_code_for_token(
    OAuth2TokenRequest(
        code="authorization-code",
        client_id="your-client-id",
        client_secret="your-client-secret",
        redirect_uri="https://yourapp.com/callback"
    )
)
```

#### `get_oauth2_user_info() -> User`
Get user info from OAuth2 token.

```python
user = authflow.get_oauth2_user_info()
```

### Universal Login

#### `get_universal_login_url(tenant_slug: str, return_to: str = None) -> str`
Get the hosted login page URL.

```python
login_url = authflow.get_universal_login_url(
    tenant_slug="my-company",
    return_to="https://myapp.com/dashboard"
)

# Redirect to hosted login
```

#### `get_universal_register_url(tenant_slug: str, return_to: str = None) -> str`
Get the hosted registration page URL.

```python
register_url = authflow.get_universal_register_url(
    tenant_slug="my-company",
    return_to="https://myapp.com/dashboard"
)
```

### API Keys

#### `create_api_key(data: APIKeyCreateRequest) -> APIKey`
Create a new API key.

```python
from authflow import APIKeyCreateRequest

api_key = authflow.create_api_key(
    APIKeyCreateRequest(
        name="Production API Key",
        expires_at="2024-12-31",
        permissions=["read", "write"]
    )
)

print(f"API Key: {api_key.key}")
```

#### `list_api_keys() -> List[APIKey]`
List all API keys.

```python
api_keys = authflow.list_api_keys()
for key in api_keys:
    print(f"{key.name}: {key.key}")
```

#### `delete_api_key(key_id: str) -> None`
Delete an API key.

```python
authflow.delete_api_key(api_key_id)
```

### Session Management

#### `get_session() -> Optional[Session]`
Get the current session.

```python
session = authflow.get_session()
if session:
    print(f"Access token: {session.access_token}")
    print(f"Expires at: {session.expires_at}")
```

#### `get_user() -> Optional[User]`
Get the current user from session.

```python
user = authflow.get_user()
if user:
    print(f"User: {user.email}")
```

#### `is_authenticated() -> bool`
Check if user is authenticated.

```python
if authflow.is_authenticated():
    # User is logged in
    pass
```

#### `refresh_token() -> Session`
Manually refresh the access token.

```python
new_session = authflow.refresh_token()
```

### Utilities

#### `check_password_breach(password: str) -> dict`
Check if a password has been breached (Have I Been Pwned).

```python
result = authflow.check_password_breach("password123")
if result["breached"]:
    print("This password has been compromised!")
```

## Error Handling

All SDK methods raise `AuthflowError` on failure. Use try/except:

```python
from authflow import AuthflowError, LoginCredentials

try:
    session = authflow.login(
        LoginCredentials(
            email="user@example.com",
            password="wrong-password"
        )
    )
except AuthflowError as e:
    print(f"Login failed: {e.message}")
    print(f"Status code: {e.status_code}")
```

## Type Hints

The SDK includes full type annotations:

```python
from authflow import AuthflowClient, User, Session, MFASetupResponse
from typing import Optional

authflow: AuthflowClient = AuthflowClient(config)

user: Optional[User] = authflow.get_user()
session: Optional[Session] = authflow.get_session()
```

## Requirements

- Python 3.8+
- requests >= 2.28.0

## License

MIT

## Support

- Documentation: https://docs.authflow.dev
- GitHub: https://github.com/authflow/python-sdk
- Issues: https://github.com/authflow/python-sdk/issues
