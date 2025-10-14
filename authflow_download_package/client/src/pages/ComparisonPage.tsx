import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Check,
  X,
  DollarSign,
  Shield,
  Zap,
  Users,
  Cloud,
  Code,
  Lock,
  Gauge,
  Sparkles,
  TrendingDown,
  ArrowRight,
  Calculator,
} from "lucide-react";

export default function ComparisonPage() {
  const [mau, setMau] = useState(10000);

  // Calculate costs based on MAU
  const calculateCosts = () => {
    // Auth0 pricing: ~$0.50 per MAU for 10K+ users, plus base fee
    const auth0Base = 240;
    const auth0PerUser = mau > 1000 ? (mau - 1000) * 0.50 : 0;
    const auth0Premium = 2000; // Premium features
    const auth0Total = (auth0Base + auth0PerUser + auth0Premium) * 12;

    // Okta pricing: ~$2-5 per user/month
    const oktaPerUser = mau * 2;
    const oktaTotal = oktaPerUser * 12;

    // Authflow: Flat $99-299/mo
    const authflowTotal = 200 * 12; // Average of $99-299

    return {
      auth0Monthly: Math.round(auth0Base + auth0PerUser + auth0Premium),
      auth0Annual: Math.round(auth0Total),
      oktaMonthly: Math.round(oktaPerUser),
      oktaAnnual: Math.round(oktaTotal),
      authflowMonthly: 200,
      authflowAnnual: authflowTotal,
      savingsVsAuth0: Math.round(auth0Total - authflowTotal),
      savingsVsOkta: Math.round(oktaTotal - authflowTotal),
      savingsPercentAuth0: Math.round(((auth0Total - authflowTotal) / auth0Total) * 100),
      savingsPercentOkta: Math.round(((oktaTotal - authflowTotal) / oktaTotal) * 100),
    };
  };

  const costs = calculateCosts();
  const features = [
    {
      category: "Authentication",
      items: [
        { name: "Email/Password", authflow: true, auth0: true, okta: true },
        { name: "Social Login (Google, GitHub)", authflow: true, auth0: true, okta: true },
        { name: "Multi-Factor Auth (TOTP + Email)", authflow: true, auth0: true, okta: true },
        { name: "Magic Link Passwordless", authflow: true, auth0: true, okta: false },
        { name: "WebAuthn/FIDO2", authflow: "coming", auth0: true, okta: true },
        { name: "Risk-Based Authentication", authflow: "free", auth0: "paid", okta: "paid" },
      ]
    },
    {
      category: "OAuth2 & Standards",
      items: [
        { name: "OAuth2 Authorization Server", authflow: true, auth0: true, okta: true },
        { name: "OpenID Connect Provider", authflow: true, auth0: true, okta: true },
        { name: "PKCE Support", authflow: true, auth0: true, okta: true },
        { name: "Refresh Tokens", authflow: true, auth0: true, okta: true },
        { name: "Custom Scopes", authflow: true, auth0: true, okta: true },
      ]
    },
    {
      category: "Multi-Tenancy",
      items: [
        { name: "Multi-Tenant Architecture", authflow: "free", auth0: "paid", okta: "enterprise" },
        { name: "Complete Tenant Isolation", authflow: true, auth0: true, okta: true },
        { name: "Per-Tenant Branding", authflow: true, auth0: true, okta: true },
        { name: "Custom Domains", authflow: "free", auth0: "paid", okta: "paid" },
        { name: "Tenant Analytics", authflow: true, auth0: true, okta: true },
      ]
    },
    {
      category: "Security",
      items: [
        { name: "Password Breach Detection", authflow: "free", auth0: "paid", okta: false },
        { name: "IP Restrictions", authflow: true, auth0: true, okta: true },
        { name: "GDPR Compliance Tools", authflow: "free", auth0: true, okta: true },
        { name: "Advanced Audit Logging", authflow: "free", auth0: "paid", okta: true },
        { name: "Session Management", authflow: true, auth0: true, okta: true },
      ]
    },
    {
      category: "Developer Experience",
      items: [
        { name: "REST API", authflow: true, auth0: true, okta: true },
        { name: "Webhooks", authflow: "free", auth0: "paid", okta: true },
        { name: "API Key Management", authflow: true, auth0: true, okta: true },
        { name: "SDKs Available", authflow: "coming", auth0: true, okta: true },
        { name: "Comprehensive Docs", authflow: true, auth0: true, okta: true },
      ]
    },
    {
      category: "Deployment & Control",
      items: [
        { name: "Cloud Hosted", authflow: true, auth0: true, okta: true },
        { name: "Self-Hosted Option", authflow: true, auth0: false, okta: false },
        { name: "Data Sovereignty", authflow: true, auth0: false, okta: false },
        { name: "No Vendor Lock-In", authflow: true, auth0: false, okta: false },
        { name: "Full Code Access", authflow: "self-hosted", auth0: false, okta: false },
      ]
    },
  ];

  const pricing = [
    {
      name: "Authflow",
      color: "primary",
      features: [
        "Flat licensing fee",
        "No per-user charges",
        "All features included",
        "Unlimited MAU",
        "Self-host option available",
      ],
      price: "$99-299",
      period: "/month",
      savings: null,
      recommended: true,
    },
    {
      name: "Auth0",
      color: "secondary",
      features: [
        "Starts at $240/mo for 1K MAU",
        "$0.50 per extra user",
        "Basic features only",
        "Premium features cost extra",
        "Cloud only",
      ],
      price: "$2,400+",
      period: "/month",
      savings: "90% more expensive",
      recommended: false,
    },
    {
      name: "Okta",
      color: "secondary",
      features: [
        "Starts at $2/user/month",
        "Minimum commitments",
        "Enterprise focused",
        "Complex pricing tiers",
        "Cloud only",
      ],
      price: "$5,000+",
      period: "/month",
      savings: "95% more expensive",
      recommended: false,
    },
  ];

  const renderValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="h-5 w-5 text-green-500" data-testid="icon-check" />;
    }
    if (value === false) {
      return <X className="h-5 w-5 text-muted-foreground" data-testid="icon-cross" />;
    }
    if (value === "coming") {
      return <Badge variant="secondary" className="text-xs">Coming Soon</Badge>;
    }
    if (value === "free") {
      return <Badge variant="default" className="text-xs bg-green-600">Free</Badge>;
    }
    if (value === "paid") {
      return <Badge variant="outline" className="text-xs">Paid Add-on</Badge>;
    }
    if (value === "enterprise") {
      return <Badge variant="outline" className="text-xs">Enterprise Only</Badge>;
    }
    if (value === "self-hosted") {
      return <Badge variant="secondary" className="text-xs">Self-Hosted</Badge>;
    }
    return <span className="text-xs text-muted-foreground">{value}</span>;
  };

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
              <Link href="/why-authflow">
                <Button variant="ghost" data-testid="link-why-authflow">Why Authflow</Button>
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
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Feature-by-Feature Comparison
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Authflow vs Auth0 vs Okta
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            See exactly how Authflow compares to Auth0 and Okta. Same enterprise features, 
            90% lower cost, with the freedom to self-host.
          </p>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <div className="flex items-center gap-2 text-green-600">
              <TrendingDown className="h-5 w-5" />
              <span className="font-semibold">Save 80-90% on costs</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Check className="h-5 w-5" />
              <span className="font-semibold">All features included</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Cloud className="h-5 w-5" />
              <span className="font-semibold">Cloud or Self-Hosted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pricing That Makes Sense</h2>
            <p className="text-lg text-muted-foreground">
              Simple, predictable pricing vs complex per-user costs
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
            {pricing.map((plan) => (
              <Card
                key={plan.name}
                className={plan.recommended ? "border-2 border-primary shadow-lg" : ""}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                <CardHeader>
                  {plan.recommended && (
                    <Badge className="mb-2 w-fit">Recommended</Badge>
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <CardDescription className="text-red-500 font-semibold mt-2">
                      {plan.savings}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.recommended && (
                    <Link href="/register">
                      <Button className="w-full mt-6" data-testid="button-start-free">
                        Start Free Trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Example: For 10,000 users, Auth0 costs ~$5,000/month. Authflow: ~$200-500/month
            </p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              💰 Save over $50,000 per year
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Feature Comparison</h2>
            <p className="text-lg text-muted-foreground">
              Every feature you need, at a fraction of the cost
            </p>
          </div>

          <div className="space-y-8 max-w-6xl mx-auto">
            {features.map((section) => (
              <Card key={section.category}>
                <CardHeader>
                  <CardTitle className="text-xl">{section.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Feature</th>
                          <th className="text-center py-3 px-4 font-semibold text-primary">
                            Authflow
                          </th>
                          <th className="text-center py-3 px-4 font-semibold">Auth0</th>
                          <th className="text-center py-3 px-4 font-semibold">Okta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b last:border-b-0 hover-elevate"
                          >
                            <td className="py-3 px-4">{item.name}</td>
                            <td className="py-3 px-4 text-center">
                              {renderValue(item.authflow)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {renderValue(item.auth0)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {renderValue(item.okta)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Advantages */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Businesses Choose Authflow</h2>
            <p className="text-lg text-muted-foreground">
              The best of all platforms, without the drawbacks
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            <Card className="hover-elevate">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>80-90% Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Flat pricing with no per-user fees. All features included. No hidden costs.
                  Perfect for growing businesses.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Cloud className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Flexible Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Choose cloud-hosted for convenience or self-host for complete control.
                  Auth0 and Okta only offer cloud.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Breach detection, risk-based auth, and GDPR tools included free.
                  Auth0 charges extra for these.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>True Multi-Tenancy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built from the ground up for B2B SaaS. Complete isolation, per-tenant
                  branding, all included free.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>No Vendor Lock-In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Export all data anytime. Standard OAuth2/OIDC. Self-host option provides
                  complete freedom.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Modern Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Node.js, React, PostgreSQL. Familiar tools, easy customization, great
                  developer experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 gap-1.5">
              <Calculator className="h-3.5 w-3.5" />
              ROI Calculator
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Calculate Your Savings</h2>
            <p className="text-lg text-muted-foreground">
              See exactly how much you'll save by switching to Authflow
            </p>
          </div>

          <Card className="border-2 border-primary">
            <CardContent className="p-8">
              {/* Input Section */}
              <div className="mb-8">
                <Label htmlFor="mau-input" className="text-base font-semibold mb-4 block">
                  Monthly Active Users (MAU)
                </Label>
                <div className="flex gap-4 items-center">
                  <Slider
                    id="mau-slider"
                    value={[mau]}
                    onValueChange={(value) => setMau(value[0])}
                    min={1000}
                    max={100000}
                    step={1000}
                    className="flex-1"
                    data-testid="slider-mau"
                  />
                  <Input
                    id="mau-input"
                    type="number"
                    value={mau}
                    onChange={(e) => setMau(Number(e.target.value) || 1000)}
                    className="w-32"
                    data-testid="input-mau"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Adjust to match your expected user count
                </p>
              </div>

              {/* Cost Comparison */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Auth0</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monthly</span>
                        <span className="font-semibold">${costs.auth0Monthly.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Annual</span>
                        <span className="font-bold text-red-500">
                          ${costs.auth0Annual.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Okta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monthly</span>
                        <span className="font-semibold">${costs.oktaMonthly.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Annual</span>
                        <span className="font-bold text-red-500">
                          ${costs.oktaAnnual.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg text-primary">Authflow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monthly</span>
                        <span className="font-semibold">${costs.authflowMonthly}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold">Annual</span>
                        <span className="font-bold text-green-600">
                          ${costs.authflowAnnual.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Savings Summary */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/20">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Savings vs Auth0</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${costs.savingsVsAuth0.toLocaleString()}
                      <span className="text-lg text-muted-foreground ml-2">/year</span>
                    </p>
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      {costs.savingsPercentAuth0}% cost reduction
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Savings vs Okta</p>
                    <p className="text-3xl font-bold text-green-600">
                      ${costs.savingsVsOkta.toLocaleString()}
                      <span className="text-lg text-muted-foreground ml-2">/year</span>
                    </p>
                    <p className="text-sm text-green-600 font-semibold mt-1">
                      {costs.savingsPercentOkta}% cost reduction
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-green-500/20 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    💰 Save up to ${Math.max(costs.savingsVsAuth0, costs.savingsVsOkta).toLocaleString()} per year
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    With unlimited users and all enterprise features included
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Save 90% on Authentication?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join innovative companies using Authflow for enterprise authentication at a
            fraction of the cost.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2" data-testid="button-start-trial">
                <Sparkles className="h-5 w-5" />
                Start Free Trial
              </Button>
            </Link>
            <Link href="/why-authflow">
              <Button size="lg" variant="outline" className="gap-2 bg-primary/10" data-testid="button-why-us">
                Why Choose Us
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Authflow. All rights reserved. Built with enterprise security in mind.</p>
        </div>
      </footer>
    </div>
  );
}
