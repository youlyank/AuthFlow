import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Activity, Key, Bell, Webhook } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TenantStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  activeSessions: number;
  mfaAdoption: number;
}

interface RecentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  lastLoginAt?: string;
}

export default function TenantAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<TenantStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: recentUsers = [], isLoading: usersLoading } = useQuery<RecentUser[]>({
    queryKey: ["/api/admin/users/recent"],
  });

  // Mock chart data
  const userGrowth = [
    { month: "Jan", users: 120 },
    { month: "Feb", users: 145 },
    { month: "Mar", users: 180 },
    { month: "Apr", users: 230 },
    { month: "May", users: 290 },
    { month: "Jun", users: 350 },
  ];

  const authActivity = [
    { day: "Mon", logins: 125, failures: 8 },
    { day: "Tue", logins: 142, failures: 12 },
    { day: "Wed", logins: 138, failures: 6 },
    { day: "Thu", logins: 156, failures: 9 },
    { day: "Fri", logins: 149, failures: 7 },
    { day: "Sat", logins: 98, failures: 4 },
    { day: "Sun", logins: 87, failures: 3 },
  ];

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your tenant users and settings</p>
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
          Tenant Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">User management and authentication metrics</p>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.activeUsers || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Sessions</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Live connections
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">MFA Adoption</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Shield className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.mfaAdoption || 0}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              Users with MFA enabled
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Roles</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Key className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalRoles || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Permission groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly active user trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="users" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#users)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Auth Activity */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Authentication Activity</CardTitle>
            <CardDescription>Login success vs failures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={authActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="logins" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Successful</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest users who joined your tenant</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
