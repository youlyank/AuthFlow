export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "AuthFlow API",
    version: "1.0.0",
    description: "Comprehensive B2B Authentication SaaS Platform API with multi-tenant architecture, OAuth2/OIDC, MFA, WebAuthn, and more",
    contact: {
      name: "AuthFlow Support",
      email: "support@authflow.com",
    },
  },
  servers: [
    {
      url: "/api",
      description: "API Server",
    },
  ],
  tags: [
    { name: "Authentication", description: "User authentication endpoints" },
    { name: "MFA", description: "Multi-factor authentication" },
    { name: "OAuth2", description: "OAuth2 provider endpoints" },
    { name: "WebAuthn", description: "Passwordless/FIDO2 authentication" },
    { name: "Magic Links", description: "Passwordless email authentication" },
    { name: "API Keys", description: "API key management" },
    { name: "Webhooks", description: "Webhook management" },
    { name: "Users", description: "User management" },
    { name: "Tenants", description: "Tenant management" },
    { name: "Admin", description: "Super admin endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      apiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          role: { type: "string", enum: ["user", "tenant_admin", "super_admin"] },
          tenantId: { type: "string", format: "uuid" },
          emailVerified: { type: "boolean" },
          phoneVerified: { type: "boolean" },
          mfaEnabled: { type: "boolean" },
          mfaMethod: { type: "string", enum: ["totp", "email", "sms"], nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "firstName", "lastName"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  tenantSlug: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  tenantSlug: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    token: { type: "string" },
                    requiresMfa: { type: "boolean" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Logout successful",
          },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
          "401": {
            description: "Not authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/user/mfa/totp/setup": {
      post: {
        tags: ["MFA"],
        summary: "Setup TOTP MFA",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "TOTP setup initiated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    secret: { type: "string" },
                    qrCode: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/user/mfa/sms/enable": {
      post: {
        tags: ["MFA"],
        summary: "Enable SMS MFA",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "SMS OTP sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "503": {
            description: "SMS service not configured",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/oauth2/authorize": {
      get: {
        tags: ["OAuth2"],
        summary: "OAuth2 authorization endpoint",
        parameters: [
          {
            in: "query",
            name: "client_id",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "redirect_uri",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "response_type",
            required: true,
            schema: { type: "string", enum: ["code", "token"] },
          },
          {
            in: "query",
            name: "scope",
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "state",
            schema: { type: "string" },
          },
        ],
        responses: {
          "302": {
            description: "Redirect to login or client callback",
          },
        },
      },
    },
    "/oauth2/token": {
      post: {
        tags: ["OAuth2"],
        summary: "Exchange authorization code for access token",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["grant_type", "code", "client_id", "redirect_uri"],
                properties: {
                  grant_type: { type: "string", enum: ["authorization_code", "refresh_token"] },
                  code: { type: "string" },
                  client_id: { type: "string" },
                  client_secret: { type: "string" },
                  redirect_uri: { type: "string" },
                  refresh_token: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Token response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    access_token: { type: "string" },
                    token_type: { type: "string" },
                    expires_in: { type: "number" },
                    refresh_token: { type: "string" },
                    scope: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api-keys": {
      post: {
        tags: ["API Keys"],
        summary: "Create API key",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  expiresAt: { type: "string", format: "date-time" },
                  permissions: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "API key created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    key: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["API Keys"],
        summary: "List API keys",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of API keys",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      createdAt: { type: "string", format: "date-time" },
                      lastUsed: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/webhooks": {
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: { type: "string", format: "uri" },
                  events: { type: "array", items: { type: "string" } },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Webhook created",
          },
        },
      },
      get: {
        tags: ["Webhooks"],
        summary: "List webhooks",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "List of webhooks",
          },
        },
      },
    },
  },
};
