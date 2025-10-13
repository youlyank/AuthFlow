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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Webhook, Trash2, RefreshCw, Eye, Copy, CheckCircle, XCircle } from "lucide-react";

const AVAILABLE_EVENTS = [
  { value: "user.created", label: "User Created" },
  { value: "user.updated", label: "User Updated" },
  { value: "user.deleted", label: "User Deleted" },
  { value: "user.login", label: "User Login" },
  { value: "user.logout", label: "User Logout" },
  { value: "user.password_reset", label: "Password Reset" },
  { value: "user.email_verified", label: "Email Verified" },
  { value: "session.created", label: "Session Created" },
  { value: "session.expired", label: "Session Expired" },
  { value: "mfa.enabled", label: "MFA Enabled" },
  { value: "mfa.disabled", label: "MFA Disabled" },
  { value: "subscription.updated", label: "Subscription Updated" },
];

const createWebhookSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
  description: z.string().optional(),
});

type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export default function WebhookManagement() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [deliveriesDialogOpen, setDeliveriesDialogOpen] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

  const form = useForm<CreateWebhookInput>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      url: "",
      events: [],
      description: "",
    },
  });

  const { data: webhooks, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/webhooks"],
  });

  const { data: deliveries } = useQuery<any[]>({
    queryKey: ["/api/admin/webhooks", selectedWebhook?.id, "deliveries"],
    enabled: !!selectedWebhook,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateWebhookInput) => {
      const res = await apiRequest("/api/admin/webhooks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      setWebhookSecret(data.secret);
      toast({
        title: "Webhook created",
        description: "Save the secret - it won't be shown again!",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/webhooks/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/webhooks"] });
      toast({ title: "Webhook deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete webhook",
        variant: "destructive",
      });
    },
  });

  const regenerateSecretMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/webhooks/${id}/regenerate-secret`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      setWebhookSecret(data.secret);
      toast({
        title: "Secret regenerated",
        description: "Save the new secret - it won't be shown again!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to regenerate secret",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateWebhookInput) => {
    createMutation.mutate(data);
  };

  const copySecret = () => {
    if (webhookSecret) {
      navigator.clipboard.writeText(webhookSecret);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">
            Subscribe to events and receive HTTP callbacks
          </p>
        </div>
        <Button data-testid="button-create-webhook" onClick={() => {
          setCreateDialogOpen(true);
          setWebhookSecret(null);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : webhooks && webhooks.length > 0 ? (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} data-testid={`card-webhook-${webhook.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{webhook.url}</CardTitle>
                  <CardDescription className="truncate">
                    {webhook.description || "No description"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    data-testid={`button-view-deliveries-${webhook.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWebhook(webhook);
                      setDeliveriesDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Deliveries
                  </Button>
                  <Button
                    data-testid={`button-regenerate-secret-${webhook.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateSecretMutation.mutate(webhook.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate Secret
                  </Button>
                  <Button
                    data-testid={`button-delete-webhook-${webhook.id}`}
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map((event: string) => (
                    <Badge key={event} variant="secondary" data-testid={`badge-event-${event}`}>
                      {event}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Webhook className="w-12 h-12 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first webhook to start receiving event notifications
            </p>
            <Button data-testid="button-create-first-webhook" onClick={() => {
              setCreateDialogOpen(true);
              setWebhookSecret(null);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => {
        setCreateDialogOpen(open);
        if (!open) {
          form.reset();
          setWebhookSecret(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook endpoint to receive HTTP callbacks for events
            </DialogDescription>
          </DialogHeader>

          {webhookSecret ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Webhook Secret (Save this!)</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded border text-sm break-all" data-testid="text-webhook-secret">
                    {webhookSecret}
                  </code>
                  <Button data-testid="button-copy-secret" size="sm" onClick={copySecret}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use this secret to verify webhook signatures with HMAC SHA256
                </p>
              </div>
              <DialogFooter>
                <Button data-testid="button-close-secret-dialog" onClick={() => {
                  setCreateDialogOpen(false);
                  setWebhookSecret(null);
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
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-webhook-url"
                          placeholder="https://api.example.com/webhooks"
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
                          data-testid="input-webhook-description"
                          placeholder="Describe this webhook's purpose"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="events"
                  render={() => (
                    <FormItem>
                      <FormLabel>Events to Subscribe</FormLabel>
                      <FormDescription>
                        Select which events should trigger this webhook
                      </FormDescription>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {AVAILABLE_EVENTS.map((event) => (
                          <FormField
                            key={event.value}
                            control={form.control}
                            name="events"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    data-testid={`checkbox-event-${event.value}`}
                                    checked={field.value?.includes(event.value)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      field.onChange(
                                        checked
                                          ? [...current, event.value]
                                          : current.filter((v) => v !== event.value)
                                      );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {event.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    data-testid="button-cancel-create-webhook"
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button data-testid="button-submit-create-webhook" type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Webhook"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog open={deliveriesDialogOpen} onOpenChange={setDeliveriesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhook Deliveries</DialogTitle>
            <DialogDescription className="truncate">
              {selectedWebhook?.url}
            </DialogDescription>
          </DialogHeader>

          {deliveries && deliveries.length > 0 ? (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <Card key={delivery.id} data-testid={`card-delivery-${delivery.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {delivery.status === "success" ? (
                          <CheckCircle className="w-4 h-4 text-green-600" data-testid={`icon-success-${delivery.id}`} />
                        ) : delivery.status === "failed" ? (
                          <XCircle className="w-4 h-4 text-red-600" data-testid={`icon-failed-${delivery.id}`} />
                        ) : (
                          <RefreshCw className="w-4 h-4 text-yellow-600" data-testid={`icon-pending-${delivery.id}`} />
                        )}
                        <span className="font-medium" data-testid={`text-delivery-event-${delivery.id}`}>{delivery.event}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span data-testid={`text-delivery-status-${delivery.id}`}>
                          {delivery.status} (Attempt {delivery.attempts})
                        </span>
                        {delivery.responseStatus && (
                          <Badge variant="outline" data-testid={`badge-status-${delivery.id}`}>
                            {delivery.responseStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {delivery.responseBody && (
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-response-${delivery.id}`}>
                        {delivery.responseBody}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-deliveries">
              No deliveries yet
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
