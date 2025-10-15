import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Book, Code2, Terminal } from "lucide-react";

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">API Reference</h1>
          <p className="text-xl text-muted-foreground">
            Complete REST API documentation with interactive Swagger UI
          </p>
        </div>

        {/* Main CTA */}
        <Card className="mb-12 bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Code2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Interactive API Documentation</CardTitle>
                <CardDescription className="text-base mt-1">
                  Explore and test all API endpoints with our Swagger UI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="gap-2" asChild>
              <a href="/api-docs" target="_blank">
                <ExternalLink className="h-5 w-5" />
                Open Swagger Documentation
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Reference */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Quick Reference</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="block p-3 rounded-lg bg-muted font-mono text-sm">
                    https://your-authflow-instance.com/api
                  </code>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="block p-3 rounded-lg bg-muted font-mono text-sm">
                    Authorization: Bearer YOUR_JWT_TOKEN
                  </code>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Endpoint Categories */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Endpoint Categories</h2>
            <div className="space-y-3">
              {[
                {
                  category: "Authentication",
                  endpoints: [
                    "POST /api/auth/register",
                    "POST /api/auth/login",
                    "POST /api/auth/logout",
                    "POST /api/auth/refresh",
                    "GET /api/auth/me"
                  ]
                },
                {
                  category: "Multi-Factor Authentication",
                  endpoints: [
                    "POST /api/mfa/totp/setup",
                    "POST /api/mfa/totp/verify",
                    "POST /api/mfa/email/send",
                    "POST /api/mfa/sms/send"
                  ]
                },
                {
                  category: "WebAuthn / Passkeys",
                  endpoints: [
                    "POST /api/webauthn/register/begin",
                    "POST /api/webauthn/register/complete",
                    "POST /api/webauthn/login/begin",
                    "POST /api/webauthn/login/complete"
                  ]
                },
                {
                  category: "OAuth2",
                  endpoints: [
                    "GET /api/oauth/google",
                    "GET /api/oauth/github",
                    "GET /api/oauth/callback/:provider",
                    "POST /api/oauth2/token",
                    "GET /api/oauth2/authorize"
                  ]
                },
                {
                  category: "Users",
                  endpoints: [
                    "GET /api/users",
                    "GET /api/users/:id",
                    "PATCH /api/users/:id",
                    "DELETE /api/users/:id"
                  ]
                },
                {
                  category: "API Keys",
                  endpoints: [
                    "GET /api/api-keys",
                    "POST /api/api-keys",
                    "DELETE /api/api-keys/:id"
                  ]
                },
                {
                  category: "Webhooks",
                  endpoints: [
                    "GET /api/webhooks",
                    "POST /api/webhooks",
                    "PATCH /api/webhooks/:id",
                    "DELETE /api/webhooks/:id"
                  ]
                },
                {
                  category: "Sessions",
                  endpoints: [
                    "GET /api/sessions",
                    "DELETE /api/sessions/:id",
                    "GET /api/login-history"
                  ]
                }
              ].map((section) => (
                <Card key={section.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {section.endpoints.map((endpoint) => {
                        const [method, path] = endpoint.split(' ');
                        const methodColors: Record<string, string> = {
                          GET: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
                          POST: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
                          PATCH: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950',
                          DELETE: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950'
                        };
                        return (
                          <div key={endpoint} className="flex items-center gap-3 font-mono text-sm">
                            <span className={`px-2 py-1 rounded font-semibold ${methodColors[method]}`}>
                              {method}
                            </span>
                            <code className="text-muted-foreground">{path}</code>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Example Request */}
          <Card>
            <CardHeader>
              <CardTitle>Example Request</CardTitle>
              <CardDescription>Login with email and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">cURL</h4>
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                  <code className="text-sm font-mono">{`curl -X POST https://your-authflow-instance.com/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'`}</code>
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                  <code className="text-sm font-mono">{`{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rt_1234567890abcdef...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover-lift cursor-pointer" onClick={() => window.open('/api-docs', '_blank')}>
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Full Documentation</CardTitle>
                <CardDescription>
                  Complete API reference with all endpoints
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover-lift cursor-pointer" onClick={() => window.location.href = '/docs/sdks'}>
              <CardHeader>
                <Terminal className="h-8 w-8 text-primary mb-3" />
                <CardTitle>SDK Documentation</CardTitle>
                <CardDescription>
                  Client libraries for 5 languages
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover-lift cursor-pointer" onClick={() => window.location.href = '/docs/quickstart'}>
              <CardHeader>
                <Code2 className="h-8 w-8 text-primary mb-3" />
                <CardTitle>Quickstart Guide</CardTitle>
                <CardDescription>
                  Get started in under 5 minutes
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
