import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, Code2, Database, Key, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MigrationGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Docs
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">Migration Guide</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Database className="h-4 w-4" />
            Migration Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Migrate from Auth0 or Okta
          </h1>
          <p className="text-xl text-muted-foreground">
            Step-by-step guide to migrate your authentication from Auth0 or Okta to AuthFlow with minimal downtime
          </p>
        </div>

        {/* Why Migrate */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Why Migrate to AuthFlow?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold mb-2">💰 80% Cost Savings</h4>
                <p className="text-sm text-muted-foreground">
                  Reduce your authentication costs significantly compared to Auth0 and Okta pricing
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🚀 Better Performance</h4>
                <p className="text-sm text-muted-foreground">
                  Built on modern infrastructure with faster response times and lower latency
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🔧 Full Control</h4>
                <p className="text-sm text-muted-foreground">
                  Self-hosted option available with complete control over your data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Migration Overview */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Migration Overview</h2>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Estimated Time:</strong> 2-4 hours for a typical application. We recommend migrating during low-traffic periods.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {[
              { step: 1, title: "Prepare Your Migration", time: "30 min" },
              { step: 2, title: "Set Up AuthFlow Tenant", time: "15 min" },
              { step: 3, title: "Migrate Users", time: "1-2 hours" },
              { step: 4, title: "Update Your Application", time: "30-60 min" },
              { step: 5, title: "Test & Deploy", time: "30 min" }
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.title}</h4>
                </div>
                <div className="text-sm text-muted-foreground">{item.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Prepare */}
        <Card className="glass-card mb-8" data-testid="step-prepare">
          <CardHeader>
            <CardTitle>Step 1: Prepare Your Migration</CardTitle>
            <CardDescription>Export your existing data and plan your migration strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Export Users from Auth0
              </h4>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <div className="text-muted-foreground mb-2"># Using Auth0 Management API</div>
                <code className="text-foreground">
                  curl -H "Authorization: Bearer YOUR_MGMT_TOKEN" \<br />
                  &nbsp;&nbsp;https://YOUR_DOMAIN.auth0.com/api/v2/users &gt; users.json
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Export Users from Okta
              </h4>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                <div className="text-muted-foreground mb-2"># Using Okta API</div>
                <code className="text-foreground">
                  curl -H "Authorization: SSWS YOUR_API_TOKEN" \<br />
                  &nbsp;&nbsp;https://YOUR_DOMAIN.okta.com/api/v1/users &gt; users.json
                </code>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Password Migration Note:</strong> Auth0 and Okta don't export password hashes for security reasons. 
                You'll need to either force password reset or use progressive migration (recommended).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 2: Set Up AuthFlow */}
        <Card className="glass-card mb-8" data-testid="step-setup">
          <CardHeader>
            <CardTitle>Step 2: Set Up AuthFlow Tenant</CardTitle>
            <CardDescription>Create your AuthFlow tenant and configure basic settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Create Your Tenant</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Sign up at AuthFlow and create a new account</li>
                <li>Create a new tenant in the Super Admin dashboard</li>
                <li>Note your Tenant ID and API Key</li>
                <li>Configure OAuth providers (Google, GitHub) if needed</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Configure Settings</h4>
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Enable MFA options (TOTP, Email, SMS)</div>
                    <div className="text-sm text-muted-foreground">Match your current Auth0/Okta MFA configuration</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Set password policies</div>
                    <div className="text-sm text-muted-foreground">Configure minimum length, complexity requirements</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Configure session settings</div>
                    <div className="text-sm text-muted-foreground">Set token expiration and refresh token rotation</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Migrate Users */}
        <Card className="glass-card mb-8" data-testid="step-migrate-users">
          <CardHeader>
            <CardTitle>Step 3: Migrate Users</CardTitle>
            <CardDescription>Choose your migration strategy: Bulk or Progressive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Option A: Bulk Migration</CardTitle>
                  <CardDescription>Migrate all users at once (requires password reset)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                      <code>
                        POST /api/admin/users/bulk<br />
                        Content-Type: application/json
                      </code>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Quick migration
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Maintains user metadata
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        Requires password reset
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Option B: Progressive Migration</CardTitle>
                  <CardDescription>Migrate users gradually during login (no password reset)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="text-muted-foreground mb-1">1. User logs in</div>
                      <div className="text-muted-foreground mb-1">2. Verify against Auth0/Okta</div>
                      <div className="text-muted-foreground">3. Create in AuthFlow</div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        No password reset
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Zero downtime
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        Takes longer to complete
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Example: Bulk User Import</h4>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <code className="text-foreground">{`const users = await fetch('${window.location.origin}/api/admin/users/bulk', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    users: [
      {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        emailVerified: true,
        metadata: { plan: 'premium' }
      }
    ]
  })
});`}</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Update Application */}
        <Card className="glass-card mb-8" data-testid="step-update-app">
          <CardHeader>
            <CardTitle>Step 4: Update Your Application</CardTitle>
            <CardDescription>Replace Auth0/Okta SDK with AuthFlow SDK</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Replace Auth0 SDK</h4>
              <div className="grid gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Before (Auth0):</div>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">{`import { Auth0Client } from '@auth0/auth0-spa-js';

const auth0 = new Auth0Client({
  domain: 'YOUR_DOMAIN.auth0.com',
  client_id: 'YOUR_CLIENT_ID'
});`}</code>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">After (AuthFlow):</div>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">{`import { AuthFlowClient } from '@authflow/js';

const authflow = new AuthFlowClient({
  baseURL: '${window.location.origin}',
  tenantId: 'YOUR_TENANT_ID'
});`}</code>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Replace Okta SDK</h4>
              <div className="grid gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Before (Okta):</div>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">{`import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://YOUR_DOMAIN.okta.com',
  clientId: 'YOUR_CLIENT_ID'
});`}</code>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">After (AuthFlow):</div>
                  <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                    <code className="text-foreground">{`import { AuthFlowClient } from '@authflow/js';

const authflow = new AuthFlowClient({
  baseURL: '${window.location.origin}',
  tenantId: 'YOUR_TENANT_ID'
});`}</code>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Code2 className="h-4 w-4" />
              <AlertDescription>
                <strong>API Compatibility:</strong> AuthFlow provides similar methods to Auth0/Okta. Most code changes are just SDK imports and configuration.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 5: Test & Deploy */}
        <Card className="glass-card mb-8" data-testid="step-test-deploy">
          <CardHeader>
            <CardTitle>Step 5: Test & Deploy</CardTitle>
            <CardDescription>Verify everything works before going live</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Testing Checklist</h4>
              <div className="space-y-2">
                {[
                  "Test user login with email/password",
                  "Verify OAuth providers (Google, GitHub) work",
                  "Test MFA flows (TOTP, Email OTP, SMS OTP)",
                  "Verify session management and token refresh",
                  "Test password reset flow",
                  "Check user profile updates",
                  "Verify API authentication with tokens",
                  "Test logout and session cleanup"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Deployment Strategy</h4>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="font-medium mb-1">1. Staging Environment</div>
                  <div className="text-sm text-muted-foreground">Deploy to staging first, test all flows</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="font-medium mb-1">2. Gradual Rollout</div>
                  <div className="text-sm text-muted-foreground">Use feature flags to roll out to 10% → 50% → 100% of users</div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <div className="font-medium mb-1">3. Monitor & Rollback Plan</div>
                  <div className="text-sm text-muted-foreground">Monitor error rates, have Auth0/Okta fallback ready</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Feature Mapping</CardTitle>
            <CardDescription>How Auth0/Okta features map to AuthFlow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Auth0/Okta Feature</th>
                    <th className="text-left py-3 px-4">AuthFlow Equivalent</th>
                    <th className="text-left py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { auth0: "Universal Login", authflow: "Hosted Login Pages", notes: "Customizable UI" },
                    { auth0: "Rules/Hooks", authflow: "Actions/Hooks System", notes: "Pre/Post authentication hooks" },
                    { auth0: "Social Connections", authflow: "OAuth Providers", notes: "Google, GitHub supported" },
                    { auth0: "MFA", authflow: "MFA (TOTP, Email, SMS)", notes: "Multiple methods available" },
                    { auth0: "Organizations", authflow: "Multi-Tenancy", notes: "Built-in tenant isolation" },
                    { auth0: "Management API", authflow: "Admin API", notes: "RESTful API with OpenAPI docs" },
                    { auth0: "Passwordless", authflow: "Magic Links", notes: "Email-based authentication" },
                    { auth0: "WebAuthn", authflow: "WebAuthn/FIDO2", notes: "Biometric authentication" }
                  ].map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 px-4 font-medium">{row.auth0}</td>
                      <td className="py-3 px-4 text-primary">{row.authflow}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Support & Resources */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="glass-card">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-3" />
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Our team is here to assist with your migration</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/architecture">
                <Button className="w-full gap-2">
                  View Architecture Docs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <Key className="h-8 w-8 text-primary mb-3" />
              <CardTitle>API Reference</CardTitle>
              <CardDescription>Complete documentation for all API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/api">
                <Button className="w-full gap-2" variant="outline">
                  Browse API Docs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="p-8 rounded-2xl border bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent">
          <h3 className="text-2xl font-bold mb-3">Ready to Migrate?</h3>
          <p className="text-muted-foreground mb-6">
            Start your migration today and experience better performance at 80% lower cost
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs/quickstart">
              <Button size="lg" variant="outline" className="gap-2">
                <Code2 className="h-5 w-5" />
                Quick Start Guide
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
