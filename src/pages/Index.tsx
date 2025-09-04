import { useState, useMemo, useEffect } from "react";
import { type Proposal } from "@/components/ProposalCard";
import { ProposalFilters, type FilterOptions } from "@/components/ProposalFilters";
import { ProposalList } from "@/components/ProposalList";
import { ProposalEditModal } from "@/components/ProposalEditModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch proposals on component mount and when user changes
  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  const fetchProposals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Use the secure function that applies role-based field access
      const { data, error } = await supabase
        .rpc('get_user_proposals');

      if (error) throw error;

      // Transform data to match Proposal interface
      const transformedProposals: Proposal[] = data.map((proposal: any) => ({
        id: proposal.id,
        clientName: proposal.client_name,
        clientEmail: proposal.client_email, // Will be masked for non-admins
        clientPhone: proposal.client_phone, // Will be masked for non-admins
        processNumber: proposal.process_number,
        organizationName: proposal.organization_name,
        cedibleValue: parseFloat(proposal.cedible_value.toString()),
        proposalValue: parseFloat(proposal.proposal_value.toString()),
        receiverType: proposal.receiver_type as "advogado" | "autor" | "precatorio",
        status: proposal.status as "pendente" | "aprovada" | "rejeitada",
        createdAt: new Date(proposal.created_at),
        updatedAt: new Date(proposal.updated_at),
        assignee: "Sistema", // TODO: Get from created_by relation
        canViewClientDetails: proposal.can_view_client_details, // New field for UI control
      }));

      setProposals(transformedProposals);
      
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast({
        title: "Erro ao carregar propostas",
        description: "Não foi possível carregar as propostas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = async () => {
    // Refresh proposals list after creating a new one
    await fetchProposals();
    
    // Create notification for new proposal
    if (user) {
      try {
        const { error } = await supabase.functions.invoke('create-notification', {
          body: {
            user_id: user.id,
            title: 'Nova Proposta Criada',
            message: 'Uma nova proposta foi criada com sucesso.',
            type: 'proposal'
          }
        });

        if (error) {
          console.error('Error creating notification:', error);
        }
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  };

  const handleSendEmail = async (proposal: Proposal) => {
    // Check if user can view client details before sending email
    if (!proposal.canViewClientDetails) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem enviar emails com dados de contato dos clientes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-proposal-email', {
        body: { 
          proposalId: proposal.id,
          recipientEmail: proposal.clientEmail
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Email enviado!",
        description: `Proposta enviada para ${proposal.clientEmail}`,
      });

      // Log audit event
      try {
        await supabase.rpc('create_audit_log', {
          p_action_type: 'EMAIL_SENT',
          p_table_name: 'proposals',
          p_record_id: proposal.id,
          p_new_data: { recipient_email: proposal.clientEmail, action: 'email_sent' }
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSendWhatsApp = async (proposal: Proposal) => {
    // Check if user can view client details before sending WhatsApp
    if (!proposal.canViewClientDetails) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem enviar mensagens com dados de contato dos clientes.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Proposal object:', proposal);
      console.log('Client phone:', proposal.clientPhone);
      
      // Generate secure access token
      const { data: tokenData, error } = await supabase
        .rpc('create_proposal_access_token', { p_proposal_id: proposal.id });
      
      if (error) throw error;
      
      const proposalUrl = `${window.location.origin}/proposta/${proposal.id}?token=${tokenData}`;
      
      // Create WhatsApp message with proposal link using client's WhatsApp number
      const message = encodeURIComponent(
        `Olá ${proposal.clientName}! 

Temos uma proposta de antecipação de crédito judicial de *R$ ${proposal.proposalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}* para seu processo.

Para visualizar os detalhes e aceitar a proposta, clique no link:
${proposalUrl}

Equipe EnvPRO 📋⚖️`
      );
      
      // Use client's phone number for WhatsApp
      const phoneNumber = proposal.clientPhone?.replace(/[^\d]/g, '') || "";
      console.log('Formatted phone number:', phoneNumber);
      
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${message}`
        : `https://wa.me/?text=${message}`;
      
      console.log('WhatsApp URL:', whatsappUrl);
      
      window.open(whatsappUrl, '_blank');

      toast({
        title: "WhatsApp aberto", 
        description: phoneNumber 
          ? `Conversa iniciada com ${proposal.clientName}`
          : `Mensagem preparada para ${proposal.clientName}`,
      });

      // Log audit event
      try {
        await supabase.rpc('create_audit_log', {
          p_action_type: 'WHATSAPP_SENT',
          p_table_name: 'proposals', 
          p_record_id: proposal.id,
          p_new_data: { phone_number: phoneNumber, action: 'whatsapp_sent' }
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
    } catch (error) {
      console.error('Error generating WhatsApp link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link seguro.",
        variant: "destructive",
      });
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    // Open proposal view in new tab
    window.open(`/proposta/${proposal.id}`, '_blank');
  };

  const handleEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
  };

  const handleDeleteProposal = (proposal: Proposal) => {
    setDeletingProposal(proposal);
  };

  const confirmDeleteProposal = async () => {
    if (!deletingProposal) return;

    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', deletingProposal.id);

      if (error) throw error;

      toast({
        title: "Proposta excluída!",
        description: `A proposta de ${deletingProposal.clientName} foi removida com sucesso.`,
      });

      // Create notification for deleted proposal
      if (user) {
        try {
          await supabase.functions.invoke('create-notification', {
            body: {
              user_id: user.id,
              title: 'Proposta Excluída',
              message: `A proposta de ${deletingProposal.clientName} foi excluída.`,
              type: 'proposal',
              data: { client_name: deletingProposal.clientName }
            }
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      // Refresh proposals list
      fetchProposals();
      setDeletingProposal(null);
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a proposta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProposal = async () => {
    // Refresh proposals list after update
    await fetchProposals();
    setEditingProposal(null);
    
    // Create notification for updated proposal
    if (user && editingProposal) {
      try {
        await supabase.functions.invoke('create-notification', {
          body: {
            user_id: user.id,
            title: 'Proposta Atualizada',
            message: `A proposta de ${editingProposal.clientName} foi atualizada com sucesso.`,
            type: 'proposal',
            data: { 
              proposal_id: editingProposal.id,
              client_name: editingProposal.clientName 
            }
          }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }
  };

  // Filter proposals based on active filters
  const filteredProposals = useMemo(() => {
    return proposals.filter((proposal) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          proposal.clientName.toLowerCase().includes(searchLower) ||
          proposal.clientEmail.toLowerCase().includes(searchLower) ||
          (proposal.processNumber && proposal.processNumber.toLowerCase().includes(searchLower)) ||
          (proposal.organizationName && proposal.organizationName.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(proposal.status)) {
        return false;
      }

      // Receiver type filter
      if (filters.receiverType.length > 0 && !filters.receiverType.includes(proposal.receiverType)) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && proposal.createdAt < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (proposal.createdAt > endOfDay) {
          return false;
        }
      }

      // Value range filter
      if (filters.minValue && proposal.proposalValue < filters.minValue) {
        return false;
      }
      if (filters.maxValue && proposal.proposalValue > filters.maxValue) {
        return false;
      }

      return true;
    });
  }, [proposals, filters]);

  return (
    <div className="space-y-6 h-full">
      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Propostas Jurídicas
        </h2>
        <p className="text-base text-muted-foreground">
          Gerencie e envie suas propostas para clientes via email ou WhatsApp
        </p>
      </div>

      <div className="space-y-6">
        {/* Filters */}
        <ProposalFilters
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={proposals.length}
          filteredCount={filteredProposals.length}
        />

        {/* Proposals List */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ProposalList
            proposals={filteredProposals}
            onSendEmail={handleSendEmail}
            onSendWhatsApp={handleSendWhatsApp}
            onView={handleViewProposal}
            onEdit={handleEditProposal}
            onDelete={handleDeleteProposal}
          />
        )}
      </div>

      {editingProposal && (
        <ProposalEditModal
          proposal={editingProposal}
          isOpen={!!editingProposal}
          onClose={() => setEditingProposal(null)}
          onUpdate={handleUpdateProposal}
        />
      )}

      <DeleteConfirmDialog
        isOpen={!!deletingProposal}
        onClose={() => setDeletingProposal(null)}
        onConfirm={confirmDeleteProposal}
        title="Excluir Proposta"
        description={
          deletingProposal
            ? `Tem certeza que deseja excluir a proposta de ${deletingProposal.clientName}? Esta ação não pode ser desfeita.`
            : ""
        }
      />
    </div>
  );
};

export default Index;