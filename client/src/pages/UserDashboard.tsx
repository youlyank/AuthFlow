import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Clock, CheckCircle, Activity, Key, Smartphone, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard">
          Welcome Back
        </h1>
        <p className="text-lg text-muted-foreground">Your account overview and recent activity</p>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.totalSessions || 0} total
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security</CardTitle>
              <div className={`p-2 rounded-lg ${stats?.mfaEnabled ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <Shield className={`h-5 w-5 ${stats?.mfaEnabled ? 'text-green-500' : 'text-yellow-500'}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.mfaEnabled ? "Protected" : "Basic"}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.mfaEnabled ? "MFA enabled" : "MFA disabled"}
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Login</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastLoginAt
                ? formatDistanceToNow(new Date(stats.lastLoginAt), { addSuffix: true })
                : "Never"}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-sm text-muted-foreground mt-2">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage MFA, passkeys, and trusted devices</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/security">
              <Button className="w-full gap-2">
                <Shield className="h-4 w-4" />
                Configure Security
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="p-3 rounded-lg bg-blue-500/10 w-fit mb-2">
              <Key className="h-6 w-6 text-blue-500" />
            </div>
            <CardTitle>Passkeys</CardTitle>
            <CardDescription>Manage biometric authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/passkeys">
              <Button variant="outline" className="w-full gap-2">
                <Key className="h-4 w-4" />
                Manage Passkeys
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader>
            <div className="p-3 rounded-lg bg-green-500/10 w-fit mb-2">
              <Bell className="h-6 w-6 text-green-500" />
            </div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Configure alerts and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full gap-2">
              <Bell className="h-4 w-4" />
              View Notifications
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Login History */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent authentication attempts to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : loginHistory.length > 0 ? (
            <div className="space-y-3">
              {loginHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                  data-testid={`login-record-${record.id}`}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{record.location || "Unknown Location"}</p>
                      <Badge variant={record.success ? "default" : "destructive"} className="text-xs">
                        {record.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {record.ipAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Smartphone className="h-3 w-3" />
                        {record.userAgent}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No login history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {!stats?.mfaEnabled && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Shield className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="flex-1">
                <CardTitle>Enhance Your Security</CardTitle>
                <CardDescription className="mt-2">
                  Enable multi-factor authentication to add an extra layer of security to your account
                </CardDescription>
              </div>
              <Link href="/security">
                <Button className="gap-2">
                  Enable MFA
                  <Shield className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
