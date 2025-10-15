import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Clock, Code2, Rocket, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SDKRoadmapPage() {
  const sdkStatus = [
    {
      category: "✅ Production Ready (Q1 2025)",
      sdks: [
        { name: "Python", status: "ready", features: "Full auth, MFA, WebAuthn, OAuth2" },
        { name: "JavaScript/TypeScript", status: "ready", features: "Browser & Node.js, session management" },
        { name: "Go", status: "ready", features: "Type-safe client, all auth methods" },
        { name: "PHP", status: "ready", features: "PSR-4 compliant, Composer support" },
        { name: "Ruby", status: "ready", features: "Rails integration, gem-based" }
      ]
    },
    {
      category: "🚀 In Development (Q2 2025)",
      sdks: [
        { name: "React", status: "beta", features: "Hooks-based, React 18+, context API" },
        { name: "Next.js", status: "beta", features: "App Router, middleware, RSC support" },
        { name: "Angular", status: "development", features: "v17+ standalone components" },
        { name: "Vue", status: "development", features: "Vue 3 Composition API" },
        { name: "Laravel", status: "beta", features: "v10+ middleware, Sanctum integration" },
        { name: "Django", status: "development", features: "Django 4.2+, async views" },
        { name: "Flutter", status: "development", features: "iOS, Android, Web support" },
        { name: "React Native", status: "development", features: "Expo & bare workflow" }
      ]
    },
    {
      category: "📋 Planned (Q3-Q4 2025)",
      sdks: [
        { name: "Spring Boot", status: "planned", features: "Java 17+, Spring Security integration" },
        { name: "ASP.NET Core", status: "planned", features: ".NET 8, minimal APIs" },
        { name: "Express.js", status: "planned", features: "Middleware-based, TypeScript" },
        { name: "FastAPI", status: "planned", features: "Python async, Pydantic models" },
        { name: "Swift (iOS)", status: "planned", features: "SwiftUI, async/await" },
        { name: "Kotlin (Android)", status: "planned", features: "Jetpack Compose, Coroutines" },
        { name: "Rust", status: "planned", features: "Actix/Axum integration" },
        { name: ".NET MAUI", status: "planned", features: "Cross-platform mobile" },
        { name: "Svelte/SvelteKit", status: "planned", features: "Svelte 5 runes" },
        { name: "Blazor", status: "planned", features: "Server & WASM" },
        { name: "Remix", status: "planned", features: "Full-stack React" },
        { name: "NestJS", status: "planned", features: "TypeScript decorators" },
        { name: "Deno", status: "planned", features: "Modern TypeScript runtime" }
      ]
    },
    {
      category: "🔮 Future (2026+)",
      sdks: [
        { name: "Ruby on Rails API", status: "future", features: "Rails 7.1+ API mode" },
        { name: "Elixir/Phoenix", status: "future", features: "LiveView support" },
        { name: "Scala/Play", status: "future", features: "Akka integration" }
      ]
    }
  ];

  const comparison = {
    auth0: 30,
    authflow: 5,
    planned: 26, // 5 ready + 8 in dev + 13 planned for 2025
    future: 3   // 3 for 2026+
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string }> = {
      ready: { variant: "default", color: "bg-green-500/10 text-green-500 border-green-500/20" },
      beta: { variant: "secondary", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      development: { variant: "outline", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      planned: { variant: "outline", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
      future: { variant: "outline", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" }
    };
    const config = variants[status] || variants.future;
    return <Badge className={config.color}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/docs">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Docs
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-semibold">SDK Roadmap</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Rocket className="h-4 w-4" />
            Product Roadmap
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SDK Development Roadmap
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Our plan to match and exceed Auth0's SDK coverage across all major platforms and frameworks
          </p>

          {/* Progress Overview */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="glass-card">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-2xl">{comparison.authflow}</CardTitle>
                <CardDescription>Production Ready</CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle className="text-2xl">{comparison.planned}</CardTitle>
                <CardDescription>In Development/Planned</CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card">
              <CardHeader>
                <Target className="h-8 w-8 text-purple-500 mb-2" />
                <CardTitle className="text-2xl">{comparison.auth0}</CardTitle>
                <CardDescription>Auth0 Total (Goal)</CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-card border-primary/50">
              <CardHeader>
                <Code2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-2xl">26</CardTitle>
                <CardDescription>Total by End of 2025</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Auth0 vs AuthFlow Comparison */}
        <Card className="glass-card mb-12 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle>How We Compare to Auth0</CardTitle>
            <CardDescription>SDK coverage comparison with Auth0 (2025)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Auth0 SDKs</span>
                  <span className="text-muted-foreground">30+ SDKs</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">AuthFlow Current (Q1 2025)</span>
                  <span className="text-muted-foreground">{comparison.authflow} SDKs</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "16.6%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">AuthFlow Target (End of 2025)</span>
                  <span className="text-muted-foreground">26 SDKs</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "86.6%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SDK Status by Quarter */}
        {sdkStatus.map((section, idx) => (
          <div key={idx} className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{section.category}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.sdks.map((sdk) => (
                <Card key={sdk.name} className="glass-card hover-lift transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Code2 className="h-6 w-6 text-primary" />
                      {getStatusBadge(sdk.status)}
                    </div>
                    <CardTitle>{sdk.name}</CardTitle>
                    <CardDescription>{sdk.features}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {/* Community Contribution */}
        <Card className="glass-card bg-gradient-to-br from-purple-500/10 to-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Want to Help?</CardTitle>
            <CardDescription className="text-base">
              We're building SDKs in the open. Contribute to our growing ecosystem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card/50">
                <h4 className="font-semibold mb-2">Request an SDK</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Need support for a specific framework? Let us know your priority.
                </p>
                <Button variant="outline" className="w-full">Submit Request</Button>
              </div>
              <div className="p-4 rounded-lg border bg-card/50">
                <h4 className="font-semibold mb-2">Contribute Code</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Help us build SDKs faster by contributing to open-source repos.
                </p>
                <Button variant="outline" className="w-full">View on GitHub</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="mt-12 p-8 rounded-2xl border bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent">
          <h3 className="text-2xl font-bold mb-3">Stay Updated</h3>
          <p className="text-muted-foreground mb-6">
            Follow our SDK development progress and get notified when new SDKs are released
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/docs/sdks">
              <Button size="lg" className="gap-2">
                <Code2 className="h-5 w-5" />
                View Current SDKs
              </Button>
            </Link>
            <Link href="/docs/quickstart">
              <Button size="lg" variant="outline" className="gap-2">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
