import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MfaVerifyPage from "@/pages/MfaVerifyPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminTenants from "@/pages/SuperAdminTenants";
import SuperAdminPlans from "@/pages/SuperAdminPlans";
import TenantAdminDashboard from "@/pages/TenantAdminDashboard";
import TenantAdminUsers from "@/pages/TenantAdminUsers";
import TenantAdminSessions from "@/pages/TenantAdminSessions";
import UserDashboard from "@/pages/UserDashboard";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} onLogout={logout} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between h-16 px-6 border-b bg-background">
            <h2 className="text-xl font-semibold">Authflow</h2>
            <div className="flex items-center gap-2">
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/auth/mfa" component={MfaVerifyPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />

      {/* Protected routes */}
      <Route path="/super-admin">
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <DashboardLayout>
            <SuperAdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/super-admin/tenants">
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <DashboardLayout>
            <SuperAdminTenants />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/super-admin/plans">
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <DashboardLayout>
            <SuperAdminPlans />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <TenantAdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/users">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <TenantAdminUsers />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/sessions">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <TenantAdminSessions />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <UserDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Default redirect */}
      <Route path="/">
        <Redirect to="/auth/login" />
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
