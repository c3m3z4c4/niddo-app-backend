import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import { ADMIN_ROLES } from "@/types";

// Pages
import Login from "./pages/Login";
import VecinoHome from "./pages/vecino/Home";
import VecinoCalendar from "./pages/vecino/Calendar";
import VecinoMeetings from "./pages/vecino/Meetings";
import VecinoEvents from "./pages/vecino/Events";
import VecinoProfile from "./pages/vecino/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMeetings from "./pages/admin/Meetings";
import AdminEvents from "./pages/admin/Events";
import AdminHouses from "./pages/admin/Houses";
import AdminUsers from "./pages/admin/Users";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Landing />;
  if (user && ADMIN_ROLES.includes(user.role)) return <Navigate to="/admin" replace />;
  return <VecinoHome />;
}

function AppRoutes() {
  return (
    <BrandingProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Resident Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/calendario" element={<ProtectedRoute allowedRoles={['RESIDENT']}><VecinoCalendar /></ProtectedRoute>} />
          <Route path="/reuniones" element={<ProtectedRoute allowedRoles={['RESIDENT']}><VecinoMeetings /></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute allowedRoles={['RESIDENT']}><VecinoEvents /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute allowedRoles={['RESIDENT']}><VecinoProfile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reuniones" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminMeetings /></ProtectedRoute>} />
          <Route path="/admin/eventos" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminEvents /></ProtectedRoute>} />
          <Route path="/admin/casas" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminHouses /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminUsers /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </BrandingProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
