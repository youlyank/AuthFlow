import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Palette, Globe, Plus, X, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_FEATURES = [
  { key: "enableWebAuthn", label: "WebAuthn/FIDO2", description: "Enable passwordless authentication with WebAuthn" },
  { key: "enableMagicLink", label: "Magic Link", description: "Enable magic link authentication" },
  { key: "enableApiKeys", label: "API Keys", description: "Allow users to generate API keys" },
  { key: "enableWebhooks", label: "Webhooks", description: "Enable webhook configuration" },
  { key: "enableAuditLogs", label: "Audit Logs", description: "Enable detailed audit logging" },
  { key: "enableAdvancedAnalytics", label: "Advanced Analytics", description: "Enable advanced analytics and reporting" },
];

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color"),
  allowPasswordAuth: z.boolean(),
  allowSocialAuth: z.boolean(),
  allowMagicLink: z.boolean(),
  requireEmailVerification: z.boolean(),
  requireMfa: z.boolean(),
  sessionTimeout: z.number().min(300).max(2592000),
  customDomain: z.string().optional().or(z.literal("")),
  allowedDomains: z.array(z.string()).default([]),
  features: z.record(z.boolean()).default({}),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function TenantAdminSettings() {
  const { toast } = useToast();
  const [newDomain, setNewDomain] = useState("");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/tenant-admin/settings"],
  });

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      name: settings.name,
      logoUrl: settings.logoUrl || "",
      primaryColor: settings.primaryColor || "#2563eb",
      allowPasswordAuth: settings.allowPasswordAuth ?? true,
      allowSocialAuth: settings.allowSocialAuth ?? true,
      allowMagicLink: settings.allowMagicLink ?? true,
      requireEmailVerification: settings.requireEmailVerification ?? true,
      requireMfa: settings.requireMfa ?? false,
      sessionTimeout: settings.sessionTimeout || 86400,
      customDomain: settings.customDomain || "",
      allowedDomains: Array.isArray(settings.allowedDomains) ? settings.allowedDomains : [],
      features: settings.features || {},
    } : {
      name: "",
      logoUrl: "",
      primaryColor: "#2563eb",
      allowPasswordAuth: true,
      allowSocialAuth: true,
      allowMagicLink: true,
      requireEmailVerification: true,
      requireMfa: false,
      sessionTimeout: 86400,
      customDomain: "",
      allowedDomains: [],
      features: {},
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SettingsFormValues) => 
      apiRequest("/api/tenant-admin/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-admin/settings"] });
      toast({
        title: "Settings updated",
        description: "Tenant settings have been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div data-testid="loading-settings">Loading settings...</div>;
  }

  const sessionTimeoutHours = Math.floor(form.watch("sessionTimeout") / 3600);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Tenant Settings</h1>
        <p className="text-muted-foreground">Configure authentication, branding, and security settings for your organization</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general" data-testid="tab-general">
                <Settings className="w-4 h-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding" data-testid="tab-branding">
                <Palette className="w-4 h-4 mr-2" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="authentication" data-testid="tab-authentication">
                <Shield className="w-4 h-4 mr-2" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="features" data-testid="tab-features">
                <Zap className="w-4 h-4 mr-2" />
                Features
              </TabsTrigger>
              <TabsTrigger value="domain" data-testid="tab-domain">
                <Globe className="w-4 h-4 mr-2" />
                Domain
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>Basic information about your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-org-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Branding Settings</CardTitle>
                  <CardDescription>Customize the look and feel of your authentication pages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/logo.png" data-testid="input-logo-url" />
                        </FormControl>
                        <FormDescription>URL to your organization's logo</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input {...field} placeholder="#2563eb" data-testid="input-primary-color" />
                          </FormControl>
                          <div 
                            className="w-12 h-10 rounded border"
                            style={{ backgroundColor: field.value }}
                            data-testid="preview-primary-color"
                          />
                        </div>
                        <FormDescription>Primary brand color in hex format</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authentication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Authentication Methods</CardTitle>
                  <CardDescription>Configure which authentication methods are available</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="allowPasswordAuth"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Password Authentication</FormLabel>
                          <FormDescription>Allow users to sign in with email and password</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-allow-password"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="allowSocialAuth"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Social Login</FormLabel>
                          <FormDescription>Allow users to sign in with Google, GitHub, etc.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-allow-social"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="allowMagicLink"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Magic Link</FormLabel>
                          <FormDescription>Allow passwordless authentication via email links</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-allow-magic-link"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Requirements</CardTitle>
                  <CardDescription>Configure security policies for your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="requireEmailVerification"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Require Email Verification</FormLabel>
                          <FormDescription>Users must verify their email before accessing the system</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-email-verification"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="requireMfa"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Require Multi-Factor Authentication</FormLabel>
                          <FormDescription>All users must enable MFA to access the system</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-require-mfa"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="sessionTimeout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Timeout</FormLabel>
                        <div className="flex items-center gap-4">
                          <FormControl>
                            <Input
                              type="number"
                              value={field.value}
                              onChange={(e) => {
                                const value = e.target.valueAsNumber;
                                field.onChange(isNaN(value) ? 300 : value);
                              }}
                              min={300}
                              max={2592000}
                              data-testid="input-session-timeout"
                            />
                          </FormControl>
                          <span className="text-sm text-muted-foreground" data-testid="text-session-timeout-hours">
                            {sessionTimeoutHours} hours
                          </span>
                        </div>
                        <FormDescription>Automatically log out users after this period of inactivity (in seconds)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Toggles</CardTitle>
                  <CardDescription>Enable or disable specific features for your organization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <div className="space-y-6">
                        {AVAILABLE_FEATURES.map((feature, index) => (
                          <div key={feature.key}>
                            {index > 0 && <Separator />}
                            <FormItem className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <FormLabel>{feature.label}</FormLabel>
                                <FormDescription>{feature.description}</FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value[feature.key] ?? false}
                                  onCheckedChange={(checked) => {
                                    field.onChange({
                                      ...field.value,
                                      [feature.key]: checked,
                                    });
                                  }}
                                  data-testid={`switch-feature-${feature.key}`}
                                />
                              </FormControl>
                            </FormItem>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Domain Settings</CardTitle>
                  <CardDescription>Configure custom domain and allowed email domains</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="customDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Domain</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="auth.yourdomain.com" data-testid="input-custom-domain" />
                        </FormControl>
                        <FormDescription>Custom domain for your authentication pages</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="allowedDomains"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed Email Domains</FormLabel>
                        <FormDescription>
                          Restrict user registration to specific email domains
                        </FormDescription>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={newDomain}
                              onChange={(e) => setNewDomain(e.target.value)}
                              placeholder="example.com"
                              data-testid="input-new-domain"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (newDomain && !field.value.includes(newDomain)) {
                                    field.onChange([...field.value, newDomain]);
                                    setNewDomain("");
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (newDomain && !field.value.includes(newDomain)) {
                                  field.onChange([...field.value, newDomain]);
                                  setNewDomain("");
                                }
                              }}
                              data-testid="button-add-domain"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2" data-testid="list-allowed-domains">
                              {field.value.map((domain, index) => (
                                <Badge key={index} variant="secondary" className="gap-1" data-testid={`badge-domain-${index}`}>
                                  {domain}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDomains = field.value.filter((_, i) => i !== index);
                                      field.onChange(newDomains);
                                    }}
                                    className="ml-1 hover-elevate rounded-full"
                                    data-testid={`button-remove-domain-${index}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-settings">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
