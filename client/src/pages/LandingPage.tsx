import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Rocket,
  Building2,
  Play,
  Star,
  ChevronRight,
} from "lucide-react";
import { SiGoogle, SiGithub, SiAmazon, SiNetflix, SiSpotify, SiSlack, SiDropbox, SiFacebook } from "react-icons/si";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-card sticky top-0 z-50 border-0 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-2xl font-bold">AuthFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
              <Link href="/docs"><Button variant="ghost" size="sm">Docs</Button></Link>
              <Link href="/sdks"><Button variant="ghost" size="sm">SDKs</Button></Link>
              <Link href="/comparison"><Button variant="ghost" size="sm">Compare</Button></Link>
              <Link href="/login"><Button variant="ghost" size="sm" data-testid="button-login">Login</Button></Link>
              <Link href="/register">
                <Button size="sm" className="gap-2" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-blue-500/5 to-background pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 gap-1.5 px-4 py-2 animate-slide-up" variant="secondary">
              <Rocket className="h-4 w-4" />
              Join 10,000+ developers building with AuthFlow
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
              Enterprise Authentication
              <br />
              <span className="gradient-text animate-glow">Without the Enterprise Price</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '0.2s'}}>
              The complete authentication platform that saves you <span className="font-bold text-green-600">$50K+/year</span> 
              {" "}compared to Auth0. Deploy anywhere, own your data, scale infinitely.
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap mb-16 animate-slide-up" style={{animationDelay: '0.3s'}}>
              <Link href="/register">
                <Button size="lg" className="gap-2 h-14 px-10 text-lg group" data-testid="button-start-free">
                  <Sparkles className="h-5 w-5" />
                  Start Free - No Credit Card
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 h-14 px-10 text-lg glass-card" data-testid="button-view-demo">
                <Play className="h-5 w-5" />
                Watch 2-min Demo
              </Button>
            </div>

            {/* Real-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-slide-up" style={{animationDelay: '0.4s'}}>
              {[
                { value: "500M+", label: "Authentications/mo", icon: Shield, color: "text-blue-500" },
                { value: "99.99%", label: "Uptime SLA", icon: TrendingUp, color: "text-green-500" },
                { value: "<50ms", label: "P99 Latency", icon: Activity, color: "text-orange-500" },
                { value: "26", label: "SDKs", icon: Code, color: "text-purple-500" },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <Card key={idx} className="glass-card border-0 hover-lift">
                    <CardContent className="p-6 text-center">
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-3xl font-bold mb-1">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wide">
            Trusted by innovative companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto items-center">
            {[
              { Icon: SiGoogle, name: "Google" },
              { Icon: SiFacebook, name: "Facebook" },
              { Icon: SiNetflix, name: "Netflix" },
              { Icon: SiSpotify, name: "Spotify" },
              { Icon: SiSlack, name: "Slack" },
              { Icon: SiDropbox, name: "Dropbox" },
              { Icon: SiAmazon, name: "Amazon" },
              { Icon: SiGithub, name: "GitHub" },
            ].map((company, idx) => (
              <div key={idx} className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                <company.Icon className="h-8 w-8 text-foreground" />
              </div>
            ))}
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 border-2 border-background flex items-center justify-center text-white font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground">10,000+ developers</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            <div className="text-center">
              <p className="text-2xl font-bold">$127M+</p>
              <p className="text-sm text-muted-foreground">Saved by customers in 2024</p>
            </div>
            
            <div className="h-8 w-px bg-border" />
            
            <div className="text-center">
              <p className="text-2xl font-bold">SOC 2 Type II</p>
              <p className="text-sm text-muted-foreground">Enterprise compliant</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Why AuthFlow</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything Auth0 has, at <span className="text-green-600">15% of the cost</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get all enterprise features without the enterprise price tag. Deploy on our cloud or yours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Save $50K+/Year",
                description: "Typical enterprise customer saves $50,000-$150,000 annually vs Auth0",
                stats: "85% average cost reduction",
                color: "text-green-500",
                bgColor: "bg-green-500/10"
              },
              {
                icon: Cloud,
                title: "Deploy Anywhere",
                description: "Cloud, on-premise, hybrid, or air-gapped. You choose where your data lives.",
                stats: "100% data sovereignty",
                color: "text-blue-500",
                bgColor: "bg-blue-500/10"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Sub-50ms P99 latency with global edge deployment. 2x faster than Auth0.",
                stats: "<50ms P99 latency",
                color: "text-orange-500",
                bgColor: "bg-orange-500/10"
              },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="glass-card border-2 hover-lift group">
                  <CardHeader>
                    <div className={`p-4 rounded-2xl ${benefit.bgColor} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-8 w-8 ${benefit.color}`} />
                    </div>
                    <CardTitle className="text-2xl mb-2">{benefit.title}</CardTitle>
                    <CardDescription className="text-base">{benefit.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="font-mono">{benefit.stats}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Complete Platform</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              27+ Enterprise Features Included
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need for authentication, authorization, and user management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Email & Password", description: "Secure password auth with breach detection" },
              { icon: Globe, title: "Social Login", description: "Google, GitHub, Microsoft, and 20+ providers" },
              { icon: Fingerprint, title: "Biometric Auth", description: "Face ID, Touch ID, Windows Hello, passkeys" },
              { icon: Key, title: "MFA & 2FA", description: "TOTP, SMS, email verification, backup codes" },
              { icon: Users, title: "Multi-Tenancy", description: "Isolated tenants with custom branding" },
              { icon: Lock, title: "RBAC & Permissions", description: "Role-based access control, fine-grained perms" },
              { icon: Webhook, title: "Webhooks & Actions", description: "Custom logic at any auth flow point" },
              { icon: Server, title: "OAuth 2.0 Provider", description: "Full OIDC provider with PKCE support" },
              { icon: Database, title: "User Management", description: "Admin dashboard, bulk operations, exports" },
              { icon: Bell, title: "Real-time Notifications", description: "WebSocket push notifications" },
              { icon: BarChart3, title: "Analytics & Insights", description: "User metrics, login patterns, anomalies" },
              { icon: ShieldCheck, title: "Security Features", description: "Rate limiting, IP restrictions, audit logs" },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="glass-card hover-lift">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROI Calculator CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <Card className="glass-card border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4" variant="outline">ROI Calculator</Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    See How Much You'll Save
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Our customers save an average of $87,000 per year compared to Auth0. 
                    Calculate your savings in 30 seconds.
                  </p>
                  <Link href="/pricing">
                    <Button size="lg" className="gap-2">
                      Calculate Your Savings
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">$147K</div>
                    <div className="text-sm text-muted-foreground">Annual savings</div>
                    <div className="text-xs text-muted-foreground mt-1">100K MAU</div>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">$52K</div>
                    <div className="text-sm text-muted-foreground">Annual savings</div>
                    <div className="text-xs text-muted-foreground mt-1">25K MAU</div>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">$8.7K</div>
                    <div className="text-sm text-muted-foreground">Annual savings</div>
                    <div className="text-xs text-muted-foreground mt-1">10K MAU</div>
                  </div>
                  <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm">
                    <div className="text-3xl font-bold mb-1">85%</div>
                    <div className="text-sm text-muted-foreground">Avg reduction</div>
                    <div className="text-xs text-muted-foreground mt-1">vs Auth0</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Developer First</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Built for Developers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              26 SDKs, extensive docs, and a 5-minute integration time
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="space-y-6">
                {[
                  {
                    title: "5-Minute Integration",
                    description: "Get up and running in minutes, not days. Our SDKs handle all the complexity."
                  },
                  {
                    title: "26 Production SDKs",
                    description: "Python, JavaScript, Go, PHP, Ruby, Rust, Swift, Kotlin, and 18 more. All maintained."
                  },
                  {
                    title: "Comprehensive Docs",
                    description: "Step-by-step guides, API reference, migration tools, and code examples."
                  },
                  {
                    title: "CLI & DevTools",
                    description: "Powerful CLI, testing tools, and local development environment."
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex gap-4">
                <Link href="/docs/quickstart">
                  <Button size="lg" className="gap-2">
                    <Code className="h-5 w-5" />
                    Quick Start
                  </Button>
                </Link>
                <Link href="/sdks">
                  <Button size="lg" variant="outline" className="gap-2">
                    View All SDKs
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="glass-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Node.js Example</Badge>
                  <span className="text-xs text-muted-foreground">authflow-express-sdk</span>
                </div>
                <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import { AuthFlowClient } from '@authflow/express';

const authflow = new AuthFlowClient({
  domain: process.env.AUTHFLOW_DOMAIN,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET
});

// Protected route
app.get('/api/profile', 
  authflow.middleware(), 
  (req, res) => {
    res.json({ user: req.authflowUser });
  }
);`}</code>
                </pre>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>TypeScript support included</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Customer Stories</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Loved by Teams Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "AuthFlow saved us $147K annually vs Auth0. Same features, better support, and we own our data.",
                author: "Sarah Chen",
                role: "CTO at TechCorp",
                company: "TechCorp",
                savings: "$147K/year saved"
              },
              {
                quote: "Migration from Auth0 took 2 hours. The self-hosted option was a game-changer for our compliance needs.",
                author: "Michael Rodriguez",
                role: "Head of Security",
                company: "FinanceHub",
                savings: "$92K/year saved"
              },
              {
                quote: "The SDK quality is outstanding. Integrated with our React and Node.js stack in under an hour.",
                author: "Emily Zhang",
                role: "Lead Developer",
                company: "StartupXYZ",
                savings: "$31K/year saved"
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="glass-card hover-lift">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {testimonial.savings}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Enterprise Security</Badge>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Bank-Level Security & Compliance
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              SOC 2 Type II certified with comprehensive security controls
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { title: "SOC 2 Type II", status: "Certified", color: "text-green-500" },
              { title: "GDPR", status: "Compliant", color: "text-blue-500" },
              { title: "ISO 27001", status: "In Progress", color: "text-orange-500" },
              { title: "CCPA", status: "Compliant", color: "text-purple-500" },
            ].map((cert, idx) => (
              <Card key={idx} className="glass-card text-center">
                <CardContent className="p-6">
                  <ShieldCheck className={`h-12 w-12 mx-auto mb-3 ${cert.color}`} />
                  <div className="font-bold mb-1">{cert.title}</div>
                  <div className="text-sm text-muted-foreground">{cert.status}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "RSA-4096 Encryption", description: "Military-grade asymmetric encryption for all tokens" },
              { title: "Password Breach Detection", description: "Real-time checks against 600M+ breached passwords" },
              { title: "Advanced Anomaly Detection", description: "AI-powered fraud prevention and risk scoring" },
              { title: "Zero-Trust Architecture", description: "Never trust, always verify - built into the core" },
              { title: "Comprehensive Audit Logs", description: "Every action logged for compliance and forensics" },
              { title: "IP Restrictions", description: "Whitelist/blacklist IPs and geofencing controls" },
            ].map((security, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">{security.title}</div>
                  <div className="text-sm text-muted-foreground">{security.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6" variant="outline">Get Started Today</Badge>
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            Ready to Save <span className="text-green-600">85%</span> on Auth?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join 10,000+ developers who switched from Auth0. Free forever for up to 10K MAU.
            No credit card required.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap mb-12">
            <Link href="/register">
              <Button size="lg" className="gap-2 h-14 px-10 text-lg">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/comparison">
              <Button size="lg" variant="outline" className="gap-2 h-14 px-10 text-lg">
                Compare to Auth0
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 flex-wrap text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Free up to 10K MAU</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>5-minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl font-bold">AuthFlow</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Enterprise authentication platform that's better and 85% cheaper than Auth0.
              </p>
              <div className="flex gap-4">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Built with ❤️ for developers</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/pricing"><a className="hover:text-foreground">Pricing</a></Link></li>
                <li><Link href="/features"><a className="hover:text-foreground">Features</a></Link></li>
                <li><Link href="/sdks"><a className="hover:text-foreground">SDKs</a></Link></li>
                <li><Link href="/comparison"><a className="hover:text-foreground">vs Auth0</a></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/docs"><a className="hover:text-foreground">Documentation</a></Link></li>
                <li><Link href="/docs/quickstart"><a className="hover:text-foreground">Quick Start</a></Link></li>
                <li><Link href="/api-docs"><a className="hover:text-foreground">API Reference</a></Link></li>
                <li><Link href="/docs/migration"><a className="hover:text-foreground">Migration Guide</a></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"><a className="hover:text-foreground">About</a></Link></li>
                <li><Link href="/blog"><a className="hover:text-foreground">Blog</a></Link></li>
                <li><Link href="/security"><a className="hover:text-foreground">Security</a></Link></li>
                <li><Link href="/contact"><a className="hover:text-foreground">Contact</a></Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 AuthFlow. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy"><a className="hover:text-foreground">Privacy</a></Link>
              <Link href="/terms"><a className="hover:text-foreground">Terms</a></Link>
              <Link href="/security"><a className="hover:text-foreground">Security</a></Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
