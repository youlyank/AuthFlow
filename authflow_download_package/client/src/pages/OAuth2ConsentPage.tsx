import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, X, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: "Verify your identity",
  profile: "Access your profile information (name, avatar)",
  email: "Access your email address",
  offline_access: "Access your data when you're not using the app",
};

export default function OAuth2ConsentPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);

  const request_id = params.get("request_id");

  const { data: authRequest, isLoading } = useQuery<any>({
    queryKey: [`/api/oauth2/auth-request/${request_id}`],
    enabled: !!request_id,
  });

  const scopes = authRequest?.scope?.split(" ").filter(Boolean) || [];

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/oauth2/consent", {
        request_id,
        approved: true,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Redirect to client with authorization code
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Authorization failed",
        description: error.message || "Failed to authorize application",
        variant: "destructive",
      });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/oauth2/consent", {
        request_id,
        approved: false,
      });
      return res.json();
    },
    onSuccess: (data) => {
      // Redirect to client with error
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    },
  });

  // Validate required parameters
  useEffect(() => {
    if (!request_id) {
      toast({
        title: "Invalid request",
        description: "Missing authorization request ID",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [request_id, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!authRequest) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertCircle className="w-12 h-12 mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Invalid Request</h3>
            <p className="text-muted-foreground text-center">
              The authorization request could not be found or has expired
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="max-w-md w-full" data-testid="card-oauth-consent">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate" data-testid="text-client-name">
                {authRequest.clientName}
              </CardTitle>
              <CardDescription className="truncate">
                wants to access your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium">This application will be able to:</p>
            <div className="space-y-2">
              {scopes.map((scopeName: string) => (
                <div key={scopeName} className="flex items-start gap-2" data-testid={`scope-${scopeName}`}>
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{SCOPE_DESCRIPTIONS[scopeName] || scopeName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {authRequest.clientDescription && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground" data-testid="text-client-description">
                {authRequest.clientDescription}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              data-testid="button-deny-consent"
              variant="outline"
              className="flex-1"
              onClick={() => denyMutation.mutate()}
              disabled={denyMutation.isPending}
            >
              <X className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button
              data-testid="button-approve-consent"
              className="flex-1"
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              {approveMutation.isPending ? "Authorizing..." : "Authorize"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By authorizing, you allow this application to access your data according to the permissions shown above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
