import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Code2, 
  Rocket, 
  Shield, 
  Webhook, 
  Key, 
  Puzzle, 
  FileText,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function DocsLandingPage() {
  const quickLinks = [
    {
      title: "Quickstart",
      description: "Get up and running in under 5 minutes",
      icon: Rocket,
      href: "/docs/quickstart",
      colorBg: "bg-blue-500/10",
      colorText: "text-blue-500"
    },
    {
      title: "Migration Guide",
      description: "Move from Auth0 or Okta to AuthFlow",
      icon: Zap,
      href: "/docs/migration",
      colorBg: "bg-yellow-500/10",
      colorText: "text-yellow-500"
    },
    {
      title: "API Reference",
      description: "Complete API documentation with examples",
      icon: Code2,
      href: "/docs/api",
      colorBg: "bg-green-500/10",
      colorText: "text-green-500"
    },
    {
      title: "SDKs",
      description: "Client libraries for 5 languages",
      icon: Puzzle,
      href: "/docs/sdks",
      colorBg: "bg-purple-500/10",
      colorText: "text-purple-500"
    }
  ];

  const tutorials = [
    {
      title: "Migration from Auth0/Okta",
      description: "Step-by-step migration guide with zero downtime",
      href: "/docs/migration",
      time: "2-4 hours"
    },
    {
      title: "Email & Password Authentication",
      description: "Implement secure login and registration",
      href: "/docs/quickstart",
      time: "10 min"
    },
    {
      title: "Multi-Factor Authentication",
      description: "Add TOTP, SMS, and Email OTP",
      href: "/docs/quickstart",
      time: "15 min"
    },
    {
      title: "WebAuthn & Passkeys",
      description: "Enable biometric authentication",
      href: "/docs/quickstart",
      time: "12 min"
    },
    {
      title: "OAuth2 Integration",
      description: "Add Google and GitHub login",
      href: "/docs/quickstart",
      time: "8 min"
    },
    {
      title: "Webhooks & Events",
      description: "Listen to authentication events",
      href: "/docs/quickstart",
      time: "10 min"
    }
  ];

  const features = [
    "Multi-tenant architecture",
    "80% cost savings vs Auth0/Okta",
    "Self-hosted or cloud deployment",
    "SOC 2 & GDPR compliant",
    "Real-time WebSocket notifications",
    "Advanced RBAC"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-transparent" />
        <div className="container relative mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm mb-6">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Enterprise Authentication Platform</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              AuthFlow Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to integrate enterprise-grade authentication into your application
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/docs/quickstart">
                <Button size="lg" className="gap-2">
                  <Rocket className="h-5 w-5" />
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/docs/api">
                <Button size="lg" variant="outline" className="gap-2">
                  <Code2 className="h-5 w-5" />
                  API Reference
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        {/* Quick Links */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8">Quick Links</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="hover-lift cursor-pointer h-full transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className={`p-3 rounded-lg ${link.colorBg} w-fit mb-3`}>
                      <link.icon className={`h-6 w-6 ${link.colorText}`} />
                    </div>
                    <CardTitle>{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Tutorials */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Tutorials</h2>
            <Link href="/docs/quickstart">
              <Button variant="ghost" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial) => (
              <Link key={tutorial.title} href={tutorial.href}>
                <Card className="hover-lift cursor-pointer transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {tutorial.time}
                      </span>
                    </div>
                    <CardDescription>{tutorial.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8">Why AuthFlow?</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Resources */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass-card">
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-3" />
              <CardTitle>Architecture Guide</CardTitle>
              <CardDescription>
                Understanding AuthFlow's technical design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/architecture">
                <Button variant="ghost" className="gap-2 w-full">
                  Read Guide
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <Webhook className="h-8 w-8 text-primary mb-3" />
              <CardTitle>SDK Libraries</CardTitle>
              <CardDescription>
                Client libraries for 5 programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/sdks">
                <Button variant="ghost" className="gap-2 w-full">
                  View SDKs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <Key className="h-8 w-8 text-primary mb-3" />
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Complete REST API documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/docs/api">
                <Button variant="ghost" className="gap-2 w-full">
                  View Docs
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer CTA */}
        <div className="mt-20 p-8 rounded-2xl border bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent">
          <div className="max-w-2xl mx-auto text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-3">Need Help?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Check our interactive API documentation
            </p>
            <Link href="/docs/api">
              <Button size="lg" className="gap-2">
                <Code2 className="h-5 w-5" />
                Explore API Docs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
