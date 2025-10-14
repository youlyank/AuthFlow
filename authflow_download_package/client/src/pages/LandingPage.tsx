import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Key,
  Users,
  Globe,
  Lock,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  ShieldCheck,
  Cloud,
  Code,
  Sparkles,
  DollarSign,
  TrendingUp,
  Server,
  Webhook,
  Database,
  Settings,
  FileCode,
  Layers,
} from "lucide-react";

export default function LandingPage() {
  const stats = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "27+", label: "Enterprise Features" },
    { value: "80%", label: "Cost Savings" },
    { value: "< 10ms", label: "Response Time" },
  ];

  const authMethods = [
    {
      icon: Key,
      title: "Email & Password",
      description: "Secure authentication with bcrypt hashing, email verification, and password reset flows.",
    },
    {
      icon: ShieldCheck,
      title: "Multi-Factor Auth",
      description: "TOTP authenticators, email OTP, and trusted device fingerprinting for enhanced security.",
    },
    {
      icon: Zap,
      title: "Magic Links",
      description: "Passwordless authentication via secure, time-limited email links.",
    },
    {
      icon: Fingerprint,
      title: "WebAuthn/FIDO2",
      description: "Biometric authentication with Touch ID, Face ID, and hardware security keys.",
    },
    {
      icon: Globe,
      title: "Social Login",
      description: "OAuth integration with Google, GitHub, and other popular providers.",
    },
    {
      icon: Shield,
      title: "Risk-Based Auth",
      description: "Intelligent security scoring with automatic threat detection and mitigation.",
    },
  ];

  const enterpriseFeatures = [
    {
      icon: Users,
      title: "Multi-Tenancy",
      description: "Complete tenant isolation with per-tenant branding and unlimited organizations.",
      badge: "Enterprise",
    },
    {
      icon: Lock,
      title: "OAuth2/OIDC Provider",
      description: "Full OAuth2 authorization server with PKCE, consent screens, and token management.",
      badge: "Standards",
    },
    {
      icon: Webhook,
      title: "Webhooks & APIs",
      description: "Comprehensive REST APIs and webhooks for seamless integration with your systems.",
      badge: "Developer",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards, security events, and user growth metrics for data-driven decisions.",
      badge: "Insights",
    },
    {
      icon: Database,
      title: "GDPR Compliance",
      description: "Built-in data export, right-to-be-forgotten, and consent management tools.",
      badge: "Compliance",
    },
    {
      icon: ShieldCheck,
      title: "Breach Detection",
      description: "Password breach monitoring using Have I Been Pwned API with k-anonymity.",
      badge: "Security",
    },
  ];

  const deploymentOptions = [
    {
      title: "Cloud-Hosted",
      description: "Fully managed, scalable infrastructure with automatic updates and 99.9% uptime SLA.",
      features: ["Automatic scaling", "Global CDN", "Managed backups", "24/7 monitoring"],
      icon: Cloud,
      recommended: true,
    },
    {
      title: "Self-Hosted",
      description: "Deploy on your infrastructure for complete control and data sovereignty.",
      features: ["Full source access", "Custom deployment", "Data sovereignty", "No vendor lock-in"],
      icon: Server,
      recommended: false,
    },
  ];

  const comparisons = [
    { metric: "Base Price", authflow: "$99/mo", auth0: "$240/mo", okta: "$2,400/mo" },
    { metric: "Per-User Cost", authflow: "$0", auth0: "$0.50/user", okta: "$2-5/user" },
    { metric: "Multi-Tenancy", authflow: "Included", auth0: "Paid Add-on", okta: "Enterprise Only" },
    { metric: "Self-Hosting", authflow: "Available", auth0: "Not Available", okta: "Not Available" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Authflow</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/comparison">
                <Button variant="ghost" size="sm" data-testid="link-comparison">
                  Compare
                </Button>
              </Link>
              <Link href="/why-authflow">
                <Button variant="ghost" size="sm" data-testid="link-why-authflow">
                  Why Us
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-2" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5 pointer-events-none" />
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 gap-1.5" variant="secondary">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise Authentication Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
              Authentication that{" "}
              <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
                scales with you
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Replace Auth0 and Okta with a modern, cost-effective authentication platform.
              27+ enterprise features, 80% cost savings, flexible deployment options.
            </p>
            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <Link href="/register">
                <Button size="lg" className="gap-2 h-12 px-8" data-testid="button-start-free-trial">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/comparison">
                <Button size="lg" variant="outline" className="gap-2 h-12 px-8" data-testid="button-compare-plans">
                  Compare Plans
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto pt-8 border-t">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y">
        <div className="container mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8">
            TRUSTED BY INNOVATIVE COMPANIES WORLDWIDE
          </p>
          <div className="flex justify-center items-center gap-8 flex-wrap opacity-50">
            <div className="text-2xl font-bold">TechCorp</div>
            <div className="text-2xl font-bold">StartupXYZ</div>
            <div className="text-2xl font-bold">Enterprise Co</div>
            <div className="text-2xl font-bold">SaaS Platform</div>
          </div>
        </div>
      </section>

      {/* Authentication Methods */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Authentication</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Every Authentication Method
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From traditional passwords to cutting-edge biometrics, support all modern
              authentication methods out of the box.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {authMethods.map((method, idx) => {
              const Icon = method.icon;
              return (
                <Card key={idx} className="hover-elevate" data-testid={`card-auth-${idx}`}>
                  <CardHeader>
                    <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Enterprise Ready</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Built for Modern Businesses
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build secure, scalable authentication for B2B SaaS,
              fintech, healthcare, and more.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {enterpriseFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Flexible Deployment</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Deploy Your Way
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose cloud-hosted for convenience or self-host for complete control. The only
              auth platform offering both.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {deploymentOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <Card
                  key={idx}
                  className={`hover-elevate ${
                    option.recommended ? "border-2 border-primary shadow-lg" : ""
                  }`}
                >
                  <CardHeader>
                    {option.recommended && (
                      <Badge className="mb-3 w-fit">Recommended</Badge>
                    )}
                    <div className="p-4 rounded-lg bg-primary/10 w-fit mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{option.title}</CardTitle>
                    <p className="text-muted-foreground">{option.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {option.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              80% Lower Cost Than Auth0
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get all enterprise features at a fraction of the cost. No per-user fees, no hidden
              charges.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold">Feature</th>
                      <th className="text-center py-4 px-6 font-semibold text-primary">
                        Authflow
                      </th>
                      <th className="text-center py-4 px-6 font-semibold">Auth0</th>
                      <th className="text-center py-4 px-6 font-semibold">Okta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((row, idx) => (
                      <tr key={idx} className="border-t hover-elevate">
                        <td className="py-4 px-6 font-medium">{row.metric}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            {row.authflow}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-muted-foreground">
                          {row.auth0}
                        </td>
                        <td className="py-4 px-6 text-center text-muted-foreground">
                          {row.okta}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Example: For 10,000 users/month
              </p>
              <div className="flex gap-4 justify-center items-center flex-wrap">
                <div className="text-lg">
                  <span className="text-muted-foreground">Authflow: </span>
                  <span className="font-bold text-green-600">$99-299/mo</span>
                </div>
                <div className="text-lg">
                  <span className="text-muted-foreground">Auth0: </span>
                  <span className="font-bold text-red-500">$5,000+/mo</span>
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-green-600">
                💰 Save over $50,000 per year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4">Developer First</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Built by Developers, for Developers
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Modern tech stack, comprehensive APIs, and detailed documentation make
                  integration a breeze.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">RESTful APIs</div>
                      <div className="text-sm text-muted-foreground">
                        100+ well-documented endpoints with OpenAPI specs
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <Webhook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Webhooks</div>
                      <div className="text-sm text-muted-foreground">
                        Real-time event notifications with automatic retries
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <FileCode className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">SDKs Coming Soon</div>
                      <div className="text-sm text-muted-foreground">
                        JavaScript, Python, Go, and PHP client libraries
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-card border rounded-lg p-6 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">Quick Start</span>
                  </div>
                  <pre className="text-sm font-mono bg-muted p-4 rounded overflow-x-auto">
                    <code className="text-foreground">{`// Initialize Authflow
import { Authflow } from 'authflow';

const auth = new Authflow({
  tenantId: 'your-tenant-id',
  apiKey: 'your-api-key'
});

// Authenticate user
const user = await auth.login({
  email: 'user@example.com',
  password: 'secure-password'
});`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none" />
        <div className="container mx-auto text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Authentication?
          </h2>
          <p className="text-lg sm:text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join innovative companies using Authflow. Start your free trial today—no credit card
            required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 h-12 px-8"
                data-testid="button-cta-start"
              >
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/comparison">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 h-12 px-8 bg-primary/10 hover:bg-primary/20"
                data-testid="button-cta-compare"
              >
                View Full Comparison
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-6 sm:gap-8 justify-center flex-wrap text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Authflow</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enterprise authentication platform for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/comparison">
                    <span className="hover:text-foreground cursor-pointer">Pricing</span>
                  </Link>
                </li>
                <li>
                  <Link href="/why-authflow">
                    <span className="hover:text-foreground cursor-pointer">Features</span>
                  </Link>
                </li>
                <li>
                  <span className="hover:text-foreground cursor-pointer">Documentation</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="hover:text-foreground cursor-pointer">About</span>
                </li>
                <li>
                  <span className="hover:text-foreground cursor-pointer">Blog</span>
                </li>
                <li>
                  <span className="hover:text-foreground cursor-pointer">Careers</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="hover:text-foreground cursor-pointer">Privacy</span>
                </li>
                <li>
                  <span className="hover:text-foreground cursor-pointer">Terms</span>
                </li>
                <li>
                  <span className="hover:text-foreground cursor-pointer">Security</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              © 2025 Authflow. All rights reserved. Built with enterprise security in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
