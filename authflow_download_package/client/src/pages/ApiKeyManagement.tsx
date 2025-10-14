import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Key, Trash2, Copy, ShieldOff, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const AVAILABLE_PERMISSIONS = [
  { value: "*", label: "All Permissions (Wildcard)", description: "Full access to all API endpoints" },
  { value: "users:read", label: "Users: Read", description: "View user data" },
  { value: "users:write", label: "Users: Write", description: "Create and update users" },
  { value: "sessions:read", label: "Sessions: Read", description: "View session data" },
  { value: "sessions:write", label: "Sessions: Write", description: "Manage sessions" },
  { value: "webhooks:read", label: "Webhooks: Read", description: "View webhooks" },
  { value: "webhooks:write", label: "Webhooks: Write", description: "Manage webhooks" },
  { value: "api_keys:read", label: "API Keys: Read", description: "View API keys" },
  { value: "api_keys:write", label: "API Keys: Write", description: "Manage API keys" },
];

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
  expiresInDays: z.string().optional(),
});

type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

export default function ApiKeyManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const form = useForm<CreateApiKeyInput>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      permissions: [],
      expiresInDays: "",
    },
  });

  const { data: apiKeys, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/api-keys"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateApiKeyInput) => {
      const payload: any = {
        name: data.name,
        permissions: data.permissions,
      };

      if (data.expiresInDays) {
        const days = parseInt(data.expiresInDays);
        if (!isNaN(days) && days > 0) {
          payload.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const res = await apiRequest("POST", "/api/admin/api-keys", payload);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      setApiKey(data.key);
      toast({
        title: "API key created",
        description: "Save the key - it won't be shown again!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/admin/api-keys/${id}/revoke`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "API key deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateApiKeyInput) => {
    createMutation.mutate(data);
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage programmatic access to your tenant's API
          </p>
        </div>
        <Button data-testid="button-create-api-key" onClick={() => {
          setCreateDialogOpen(true);
          setApiKey(null);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : apiKeys && apiKeys.length > 0 ? (
        <div className="grid gap-4">
          {apiKeys.map((key) => {
            const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
            const isRevoked = key.revokedAt !== null;

            return (
              <Card key={key.id} data-testid={`card-api-key-${key.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{key.name}</CardTitle>
                      {isRevoked ? (
                        <Badge variant="destructive" data-testid={`badge-revoked-${key.id}`}>
                          <ShieldOff className="w-3 h-3 mr-1" />
                          Revoked
                        </Badge>
                      ) : isExpired ? (
                        <Badge variant="destructive" data-testid={`badge-expired-${key.id}`}>
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="default" data-testid={`badge-active-${key.id}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {key.expiresAt ? (
                        isExpired ? (
                          <span data-testid={`text-expired-${key.id}`}>
                            Expired {formatDistanceToNow(new Date(key.expiresAt))} ago
                          </span>
                        ) : (
                          <span data-testid={`text-expires-${key.id}`}>
                            Expires {formatDistanceToNow(new Date(key.expiresAt), { addSuffix: true })}
                          </span>
                        )
                      ) : (
                        <span data-testid={`text-no-expiration-${key.id}`}>No expiration</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isRevoked && !isExpired && (
                      <Button
                        data-testid={`button-revoke-${key.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() => revokeMutation.mutate(key.id)}
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    )}
                    <Button
                      data-testid={`button-delete-${key.id}`}
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(key.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {key.permissions.map((perm: string) => (
                      <Badge key={perm} variant="secondary" data-testid={`badge-permission-${perm}`}>
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Key className="w-12 h-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No API keys configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first API key to enable programmatic access
            </p>
            <Button data-testid="button-create-first-api-key" onClick={() => {
              setCreateDialogOpen(true);
              setApiKey(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          form.reset();
          setApiKey(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access to your tenant's data
            </DialogDescription>
          </DialogHeader>

          {apiKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">API Key (Save this!)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded border text-sm break-all" data-testid="text-api-key">
                    {apiKey}
                  </code>
                  <Button data-testid="button-copy-key" size="sm" onClick={copyKey}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This key won't be shown again. Store it securely!
                </p>
              </div>
              <DialogFooter>
                <Button data-testid="button-close-key-dialog" onClick={() => {
                  setCreateDialogOpen(false);
                  setApiKey(null);
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-key-name"
                          placeholder="Production API Key"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name to identify this key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresInDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiration (optional)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-expires-days"
                          type="number"
                          placeholder="30"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of days until expiration (leave empty for no expiration)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <FormDescription>
                        Select which API endpoints this key can access
                      </FormDescription>
                      <div className="space-y-3 mt-2">
                        {AVAILABLE_PERMISSIONS.map((perm) => (
                          <FormField
                            key={perm.value}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              const isWildcard = perm.value === "*";
                              const hasWildcard = field.value?.includes("*");

                              return (
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      data-testid={`checkbox-permission-${perm.value}`}
                                      checked={field.value?.includes(perm.value)}
                                      disabled={!isWildcard && hasWildcard}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (isWildcard && checked) {
                                          // If wildcard is checked, set only wildcard
                                          field.onChange(["*"]);
                                        } else if (checked) {
                                          // Add permission
                                          field.onChange([...current, perm.value]);
                                        } else {
                                          // Remove permission
                                          field.onChange(current.filter((v) => v !== perm.value));
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal cursor-pointer">
                                      {perm.label}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      {perm.description}
                                    </p>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    data-testid="button-cancel-create-api-key"
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-create-api-key" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create API Key"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
