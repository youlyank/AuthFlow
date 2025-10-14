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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, AppWindow, Trash2, Copy, X } from "lucide-react";

const createClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  redirectUris: z.string().min(1, "At least one redirect URI is required"),
});

type CreateClientInput = z.infer<typeof createClientSchema>;

export default function OAuth2ClientManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clientCredentials, setClientCredentials] = useState<{ clientId: string; clientSecret: string } | null>(null);

  const form = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: "",
      description: "",
      redirectUris: "",
    },
  });

  const { data: clients, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/oauth2/clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateClientInput) => {
      const redirectUris = data.redirectUris
        .split("\n")
        .map(uri => uri.trim())
        .filter(Boolean);

      const res = await apiRequest("POST", "/api/admin/oauth2/clients", {
        name: data.name,
        description: data.description || undefined,
        redirectUris,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/oauth2/clients"] });
      setClientCredentials({
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      });
      toast({
        title: "OAuth2 client created",
        description: "Save the credentials - they won't be shown again!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create OAuth2 client",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/oauth2/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/oauth2/clients"] });
      toast({ title: "OAuth2 client deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete OAuth2 client",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateClientInput) => {
    createMutation.mutate(data);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OAuth2 Clients</h1>
          <p className="text-muted-foreground">
            Manage OAuth2/OIDC applications that can authenticate users
          </p>
        </div>
        <Button data-testid="button-create-oauth-client" onClick={() => {
          setCreateDialogOpen(true);
          setClientCredentials(null);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Client
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} data-testid={`card-oauth-client-${client.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <CardDescription className="truncate">
                    {client.description || "No description"}
                  </CardDescription>
                </div>
                <Button
                  data-testid={`button-delete-oauth-client-${client.id}`}
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(client.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Client ID</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm truncate" data-testid={`text-client-id-${client.id}`}>
                      {client.clientId}
                    </code>
                    <Button
                      data-testid={`button-copy-client-id-${client.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(client.clientId, "Client ID")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Redirect URIs</p>
                  <div className="flex flex-wrap gap-2">
                    {client.redirectUris.map((uri: string, idx: number) => (
                      <Badge key={idx} variant="secondary" data-testid={`badge-redirect-uri-${idx}`}>
                        {uri}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AppWindow className="w-12 h-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No OAuth2 clients configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first OAuth2 client to enable third-party authentication
            </p>
            <Button data-testid="button-create-first-oauth-client" onClick={() => {
              setCreateDialogOpen(true);
              setClientCredentials(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Client Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          form.reset();
          setClientCredentials(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create OAuth2 Client</DialogTitle>
            <DialogDescription>
              Create a new OAuth2/OIDC client application
            </DialogDescription>
          </DialogHeader>

          {clientCredentials ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Client ID</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded border text-sm break-all" data-testid="text-new-client-id">
                      {clientCredentials.clientId}
                    </code>
                    <Button data-testid="button-copy-new-client-id" size="sm" onClick={() => copyToClipboard(clientCredentials.clientId, "Client ID")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Client Secret (Save this!)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded border text-sm break-all" data-testid="text-new-client-secret">
                      {clientCredentials.clientSecret}
                    </code>
                    <Button data-testid="button-copy-new-client-secret" size="sm" onClick={() => copyToClipboard(clientCredentials.clientSecret, "Client Secret")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  The client secret won't be shown again. Store it securely!
                </p>
              </div>
              <DialogFooter>
                <Button data-testid="button-close-credentials-dialog" onClick={() => {
                  setCreateDialogOpen(false);
                  setClientCredentials(null);
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
                      <FormLabel>Application Name</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-client-name"
                          placeholder="My Application"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-client-description"
                          placeholder="Describe this OAuth2 client's purpose"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="redirectUris"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redirect URIs</FormLabel>
                      <FormControl>
                        <Textarea
                          data-testid="input-redirect-uris"
                          placeholder="https://myapp.com/callback&#10;https://myapp.com/auth/callback"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter one redirect URI per line. These are the allowed callback URLs after authentication.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    data-testid="button-cancel-create-oauth-client"
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-create-oauth-client" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Client"}
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
