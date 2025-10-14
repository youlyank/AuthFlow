import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, Shield, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsData {
  loginsByDate: { [key: string]: number };
  eventsByType: { [key: string]: number };
  usersByDate: { [key: string]: number };
  totalLogins: number;
  totalSecurityEvents: number;
  totalNewUsers: number;
}

export default function AdvancedAnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/advanced", { period }],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/advanced?period=${period}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  // Transform data for charts
  const loginTrendData = analytics
    ? Object.entries(analytics.loginsByDate)
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          logins: count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const userGrowthData = analytics
    ? Object.entries(analytics.usersByDate)
        .map(([date, count]) => ({
          date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users: count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const securityEventsData = analytics
    ? Object.entries(analytics.eventsByType).map(([type, count]) => ({
        type: type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        count,
      }))
    : [];

  // Calculate cumulative user growth
  const cumulativeUserData = userGrowthData.reduce((acc, curr, idx) => {
    const cumulative = idx === 0 ? curr.users : acc[idx - 1].cumulative + curr.users;
    return [...acc, { ...curr, cumulative }];
  }, [] as any[]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-analytics">
            <BarChart3 className="w-8 h-8" />
            Advanced Analytics
          </h1>
          <p className="text-muted-foreground">Track platform usage and security trends</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
          <SelectTrigger className="w-32" data-testid="select-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card data-testid="card-total-logins">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalLogins || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "Last 90 days"}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-new-users">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalNewUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "Last 90 days"}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-security-events">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Events</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalSecurityEvents || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "Last 90 days"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Tabs */}
          <Tabs defaultValue="logins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="logins" data-testid="tab-logins">
                <Calendar className="mr-2 h-4 w-4" />
                Login Trends
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="mr-2 h-4 w-4" />
                User Growth
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">
                <Shield className="mr-2 h-4 w-4" />
                Security Events
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logins" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Login Activity</CardTitle>
                  <CardDescription>Daily login count over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={loginTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))" 
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="logins" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Logins"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Registration Trends</CardTitle>
                  <CardDescription>Cumulative new user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cumulativeUserData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))" 
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Total Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Events by Type</CardTitle>
                  <CardDescription>Distribution of security events</CardDescription>
                </CardHeader>
                <CardContent>
                  {securityEventsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={securityEventsData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="type" className="text-xs" angle={-45} textAnchor="end" height={100} />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))" 
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--destructive))"
                          name="Events"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No security events in this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
