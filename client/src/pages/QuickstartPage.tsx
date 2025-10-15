import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Terminal, CheckCircle2, Copy, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";

export default function QuickstartPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("backend");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <div className="absolute top-3 right-3 z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyToClipboard(code, id)}
          className="gap-2"
        >
          {copied === id ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 rounded-lg bg-muted overflow-x-auto">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );

  const backendSDKs = [
    { id: "javascript", name: "JavaScript/Node.js", install: "npm install @authflow/sdk-js", package: "@authflow/sdk-js" },
    { id: "typescript", name: "TypeScript", install: "npm install @authflow/sdk-js", package: "@authflow/sdk-js" },
    { id: "python", name: "Python", install: "pip install authflow-sdk", package: "authflow" },
    { id: "go", name: "Go", install: "go get github.com/authflow/sdk-go", package: "github.com/authflow/sdk-go" },
    { id: "php", name: "PHP", install: "composer require authflow/sdk-php", package: "authflow/sdk-php" },
    { id: "ruby", name: "Ruby", install: "gem install authflow-sdk", package: "authflow-sdk" },
    { id: "rust", name: "Rust", install: "cargo add authflow-sdk", package: "authflow-sdk" },
    { id: "java", name: "Java", install: "// Add to pom.xml or build.gradle", package: "com.authflow:sdk" },
    { id: "dotnet", name: ".NET/C#", install: "dotnet add package AuthFlow.SDK", package: "AuthFlow.SDK" },
  ];

  const mobileSDKs = [
    { id: "swift", name: "Swift (iOS)", install: "// Add to Package.swift", package: "AuthFlowSDK" },
    { id: "kotlin", name: "Kotlin (Android)", install: "// Add to build.gradle", package: "com.authflow:android-sdk" },
    { id: "flutter", name: "Flutter", install: "flutter pub add authflow_sdk", package: "authflow_sdk" },
    { id: "react-native", name: "React Native", install: "npm install @authflow/react-native", package: "@authflow/react-native" },
  ];

  const frontendSDKs = [
    { id: "react", name: "React", install: "npm install @authflow/react", package: "@authflow/react" },
    { id: "angular", name: "Angular", install: "npm install @authflow/angular", package: "@authflow/angular" },
    { id: "vue", name: "Vue.js", install: "npm install @authflow/vue", package: "@authflow/vue" },
    { id: "nextjs", name: "Next.js", install: "npm install @authflow/nextjs", package: "@authflow/nextjs" },
    { id: "svelte", name: "Svelte/SvelteKit", install: "npm install @authflow/svelte", package: "@authflow/svelte" },
    { id: "solidjs", name: "SolidJS", install: "npm install @authflow/solid", package: "@authflow/solid" },
    { id: "nuxt", name: "Nuxt", install: "npm install @authflow/nuxt", package: "@authflow/nuxt" },
    { id: "remix", name: "Remix", install: "npm install @authflow/remix", package: "@authflow/remix" },
  ];

  const frameworkSDKs = [
    { id: "laravel", name: "Laravel", install: "composer require authflow/laravel", package: "authflow/laravel" },
    { id: "django", name: "Django", install: "pip install authflow-django", package: "authflow_django" },
    { id: "express", name: "Express.js", install: "npm install @authflow/express", package: "@authflow/express" },
    { id: "nestjs", name: "NestJS", install: "npm install @authflow/nestjs", package: "@authflow/nestjs" },
    { id: "blazor", name: "Blazor", install: "dotnet add package AuthFlow.Blazor", package: "AuthFlow.Blazor" },
    { id: "deno", name: "Deno", install: "import AuthFlow from 'https://deno.land/x/authflow'", package: "deno.land/x/authflow" },
  ];

  const getInitCode = (sdk: string) => {
    const codes: Record<string, string> = {
      javascript: `import { AuthFlowClient } from '@authflow/sdk-js';

const authflow = new AuthFlowClient({
  domain: 'your-domain.authflow.com',
  clientId: 'YOUR_CLIENT_ID',
  clientSecret: 'YOUR_CLIENT_SECRET'
});`,
      python: `from authflow import AuthFlowClient

authflow = AuthFlowClient(
    domain='your-domain.authflow.com',
    client_id='YOUR_CLIENT_ID',
    client_secret='YOUR_CLIENT_SECRET'
)`,
      go: `import "github.com/authflow/sdk-go"

client, err := authflow.NewClient(&authflow.Config{
    Domain:       "your-domain.authflow.com",
    ClientID:     "YOUR_CLIENT_ID",
    ClientSecret: "YOUR_CLIENT_SECRET",
})`,
      php: `<?php
require 'vendor/autoload.php';

use AuthFlow\\SDK\\Client;

$authflow = new Client([
    'domain' => 'your-domain.authflow.com',
    'client_id' => 'YOUR_CLIENT_ID',
    'client_secret' => 'YOUR_CLIENT_SECRET'
]);`,
      ruby: `require 'authflow'

authflow = AuthFlow::Client.new(
  domain: 'your-domain.authflow.com',
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET'
)`,
      react: `import { AuthFlowProvider } from '@authflow/react';

function App() {
  return (
    <AuthFlowProvider
      domain="your-domain.authflow.com"
      clientId="YOUR_CLIENT_ID"
      redirectUri={window.location.origin}
    >
      <YourApp />
    </AuthFlowProvider>
  );
}`,
      nextjs: `// app/layout.tsx
import { AuthFlowProvider } from '@authflow/nextjs';

export default function RootLayout({ children }) {
  return (
    <AuthFlowProvider
      domain={process.env.AUTHFLOW_DOMAIN}
      clientId={process.env.AUTHFLOW_CLIENT_ID}
    >
      {children}
    </AuthFlowProvider>
  );
}`,
      laravel: `// config/authflow.php
return [
    'domain' => env('AUTHFLOW_DOMAIN'),
    'client_id' => env('AUTHFLOW_CLIENT_ID'),
    'client_secret' => env('AUTHFLOW_CLIENT_SECRET'),
];

// In your controller
use AuthFlow\\Laravel\\Facades\\AuthFlow;

$user = AuthFlow::getUser();`,
      django: `# settings.py
AUTHFLOW = {
    'DOMAIN': 'your-domain.authflow.com',
    'CLIENT_ID': 'YOUR_CLIENT_ID',
    'CLIENT_SECRET': 'YOUR_CLIENT_SECRET',
}

# Add to MIDDLEWARE
MIDDLEWARE = [
    # ...
    'authflow_django.middleware.AuthFlowMiddleware',
]`,
      swift: `import AuthFlowSDK

let authflow = AuthFlow(
    domain: "your-domain.authflow.com",
    clientId: "YOUR_CLIENT_ID"
)`,
      kotlin: `import com.authflow.android.AuthFlow

val authflow = AuthFlow(
    domain = "your-domain.authflow.com",
    clientId = "YOUR_CLIENT_ID"
)`,
      flutter: `import 'package:authflow_sdk/authflow_sdk.dart';

final authflow = AuthFlow(
  domain: 'your-domain.authflow.com',
  clientId: 'YOUR_CLIENT_ID',
);`,
    };
    return codes[sdk] || codes.javascript;
  };

  const getLoginCode = (sdk: string) => {
    const codes: Record<string, string> = {
      javascript: `// Redirect to login
await authflow.loginWithRedirect();

// Or use popup
const user = await authflow.loginWithPopup();

// Handle callback
const user = await authflow.handleRedirectCallback();`,
      python: `# Get authorization URL
auth_url = authflow.get_authorization_url(
    redirect_uri='http://localhost:3000/callback'
)

# Exchange code for tokens
tokens = authflow.exchange_code_for_tokens(code)

# Get user info
user = authflow.get_user_info(tokens['access_token'])`,
      react: `import { useAuthFlow } from '@authflow/react';

function LoginButton() {
  const { loginWithRedirect, user, isAuthenticated } = useAuthFlow();
  
  if (isAuthenticated) {
    return <div>Welcome {user.name}</div>;
  }
  
  return <button onClick={loginWithRedirect}>Log In</button>;
}`,
      nextjs: `// app/login/page.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@authflow/nextjs';

export default async function LoginPage() {
  const session = await getSession();
  
  if (session) {
    redirect('/dashboard');
  }
  
  return <a href="/api/auth/login">Log In</a>;
}`,
      swift: `// Login with biometrics
authflow.login(
    strategy: .biometric,
    completion: { result in
        switch result {
        case .success(let user):
            print("Logged in: \\(user.email)")
        case .failure(let error):
            print("Error: \\(error)")
        }
    }
)`,
      kotlin: `// Login with biometrics
authflow.login(
    strategy = LoginStrategy.Biometric,
    callback = { result ->
        result.onSuccess { user ->
            println("Logged in: \${user.email}")
        }.onFailure { error ->
            println("Error: \$error")
        }
    }
)`,
    };
    return codes[sdk] || codes.javascript;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/docs">
            <Button variant="ghost" className="gap-2 mb-4">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Back to Docs
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">Quickstart Guide</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Get up and running with AuthFlow in under 5 minutes. Choose your language/framework below.
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="secondary">26 SDKs Available</Badge>
            <Badge variant="outline">Full Auth Support</Badge>
            <Badge variant="outline">MFA & WebAuthn</Badge>
            <Badge variant="outline">OAuth2/OIDC</Badge>
          </div>
        </div>

        {/* SDK Categories */}
        <div className="mb-8">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="backend">Backend ({backendSDKs.length})</TabsTrigger>
              <TabsTrigger value="mobile">Mobile ({mobileSDKs.length})</TabsTrigger>
              <TabsTrigger value="frontend">Frontend ({frontendSDKs.length})</TabsTrigger>
              <TabsTrigger value="framework">Framework ({frameworkSDKs.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1: Install SDK */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <CardTitle>Install SDK</CardTitle>
              </div>
              <CardDescription>Choose your preferred language and install the AuthFlow SDK</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCategory === "backend" && (
                <Tabs defaultValue="javascript">
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    {backendSDKs.slice(0, 5).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {backendSDKs.slice(5).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {backendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-install`} language="bash" code={sdk.install} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "mobile" && (
                <Tabs defaultValue="swift">
                  <TabsList className="grid w-full grid-cols-4">
                    {mobileSDKs.map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {mobileSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-install`} language="bash" code={sdk.install} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "frontend" && (
                <Tabs defaultValue="react">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {frontendSDKs.slice(0, 4).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {frontendSDKs.slice(4).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frontendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-install`} language="bash" code={sdk.install} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "framework" && (
                <Tabs defaultValue="laravel">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    {frameworkSDKs.slice(0, 3).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    {frameworkSDKs.slice(3).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frameworkSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-install`} language="bash" code={sdk.install} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Initialize */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <CardTitle>Initialize SDK</CardTitle>
              </div>
              <CardDescription>Configure the SDK with your AuthFlow credentials</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCategory === "backend" && (
                <Tabs defaultValue="javascript">
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    {backendSDKs.slice(0, 5).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {backendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-init`} language={sdk.id} code={getInitCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "mobile" && (
                <Tabs defaultValue="swift">
                  <TabsList className="grid w-full grid-cols-4">
                    {mobileSDKs.map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {mobileSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-init`} language={sdk.id} code={getInitCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "frontend" && (
                <Tabs defaultValue="react">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {frontendSDKs.slice(0, 4).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frontendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-init`} language={sdk.id} code={getInitCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "framework" && (
                <Tabs defaultValue="laravel">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    {frameworkSDKs.slice(0, 3).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frameworkSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-init`} language={sdk.id} code={getInitCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Implement Login */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <CardTitle>Implement Authentication</CardTitle>
              </div>
              <CardDescription>Add login functionality to your application</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedCategory === "backend" && (
                <Tabs defaultValue="javascript">
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    {backendSDKs.slice(0, 5).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {backendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-login`} language={sdk.id} code={getLoginCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "mobile" && (
                <Tabs defaultValue="swift">
                  <TabsList className="grid w-full grid-cols-4">
                    {mobileSDKs.map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {mobileSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-login`} language={sdk.id} code={getLoginCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "frontend" && (
                <Tabs defaultValue="react">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    {frontendSDKs.slice(0, 4).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frontendSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-login`} language={sdk.id} code={getLoginCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
              
              {selectedCategory === "framework" && (
                <Tabs defaultValue="laravel">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    {frameworkSDKs.slice(0, 3).map(sdk => (
                      <TabsTrigger key={sdk.id} value={sdk.id}>{sdk.name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {frameworkSDKs.map(sdk => (
                    <TabsContent key={sdk.id} value={sdk.id}>
                      <CodeBlock id={`${sdk.id}-login`} language={sdk.id} code={getLoginCode(sdk.id)} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Get Credentials */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <CardTitle>Get Your Credentials</CardTitle>
              </div>
              <CardDescription>Register your application to get your API credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Sign up for AuthFlow</p>
                    <p className="text-sm text-muted-foreground">Create a free account - no credit card required</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Create an application</p>
                    <p className="text-sm text-muted-foreground">Get your domain, client ID, and client secret</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Configure callback URLs</p>
                    <p className="text-sm text-muted-foreground">Set your redirect URIs for development and production</p>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full gap-2 mt-4">
                    Get Started Free
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Explore advanced features and integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/docs/flows">
                <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                  <BookOpen className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Authentication Flows</h3>
                  <p className="text-sm text-muted-foreground">Learn about OAuth 2.0 and OIDC flows</p>
                </div>
              </Link>
              <Link href="/docs/sdks">
                <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                  <Code2 className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">SDK Documentation</h3>
                  <p className="text-sm text-muted-foreground">Detailed guides for each SDK</p>
                </div>
              </Link>
              <Link href="/sdks">
                <div className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer">
                  <Terminal className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">Download SDKs</h3>
                  <p className="text-sm text-muted-foreground">Get SDK packages and source code</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
