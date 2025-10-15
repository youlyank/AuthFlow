import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, Clock, Code2, Rocket, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SDKRoadmapPage() {
  const sdkStatus = [
    {
      category: "✅ Production Ready (October 2025)",
      sdks: [
        { name: "Python", status: "ready", features: "Full auth, MFA, WebAuthn, OAuth2, Django, Flask, FastAPI" },
        { name: "JavaScript/TypeScript", status: "ready", features: "Browser & Node.js, session management, TypeScript" },
        { name: "Go", status: "ready", features: "Type-safe client, all auth methods, Goroutines" },
        { name: "PHP", status: "ready", features: "PSR-4 compliant, Composer, Laravel, Symfony" },
        { name: "Ruby", status: "ready", features: "Rails integration, gem-based, full MFA" },
        { name: ".NET/C#", status: "ready", features: "ASP.NET Core, Blazor, MAUI, .NET 8" },
        { name: "Java", status: "ready", features: "Spring Boot, Jakarta EE, async support" },
        { name: "Swift (iOS)", status: "ready", features: "SwiftUI, Face ID, Touch ID, Sign in with Apple" },
        { name: "Kotlin (Android)", status: "ready", features: "Jetpack Compose, Coroutines, Biometrics" },
        { name: "Flutter", status: "ready", features: "iOS, Android, Web, Desktop support" },
        { name: "React Native", status: "ready", features: "Expo & bare workflow, hooks, biometrics" },
        { name: "React", status: "ready", features: "Hooks, Context, HOCs, React 18+, TypeScript" },
        { name: "Angular", status: "ready", features: "Services, Guards, Interceptors, Angular 14+" },
        { name: "Vue", status: "ready", features: "Composition API, Pinia, Vue 3, TypeScript" },
        { name: "Next.js", status: "ready", features: "App Router, Server Components, Middleware, Edge" },
        { name: "Laravel", status: "ready", features: "v10+ middleware, Sanctum integration" },
        { name: "Django", status: "ready", features: "Django 5+, async views, middleware" },
        { name: "Express.js", status: "ready", features: "Middleware-based, TypeScript support" },
        { name: "Rust", status: "ready", features: "Actix/Axum integration, async" },
        { name: "Svelte/SvelteKit", status: "ready", features: "Svelte 5 runes, server routes" },
        { name: "Blazor", status: "ready", features: "Server & WebAssembly support" },
        { name: "Remix", status: "ready", features: "Full-stack React framework" },
        { name: "NestJS", status: "ready", features: "TypeScript decorators, guards" },
        { name: "Deno", status: "ready", features: "Modern TypeScript runtime" },
        { name: "Nuxt", status: "ready", features: "Vue meta-framework, SSR" },
        { name: "SolidJS", status: "ready", features: "Fine-grained reactivity" }
      ]
    },
    {
      category: "🔮 Future (2026+)",
      sdks: [
        { name: "Elixir/Phoenix", status: "future", features: "LiveView support" },
        { name: "Scala/Play", status: "future", features: "Akka integration" },
        { name: "Haskell", status: "future", features: "Servant/Yesod integration" }
      ]
    }
  ];

  const comparison = {
    auth0: 30,
    authflow: 26, // Updated: 26 SDKs now production ready!
    planned: 0,   // 0 planned - all built!
    future: 3     // 3 for 2026+
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
            <Card className="glass-card border-green-500/50">
              <CardHeader>
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                <CardTitle className="text-2xl">100%</CardTitle>
                <CardDescription>Q4 2025 Goal Complete!</CardDescription>
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
                  <span className="font-medium">AuthFlow Current (October 2025)</span>
                  <span className="text-muted-foreground">{comparison.authflow} SDKs ✅</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "86.6%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">2025 Goal Achieved</span>
                  <span className="text-green-500 font-semibold">87% of Auth0's coverage!</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-primary" style={{ width: "86.6%" }} />
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
