import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, EyeOff, Mail, Lock, LogIn, Wand2, Send, Fingerprint } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { startAuthentication } from "@simplewebauthn/browser";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  customDomain: string | null;
  allowPasswordAuth: boolean;
  allowSocialAuth: boolean;
  allowMagicLink: boolean;
  requireEmailVerification: boolean;
}

export default function UniversalLoginPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkDialogOpen, setMagicLinkDialogOpen] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const { toast } = useToast();

  // Get tenant slug and redirect_uri from URL
  const params = new URLSearchParams(window.location.search);
  const tenantSlug = params.get("tenant");
  const redirectUri = params.get("redirect_uri");

  // Fetch tenant branding
  const { data: tenant, isLoading: loadingTenant } = useQuery<TenantBranding>({
    queryKey: [`/api/public/tenant/${tenantSlug}`],
    enabled: !!tenantSlug,
  });

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      return apiRequest("POST", "/api/auth/login", {
        ...data,
        tenantSlug,
        redirectUri,
      }) as Promise<any>;
    },
    onSuccess: (data: any) => {
      if (data.requiresMfa) {
        setLocation("/auth/mfa");
      } else if (data.redirectUri) {
        // Use backend-validated redirect URI
        window.location.href = data.redirectUri;
      } else {
        // Default to home if no valid redirect
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid email or password",
      });
    },
  });

  const handleOAuthLogin = (provider: "google" | "github") => {
    const oauthUrl = `/api/auth/oauth/${provider}?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`;
    window.location.href = oauthUrl;
  };

  const magicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/auth/magic-link/request", {
        email,
        tenantSlug,
        redirectUri,
      }) as Promise<any>;
    },
    onSuccess: () => {
      toast({
        title: "Magic link sent!",
        description: "Check your email for the sign-in link. It expires in 15 minutes.",
      });
      setMagicLinkDialogOpen(false);
      setMagicLinkEmail("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to send magic link",
        description: error.message || "Please try again later",
      });
    },
  });

  const webauthnMutation = useMutation({
    mutationFn: async () => {
      // Get challenge from server
      const optionsRes = await fetch("/api/auth/webauthn/authenticate-options", {
        credentials: "include",
      });
      const options = await optionsRes.json();

      // Authenticate with browser
      const authResponse = await startAuthentication(options);

      // Verify with server
      const verifyRes = await fetch("/api/auth/webauthn/authenticate-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authResponse,
          tenantSlug,
          redirectUri,
        }),
        credentials: "include",
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.error || "WebAuthn authentication failed");
      }

      return verifyRes.json();
    },
    onSuccess: (data: any) => {
      if (data.redirectUri) {
        // Use backend-validated redirect URI
        window.location.href = data.redirectUri;
      } else {
        // Default to home if no valid redirect
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "WebAuthn failed",
        description: error.message || "Failed to authenticate with passkey",
      });
    },
  });

  // Apply tenant primary color and restore on unmount
  useEffect(() => {
    if (tenant?.primaryColor) {
      // Save original value
      const originalPrimary = getComputedStyle(document.documentElement).getPropertyValue("--primary");
      document.documentElement.style.setProperty("--primary", tenant.primaryColor);
      
      // Restore on unmount
      return () => {
        if (originalPrimary) {
          document.documentElement.style.setProperty("--primary", originalPrimary);
        } else {
          document.documentElement.style.removeProperty("--primary");
        }
      };
    }
  }, [tenant?.primaryColor]);

  if (!tenantSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Missing Tenant</CardTitle>
            <CardDescription>
              Please provide a tenant parameter in the URL (e.g., ?tenant=your-company)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Tenant Not Found</CardTitle>
            <CardDescription>
              The tenant "{tenantSlug}" could not be found or is inactive.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          {tenant.logoUrl ? (
            <div className="flex justify-center">
              <img
                src={tenant.logoUrl}
                alt={`${tenant.name} logo`}
                className="h-12 object-contain"
                data-testid="tenant-logo"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="text-3xl font-bold"
                style={{ color: tenant.primaryColor }}
                data-testid="tenant-name-logo"
              >
                {tenant.name}
              </div>
            </div>
          )}
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to {tenant.name}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {tenant.allowSocialAuth && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("google")}
                data-testid="button-google-login"
                className="hover-elevate active-elevate-2"
              >
                <SiGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthLogin("github")}
                data-testid="button-github-login"
                className="hover-elevate active-elevate-2"
              >
                <SiGithub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full hover-elevate active-elevate-2"
            onClick={() => webauthnMutation.mutate()}
            disabled={webauthnMutation.isPending}
            data-testid="button-webauthn-login"
          >
            {webauthnMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Authenticating...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Sign in with Passkey
              </>
            )}
          </Button>

          {tenant.allowMagicLink && (
            <Dialog open={magicLinkDialogOpen} onOpenChange={setMagicLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full hover-elevate active-elevate-2"
                  data-testid="button-magic-link"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Sign in with Magic Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Passwordless Sign In</DialogTitle>
                  <DialogDescription>
                    Enter your email and we'll send you a secure sign-in link. No password needed!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-magic-link-email"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => magicLinkMutation.mutate(magicLinkEmail)}
                    disabled={!magicLinkEmail || magicLinkMutation.isPending}
                    className="w-full"
                    data-testid="button-send-magic-link"
                  >
                    {magicLinkMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {tenant.allowPasswordAuth && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="name@company.com"
                              className="pl-10"
                              data-testid="input-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <a
                            href={`/auth/forgot-password?tenant=${tenantSlug}`}
                            className="text-sm text-primary hover:underline"
                            data-testid="link-forgot-password"
                          >
                            Forgot password?
                          </a>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-10 pr-10"
                              data-testid="input-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <a
              href={`/auth/universal-register?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`}
              className="text-primary hover:underline font-medium"
              data-testid="link-register"
            >
              Sign up
            </a>
          </div>
          <div className="text-xs text-center text-muted-foreground pt-2">
            Powered by{" "}
            <a href="https://authflow.com" className="text-primary hover:underline">
              Authflow
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
