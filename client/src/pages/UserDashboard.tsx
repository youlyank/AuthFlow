import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, CheckCircle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface UserStats {
  totalSessions: number;
  activeSessions: number;
  mfaEnabled: boolean;
  lastLoginAt?: string;
}

interface LoginRecord {
  id: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  success: boolean;
  createdAt: string;
}

export default function UserDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: loginHistory = [], isLoading: historyLoading } = useQuery<LoginRecord[]>({
    queryKey: ["/api/user/login-history"],
  });

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-dashboard">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Welcome back</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Sessions"
          value={stats?.activeSessions || 0}
          icon={Activity}
          description={`${stats?.totalSessions || 0} total`}
        />
        <StatsCard
          title="Security"
          value={stats?.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
          icon={Shield}
        />
        <StatsCard
          title="Last Login"
          value={
            stats?.lastLoginAt
              ? formatDistanceToNow(new Date(stats.lastLoginAt), { addSuffix: true })
              : "Never"
          }
          icon={Clock}
        />
        <StatsCard
          title="Account Status"
          value="Active"
          icon={CheckCircle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent login attempts to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {loginHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`login-record-${record.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{record.location}</p>
                      <Badge variant={record.success ? "default" : "destructive"}>
                        {record.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {record.ipAddress} • {record.userAgent}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
