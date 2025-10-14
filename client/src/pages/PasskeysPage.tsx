import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Fingerprint, Trash2, Plus, Smartphone } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasskeysPage() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState("");

  // Fetch passkeys
  const { data: passkeys = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/webauthn/credentials"],
  });

  // Register new passkey
  const registerMutation = useMutation({
    mutationFn: async () => {
      setIsRegistering(true);
      try {
        // Start registration
        const options = await apiRequest("/api/webauthn/register/start", "POST", {}) as any;

        // Trigger browser WebAuthn
        const credential = await startRegistration({ optionsJSON: options });

        // Verify registration
        await apiRequest("/api/webauthn/register/verify", "POST", {
          response: credential,
          deviceName: deviceName || "Passkey",
        });

        return true;
      } finally {
        setIsRegistering(false);
        setDeviceName("");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webauthn/credentials"] });
      toast({
        title: "Success",
        description: "Passkey registered successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register passkey",
        variant: "destructive",
      });
    },
  });

  // Delete passkey
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/webauthn/credentials/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webauthn/credentials"] });
      toast({
        title: "Success",
        description: "Passkey deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete passkey",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">Loading passkeys...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="w-6 h-6" />
            Passkeys / Biometric Login
          </CardTitle>
          <CardDescription>
            Manage your passkeys for passwordless authentication using Face ID, Touch ID, or security keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Register New Passkey */}
          <div className="space-y-3">
            <Label htmlFor="device-name">Device Name (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="device-name"
                data-testid="input-device-name"
                placeholder="e.g., MacBook Pro, iPhone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <Button
                data-testid="button-register-passkey"
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending || isRegistering}
              >
                <Plus className="w-4 h-4 mr-2" />
                {isRegistering ? "Registering..." : "Register Passkey"}
              </Button>
            </div>
          </div>

          {/* List of Passkeys */}
          <div className="space-y-3">
            <h3 className="font-medium">Registered Passkeys</h3>
            {passkeys.length === 0 ? (
              <Card className="bg-muted/30">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No passkeys registered yet</p>
                  <p className="text-sm mt-1">Register a passkey to enable passwordless login</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {passkeys.map((passkey: any) => (
                  <Card key={passkey.id} data-testid={`card-passkey-${passkey.id}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Fingerprint className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium" data-testid={`text-passkey-name-${passkey.id}`}>
                            {passkey.deviceName || "Passkey"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Registered {new Date(passkey.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-${passkey.id}`}
                        onClick={() => setDeleteId(passkey.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this passkey? You won't be able to use it for authentication anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-delete"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
