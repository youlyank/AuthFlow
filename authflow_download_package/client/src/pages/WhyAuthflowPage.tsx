import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  DollarSign,
  Zap,
  Cloud,
  Lock,
  Users,
  Code,
  Sparkles,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Globe,
  Server,
  FileCode,
  Heart,
  Rocket,
  Target,
} from "lucide-react";

export default function WhyAuthflowPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: "Predictable, Affordable Pricing",
      description: "Flat licensing fees with no per-user charges. Save 80-90% compared to Auth0 and Okta while getting all features included.",
      stats: "Save $80K+/year",
      color: "text-green-600",
    },
    {
      icon: Cloud,
      title: "Deploy Anywhere, Your Way",
      description: "Choose cloud-hosted for convenience or self-host for complete control. The only auth platform offering both deployment options.",
      stats: "2 deployment options",
      color: "text-blue-600",
    },
    {
      icon: Shield,
      title: "Enterprise Security Built-In",
      description: "Password breach detection, risk-based auth, IP restrictions, and GDPR tools included free. Not paid add-ons.",
      stats: "10+ security features",
      color: "text-red-600",
    },
    {
      icon: Users,
      title: "True Multi-Tenancy",
      description: "Built from the ground up for B2B SaaS. Complete tenant isolation, per-tenant branding, and unlimited organizations.",
      stats: "100% isolation",
      color: "text-purple-600",
    },
    {
      icon: Lock,
      title: "No Vendor Lock-In",
      description: "Export all data anytime. Standard OAuth2/OIDC ensures portability. Self-host option provides complete freedom.",
      stats: "Full data ownership",
      color: "text-orange-600",
    },
    {
      icon: Code,
      title: "Modern Developer Experience",
      description: "Node.js, React, PostgreSQL stack. Comprehensive APIs, webhooks, and clear documentation. Built for developers.",
      stats: "REST + Webhooks",
      color: "text-indigo-600",
    },
  ];

  const useCases = [
    {
      icon: Rocket,
      title: "B2B SaaS Platforms",
      description: "Perfect for multi-tenant applications needing white-label authentication with complete customization.",
      ideal: ["Multi-tenant apps", "White-label products", "Customer portals"],
    },
    {
      icon: Heart,
      title: "Startups & Scale-ups",
      description: "Cost-effective growth without per-user penalties. Start small, scale to millions without breaking the bank.",
      ideal: ["Limited budgets", "Rapid scaling", "Unpredictable growth"],
    },
    {
      icon: Server,
      title: "Fintech & Healthcare",
      description: "Self-hosted deployment for data sovereignty. Meet compliance requirements while maintaining full control.",
      ideal: ["Data sovereignty", "Compliance needs", "Regulated industries"],
    },
    {
      icon: Globe,
      title: "ISVs & Product Companies",
      description: "Embed authentication in your products. License-based model aligns with your business, not ours.",
      ideal: ["Product integration", "Reseller models", "OEM licensing"],
    },
  ];

  const comparisonPoints = [
    {
      title: "vs Auth0",
      points: [
        { feature: "Cost", authflow: "80% cheaper", competitor: "Expensive per-user pricing" },
        { feature: "Deployment", authflow: "Cloud + Self-hosted", competitor: "Cloud only" },
        { feature: "Security features", authflow: "All included free", competitor: "Many are paid add-ons" },
        { feature: "Multi-tenancy", authflow: "Built-in free", competitor: "Organizations are paid" },
      ],
    },
    {
      title: "vs Okta",
      points: [
        { feature: "Pricing", authflow: "Simple flat fee", competitor: "$2-5 per user/month" },
        { feature: "Complexity", authflow: "Easy to implement", competitor: "Enterprise complexity" },
        { feature: "Target market", authflow: "SMB to Enterprise", competitor: "Enterprise focused" },
        { feature: "Self-hosting", authflow: "Available", competitor: "Not available" },
      ],
    },
  ];

  const whyNow = [
    {
      title: "Proven Technology",
      description: "Built with battle-tested technologies: Node.js, React, PostgreSQL. 27+ production-ready features.",
      icon: CheckCircle,
    },
    {
      title: "Active Development",
      description: "Regular updates, new features, and security patches. Roadmap includes WebAuthn, SAML, and more.",
      icon: TrendingUp,
    },
    {
      title: "Production Ready",
      description: "Comprehensive testing, security audits passed, and real-world deployments. Ready for your business.",
      icon: Target,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer hover-elevate rounded-md px-2 py-1">
                <Shield className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Authflow</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/comparison">
                <Button variant="ghost" data-testid="link-comparison">Compare Plans</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Login</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-get-started">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Enterprise Authentication, Simplified
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Why Choose Authflow?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The authentication platform that gives you enterprise features, flexible deployment, 
            and predictable pricing—without the enterprise price tag.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" className="gap-2" data-testid="button-start-free">
                <Rocket className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/comparison">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-see-comparison">
                See Full Comparison
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for Modern Businesses</h2>
            <p className="text-lg text-muted-foreground">
              Six compelling reasons to choose Authflow
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="hover-elevate" data-testid={`card-benefit-${idx}`}>
                  <CardHeader>
                    <Icon className={`h-12 w-12 mb-3 ${benefit.color}`} />
                    <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit">
                      {benefit.stats}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For Your Use Case</h2>
            <p className="text-lg text-muted-foreground">
              Whatever you're building, Authflow scales with you
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            {useCases.map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <Card key={idx} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{useCase.title}</CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {useCase.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">Ideal for:</p>
                      <ul className="space-y-1">
                        {useCase.ideal.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Comparison */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Stack Up</h2>
            <p className="text-lg text-muted-foreground">
              Quick comparison with the competition
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {comparisonPoints.map((comparison, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{comparison.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comparison.points.map((point, i) => (
                      <div key={i} className="border-b last:border-b-0 pb-3 last:pb-0">
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          {point.feature}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Authflow</p>
                              <p className="text-sm font-semibold">{point.authflow}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Competitor</p>
                              <p className="text-sm">{point.competitor}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/comparison">
              <Button variant="outline" className="gap-2" data-testid="button-full-comparison">
                View Complete Feature Comparison
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Now?</h2>
            <p className="text-lg text-muted-foreground">
              Authflow is production-ready and battle-tested
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {whyNow.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Card key={idx} className="text-center hover-elevate">
                  <CardHeader>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Trusted by Innovative Companies</h3>
                <p className="text-muted-foreground">
                  Join businesses who have already made the switch
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">80%</div>
                  <p className="text-sm text-muted-foreground">Average Cost Savings</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">27+</div>
                  <p className="text-sm text-muted-foreground">Production Features</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">Tenant Isolation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Experience the Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start your free trial today. No credit card required. Full access to all features.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-start-trial">
                <Rocket className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/comparison">
              <Button size="lg" variant="outline" className="gap-2 bg-primary/10" data-testid="button-compare">
                Compare Features
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex gap-8 justify-center flex-wrap text-sm opacity-90">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>No credit card needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Authflow. All rights reserved. Built for developers, trusted by businesses.</p>
        </div>
      </footer>
    </div>
  );
}
