import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Shield, Zap, Cloud, Lock, Webhook, Key, Users } from "lucide-react";

export default function ArchitecturePage() {
  const components = [
    {
      title: "Multi-Tenant Architecture",
      icon: Users,
      color: "blue",
      description: "Row-level isolation using PostgreSQL tenant_id column",
      details: [
        "Each tenant has isolated data",
        "Automatic tenant context injection",
        "Cross-tenant access prevention",
        "Scalable to millions of tenants"
      ]
    },
    {
      title: "Authentication Layer",
      icon: Shield,
      color: "green",
      description: "JWT-based with RSA-4096 asymmetric encryption",
      details: [
        "Access & refresh token rotation",
        "bcrypt password hashing (cost 10)",
        "Session fingerprinting",
        "Device tracking & trust"
      ]
    },
    {
      title: "Authorization (RBAC)",
      icon: Lock,
      color: "purple",
      description: "Role-Based Access Control with fine-grained permissions",
      details: [
        "3 role levels: super_admin, tenant_admin, user",
        "API key permission system",
        "Resource-level access control",
        "Centralized middleware enforcement"
      ]
    },
    {
      title: "Real-time Updates",
      icon: Zap,
      color: "yellow",
      description: "WebSocket-based push notifications via Socket.IO",
      details: [
        "Event types: system, security, billing",
        "Read/unread tracking",
        "Priority levels",
        "Per-user room isolation"
      ]
    },
    {
      title: "OAuth2/OIDC Provider",
      icon: Cloud,
      color: "cyan",
      description: "Full-featured identity provider implementation",
      details: [
        "Authorization & Token endpoints",
        "PKCE support",
        "Client management",
        "JWKS & Discovery"
      ]
    },
    {
      title: "Webhook System",
      icon: Webhook,
      color: "orange",
      description: "Production-ready event delivery",
      details: [
        "Atomic delivery guarantees",
        "HMAC signature verification",
        "Exponential backoff retry",
        "Scheduled retry processor"
      ]
    },
    {
      title: "API Key Management",
      icon: Key,
      color: "red",
      description: "Server-to-server authentication",
      details: [
        "SHA-256 hashed keys",
        "Permission-based access",
        "Rate limiting per key",
        "Automatic expiration"
      ]
    },
    {
      title: "Database Layer",
      icon: Database,
      color: "indigo",
      description: "PostgreSQL with Drizzle ORM",
      details: [
        "31 normalized tables",
        "Foreign key constraints",
        "Indexed queries",
        "Migration system"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Architecture Overview</h1>
          <p className="text-xl text-muted-foreground">
            Understanding AuthFlow's technical design and implementation
          </p>
        </div>

        {/* Architecture Diagram */}
        <Card className="mb-12 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle>System Architecture</CardTitle>
            <CardDescription>High-level component overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono text-sm">
              <div className="p-4 rounded-lg border bg-background">
                <div className="text-center mb-4 font-bold text-primary">Client Applications</div>
                <div className="text-center text-muted-foreground">↓</div>
              </div>
              <div className="p-4 rounded-lg border bg-background">
                <div className="text-center mb-4 font-bold text-primary">Load Balancer / CDN</div>
                <div className="text-center text-muted-foreground">↓</div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="font-bold text-blue-500 mb-2">Express.js API</div>
                  <div className="text-xs text-muted-foreground">
                    • REST endpoints<br />
                    • JWT validation<br />
                    • Rate limiting<br />
                    • CORS handling
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="font-bold text-green-500 mb-2">WebSocket Server</div>
                  <div className="text-xs text-muted-foreground">
                    • Socket.IO<br />
                    • Real-time events<br />
                    • User rooms<br />
                    • Push notifications
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="font-bold text-purple-500 mb-2">OAuth2 Provider</div>
                  <div className="text-xs text-muted-foreground">
                    • Authorization<br />
                    • Token issuance<br />
                    • OIDC endpoints<br />
                    • Client mgmt
                  </div>
                </div>
              </div>
              <div className="text-center text-muted-foreground">↓</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-background">
                  <div className="font-bold text-orange-500 mb-2">PostgreSQL Database</div>
                  <div className="text-xs text-muted-foreground">
                    • 31 tables<br />
                    • Row-level tenancy<br />
                    • Foreign keys<br />
                    • Indexed queries
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-background">
                  <div className="font-bold text-red-500 mb-2">External Services</div>
                  <div className="text-xs text-muted-foreground">
                    • HIBP (breach check)<br />
                    • Twilio (SMS)<br />
                    • OAuth providers<br />
                    • Email service
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Components */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Core Components</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {components.map((component) => (
              <Card key={component.title} className="hover-lift">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-${component.color}-500/10`}>
                      <component.icon className={`h-6 w-6 text-${component.color}-500`} />
                    </div>
                    <CardTitle>{component.title}</CardTitle>
                  </div>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {component.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Features */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Security Features</CardTitle>
            <CardDescription>Built-in security mechanisms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Encryption</h4>
                <ul className="space-y-2 text-sm">
                  <li>• RSA-4096 asymmetric JWT signing</li>
                  <li>• bcrypt password hashing (cost 10)</li>
                  <li>• SHA-256 for API keys & secrets</li>
                  <li>• HMAC webhook signatures</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Protection</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Rate limiting per IP & user</li>
                  <li>• CSRF token validation</li>
                  <li>• XSS prevention (sanitization)</li>
                  <li>• SQL injection protection (ORM)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Compliance</h4>
                <ul className="space-y-2 text-sm">
                  <li>• GDPR data export/deletion</li>
                  <li>• Audit logging</li>
                  <li>• Session management</li>
                  <li>• Password breach detection (HIBP)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">MFA Methods</h4>
                <ul className="space-y-2 text-sm">
                  <li>• TOTP (Google Authenticator)</li>
                  <li>• Email OTP</li>
                  <li>• SMS OTP (Twilio)</li>
                  <li>• WebAuthn/FIDO2 (passkeys)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Flow</CardTitle>
            <CardDescription>How user authentication works</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">User submits credentials</h4>
                  <p className="text-sm text-muted-foreground">Email/password sent to /api/auth/login endpoint</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Validation & verification</h4>
                  <p className="text-sm text-muted-foreground">bcrypt password comparison, MFA check if enabled</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Token generation</h4>
                  <p className="text-sm text-muted-foreground">RSA-signed JWT access token (15m) + refresh token (7d)</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Session creation</h4>
                  <p className="text-sm text-muted-foreground">Device fingerprint stored, login history recorded</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Authenticated requests</h4>
                  <p className="text-sm text-muted-foreground">Bearer token in Authorization header, verified via RSA public key</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
