import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ThemeToggle } from "@/components/ThemeToggle";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import UniversalLoginPage from "@/pages/UniversalLoginPage";
import UniversalRegisterPage from "@/pages/UniversalRegisterPage";
import MfaVerifyPage from "@/pages/MfaVerifyPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import MagicLinkCallbackPage from "@/pages/MagicLinkCallbackPage";
import AcceptInvitation from "@/pages/AcceptInvitation";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import SuperAdminTenants from "@/pages/SuperAdminTenants";
import SuperAdminPlans from "@/pages/SuperAdminPlans";
import TenantAdminDashboard from "@/pages/TenantAdminDashboard";
import TenantAdminUsers from "@/pages/TenantAdminUsers";
import TenantAdminSessions from "@/pages/TenantAdminSessions";
import TenantAdminSettings from "@/pages/TenantAdminSettings";
import UserDashboard from "@/pages/UserDashboard";
import SecuritySettings from "@/pages/SecuritySettings";
import PasskeysPage from "@/pages/PasskeysPage";
import WebhookManagement from "@/pages/WebhookManagement";
import ApiKeyManagement from "@/pages/ApiKeyManagement";
import OAuth2ConsentPage from "@/pages/OAuth2ConsentPage";
import OAuth2ClientManagement from "@/pages/OAuth2ClientManagement";
import IpRestrictionsPage from "@/pages/IpRestrictionsPage";
import SecurityEventsPage from "@/pages/SecurityEventsPage";
import AdvancedAnalyticsPage from "@/pages/AdvancedAnalyticsPage";
import BrandingCustomizationPage from "@/pages/BrandingCustomizationPage";
import FeaturesDemoPage from "@/pages/FeaturesDemoPage";
import ComparisonPage from "@/pages/ComparisonPage";
import WhyAuthflowPage from "@/pages/WhyAuthflowPage";
import DocsLandingPage from "@/pages/DocsLandingPage";
import QuickstartPage from "@/pages/QuickstartPage";
import SDKDocsPage from "@/pages/SDKDocsPage";
import ArchitecturePage from "@/pages/ArchitecturePage";
import APIReferencePage from "@/pages/APIReferencePage";
import MigrationGuidePage from "@/pages/MigrationGuidePage";

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
    // Redirect based on actual role
    if (user.role === "super_admin") {
      return <Redirect to="/super-admin" />;
    } else if (user.role === "tenant_admin") {
      return <Redirect to="/admin" />;
    }
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

function LandingOrDashboard() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  // Show landing page for non-authenticated users
  if (!user) {
    return <LandingPage />;
  }
  
  // Redirect authenticated users to their dashboard based on role
  if (user.role === "super_admin") {
    return <Redirect to="/super-admin" />;
  } else if (user.role === "tenant_admin") {
    return <Redirect to="/admin" />;
  } else {
    return <Redirect to="/dashboard" />;
  }
}

function Router() {
  return (
    <Switch>
      {/* Auth routes - also alias without /auth prefix */}
      <Route path="/auth/login" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/auth/register" component={RegisterPage} />
      <Route path="/register" component={RegisterPage} />
      
      {/* Universal Login (for tenant white-labeling) */}
      <Route path="/auth/universal-login" component={UniversalLoginPage} />
      <Route path="/auth/universal-register" component={UniversalRegisterPage} />
      
      <Route path="/auth/mfa" component={MfaVerifyPage} />
      <Route path="/auth/forgot-password" component={ForgotPasswordPage} />
      <Route path="/auth/magic-link" component={MagicLinkCallbackPage} />
      <Route path="/invitation/accept" component={AcceptInvitation} />

      {/* Public marketing pages */}
      <Route path="/comparison" component={ComparisonPage} />
      <Route path="/why-authflow" component={WhyAuthflowPage} />

      {/* Documentation pages */}
      <Route path="/docs" component={DocsLandingPage} />
      <Route path="/docs/quickstart" component={QuickstartPage} />
      <Route path="/docs/sdks" component={SDKDocsPage} />
      <Route path="/docs/architecture" component={ArchitecturePage} />
      <Route path="/docs/api" component={APIReferencePage} />
      <Route path="/docs/migration" component={MigrationGuidePage} />

      {/* OAuth2 Consent */}
      <Route path="/oauth2/consent">
        <ProtectedRoute>
          <OAuth2ConsentPage />
        </ProtectedRoute>
      </Route>

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

      <Route path="/super-admin/features-demo">
        <ProtectedRoute allowedRoles={["super_admin"]}>
          <DashboardLayout>
            <FeaturesDemoPage />
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

      <Route path="/admin/settings">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <TenantAdminSettings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/webhooks">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <WebhookManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/api-keys">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <ApiKeyManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/oauth2-clients">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <OAuth2ClientManagement />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/ip-restrictions">
        <ProtectedRoute allowedRoles={["tenant_admin"]}>
          <DashboardLayout>
            <IpRestrictionsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/security-events">
        <ProtectedRoute allowedRoles={["super_admin", "tenant_admin"]}>
          <DashboardLayout>
            <SecurityEventsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/analytics">
        <ProtectedRoute allowedRoles={["super_admin", "tenant_admin"]}>
          <DashboardLayout>
            <AdvancedAnalyticsPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/admin/branding">
        <ProtectedRoute allowedRoles={["super_admin", "tenant_admin"]}>
          <DashboardLayout>
            <BrandingCustomizationPage />
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

      <Route path="/security">
        <ProtectedRoute>
          <DashboardLayout>
            <SecuritySettings />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/passkeys">
        <ProtectedRoute>
          <DashboardLayout>
            <PasskeysPage />
          </DashboardLayout>
        </ProtectedRoute>
      </Route>

      {/* Landing page with smart redirect for authenticated users */}
      <Route path="/">
        <LandingOrDashboard />
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
