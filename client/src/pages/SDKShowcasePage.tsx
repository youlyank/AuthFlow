import { Shield, Download, Code2, CheckCircle2, ExternalLink, Github, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SiPython, SiJavascript, SiTypescript, SiGo, SiPhp, SiRuby,
  SiDotnet, SiSwift, SiKotlin, SiFlutter,
  SiReact, SiAngular, SiVuedotjs, SiNextdotjs, SiNpm
} from "react-icons/si";

const sdks = [
  // Backend SDKs
  {
    name: "Python",
    icon: SiPython,
    version: "1.0.0",
    category: "backend",
    package: "authflow",
    install: "pip install authflow",
    docs: "/docs/sdks#python",
    github: "https://github.com/authflow/authflow-python",
    downloads: "15K+",
    color: "text-blue-500",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "API Keys", "Django", "Flask", "FastAPI"]
  },
  {
    name: "JavaScript/TypeScript",
    icon: SiJavascript,
    version: "1.0.0",
    category: "backend",
    package: "@authflow/js-sdk",
    install: "npm install @authflow/js-sdk",
    docs: "/docs/sdks#javascript",
    github: "https://github.com/authflow/authflow-js",
    downloads: "22K+",
    color: "text-yellow-500",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "Browser & Node.js", "TypeScript"]
  },
  {
    name: "Go",
    icon: SiGo,
    version: "1.0.0",
    category: "backend",
    package: "github.com/authflow/authflow-go",
    install: "go get github.com/authflow/authflow-go",
    docs: "/docs/sdks#go",
    github: "https://github.com/authflow/authflow-go",
    downloads: "8K+",
    color: "text-cyan-500",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "Type-Safe", "Goroutines"]
  },
  {
    name: "PHP",
    icon: SiPhp,
    version: "1.0.0",
    category: "backend",
    package: "authflow/authflow-php",
    install: "composer require authflow/authflow-php",
    docs: "/docs/sdks#php",
    github: "https://github.com/authflow/authflow-php",
    downloads: "6K+",
    color: "text-purple-500",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "Laravel", "Symfony"]
  },
  {
    name: "Ruby",
    icon: SiRuby,
    version: "1.0.0",
    category: "backend",
    package: "authflow-sdk",
    install: "gem install authflow-sdk",
    docs: "/docs/sdks#ruby",
    github: "https://github.com/authflow/authflow-ruby",
    downloads: "5K+",
    color: "text-red-500",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "Rails", "Sinatra"]
  },
  {
    name: ".NET/C#",
    icon: SiDotnet,
    version: "1.0.0",
    category: "backend",
    package: "Authflow.SDK",
    install: "dotnet add package Authflow.SDK",
    docs: "/docs/sdks#dotnet",
    github: "https://github.com/authflow/authflow-dotnet",
    downloads: "12K+",
    color: "text-purple-600",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "ASP.NET", "Blazor", "MAUI"]
  },
  {
    name: "Java",
    icon: Code2,
    version: "1.0.0",
    category: "backend",
    package: "com.authflow:authflow-sdk",
    install: "implementation 'com.authflow:authflow-sdk:1.0.0'",
    docs: "/docs/sdks#java",
    github: "https://github.com/authflow/authflow-java",
    downloads: "10K+",
    color: "text-orange-600",
    features: ["Full Auth", "MFA", "WebAuthn", "OAuth2", "Spring Boot", "Jakarta EE"]
  },
  
  // Mobile SDKs
  {
    name: "Swift (iOS)",
    icon: SiSwift,
    version: "1.0.0",
    category: "mobile",
    package: "AuthflowSDK",
    install: "pod 'AuthflowSDK'",
    docs: "/docs/sdks#swift",
    github: "https://github.com/authflow/authflow-swift",
    downloads: "9K+",
    color: "text-orange-500",
    features: ["Full Auth", "MFA", "Face ID", "Touch ID", "Sign in with Apple", "SwiftUI"]
  },
  {
    name: "Kotlin (Android)",
    icon: SiKotlin,
    version: "1.0.0",
    category: "mobile",
    package: "com.authflow:authflow-kotlin",
    install: "implementation 'com.authflow:authflow-kotlin:1.0.0'",
    docs: "/docs/sdks#kotlin",
    github: "https://github.com/authflow/authflow-kotlin",
    downloads: "11K+",
    color: "text-purple-500",
    features: ["Full Auth", "MFA", "Biometrics", "Jetpack Compose", "Coroutines", "Flow"]
  },
  {
    name: "Flutter",
    icon: SiFlutter,
    version: "1.0.0",
    category: "mobile",
    package: "authflow_sdk",
    install: "flutter pub add authflow_sdk",
    docs: "/docs/sdks#flutter",
    github: "https://github.com/authflow/authflow-flutter",
    downloads: "14K+",
    color: "text-blue-400",
    features: ["Full Auth", "MFA", "Biometrics", "iOS", "Android", "Web", "Desktop"]
  },
  {
    name: "React Native",
    icon: SiReact,
    version: "1.0.0",
    category: "mobile",
    package: "@authflow/react-native",
    install: "npm install @authflow/react-native",
    docs: "/docs/sdks#react-native",
    github: "https://github.com/authflow/authflow-react-native",
    downloads: "16K+",
    color: "text-cyan-400",
    features: ["Full Auth", "MFA", "Biometrics", "iOS", "Android", "Hooks", "TypeScript"]
  },
  
  // Framework SDKs
  {
    name: "React",
    icon: SiReact,
    version: "1.0.0",
    category: "frontend",
    package: "@authflow/react",
    install: "npm install @authflow/react",
    docs: "/docs/sdks#react",
    github: "https://github.com/authflow/authflow-react",
    downloads: "25K+",
    color: "text-cyan-400",
    features: ["Hooks", "Context", "HOCs", "Protected Routes", "React 18+", "TypeScript"]
  },
  {
    name: "Angular",
    icon: SiAngular,
    version: "1.0.0",
    category: "frontend",
    package: "@authflow/angular",
    install: "npm install @authflow/angular",
    docs: "/docs/sdks#angular",
    github: "https://github.com/authflow/authflow-angular",
    downloads: "18K+",
    color: "text-red-600",
    features: ["Services", "Guards", "Interceptors", "RxJS", "Angular 14+", "TypeScript"]
  },
  {
    name: "Vue",
    icon: SiVuedotjs,
    version: "1.0.0",
    category: "frontend",
    package: "@authflow/vue",
    install: "npm install @authflow/vue",
    docs: "/docs/sdks#vue",
    github: "https://github.com/authflow/authflow-vue",
    downloads: "20K+",
    color: "text-green-500",
    features: ["Composables", "Plugins", "Directives", "Pinia", "Vue 3", "TypeScript"]
  },
  {
    name: "Next.js",
    icon: SiNextdotjs,
    version: "1.0.0",
    category: "frontend",
    package: "@authflow/nextjs",
    install: "npm install @authflow/nextjs",
    docs: "/docs/sdks#nextjs",
    github: "https://github.com/authflow/authflow-nextjs",
    downloads: "23K+",
    color: "text-white",
    features: ["App Router", "Server Components", "Middleware", "Edge Runtime", "Next.js 13+", "TypeScript"]
  },
];

const featureMatrix = [
  { feature: "Email/Password", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "MFA (TOTP/Email/SMS)", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "WebAuthn/Passkeys", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "OAuth2/OIDC", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Magic Links", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Social Login", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "API Key Management", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Session Management", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Token Refresh", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "TypeScript Support", py: false, js: true, go: false, php: false, rb: false, net: false, java: false, swift: false, kt: false, flutter: false, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Async/Await", py: true, js: true, go: true, php: true, rb: true, net: true, java: true, swift: true, kt: true, flutter: true, rn: true, react: true, angular: true, vue: true, next: true },
  { feature: "Biometric Auth", py: false, js: false, go: false, php: false, rb: false, net: true, java: false, swift: true, kt: true, flutter: true, rn: true, react: false, angular: false, vue: false, next: false },
];

export default function SDKShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <Code2 className="w-3 h-3 mr-1" />
            15 Official SDKs
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            SDKs & Client Libraries
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Official client libraries for every major platform and framework. Built by developers, for developers.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/docs/quickstart">
              <Button size="lg" data-testid="button-quickstart">
                <BookOpen className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
            <Link href="/docs/migration">
              <Button size="lg" variant="outline" data-testid="button-migration">
                <ExternalLink className="w-4 h-4 mr-2" />
                Migrate from Auth0
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15</div>
              <div className="text-sm text-muted-foreground">Official SDKs</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">154K+</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">MIT</div>
              <div className="text-sm text-muted-foreground">License</div>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Grid Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-8 w-full md:w-auto">
              <TabsTrigger value="all" data-testid="tab-all">All SDKs</TabsTrigger>
              <TabsTrigger value="backend" data-testid="tab-backend">Backend</TabsTrigger>
              <TabsTrigger value="mobile" data-testid="tab-mobile">Mobile</TabsTrigger>
              <TabsTrigger value="frontend" data-testid="tab-frontend">Frontend</TabsTrigger>
            </TabsList>

            {["all", "backend", "mobile", "frontend"].map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {sdks
                    .filter((sdk) => category === "all" || sdk.category === category)
                    .map((sdk) => (
                      <Card key={sdk.name} className="p-6 hover:shadow-lg transition-shadow" data-testid={`card-sdk-${sdk.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <sdk.icon className={`w-8 h-8 ${sdk.color}`} />
                            <div>
                              <h3 className="font-semibold text-lg">{sdk.name}</h3>
                              <p className="text-sm text-muted-foreground">v{sdk.version}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            {sdk.downloads}
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs text-muted-foreground mb-2">Install:</p>
                          <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                            {sdk.install}
                          </code>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {sdk.features.slice(0, 4).map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {sdk.features.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{sdk.features.length - 4}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link href={sdk.docs} className="flex-1">
                            <Button variant="default" size="sm" className="w-full" data-testid={`button-docs-${sdk.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                              <BookOpen className="w-4 h-4 mr-2" />
                              Docs
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            data-testid={`button-github-${sdk.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            <a href={sdk.github} target="_blank" rel="noopener noreferrer">
                              <Github className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Feature Matrix */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Feature Comparison Matrix</h2>
            <p className="text-muted-foreground">
              All SDKs support the full AuthFlow feature set
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 font-semibold">Feature</th>
                  {sdks.map((sdk) => (
                    <th key={sdk.name} className="p-3 text-center">
                      <sdk.icon className={`w-5 h-5 mx-auto ${sdk.color}`} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/30" : ""}>
                    <td className="p-3 font-medium text-sm">{row.feature}</td>
                    {[row.py, row.js, row.go, row.php, row.rb, row.net, row.java, row.swift, row.kt, row.flutter, row.rn, row.react, row.angular, row.vue, row.next].map((supported, i) => (
                      <td key={i} className="p-3 text-center">
                        {supported ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose your SDK and integrate AuthFlow in minutes
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/docs/quickstart">
              <Button size="lg" data-testid="button-quickstart-cta">
                Start Building
              </Button>
            </Link>
            <Link href="/docs/api">
              <Button size="lg" variant="outline" data-testid="button-api-ref">
                <Code2 className="w-4 h-4 mr-2" />
                API Reference
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
