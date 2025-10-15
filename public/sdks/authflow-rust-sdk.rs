/*!
AuthFlow Rust SDK
Official Rust client for AuthFlow authentication

Installation:
```toml
[dependencies]
authflow = "1.0"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
```

Usage with Actix Web:
```rust
use authflow::{AuthFlowClient, actix::AuthFlowMiddleware};
use actix_web::{web, App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let client = AuthFlowClient::new(
        "https://your-authflow.com",
        "client_id",
        "client_secret"
    );
    
    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(client.clone()))
            .wrap(AuthFlowMiddleware)
            .service(protected_route)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
```
*/

use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct AuthFlowClient {
    domain: String,
    client_id: String,
    client_secret: String,
    http_client: Client,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub role: Option<String>,
    pub tenant_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Deserialize)]
pub struct UserResponse {
    pub user: User,
}

impl AuthFlowClient {
    pub fn new(domain: impl Into<String>, client_id: impl Into<String>, client_secret: impl Into<String>) -> Self {
        Self {
            domain: domain.into().trim_end_matches('/').to_string(),
            client_id: client_id.into(),
            client_secret: client_secret.into(),
            http_client: Client::new(),
        }
    }

    pub async fn register(&self, req: RegisterRequest) -> Result<AuthResponse, Box<dyn Error>> {
        let url = format!("{}/api/auth/register", self.domain);
        let response = self.http_client
            .post(&url)
            .json(&req)
            .send()
            .await?
            .json::<AuthResponse>()
            .await?;
        Ok(response)
    }

    pub async fn login(&self, email: impl Into<String>, password: impl Into<String>) -> Result<AuthResponse, Box<dyn Error>> {
        let url = format!("{}/api/auth/login", self.domain);
        let req = LoginRequest {
            email: email.into(),
            password: password.into(),
        };
        let response = self.http_client
            .post(&url)
            .json(&req)
            .send()
            .await?
            .json::<AuthResponse>()
            .await?;
        Ok(response)
    }

    pub async fn verify_token(&self, token: &str) -> Result<User, Box<dyn Error>> {
        let url = format!("{}/api/auth/me", self.domain);
        let response = self.http_client
            .get(&url)
            .header(header::AUTHORIZATION, format!("Bearer {}", token))
            .send()
            .await?
            .json::<UserResponse>()
            .await?;
        Ok(response.user)
    }

    pub async fn setup_mfa(&self, token: &str, method: &str) -> Result<serde_json::Value, Box<dyn Error>> {
        let url = format!("{}/api/auth/mfa/setup", self.domain);
        let response = self.http_client
            .post(&url)
            .header(header::AUTHORIZATION, format!("Bearer {}", token))
            .json(&serde_json::json!({ "method": method }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        Ok(response)
    }

    pub async fn verify_mfa(&self, token: &str, code: &str, method: &str) -> Result<serde_json::Value, Box<dyn Error>> {
        let url = format!("{}/api/auth/mfa/verify", self.domain);
        let response = self.http_client
            .post(&url)
            .header(header::AUTHORIZATION, format!("Bearer {}", token))
            .json(&serde_json::json!({ "code": code, "method": method }))
            .send()
            .await?
            .json::<serde_json::Value>()
            .await?;
        Ok(response)
    }

    pub async fn logout(&self, token: &str) -> Result<(), Box<dyn Error>> {
        let url = format!("{}/api/auth/logout", self.domain);
        self.http_client
            .post(&url)
            .header(header::AUTHORIZATION, format!("Bearer {}", token))
            .send()
            .await?;
        Ok(())
    }

    pub fn get_oauth_url(&self, provider: &str, redirect_uri: &str) -> String {
        format!("{}/api/auth/oauth/{}?redirect_uri={}", self.domain, provider, urlencoding::encode(redirect_uri))
    }
}

// Actix Web middleware
pub mod actix {
    use super::*;
    use actix_web::{
        dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
        Error, HttpMessage,
    };
    use futures::future::LocalBoxFuture;
    use std::future::{ready, Ready};

    pub struct AuthFlowMiddleware;

    impl<S, B> Transform<S, ServiceRequest> for AuthFlowMiddleware
    where
        S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
        S::Future: 'static,
        B: 'static,
    {
        type Response = ServiceResponse<B>;
        type Error = Error;
        type InitError = ();
        type Transform = AuthFlowMiddlewareService<S>;
        type Future = Ready<Result<Self::Transform, Self::InitError>>;

        fn new_transform(&self, service: S) -> Self::Future {
            ready(Ok(AuthFlowMiddlewareService { service }))
        }
    }

    pub struct AuthFlowMiddlewareService<S> {
        service: S,
    }

    impl<S, B> Service<ServiceRequest> for AuthFlowMiddlewareService<S>
    where
        S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error>,
        S::Future: 'static,
        B: 'static,
    {
        type Response = ServiceResponse<B>;
        type Error = Error;
        type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

        forward_ready!(service);

        fn call(&self, req: ServiceRequest) -> Self::Future {
            let client = req.app_data::<actix_web::web::Data<AuthFlowClient>>().cloned();
            let auth_header = req.headers().get("Authorization").and_then(|h| h.to_str().ok()).map(|s| s.to_string());

            let fut = self.service.call(req);

            Box::pin(async move {
                if let (Some(client), Some(header)) = (client, auth_header) {
                    if header.starts_with("Bearer ") {
                        let token = &header[7..];
                        if let Ok(user) = client.verify_token(token).await {
                            // Store user in extensions for route access
                        }
                    }
                }
                fut.await
            })
        }
    }
}

// Axum middleware
pub mod axum {
    use super::*;
    use axum::{
        extract::{Request, State},
        http::StatusCode,
        middleware::Next,
        response::Response,
    };

    pub async fn authflow_middleware(
        State(client): State<Arc<AuthFlowClient>>,
        mut req: Request,
        next: Next,
    ) -> Result<Response, StatusCode> {
        let auth_header = req.headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok());

        if let Some(header) = auth_header {
            if header.starts_with("Bearer ") {
                let token = &header[7..];
                if let Ok(user) = client.verify_token(token).await {
                    req.extensions_mut().insert(user);
                    return Ok(next.run(req).await);
                }
            }
        }

        Err(StatusCode::UNAUTHORIZED)
    }
}
