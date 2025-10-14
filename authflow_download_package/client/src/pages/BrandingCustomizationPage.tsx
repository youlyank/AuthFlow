import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Palette, Image, Type, FileCode, Mail, Link as LinkIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BrandingFormValues {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
  loginPageTitle?: string;
  loginPageSubtitle?: string;
  emailFooter?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
  supportEmail?: string;
}

export default function BrandingCustomizationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Handle super_admins who don't have a tenantId
  if (user?.role === "super_admin" && !user?.tenantId) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Super admins cannot manage branding directly. Please switch to a specific tenant account to configure branding.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const tenantId = user?.tenantId || "";

  const form = useForm<BrandingFormValues>({
    defaultValues: {
      logoUrl: "",
      faviconUrl: "",
      primaryColor: "#2563eb",
      secondaryColor: "#64748b",
      accentColor: "#0ea5e9",
      fontFamily: "Inter",
      customCss: "",
      loginPageTitle: "",
      loginPageSubtitle: "",
      emailFooter: "",
      privacyPolicyUrl: "",
      termsOfServiceUrl: "",
      supportEmail: "",
    },
  });

  // Fetch existing branding
  const { data: branding, isLoading } = useQuery({
    queryKey: ["/api/branding", tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/branding/${tenantId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null; // No branding yet
        throw new Error("Failed to fetch branding");
      }
      return response.json();
    },
    enabled: !!tenantId,
  });

  // Update form when branding data loads
  useEffect(() => {
    if (branding) {
      form.reset({
        logoUrl: branding.logoUrl || "",
        faviconUrl: branding.faviconUrl || "",
        primaryColor: branding.primaryColor || "#2563eb",
        secondaryColor: branding.secondaryColor || "#64748b",
        accentColor: branding.accentColor || "#0ea5e9",
        fontFamily: branding.fontFamily || "Inter",
        customCss: branding.customCss || "",
        loginPageTitle: branding.loginPageTitle || "",
        loginPageSubtitle: branding.loginPageSubtitle || "",
        emailFooter: branding.emailFooter || "",
        privacyPolicyUrl: branding.privacyPolicyUrl || "",
        termsOfServiceUrl: branding.termsOfServiceUrl || "",
        supportEmail: branding.supportEmail || "",
      });
    }
  }, [branding, form]);

  // Update branding mutation
  const updateBrandingMutation = useMutation({
    mutationFn: async (data: BrandingFormValues) => {
      return apiRequest("PUT", `/api/branding/${tenantId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/branding", tenantId] });
      toast({
        title: "Branding Updated",
        description: "Your white-label branding has been saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update branding",
      });
    },
  });

  const onSubmit = (data: BrandingFormValues) => {
    updateBrandingMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-branding">
          <Palette className="w-8 h-8" />
          Branding Customization
        </h1>
        <p className="text-muted-foreground">White-label your authentication experience</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading branding settings...</p>
          </CardContent>
        </Card>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="visual" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visual" data-testid="tab-visual">
                  <Palette className="mr-2 h-4 w-4" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="content" data-testid="tab-content">
                  <Type className="mr-2 h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="links" data-testid="tab-links">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="advanced" data-testid="tab-advanced">
                  <FileCode className="mr-2 h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      Logos & Images
                    </CardTitle>
                    <CardDescription>Upload your brand assets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} data-testid="input-logo-url" />
                          </FormControl>
                          <FormDescription>URL to your company logo (recommended: 200x60px)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="faviconUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Favicon URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/favicon.ico" {...field} data-testid="input-favicon-url" />
                          </FormControl>
                          <FormDescription>URL to your favicon (recommended: 32x32px)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Colors
                    </CardTitle>
                    <CardDescription>Customize your brand colors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20" data-testid="input-primary-color" />
                            </FormControl>
                            <Input value={field.value} onChange={field.onChange} placeholder="#2563eb" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20" data-testid="input-secondary-color" />
                            </FormControl>
                            <Input value={field.value} onChange={field.onChange} placeholder="#64748b" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accent Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input type="color" {...field} className="w-20" data-testid="input-accent-color" />
                            </FormControl>
                            <Input value={field.value} onChange={field.onChange} placeholder="#0ea5e9" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fontFamily"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Font Family</FormLabel>
                          <FormControl>
                            <Input placeholder="Inter, sans-serif" {...field} data-testid="input-font-family" />
                          </FormControl>
                          <FormDescription>Google Font name or web-safe font</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Type className="w-5 h-5" />
                      Login Page Content
                    </CardTitle>
                    <CardDescription>Customize your login page text</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="loginPageTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login Page Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Welcome Back" {...field} data-testid="input-login-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="loginPageSubtitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Login Page Subtitle</FormLabel>
                          <FormControl>
                            <Input placeholder="Sign in to your account" {...field} data-testid="input-login-subtitle" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emailFooter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Footer</FormLabel>
                          <FormControl>
                            <Textarea placeholder="© 2025 Your Company. All rights reserved." {...field} data-testid="input-email-footer" />
                          </FormControl>
                          <FormDescription>Footer text for authentication emails</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="w-5 h-5" />
                      Legal & Support Links
                    </CardTitle>
                    <CardDescription>Add your policy and support links</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="privacyPolicyUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Privacy Policy URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourcompany.com/privacy" {...field} data-testid="input-privacy-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="termsOfServiceUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms of Service URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourcompany.com/terms" {...field} data-testid="input-terms-url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supportEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Support Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="support@yourcompany.com" {...field} data-testid="input-support-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="w-5 h-5" />
                      Custom CSS
                    </CardTitle>
                    <CardDescription>Advanced styling with custom CSS (use with caution)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="customCss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom CSS</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder=".login-button { border-radius: 8px; }" 
                              {...field} 
                              className="font-mono text-sm min-h-[200px]"
                              data-testid="input-custom-css"
                            />
                          </FormControl>
                          <FormDescription>CSS will be injected into authentication pages</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updateBrandingMutation.isPending}
                data-testid="button-save-branding"
              >
                {updateBrandingMutation.isPending ? "Saving..." : "Save Branding"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
