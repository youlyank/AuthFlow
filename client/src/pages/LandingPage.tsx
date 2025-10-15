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
  Layers,
  Activity,
  Bell,
  Smartphone,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Glassmorphic */}
      <nav className="glass-card sticky top-0 z-50 border-0 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">Authflow</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/comparison">
                <Button variant="ghost" size="sm" data-testid="link-comparison">Compare</Button>
              </Link>
              <Link href="/why-authflow">
                <Button variant="ghost" size="sm" data-testid="link-why-authflow">Why Us</Button>
              </Link>
              <Link href="/sdks">
                <Button variant="ghost" size="sm" data-testid="link-sdks">SDKs</Button>
              </Link>
              <Link href="/developers">
                <Button variant="ghost" size="sm" data-testid="link-developers">Developers</Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost" size="sm" data-testid="link-docs">Docs</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">Login</Button>
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

      {/* Modern Hero Section with Glassmorphism */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-background pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 gap-1.5 px-4 py-2" variant="secondary">
              <Sparkles className="h-4 w-4" />
              Enterprise Authentication Platform
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6">
              Authentication that{" "}
              <span className="gradient-text animate-glow">
                scales with you
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Replace Auth0 and Okta with a modern, cost-effective authentication platform.
              <br className="hidden sm:block" />
              <span className="font-semibold text-foreground">27+ enterprise features</span> • <span className="font-semibold text-green-600">Up to 85% savings</span> • <span className="font-semibold text-foreground">Flexible deployment</span>
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mb-16">
              <Link href="/register">
                <Button size="lg" className="gap-2 h-14 px-10 text-lg" data-testid="button-start-free-trial">
                  <Sparkles className="h-5 w-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/docs">
                <Button size="lg" variant="outline" className="gap-2 h-14 px-10 text-lg glass-card" data-testid="button-view-docs">
                  <Code className="h-5 w-5" />
                  Documentation
                </Button>
              </Link>
            </div>

            {/* Modern Stats - Glassmorphic Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: "99.9%", label: "Uptime SLA", icon: TrendingUp },
                { value: "27+", label: "Enterprise Features", icon: Layers },
                { value: "85%", label: "Avg Savings", icon: DollarSign },
                { value: "<10ms", label: "Response Time", icon: Activity },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div key={idx} className="glass-card p-6 text-center hover-lift">
                    <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y bg-muted/50">
        <div className="container mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wide">
            Trusted by innovative companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center max-w-4xl mx-auto opacity-60">
            {[
              { name: "TechCorp", size: "text-2xl" },
              { name: "DataFlow", size: "text-2xl" },
              { name: "SecureApp", size: "text-2xl" },
              { name: "CloudVentures", size: "text-2xl" },
            ].map((company, idx) => (
              <div key={idx} className="text-center">
                <span className={`font-bold ${company.size}`}>{company.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid - Authentication Methods */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Authentication Methods</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Every Auth Method You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From traditional passwords to cutting-edge biometrics - all in one platform
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="bento-grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Large Feature Cards */}
            <div className="md:col-span-2 bento-item bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 hover-lift">
              <ShieldCheck className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-2">Multi-Factor Authentication</h3>
              <p className="text-muted-foreground">TOTP, Email OTP, SMS OTP with Twilio integration. Trusted device management included.</p>
            </div>
            
            <div className="md:col-span-2 bento-item bg-gradient-to-br from-blue-500/10 to-primary/10 border border-blue-500/20 hover-lift">
              <Fingerprint className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">WebAuthn & Passkeys</h3>
              <p className="text-muted-foreground">Biometric authentication with Touch ID, Face ID, and hardware security keys. FIDO2 compliant.</p>
            </div>

            {/* Smaller Feature Cards */}
            {[
              { icon: Key, title: "Email & Password", desc: "Bcrypt hashing, breach detection", color: "primary" },
              { icon: Globe, title: "Social Login", desc: "Google, GitHub OAuth", color: "green-500" },
              { icon: Zap, title: "Magic Links", desc: "Passwordless email auth", color: "yellow-500" },
              { icon: Lock, title: "OAuth2 Provider", desc: "Full OIDC server", color: "purple-500" },
            ].map((method, idx) => {
              const Icon = method.icon;
              return (
                <div key={idx} className="bento-item bg-card border hover-lift">
                  <Icon className={`h-8 w-8 text-${method.color} mb-3`} />
                  <h4 className="font-bold mb-1">{method.title}</h4>
                  <p className="text-sm text-muted-foreground">{method.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Features - Modern Cards */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Enterprise Ready</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for Scale
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for B2B SaaS, fintech, healthcare, and more
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Users, title: "Multi-Tenancy", desc: "Complete isolation with per-tenant branding and unlimited organizations", badge: "Enterprise" },
              { icon: Webhook, title: "Actions & Hooks", desc: "Customize auth flows with pluggable handlers and webhook-based logic", badge: "Extensible" },
              { icon: BarChart3, title: "Advanced Analytics", desc: "Real-time dashboards, security events, and growth metrics", badge: "Insights" },
              { icon: Database, title: "GDPR Compliance", desc: "Data export, right-to-be-forgotten, and consent management", badge: "Compliance" },
              { icon: Bell, title: "Real-time Notifications", desc: "WebSocket push notifications with priority levels", badge: "Real-time" },
              { icon: ShieldCheck, title: "Breach Detection", desc: "Have I Been Pwned integration with k-anonymity", badge: "Security" },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="metric-card hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Deployment Options - Glassmorphic */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px] pointer-events-none" />
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4">Flexible Deployment</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Deploy Your Way
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cloud-hosted or self-hosted - the only auth platform offering both
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Cloud,
                title: "Cloud-Hosted",
                desc: "Fully managed infrastructure with automatic updates",
                features: ["Auto-scaling", "Global CDN", "99.9% SLA", "24/7 monitoring"],
                recommended: true,
              },
              {
                icon: Server,
                title: "Self-Hosted",
                desc: "Deploy on your infrastructure for complete control",
                features: ["Full source code", "Data sovereignty", "Custom deployment", "No vendor lock-in"],
                recommended: false,
              },
            ].map((option, idx) => {
              const Icon = option.icon;
              return (
                <div key={idx} className={`glass-card rounded-2xl p-8 ${option.recommended ? 'ring-2 ring-primary' : ''}`}>
                  {option.recommended && (
                    <Badge className="mb-4">Recommended</Badge>
                  )}
                  <div className="p-4 rounded-xl bg-primary/10 w-fit mb-6">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{option.title}</h3>
                  <p className="text-muted-foreground mb-6">{option.desc}</p>
                  <ul className="space-y-3">
                    {option.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 gap-1.5">
              <DollarSign className="h-4 w-4" />
              Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Up to 85% Lower Cost
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Enterprise features at a fraction of the cost. Volume-based pricing with no hidden fees.
            </p>
          </div>

          <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">Authflow</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Auth0</th>
                    <th className="text-center py-4 px-4 font-semibold text-muted-foreground">Okta</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { metric: "Base Price", authflow: "$99/mo", auth0: "$240/mo", okta: "$2,400/mo" },
                    { metric: "Per-User Cost", authflow: "$0", auth0: "$0.50/user", okta: "$2-5/user" },
                    { metric: "Multi-Tenancy", authflow: "Included", auth0: "Paid Add-on", okta: "Enterprise Only" },
                    { metric: "Self-Hosting", authflow: "Available", auth0: "Not Available", okta: "Not Available" },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0">
                      <td className="py-4 px-4 font-medium">{row.metric}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-2 font-semibold text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {row.authflow}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.auth0}</td>
                      <td className="py-4 px-4 text-center text-muted-foreground">{row.okta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-green-500/10 to-primary/10 border border-green-500/20">
              <p className="text-center text-lg mb-2">
                <span className="text-muted-foreground">Example: For 10,000 MAU</span>
              </p>
              <div className="flex gap-6 justify-center items-center flex-wrap">
                <div className="text-lg">
                  <span className="text-muted-foreground">AuthFlow: </span>
                  <span className="font-bold text-green-600 text-2xl">~$200/mo</span>
                </div>
                <div className="text-lg">
                  <span className="text-muted-foreground">Auth0: </span>
                  <span className="font-bold text-red-500 text-2xl">~$870/mo</span>
                </div>
              </div>
              <p className="mt-4 text-center text-3xl font-bold text-green-600">
                💰 Save ~$8,000 per year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 gap-1.5">
                  <Code className="h-4 w-4" />
                  Developer First
                </Badge>
                <h2 className="text-4xl font-bold mb-6">
                  Built for Developers
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Modern stack, comprehensive APIs, and 5 official SDKs
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { title: "RESTful APIs", desc: "100+ endpoints with OpenAPI/Swagger docs", icon: Code },
                    { title: "Official SDKs", desc: "Python, JavaScript, Go, PHP, Ruby", icon: Layers },
                    { title: "Webhooks", desc: "Real-time events with automatic retries", icon: Webhook },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold mb-1">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link href="/docs">
                  <Button className="gap-2">
                    View Documentation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">Quick Start</span>
                </div>
                <pre className="text-sm font-mono bg-black/50 dark:bg-black/30 p-6 rounded-xl overflow-x-auto">
                  <code className="text-green-400">{`import { Authflow } from 'authflow';

const auth = new Authflow({
  tenantId: 'your-tenant',
  apiKey: 'your-api-key'
});

// Authenticate user
const user = await auth.login({
  email: 'user@example.com',
  password: 'secure-pass'
});

console.log('Welcome', user.name);`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4">Enterprise Security & Compliance</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Built on Security-First Principles
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Industry-leading security standards and compliance certifications
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mb-12">
            {[
              { label: "SOC 2 Type II", sublabel: "In Progress" },
              { label: "GDPR", sublabel: "Compliant" },
              { label: "ISO 27001", sublabel: "In Progress" },
              { label: "CCPA", sublabel: "Compliant" },
            ].map((cert, idx) => (
              <Card key={idx} className="text-center p-6">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-primary" />
                <div className="font-semibold mb-1">{cert.label}</div>
                <div className="text-sm text-muted-foreground">{cert.sublabel}</div>
              </Card>
            ))}
          </div>

          <Card className="max-w-3xl mx-auto p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Enterprise-Grade Security</h3>
                <p className="text-muted-foreground mb-4">
                  RSA-4096 encryption, bcrypt password hashing, breach detection via Have I Been Pwned, 
                  IP restrictions, device fingerprinting, and comprehensive audit logging.
                </p>
                <div className="flex gap-4 flex-wrap">
                  {['AES-256', 'RSA-4096', 'OAuth 2.0', 'OIDC'].map((tech, idx) => (
                    <Badge key={idx} variant="outline">{tech}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4">Customer Success</Badge>
            <h2 className="text-3xl font-bold mb-4">
              Loved by Developers & Teams
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "Migrating from Auth0 to AuthFlow saved us $60K annually while giving us better control and performance. The developer experience is fantastic.",
                author: "Sarah Chen",
                role: "CTO, TechStartup Inc",
                avatar: "SC"
              },
              {
                quote: "The self-hosting option was a game-changer for our compliance requirements. Auth0 couldn't offer that. Setup took less than a day.",
                author: "Michael Rodriguez",
                role: "Head of Engineering, SecureData",
                avatar: "MR"
              },
              {
                quote: "We needed multi-tenancy and advanced RBAC. AuthFlow delivered both at a fraction of what Okta quoted us. Their support is amazing too.",
                author: "Emily Johnson",
                role: "Product Lead, CloudVentures",
                avatar: "EJ"
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="p-6">
                <div className="mb-4">
                  <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Glassmorphic */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-primary" />
        <div className="absolute inset-0 bg-grid-white/10 bg-[size:30px_30px]" />
        
        <div className="container mx-auto text-center relative z-10 text-white">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Ready to Transform Your Authentication?
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join innovative companies using Authflow. Start free—no credit card required.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2 h-14 px-10 text-lg" data-testid="button-cta-start">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/comparison">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-10 text-lg glass-card border-white/20 text-white hover:bg-white/10" data-testid="button-cta-compare">
                View Comparison
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="flex gap-8 justify-center flex-wrap text-sm opacity-90">
            {['14-day free trial', 'No credit card needed', 'Cancel anytime'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/comparison" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/why-authflow" className="hover:text-foreground transition-colors">Why Authflow</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/docs/api" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="https://github.com" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Authflow. All rights reserved. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
