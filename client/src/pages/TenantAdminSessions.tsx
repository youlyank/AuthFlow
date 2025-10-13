import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Monitor, Smartphone, Tablet, XCircle, MapPin, Clock } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string | null;
  userLastName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  deviceInfo: any;
  lastActivityAt: string;
  createdAt: string;
  isActive: boolean;
}

export default function TenantAdminSessions() {
  const { toast } = useToast();

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["/api/tenant-admin/sessions"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/tenant-admin/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to revoke session");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant-admin/sessions"] });
      toast({
        title: "Success",
        description: "Session revoked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke session",
        variant: "destructive",
      });
    },
  });

  const handleRevokeSession = (sessionId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to revoke this session for ${userEmail}? The user will be logged out immediately.`)) {
      revokeSessionMutation.mutate(sessionId);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return <Tablet className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Device";
    
    const ua = userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    // Detect browser
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    return `${browser} on ${os}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Sessions</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage all active user sessions</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {sessions.length} Active {sessions.length === 1 ? "Session" : "Sessions"}
        </Badge>
      </div>

      <Alert>
        <Monitor className="h-4 w-4" />
        <AlertDescription>
          Sessions are automatically updated every 30 seconds. You can revoke any session to immediately log out that user.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Session Activity</CardTitle>
          <CardDescription>Real-time view of all active sessions in your tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
              <p className="text-muted-foreground">There are currently no active user sessions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {session.userFirstName || session.userLastName
                            ? `${session.userFirstName || ""} ${session.userLastName || ""}`.trim()
                            : session.userEmail}
                        </div>
                        <div className="text-sm text-muted-foreground">{session.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.userAgent)}
                        <span className="text-sm">{getDeviceInfo(session.userAgent)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {session.ipAddress || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatDistanceToNow(new Date(session.lastActivityAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id, session.userEmail)}
                        data-testid={`button-revoke-${session.id}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
