import { useState, useMemo } from "react";
import { type Proposal } from "@/components/ProposalCard";
import { ProposalFilters, type FilterOptions } from "@/components/ProposalFilters";
import { ProposalList } from "@/components/ProposalList";
import { ProposalEditModal } from "@/components/ProposalEditModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useFetchProposals, useDeleteProposal } from "@/hooks/useProposals";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [deletingProposal, setDeletingProposal] = useState<Proposal | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: [],
    receiverType: [],
    dateFrom: undefined,
    dateTo: undefined,
    minValue: undefined,
    maxValue: undefined,
  });

  const { data: proposals = [], isLoading: loading, refetch } = useFetchProposals();
  const deleteProposalMutation = useDeleteProposal();

  const handleSubmitProposal = async () => {
    await refetch();
    if (user) {
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            user_id: user.id,
            title: 'Nova Proposta Criada',
            message: 'Uma nova proposta foi criada com sucesso.',
            type: 'proposal'
          }
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  };

  const handleSendEmail = async (proposal: Proposal) => {
    if (!proposal.canViewClientDetails) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem enviar emails com dados de contato dos clientes.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('send-proposal-email', {
        body: { proposalId: proposal.id, recipientEmail: proposal.clientEmail }
      });
      if (error) throw error;
      toast({ title: "Email enviado!", description: `Proposta enviada para ${proposal.clientEmail}` });
    } catch (error) {
      toast({ title: "Erro ao enviar email", description: "Não foi possível enviar o email.", variant: "destructive" });
    }
  };

  const handleSendWhatsApp = async (proposal: Proposal) => {
    if (!proposal.canViewClientDetails) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem enviar mensagens com dados de contato.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { data: tokenData, error } = await supabase.rpc('create_proposal_access_token', { p_proposal_id: proposal.id });
      if (error) throw error;
      const proposalUrl = `${window.location.origin}/proposta/${proposal.id}?token=${tokenData}`;
      const message = encodeURIComponent(`Olá ${proposal.clientName}! Temos uma proposta para você. Veja os detalhes em: ${proposalUrl}`);
      const phoneNumber = proposal.clientPhone?.replace(/[^\d]/g, '') || "";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível gerar o link seguro.", variant: "destructive" });
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    window.open(`/proposta/${proposal.id}`, '_blank');
  };

  const handleEditProposal = (proposal: Proposal) => setEditingProposal(proposal);
  const handleDeleteProposal = (proposal: Proposal) => setDeletingProposal(proposal);

  const confirmDeleteProposal = async () => {
    if (!deletingProposal) return;
    deleteProposalMutation.mutate(deletingProposal.id);
    setDeletingProposal(null);
  };

  const handleUpdateProposal = async () => {
    await refetch();
    setEditingProposal(null);
  };

  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!`${proposal.clientName} ${proposal.clientEmail} ${proposal.processNumber} ${proposal.organizationName}`.toLowerCase().includes(searchLower)) return false;
      }
      if (filters.status.length > 0 && !filters.status.includes(proposal.status)) return false;
      if (filters.receiverType.length > 0 && !filters.receiverType.includes(proposal.receiverType)) return false;
      if (filters.dateFrom && proposal.createdAt < filters.dateFrom) return false;
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (proposal.createdAt > endOfDay) return false;
      }
      if (filters.minValue && proposal.proposalValue < filters.minValue) return false;
      if (filters.maxValue && proposal.proposalValue > filters.maxValue) return false;
      return true;
    });
  }, [proposals, filters]);

  return (
    <div className="space-y-6 h-full">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Propostas Jurídicas</h2>
        <p className="text-base text-muted-foreground">Gerencie e envie suas propostas para clientes.</p>
      </div>
      <div className="space-y-6">
        <ProposalFilters filters={filters} onFiltersChange={setFilters} totalCount={proposals.length} filteredCount={filteredProposals.length} />
        {loading ? (
          <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <ProposalList proposals={filteredProposals} onSendEmail={handleSendEmail} onSendWhatsApp={handleSendWhatsApp} onView={handleViewProposal} onEdit={handleEditProposal} onDelete={handleDeleteProposal} />
        )}
      </div>
      {editingProposal && <ProposalEditModal proposal={editingProposal} isOpen={!!editingProposal} onClose={() => setEditingProposal(null)} onUpdate={handleUpdateProposal} />}
      <DeleteConfirmDialog isOpen={!!deletingProposal} onClose={() => setDeletingProposal(null)} onConfirm={confirmDeleteProposal} title="Excluir Proposta" description={deletingProposal ? `Tem certeza que deseja excluir a proposta de ${deletingProposal.clientName}?` : ""} loading={deleteProposalMutation.isPending} />
    </div>
  );
};

export default Index;