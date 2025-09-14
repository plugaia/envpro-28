import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import ProposalView from "./pages/ProposalView";
import Configuracoes from "./pages/Configuracoes";
import Clientes from "./pages/Clientes";
import Relatorios from "./pages/Relatorios";
import Templates from "./pages/Templates";
import TemplateDesigner from "./pages/TemplateDesigner";
import NotFound from "./pages/NotFound";
import TeamInvitation from "./pages/TeamInvitation";
import { useState, useEffect } from "react";
import { ProposalForm } from "@/components/ProposalForm";

const queryClient = new QueryClient();

// Component to handle conditional routing based on auth state
const AppRoutes = () => {
  const { user, loading } = useAuth();
  const [showProposalForm, setShowProposalForm] = useState(false);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">Carregando...</div>
    </div>;
  }

  const handleNewProposal = () => {
    setShowProposalForm(true);
  };

  const handleSubmitProposal = () => {
    setShowProposalForm(false);
    // A página Index agora tem sua própria lógica de atualização
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/convite/:token" element={<TeamInvitation />} />
        <Route path="/proposta/:proposalId" element={<ProposalView />} />
        <Route path="/" element={
          user ? (
            <ProtectedRoute>
              <Layout onNewProposal={() => {
                // A lógica de abrir o formulário agora está na página Index
                // Este é um placeholder, a lógica real está em Index.tsx
                const event = new CustomEvent('openProposalForm');
                window.dispatchEvent(event);
              }}>
                <Index />
              </Layout>
            </ProtectedRoute>
          ) : (
            <Landing />
          )
        } />
        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <Layout onNewProposal={() => {
              const event = new CustomEvent('openProposalForm');
              window.dispatchEvent(event);
            }}>
              <Configuracoes />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/clientes" element={
          <ProtectedRoute>
            <Layout onNewProposal={() => {
              const event = new CustomEvent('openProposalForm');
              window.dispatchEvent(event);
            }}>
              <Clientes />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/relatorios" element={
          <ProtectedRoute>
            <Layout onNewProposal={() => {
              const event = new CustomEvent('openProposalForm');
              window.dispatchEvent(event);
            }}>
              <Relatorios />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/templates" element={
          <ProtectedRoute>
            <Layout onNewProposal={() => {
              const event = new CustomEvent('openProposalForm');
              window.dispatchEvent(event);
            }}>
              <Templates />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/templates/:templateId/design" element={<TemplateDesigner />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  const [showProposalForm, setShowProposalForm] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowProposalForm(true);
    window.addEventListener('openProposalForm', handleOpen);
    return () => window.removeEventListener('openProposalForm', handleOpen);
  }, []);

  const handleSubmit = () => {
    setShowProposalForm(false);
    // Dispara um evento para a página Index recarregar os dados
    window.dispatchEvent(new CustomEvent('proposalSubmitted'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
          {showProposalForm && (
            <ProposalForm
              onClose={() => setShowProposalForm(false)}
              onSubmit={handleSubmit}
            />
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;