import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Shield, ShieldCheck, Smartphone, Mail, Trash2, Monitor, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface TrustedDevice {
  id: string;
  deviceName: string;
  lastSeenAt: Date | null;
  createdAt: Date;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDisableMfaDialog, setShowDisableMfaDialog] = useState(false);
  const [showEmailOtpDialog, setShowEmailOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);

  const disableMfaForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  });

  // Fetch trusted devices
  const { data: trustedDevices = [], isLoading: devicesLoading } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/user/trusted-devices"],
    enabled: user?.mfaEnabled && user?.mfaMethod === "email",
    retry: false,
  });

  // Enable Email OTP mutation
  const enableEmailOtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/mfa/email/enable");
    },
    onSuccess: () => {
      setShowEmailOtpDialog(true);
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to enable Email OTP",
      });
    },
  });

  // Verify Email OTP mutation
  const verifyEmailOtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/user/mfa/email/verify", { 
        code: otpCode, 
        rememberDevice 
      });
    },
    onSuccess: () => {
      setShowEmailOtpDialog(false);
      setOtpCode("");
      setRememberDevice(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/trusted-devices"] });
      toast({
        title: "Email OTP Enabled",
        description: "Multi-factor authentication is now active",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid code",
      });
    },
  });

  // Disable MFA mutation
  const disableMfaMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const endpoint = user?.mfaMethod === "totp" 
        ? "/api/user/mfa/totp/disable"
        : "/api/user/mfa/email/disable";
      
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      setShowDisableMfaDialog(false);
      disableMfaForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/trusted-devices"] });
      toast({
        title: "MFA Disabled",
        description: "Multi-factor authentication has been disabled",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to disable MFA",
      });
    },
  });

  // Remove trusted device mutation
  const removeTrustedDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiRequest("DELETE", `/api/user/trusted-devices/${deviceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/trusted-devices"] });
      toast({
        title: "Device Removed",
        description: "Trusted device has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove device",
      });
    },
  });

  const handleEnableEmailOtp = () => {
    enableEmailOtpMutation.mutate();
  };

  const handleVerifyEmailOtp = () => {
    if (!otpCode) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code",
      });
      return;
    }
    verifyEmailOtpMutation.mutate();
  };

  const handleDisableMfa = (data: PasswordFormValues) => {
    disableMfaMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-security">
          <Shield className="w-8 h-8" />
          Security Settings
        </h1>
        <p className="text-muted-foreground">Manage your account security and authentication methods</p>
      </div>

      <div className="space-y-6">
        {/* MFA Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Multi-Factor Authentication
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Status</Label>
                <div className="flex items-center gap-2">
                  {user?.mfaEnabled ? (
                    <>
                      <Badge variant="default" className="bg-green-600" data-testid="badge-mfa-enabled">
                        Enabled
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {user.mfaMethod === "totp" && "Using Authenticator App"}
                        {user.mfaMethod === "email" && "Using Email OTP"}
                      </span>
                    </>
                  ) : (
                    <Badge variant="secondary" data-testid="badge-mfa-disabled">
                      Disabled
                    </Badge>
                  )}
                </div>
              </div>
              {user?.mfaEnabled ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableMfaDialog(true)}
                  data-testid="button-disable-mfa"
                >
                  Disable MFA
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEnableEmailOtp}
                    disabled={enableEmailOtpMutation.isPending}
                    data-testid="button-enable-email-otp"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email OTP
                  </Button>
                  <Button
                    variant="outline"
                    disabled
                    data-testid="button-enable-totp"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Authenticator App
                  </Button>
                </div>
              )}
            </div>

            {user?.mfaEnabled && user.mfaMethod === "email" && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Trusted Devices ({trustedDevices.length})
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These devices won't require OTP verification. Trusted devices expire after 30 days of inactivity.
                  </p>
                  {devicesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading devices...</div>
                  ) : trustedDevices.length > 0 ? (
                    <div className="space-y-2">
                      {trustedDevices.map((device) => (
                        <div
                          key={device.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                          data-testid={`device-${device.id}`}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{device.deviceName}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last seen: {device.lastSeenAt 
                                  ? formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })
                                  : "Never"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTrustedDeviceMutation.mutate(device.id)}
                            disabled={removeTrustedDeviceMutation.isPending}
                            data-testid={`button-remove-device-${device.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trusted devices yet</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional Security Features */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Security</CardTitle>
            <CardDescription>
              More authentication methods for enhanced security
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>WebAuthn/FIDO2</Label>
                  <p className="text-sm text-muted-foreground">Passwordless authentication with security keys</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Magic Links</Label>
                  <p className="text-sm text-muted-foreground">Passwordless login via email link (API: POST /api/auth/magic-link/request)</p>
                </div>
                <Badge variant="default">Available</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email OTP Verification Dialog */}
      <Dialog open={showEmailOtpDialog} onOpenChange={setShowEmailOtpDialog}>
        <DialogContent data-testid="dialog-verify-email-otp">
          <DialogHeader>
            <DialogTitle>Verify Email OTP</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to your email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification Code</Label>
              <Input
                id="otp-code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                data-testid="input-otp-code"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="remember-device"
                checked={rememberDevice}
                onCheckedChange={setRememberDevice}
                data-testid="switch-remember-device"
              />
              <Label htmlFor="remember-device" className="text-sm">
                Trust this device for 30 days
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailOtpDialog(false)}
              data-testid="button-cancel-verify"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyEmailOtp}
              disabled={verifyEmailOtpMutation.isPending}
              data-testid="button-submit-verify"
            >
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableMfaDialog} onOpenChange={setShowDisableMfaDialog}>
        <DialogContent data-testid="dialog-disable-mfa">
          <DialogHeader>
            <DialogTitle>Disable Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling MFA. This will also remove all trusted devices.
            </DialogDescription>
          </DialogHeader>
          <Form {...disableMfaForm}>
            <form onSubmit={disableMfaForm.handleSubmit(handleDisableMfa)} className="space-y-4">
              <FormField
                control={disableMfaForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        data-testid="input-disable-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDisableMfaDialog(false)}
                  data-testid="button-cancel-disable"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={disableMfaMutation.isPending}
                  data-testid="button-confirm-disable"
                >
                  Disable MFA
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
