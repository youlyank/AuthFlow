import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Shield,
  Lock,
  Key,
  Server,
  Smartphone,
  Globe,
  CheckCircle2,
  Code,
  ArrowRight,
  Zap,
  AlertTriangle,
} from "lucide-react";

export default function APIFlowsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/docs">
            <Button variant="ghost" className="gap-2 mb-4" data-testid="link-back-docs">
              <ArrowLeft className="h-4 w-4" />
              Back to Docs
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Authentication & Authorization Flows</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            AuthFlow supports all standard OAuth 2.0 and OpenID Connect flows. Choose the right flow for your application type.
          </p>
        </div>
      </div>

      {/* Flow Selection Guide */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold mb-8">Which Flow Should You Use?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Web Applications",
                description: "Server-side apps that can securely store secrets",
                flow: "Authorization Code Flow",
                icon: Globe,
                color: "text-blue-500",
                bgColor: "bg-blue-500/10",
              },
              {
                title: "SPAs & Mobile Apps",
                description: "Single-page and native apps without server backends",
                flow: "Authorization Code Flow with PKCE",
                icon: Smartphone,
                color: "text-green-500",
                bgColor: "bg-green-500/10",
              },
              {
                title: "Machine-to-Machine",
                description: "Backend services authenticating as themselves",
                flow: "Client Credentials Flow",
                icon: Server,
                color: "text-purple-500",
                bgColor: "bg-purple-500/10",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="hover-lift border-2">
                  <CardHeader>
                    <div className={`p-3 rounded-xl ${item.bgColor} w-fit mb-4`}>
                      <Icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                    <CardDescription className="text-base mb-4">{item.description}</CardDescription>
                    <Badge variant="secondary" className="w-fit">{item.flow}</Badge>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed Flows */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <Tabs defaultValue="auth-code" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="auth-code">Authorization Code</TabsTrigger>
              <TabsTrigger value="pkce">PKCE</TabsTrigger>
              <TabsTrigger value="client-credentials">Client Credentials</TabsTrigger>
              <TabsTrigger value="password">Resource Owner Password</TabsTrigger>
            </TabsList>

            {/* Authorization Code Flow */}
            <TabsContent value="auth-code" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Authorization Code Flow</CardTitle>
                      <CardDescription className="text-base">
                        Most secure flow for web applications with server-side backends
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Recommended
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      How It Works
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                      <li>User clicks login and is redirected to AuthFlow's authorization endpoint</li>
                      <li>User authenticates and grants consent</li>
                      <li>AuthFlow redirects back with an authorization code</li>
                      <li>Your server exchanges the code for tokens using client secret</li>
                      <li>Server receives ID token, access token, and refresh token</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Step 1: Authorization Request</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`GET https://your-domain.authflow.com/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &scope=openid email profile
  &state=RANDOM_STATE
  &audience=https://yourapi.com`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Step 2: Token Exchange (Server-Side)</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`POST https://your-domain.authflow.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&redirect_uri=https://yourapp.com/callback`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Response</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "v1.MRr-AqXDBz...",
  "token_type": "Bearer",
  "expires_in": 86400
}`}</code>
                    </pre>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-600 mb-1">Best For:</p>
                      <p className="text-sm text-muted-foreground">
                        Server-rendered web apps (Express, Django, Laravel, ASP.NET) that can securely store client secrets
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PKCE Flow */}
            <TabsContent value="pkce" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Authorization Code Flow with PKCE</CardTitle>
                      <CardDescription className="text-base">
                        Secure authentication for SPAs and mobile apps without client secrets
                      </CardDescription>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <Shield className="h-4 w-4" />
                      Enhanced Security
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      How It Works
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                      <li>App generates a random code_verifier and creates code_challenge (SHA256 hash)</li>
                      <li>User is redirected to AuthFlow with code_challenge</li>
                      <li>User authenticates and grants consent</li>
                      <li>AuthFlow redirects back with authorization code</li>
                      <li>App exchanges code + code_verifier for tokens (no client secret needed)</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Step 1: Generate PKCE Parameters</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`// Generate random code_verifier (43-128 chars)
const codeVerifier = generateRandomString(128);

// Create code_challenge (SHA256 hash, base64url encoded)
const codeChallenge = base64URLEncode(
  sha256(codeVerifier)
);`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Step 2: Authorization Request</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`GET https://your-domain.authflow.com/authorize?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/callback
  &scope=openid email profile
  &state=RANDOM_STATE
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Step 3: Token Exchange (No Client Secret)</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`POST https://your-domain.authflow.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&client_id=YOUR_CLIENT_ID
&code_verifier=ORIGINAL_CODE_VERIFIER
&redirect_uri=https://yourapp.com/callback`}</code>
                    </pre>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-600 mb-1">Best For:</p>
                      <p className="text-sm text-muted-foreground">
                        Single-page apps (React, Vue, Angular), mobile apps (iOS, Android, React Native), and any public client
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client Credentials Flow */}
            <TabsContent value="client-credentials" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Client Credentials Flow</CardTitle>
                      <CardDescription className="text-base">
                        Machine-to-machine authentication without user context
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                      <Server className="h-4 w-4" />
                      M2M
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      How It Works
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                      <li>Service authenticates directly with client credentials (ID + secret)</li>
                      <li>AuthFlow validates credentials and issues access token</li>
                      <li>Service uses access token to call APIs</li>
                      <li>No user interaction or consent required</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Token Request</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`POST https://your-domain.authflow.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&audience=https://yourapi.com`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Response</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 86400
}`}</code>
                    </pre>
                    <p className="text-sm text-muted-foreground mt-3">
                      Note: No ID token or refresh token - only access token for API authorization
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Usage Example</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`// Use access token in API requests
fetch('https://yourapi.com/data', {
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});`}</code>
                    </pre>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-600 mb-1">Best For:</p>
                      <p className="text-sm text-muted-foreground">
                        Cron jobs, CLIs, backend services, microservices communication, and scheduled tasks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resource Owner Password Flow */}
            <TabsContent value="password" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Resource Owner Password Flow</CardTitle>
                      <CardDescription className="text-base">
                        Direct username/password authentication (highly trusted apps only)
                      </CardDescription>
                    </div>
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Not Recommended
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-600 mb-1">Security Warning</p>
                      <p className="text-sm text-muted-foreground">
                        This flow requires users to share credentials directly with your app. Only use for highly trusted, first-party applications.
                        Authorization Code Flow with PKCE is recommended instead.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      How It Works
                    </h3>
                    <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                      <li>User enters username/password directly in your app</li>
                      <li>App sends credentials to AuthFlow token endpoint</li>
                      <li>AuthFlow validates and returns tokens</li>
                      <li>No redirect or consent screen involved</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Token Request</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`POST https://your-domain.authflow.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
&username=user@example.com
&password=USER_PASSWORD
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET
&scope=openid email profile
&audience=https://yourapi.com`}</code>
                    </pre>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Response</h3>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "v1.MRr-AqXDBz...",
  "token_type": "Bearer",
  "expires_in": 86400
}`}</code>
                    </pre>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-600 mb-1">Limited Use Cases:</p>
                      <p className="text-sm text-muted-foreground">
                        Only use for: Legacy app migration, highly trusted first-party mobile apps, or when redirect-based flows are impossible
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Token Types */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold mb-8">Understanding Tokens</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  ID Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Contains user identity information (JWT format)
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>User profile data (name, email)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Authentication metadata</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Short-lived (15-60 minutes)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-green-500" />
                  Access Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Grants access to protected APIs and resources
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>API authorization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Scopes and permissions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Configurable lifetime</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-purple-500" />
                  Refresh Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Gets new access tokens without re-authentication
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Silent token renewal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Long-lived (days/weeks)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Rotation for security</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Implement?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Check out our SDK quickstart guides for code examples in your preferred language
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/docs/quickstart">
              <Button size="lg" className="gap-2">
                <Code className="h-5 w-5" />
                View Quickstart Guides
              </Button>
            </Link>
            <Link href="/sdks">
              <Button size="lg" variant="outline" className="gap-2">
                Browse SDKs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
