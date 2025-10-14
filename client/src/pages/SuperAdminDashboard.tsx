import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CreditCard, TrendingUp, Activity, Shield, Globe, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyActiveUsers: number;
  revenueGrowth: number;
}

interface Tenant {
  id: string;
  name: string;
  plan: string;
  users: number;
  status: "active" | "inactive";
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/super-admin/stats"],
  });

  const { data: recentTenants = [], isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/super-admin/tenants/recent"],
  });

  // Mock chart data for demonstration
  const revenueData = [
    { month: "Jan", revenue: 12000, users: 1200 },
    { month: "Feb", revenue: 15000, users: 1400 },
    { month: "Mar", revenue: 18000, users: 1650 },
    { month: "Apr", revenue: 22000, users: 1900 },
    { month: "May", revenue: 28000, users: 2200 },
    { month: "Jun", revenue: 35000, users: 2650 },
  ];

  const tenantDistribution = [
    { name: "Starter", value: 45, color: "#3b82f6" },
    { name: "Pro", value: 35, color: "#8b5cf6" },
    { name: "Enterprise", value: 20, color: "#10b981" },
  ];

  const activityData = [
    { time: "00:00", logins: 45, signups: 12 },
    { time: "04:00", logins: 32, signups: 8 },
    { time: "08:00", logins: 89, signups: 25 },
    { time: "12:00", logins: 145, signups: 42 },
    { time: "16:00", logins: 178, signups: 58 },
    { time: "20:00", logins: 98, signups: 28 },
  ];

  if (statsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Platform-wide analytics and management</p>
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
          Super Admin Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">Platform-wide analytics and management</p>
      </div>

      {/* Modern Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalTenants || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">+12.5%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Active</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.monthlyActiveUsers || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">+8.3%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card hover-lift">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${((stats?.totalRevenue || 0) / 100).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">
                +{stats?.revenueGrowth || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Revenue & Growth</CardTitle>
            <CardDescription>Monthly revenue and user acquisition trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tenant Distribution */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Tenant Distribution</CardTitle>
            <CardDescription>By subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tenantDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tenantDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {tenantDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Real-time Activity</CardTitle>
          <CardDescription>Login and signup activity over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="logins" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="signups" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm">Logins</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">Signups</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tenants Table */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
          <CardDescription>Latest registered tenants on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : recentTenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTenants.map((tenant) => (
                  <TableRow key={tenant.id} data-testid={`tenant-row-${tenant.id}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{tenant.plan}</Badge>
                    </TableCell>
                    <TableCell>{tenant.users}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tenants yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
