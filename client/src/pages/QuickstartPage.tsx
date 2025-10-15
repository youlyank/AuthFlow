import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Terminal, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function QuickstartPage() {
  const [copied, setCopied] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Quickstart Guide</h1>
          <p className="text-xl text-muted-foreground">
            Get up and running with AuthFlow in under 5 minutes
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
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
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="go">Go</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="ruby">Ruby</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript" className="mt-4">
                  <CodeBlock
                    id="js-install"
                    language="bash"
                    code="npm install @authflow/sdk-js"
                  />
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <CodeBlock
                    id="py-install"
                    language="bash"
                    code="pip install authflow-sdk"
                  />
                </TabsContent>
                <TabsContent value="go" className="mt-4">
                  <CodeBlock
                    id="go-install"
                    language="bash"
                    code="go get github.com/authflow/sdk-go"
                  />
                </TabsContent>
                <TabsContent value="php" className="mt-4">
                  <CodeBlock
                    id="php-install"
                    language="bash"
                    code="composer require authflow/sdk-php"
                  />
                </TabsContent>
                <TabsContent value="ruby" className="mt-4">
                  <CodeBlock
                    id="ruby-install"
                    language="bash"
                    code="gem install authflow-sdk"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step 2 */}
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
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="go">Go</TabsTrigger>
                  <TabsTrigger value="php">PHP</TabsTrigger>
                  <TabsTrigger value="ruby">Ruby</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript" className="mt-4">
                  <CodeBlock
                    id="js-init"
                    language="javascript"
                    code={`import { AuthflowClient } from '@authflow/sdk-js';

const authflow = new AuthflowClient({
  baseUrl: 'https://your-authflow-instance.com',
  apiKey: 'your-api-key'
});`}
                  />
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <CodeBlock
                    id="py-init"
                    language="python"
                    code={`from authflow import AuthflowClient

authflow = AuthflowClient(
    base_url='https://your-authflow-instance.com',
    api_key='your-api-key'
)`}
                  />
                </TabsContent>
                <TabsContent value="go" className="mt-4">
                  <CodeBlock
                    id="go-init"
                    language="go"
                    code={`import "github.com/authflow/sdk-go"

client := authflow.NewClient(&authflow.Config{
    BaseURL: "https://your-authflow-instance.com",
    APIKey:  "your-api-key",
})`}
                  />
                </TabsContent>
                <TabsContent value="php" className="mt-4">
                  <CodeBlock
                    id="php-init"
                    language="php"
                    code={`use Authflow\\Client;

$authflow = new Client([
    'base_url' => 'https://your-authflow-instance.com',
    'api_key' => 'your-api-key'
]);`}
                  />
                </TabsContent>
                <TabsContent value="ruby" className="mt-4">
                  <CodeBlock
                    id="ruby-init"
                    language="ruby"
                    code={`require 'authflow'

authflow = Authflow::Client.new(
  base_url: 'https://your-authflow-instance.com',
  api_key: 'your-api-key'
)`}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <CardTitle>Authenticate Users</CardTitle>
              </div>
              <CardDescription>Implement login functionality</CardDescription>
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
                <TabsContent value="javascript" className="mt-4">
                  <CodeBlock
                    id="js-auth"
                    language="javascript"
                    code={`// Login with email/password
const result = await authflow.auth.login({
  email: 'user@example.com',
  password: 'secure-password'
});

console.log('Access Token:', result.accessToken);
console.log('User:', result.user);`}
                  />
                </TabsContent>
                <TabsContent value="python" className="mt-4">
                  <CodeBlock
                    id="py-auth"
                    language="python"
                    code={`# Login with email/password
result = authflow.auth.login(
    email='user@example.com',
    password='secure-password'
)

print('Access Token:', result['access_token'])
print('User:', result['user'])`}
                  />
                </TabsContent>
                <TabsContent value="go" className="mt-4">
                  <CodeBlock
                    id="go-auth"
                    language="go"
                    code={`// Login with email/password
result, err := client.Auth.Login(&authflow.LoginRequest{
    Email:    "user@example.com",
    Password: "secure-password",
})

if err != nil {
    log.Fatal(err)
}

fmt.Println("Access Token:", result.AccessToken)
fmt.Println("User:", result.User)`}
                  />
                </TabsContent>
                <TabsContent value="php" className="mt-4">
                  <CodeBlock
                    id="php-auth"
                    language="php"
                    code={`// Login with email/password
$result = $authflow->auth->login([
    'email' => 'user@example.com',
    'password' => 'secure-password'
]);

echo 'Access Token: ' . $result['accessToken'];
echo 'User: ' . json_encode($result['user']);`}
                  />
                </TabsContent>
                <TabsContent value="ruby" className="mt-4">
                  <CodeBlock
                    id="ruby-auth"
                    language="ruby"
                    code={`# Login with email/password
result = authflow.auth.login(
  email: 'user@example.com',
  password: 'secure-password'
)

puts "Access Token: #{result[:access_token]}"
puts "User: #{result[:user]}"`}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <CardTitle>Register New Users</CardTitle>
              </div>
              <CardDescription>Create user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock
                id="register"
                language="javascript"
                code={`// Register a new user
const user = await authflow.auth.register({
  email: 'newuser@example.com',
  password: 'Secure123!',
  firstName: 'John',
  lastName: 'Doe'
});

console.log('User registered:', user);`}
              />
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle>🎉 You're All Set!</CardTitle>
              <CardDescription>Explore advanced features next</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <a href="/docs/tutorials/mfa" className="text-primary hover:underline">
                  Add Multi-Factor Authentication
                </a>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <a href="/docs/tutorials/oauth" className="text-primary hover:underline">
                  Enable OAuth (Google, GitHub)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <a href="/docs/tutorials/webauthn" className="text-primary hover:underline">
                  Setup WebAuthn/Passkeys
                </a>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <a href="/docs/webhooks" className="text-primary hover:underline">
                  Configure Webhooks
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
