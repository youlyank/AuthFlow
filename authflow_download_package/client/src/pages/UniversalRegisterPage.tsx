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
import { ThemeToggle } from "@/components/ThemeToggle";
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type RegisterInput = z.infer<typeof registerSchema>;

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

export default function UniversalRegisterPage() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
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

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      return apiRequest("POST", "/api/auth/register", {
        ...data,
        tenantSlug,
      }) as Promise<any>;
    },
    onSuccess: () => {
      if (tenant?.requireEmailVerification) {
        toast({
          title: "Registration successful!",
          description: "Please check your email to verify your account before signing in.",
        });
        setLocation(`/auth/universal-login?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`);
      } else {
        toast({
          title: "Registration successful!",
          description: "You can now sign in with your credentials.",
        });
        setLocation(`/auth/universal-login?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`);
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Please try again",
      });
    },
  });

  const handleOAuthRegister = (provider: "google" | "github") => {
    const oauthUrl = `/api/auth/oauth/${provider}?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`;
    window.location.href = oauthUrl;
  };

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
            <CardTitle className="text-3xl font-bold">Create an account</CardTitle>
            <CardDescription>
              Join {tenant.name} today
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {tenant.allowSocialAuth && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOAuthRegister("google")}
                data-testid="button-google-register"
                className="hover-elevate active-elevate-2"
              >
                <SiGoogle className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => handleOAuthRegister("github")}
                data-testid="button-github-register"
                className="hover-elevate active-elevate-2"
              >
                <SiGithub className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>
          )}

          {tenant.allowPasswordAuth && (
            <>
              {tenant.allowSocialAuth && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or register with
                    </span>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                placeholder="John"
                                className="pl-10"
                                data-testid="input-firstname"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                placeholder="Doe"
                                className="pl-10"
                                data-testid="input-lastname"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a strong password"
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
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create account
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
            Already have an account?{" "}
            <a
              href={`/auth/universal-login?tenant=${tenantSlug}${redirectUri ? `&redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`}
              className="text-primary hover:underline font-medium"
              data-testid="link-login"
            >
              Sign in
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
