import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import ProposalView from "./pages/ProposalView";
import Configuracoes from "./pages/Configuracoes";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import NotFound from "./pages/NotFound";
import TeamInvitation from "./pages/TeamInvitation";

const queryClient = new QueryClient();

// Component to handle conditional routing based on auth state
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">Carregando...</div>
    </div>;
  }

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/convite/:token" element={<TeamInvitation />} />
      <Route path="/proposta/:proposalId" element={<ProposalView />} />
      <Route path="/" element={
        user ? (
          <ProtectedRoute>
            <Layout>
              <Index />
            </Layout>
          </ProtectedRoute>
        ) : (
          <Landing />
        )
      } />
      <Route path="/configuracoes" element={
        <ProtectedRoute>
          <Layout>
            <Configuracoes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/clientes" element={
        <ProtectedRoute>
          <Layout>
            <Clientes />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/relatorios" element={
        <ProtectedRoute>
          <Layout>
            <Relatorios />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
