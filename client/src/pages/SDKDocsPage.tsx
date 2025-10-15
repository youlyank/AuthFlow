import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiJavascript, SiPython, SiGo, SiPhp, SiRuby } from "react-icons/si";
import { ExternalLink, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SDKDocsPage() {
  const sdks = [
    {
      name: "JavaScript/TypeScript",
      icon: SiJavascript,
      package: "@authflow/sdk-js",
      install: "npm install @authflow/sdk-js",
      npm: "https://npmjs.com/package/@authflow/sdk-js",
      github: "https://github.com/authflow/sdk-js",
      color: "text-yellow-500",
      features: ["Browser & Node.js support", "TypeScript types", "Session management", "WebSocket support"]
    },
    {
      name: "Python",
      icon: SiPython,
      package: "authflow-sdk",
      install: "pip install authflow-sdk",
      pypi: "https://pypi.org/project/authflow-sdk",
      github: "https://github.com/authflow/sdk-python",
      color: "text-blue-500",
      features: ["Async/await support", "Type hints", "Django integration", "Flask helpers"]
    },
    {
      name: "Go",
      icon: SiGo,
      package: "github.com/authflow/sdk-go",
      install: "go get github.com/authflow/sdk-go",
      github: "https://github.com/authflow/sdk-go",
      color: "text-cyan-500",
      features: ["Context support", "Middleware", "Type-safe", "Goroutine-safe"]
    },
    {
      name: "PHP",
      icon: SiPhp,
      package: "authflow/sdk-php",
      install: "composer require authflow/sdk-php",
      packagist: "https://packagist.org/packages/authflow/sdk-php",
      github: "https://github.com/authflow/sdk-php",
      color: "text-purple-500",
      features: ["PSR-4 compliant", "Laravel support", "Symfony integration", "Composer ready"]
    },
    {
      name: "Ruby",
      icon: SiRuby,
      package: "authflow-sdk",
      install: "gem install authflow-sdk",
      rubygems: "https://rubygems.org/gems/authflow-sdk",
      github: "https://github.com/authflow/sdk-ruby",
      color: "text-red-500",
      features: ["Rails integration", "Rack middleware", "RSpec helpers", "ActiveSupport"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">SDK Documentation</h1>
          <p className="text-xl text-muted-foreground">
            Official client libraries for AuthFlow in 5 languages
          </p>
        </div>

        {/* SDK Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {sdks.map((sdk) => (
            <Card key={sdk.name} className="hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <sdk.icon className={`h-8 w-8 ${sdk.color}`} />
                  <CardTitle>{sdk.name}</CardTitle>
                </div>
                <CardDescription className="font-mono text-xs">
                  {sdk.package}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="p-3 rounded-lg bg-muted text-sm font-mono overflow-x-auto">
                  {sdk.install}
                </pre>
                <div className="space-y-2">
                  {sdk.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {sdk.github && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={sdk.github} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        GitHub
                      </a>
                    </Button>
                  )}
                  {(sdk.npm || sdk.pypi || sdk.packagist || sdk.rubygems) && (
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href={sdk.npm || sdk.pypi || sdk.packagist || sdk.rubygems} target="_blank" rel="noopener noreferrer">
                        <Package className="h-3 w-3 mr-1" />
                        Package
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Examples */}
        <Card>
          <CardHeader>
            <CardTitle>SDK Examples</CardTitle>
            <CardDescription>Common authentication patterns across all SDKs</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="javascript" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="go">Go</TabsTrigger>
                <TabsTrigger value="php">PHP</TabsTrigger>
                <TabsTrigger value="ruby">Ruby</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">Registration</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`const user = await authflow.auth.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe'
});`}</code>
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">MFA Setup</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`const mfaSetup = await authflow.mfa.setupTOTP();
// Show QR code to user
console.log('QR Code:', mfaSetup.qrCode);

// Verify with code from authenticator app
await authflow.mfa.verifyTOTP({
  code: '123456'
});`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="python" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">Registration</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`user = authflow.auth.register(
    email='user@example.com',
    password='SecurePass123!',
    first_name='John',
    last_name='Doe'
)`}</code>
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">WebAuthn Registration</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`# Start registration
options = authflow.webauthn.register_begin()

# Complete with credential from browser
authflow.webauthn.register_complete(
    credential=credential_from_browser
)`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="go" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">Login</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`result, err := client.Auth.Login(&authflow.LoginRequest{
    Email:    "user@example.com",
    Password: "SecurePass123!",
})
if err != nil {
    log.Fatal(err)
}

fmt.Println("Token:", result.AccessToken)`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="php" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">OAuth Login</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`// Get OAuth URL
$url = $authflow->oauth->getAuthUrl('google', [
    'redirect_uri' => 'https://yourapp.com/callback'
]);

// Handle callback
$result = $authflow->oauth->handleCallback($_GET['code']);`}</code>
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="ruby" className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-3">API Key Authentication</h4>
                  <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
                    <code className="text-sm font-mono">{`# Create API key
api_key = authflow.api_keys.create(
  name: 'Production API',
  permissions: ['users:read', 'users:write']
)

puts "API Key: #{api_key[:key]}"`}</code>
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Support Matrix</CardTitle>
            <CardDescription>Authentication features available in each SDK</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Feature</th>
                    <th className="text-center p-3">JavaScript</th>
                    <th className="text-center p-3">Python</th>
                    <th className="text-center p-3">Go</th>
                    <th className="text-center p-3">PHP</th>
                    <th className="text-center p-3">Ruby</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Email/Password", all: true },
                    { name: "OAuth2", all: true },
                    { name: "MFA (TOTP)", all: true },
                    { name: "WebAuthn", all: true },
                    { name: "Magic Links", all: true },
                    { name: "API Keys", all: true },
                    { name: "WebSocket", js: true, py: true, go: true },
                    { name: "Session Management", all: true }
                  ].map((feature) => (
                    <tr key={feature.name} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{feature.name}</td>
                      <td className="text-center p-3">
                        {(feature.all || feature.js) && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                      </td>
                      <td className="text-center p-3">
                        {(feature.all || feature.py) && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                      </td>
                      <td className="text-center p-3">
                        {(feature.all || feature.go) && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                      </td>
                      <td className="text-center p-3">
                        {feature.all && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                      </td>
                      <td className="text-center p-3">
                        {feature.all && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
