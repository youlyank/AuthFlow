"""
AuthFlow Django SDK
Official Django integration for AuthFlow authentication

Installation:
pip install authflow-django

Configuration (settings.py):
AUTHFLOW = {
    'DOMAIN': 'https://your-authflow-instance.com',
    'CLIENT_ID': 'your-client-id',
    'CLIENT_SECRET': 'your-client-secret',
}

MIDDLEWARE = [
    ...
    'authflow_django.middleware.AuthFlowMiddleware',
]
"""

import httpx
import json
from typing import Dict, Optional, Any
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from functools import wraps
import asyncio


class AuthFlowClient:
    """Sync/Async AuthFlow API client for Django"""
    
    def __init__(self, domain: str, client_id: str, client_secret: str):
        self.domain = domain.rstrip('/')
        self.client_id = client_id
        self.client_secret = client_secret
        self.client = httpx.Client(base_url=self.domain)
        self.async_client = httpx.AsyncClient(base_url=self.domain)
    
    def register(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user"""
        response = self.client.post('/api/auth/register', json=user_data)
        response.raise_for_status()
        return response.json()
    
    async def register_async(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new user (async)"""
        response = await self.async_client.post('/api/auth/register', json=user_data)
        response.raise_for_status()
        return response.json()
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login with email and password"""
        response = self.client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        response.raise_for_status()
        return response.json()
    
    async def login_async(self, email: str, password: str) -> Dict[str, Any]:
        """Login with email and password (async)"""
        response = await self.async_client.post('/api/auth/login', json={
            'email': email,
            'password': password
        })
        response.raise_for_status()
        return response.json()
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify a JWT token"""
        response = self.client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {token}'
        })
        response.raise_for_status()
        return response.json()
    
    async def verify_token_async(self, token: str) -> Dict[str, Any]:
        """Verify a JWT token (async)"""
        response = await self.async_client.get('/api/auth/me', headers={
            'Authorization': f'Bearer {token}'
        })
        response.raise_for_status()
        return response.json()
    
    def setup_mfa(self, token: str, method: str) -> Dict[str, Any]:
        """Setup MFA for a user"""
        response = self.client.post('/api/auth/mfa/setup', 
            json={'method': method},
            headers={'Authorization': f'Bearer {token}'}
        )
        response.raise_for_status()
        return response.json()
    
    def verify_mfa(self, token: str, code: str, method: str) -> Dict[str, Any]:
        """Verify MFA code"""
        response = self.client.post('/api/auth/mfa/verify',
            json={'code': code, 'method': method},
            headers={'Authorization': f'Bearer {token}'}
        )
        response.raise_for_status()
        return response.json()
    
    def logout(self, token: str) -> None:
        """Logout a user"""
        self.client.post('/api/auth/logout', headers={
            'Authorization': f'Bearer {token}'
        })
    
    def get_oauth_url(self, provider: str, redirect_uri: str) -> str:
        """Get OAuth URL for a provider"""
        from urllib.parse import urlencode
        params = urlencode({'redirect_uri': redirect_uri})
        return f"{self.domain}/api/auth/oauth/{provider}?{params}"


class AuthFlowMiddleware:
    """Django middleware for AuthFlow authentication"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        config = settings.AUTHFLOW
        self.client = AuthFlowClient(
            config['DOMAIN'],
            config['CLIENT_ID'],
            config['CLIENT_SECRET']
        )
    
    def __call__(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                user_data = self.client.verify_token(token)
                request.authflow_user = user_data.get('user')
            except Exception:
                request.authflow_user = None
        else:
            request.authflow_user = None
        
        return self.get_response(request)


def require_authflow_auth(view_func):
    """Decorator to require AuthFlow authentication"""
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        if not hasattr(request, 'authflow_user') or not request.authflow_user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapped_view


def require_authflow_auth_async(view_func):
    """Async decorator to require AuthFlow authentication"""
    @wraps(view_func)
    async def wrapped_view(request, *args, **kwargs):
        if not hasattr(request, 'authflow_user') or not request.authflow_user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        return await view_func(request, *args, **kwargs)
    return wrapped_view


# Example usage in views.py:
"""
from authflow_django import AuthFlowClient, require_authflow_auth
from django.conf import settings

authflow = AuthFlowClient(
    settings.AUTHFLOW['DOMAIN'],
    settings.AUTHFLOW['CLIENT_ID'],
    settings.AUTHFLOW['CLIENT_SECRET']
)

@require_authflow_auth
def protected_view(request):
    user = request.authflow_user
    return JsonResponse({'user': user})

async def async_login(request):
    data = json.loads(request.body)
    result = await authflow.login_async(data['email'], data['password'])
    return JsonResponse(result)
"""
