import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";

export default function MagicLinkCallbackPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: async (token: string) => {
      return apiRequest("POST", "/api/auth/magic-link/verify", { token }) as Promise<any>;
    },
    onSuccess: (data: any) => {
      queryClient.setQueryData(["/api/auth/me"], { user: data.user });
      setLocation("/");
    },
    onError: () => {
      setLocation("/auth/login?error=invalid_magic_link");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      verifyMutation.mutate(token);
    } else {
      setLocation("/auth/login?error=missing_token");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <Logo className="mx-auto" />
        <div className="space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Verifying your magic link...</p>
          <p className="text-sm text-muted-foreground">Please wait while we sign you in</p>
        </div>
      </div>
    </div>
  );
}
