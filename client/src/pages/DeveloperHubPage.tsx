import { Code2, BookOpen, Rocket, Terminal, Database, Cloud, Shield, Zap, FileCode, GitBranch, Package } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const quickstarts = [
  {
    title: "5-Minute Quickstart",
    description: "Get authentication running in your app in under 5 minutes",
    icon: Rocket,
    time: "5 min",
    difficulty: "Beginner",
    link: "/docs/quickstart",
    color: "text-blue-500"
  },
  {
    title: "React Integration",
    description: "Add AuthFlow to your React app with hooks and context",
    icon: Code2,
    time: "10 min",
    difficulty: "Beginner",
    link: "/docs/quickstart#react",
    color: "text-cyan-500"
  },
  {
    title: "Next.js Setup",
    description: "Server Components, API routes, and middleware setup",
    icon: Terminal,
    time: "15 min",
    difficulty: "Intermediate",
    link: "/docs/quickstart#nextjs",
    color: "text-black dark:text-white"
  },
  {
    title: "Mobile Apps",
    description: "React Native, Flutter, or native iOS/Android integration",
    icon: Package,
    time: "20 min",
    difficulty: "Intermediate",
    link: "/docs/quickstart#mobile",
    color: "text-purple-500"
  },
];

const tutorials = [
  {
    title: "Building a SaaS with Multi-Tenancy",
    description: "Complete guide to building a multi-tenant SaaS application with AuthFlow",
    tags: ["SaaS", "Multi-Tenancy", "RBAC"],
    duration: "45 min",
    level: "Advanced",
    link: "/docs/tutorials/saas-multitenancy"
  },
  {
    title: "Implementing MFA",
    description: "Add TOTP, Email OTP, SMS, and WebAuthn to your application",
    tags: ["MFA", "Security", "WebAuthn"],
    duration: "30 min",
    level: "Intermediate",
    link: "/docs/tutorials/mfa"
  },
  {
    title: "OAuth2 Provider Setup",
    description: "Turn your app into an OAuth2/OIDC identity provider",
    tags: ["OAuth2", "OIDC", "SSO"],
    duration: "60 min",
    level: "Advanced",
    link: "/docs/tutorials/oauth-provider"
  },
  {
    title: "API Key Authentication",
    description: "Implement API key management for your public API",
    tags: ["API Keys", "Security", "REST"],
    duration: "25 min",
    level: "Intermediate",
    link: "/docs/tutorials/api-keys"
  },
  {
    title: "Webhooks & Events",
    description: "Set up webhooks to react to authentication events",
    tags: ["Webhooks", "Events", "Integration"],
    duration: "20 min",
    level: "Beginner",
    link: "/docs/tutorials/webhooks"
  },
  {
    title: "Custom Actions & Hooks",
    description: "Extend authentication flows with custom logic",
    tags: ["Actions", "Hooks", "Customization"],
    duration: "35 min",
    level: "Advanced",
    link: "/docs/tutorials/actions"
  },
];

const codeSamples = {
  login: `// React Login Component
import { useAuth } from '@authflow/react';

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    await login({
      email: formData.get('email'),
      password: formData.get('password')
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}`,
  mfa: `// Setup TOTP MFA
import { useMFA } from '@authflow/react';

function MFASetup() {
  const { enableMFATOTP, verifyMFATOTP } = useMFA();
  const [qrCode, setQrCode] = useState('');
  
  const setup = async () => {
    const { qrCode } = await enableMFATOTP();
    setQrCode(qrCode);
  };
  
  const verify = async (code) => {
    await verifyMFATOTP(code);
    alert('MFA enabled successfully!');
  };
  
  return (
    <div>
      <button onClick={setup}>Enable MFA</button>
      {qrCode && <img src={qrCode} alt="QR Code" />}
    </div>
  );
}`,
  backend: `// Express.js Protected API Route
import { AuthflowClient } from '@authflow/js-sdk';

const authflow = new AuthflowClient({
  domain: process.env.AUTHFLOW_DOMAIN,
  tenantSlug: process.env.AUTHFLOW_TENANT
});

app.get('/api/protected', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    const user = await authflow.verifyToken(token);
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});`,
  oauth: `// OAuth2 Social Login
import { useOAuth } from '@authflow/react';

function SocialLogin() {
  const { loginWithGoogle, loginWithGitHub } = useOAuth();
  
  return (
    <div>
      <button onClick={loginWithGoogle}>
        Sign in with Google
      </button>
      <button onClick={loginWithGitHub}>
        Sign in with GitHub
      </button>
    </div>
  );
}`,
};

const resources = [
  {
    title: "API Reference",
    description: "Complete REST API documentation with interactive examples",
    icon: Database,
    link: "/docs/api",
    color: "text-green-500"
  },
  {
    title: "Architecture Guide",
    description: "Understanding AuthFlow's multi-tenant architecture",
    icon: Cloud,
    link: "/docs/architecture",
    color: "text-blue-500"
  },
  {
    title: "Security Best Practices",
    description: "Learn how to secure your authentication implementation",
    icon: Shield,
    link: "/docs/security",
    color: "text-red-500"
  },
  {
    title: "Migration Guide",
    description: "Migrate from Auth0, Okta, or Keycloak to AuthFlow",
    icon: GitBranch,
    link: "/docs/migration",
    color: "text-purple-500"
  },
];

export default function DeveloperHubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Developer Resources
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Developer Hub
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Everything you need to integrate AuthFlow into your application. Quickstarts, tutorials, code samples, and API docs.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/docs/quickstart">
              <Button size="lg" data-testid="button-get-started">
                <Rocket className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
            <Link href="/sdks">
              <Button size="lg" variant="outline" data-testid="button-browse-sdks">
                <Package className="w-4 h-4 mr-2" />
                Browse SDKs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quickstarts Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quickstart Guides</h2>
            <p className="text-muted-foreground">
              Get up and running in minutes with our framework-specific guides
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickstarts.map((guide) => (
              <Link key={guide.title} href={guide.link}>
                <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-quickstart-${guide.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <guide.icon className={`w-8 h-8 mb-4 ${guide.color}`} />
                  <h3 className="font-semibold text-lg mb-2">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {guide.time}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {guide.difficulty}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Tutorials</h2>
            <p className="text-muted-foreground">
              In-depth guides for common authentication patterns
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.title} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-tutorial-${tutorial.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">
                    {tutorial.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{tutorial.duration}</span>
                </div>
                
                <h3 className="font-semibold text-lg mb-2">{tutorial.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tutorial.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {tutorial.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Link href={tutorial.link}>
                  <Button variant="outline" size="sm" className="w-full" data-testid={`button-tutorial-${tutorial.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Read Tutorial
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Code Samples Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Code Samples</h2>
            <p className="text-muted-foreground">
              Copy-paste ready code for common authentication scenarios
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-8 w-full md:w-auto">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="mfa" data-testid="tab-mfa">MFA</TabsTrigger>
              <TabsTrigger value="backend" data-testid="tab-backend">Backend</TabsTrigger>
              <TabsTrigger value="oauth" data-testid="tab-oauth">OAuth</TabsTrigger>
            </TabsList>

            {Object.entries(codeSamples).map(([key, code]) => (
              <TabsContent key={key} value={key} className="mt-0">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-primary" />
                      <span className="font-semibold capitalize">{key} Example</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(code)}
                      data-testid={`button-copy-${key}`}
                    >
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">{code}</code>
                  </pre>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Resources</h2>
            <p className="text-muted-foreground">
              Deep dive into AuthFlow's features and capabilities
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {resources.map((resource) => (
              <Link key={resource.title} href={resource.link}>
                <Card className="p-6 h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-resource-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <resource.icon className={`w-8 h-8 mb-4 ${resource.color}`} />
                  <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground">{resource.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join our community or reach out to our support team
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="outline" asChild data-testid="button-discord">
              <a href="https://discord.gg/authflow" target="_blank" rel="noopener noreferrer">
                Join Discord
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-github">
              <a href="https://github.com/authflow" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
            <Link href="/docs">
              <Button size="lg" data-testid="button-docs">
                Browse Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
