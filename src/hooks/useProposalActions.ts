import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { ProposalDetails } from "./useProposalDetails";

interface UseProposalActionsResult {
  updateProposalStatus: (newStatus: 'aprovada' | 'rejeitada', currentProposal: ProposalDetails, accessToken: string | null) => Promise<void>;
  updating: boolean;
  updateError: string | null;
}

export function useProposalActions(): UseProposalActionsResult {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const createNotificationForLawyer = async (newStatus: 'aprovada' | 'rejeitada', proposal: ProposalDetails) => {
    if (!proposal?.created_by) return;

    try {
      const statusText = newStatus === 'aprovada' ? 'aprovada' : 'rejeitada';
      const { error } = await supabase.functions.invoke('create-notification', {
        body: {
          user_id: proposal.created_by,
          title: `Proposta ${statusText}`,
          message: `A proposta de ${proposal.client_name} foi ${statusText} pelo cliente.`,
          type: 'proposal',
          data: { 
            proposal_id: proposal.id,
            client_name: proposal.client_name,
            status: newStatus,
            proposal_value: proposal.proposal_value
          }
        }
      });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error sending notification to lawyer:', error);
    }
  };

  const updateProposalStatus = async (newStatus: 'aprovada' | 'rejeitada', currentProposal: ProposalDetails, accessToken: string | null) => {
    try {
      setUpdating(true);
      setUpdateError(null);

      if (user) {
        const { error } = await supabase
          .from('proposals')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProposal.id);

        if (error) throw error;
      } else if (accessToken) {
        const { data, error } = await supabase
          .rpc('update_proposal_status_by_token', {
            p_access_token: accessToken,
            p_new_status: newStatus
          });

        if (error) {
          console.error('RPC Error:', error);
          throw new Error('Erro de comunicação com o servidor');
        }
        
        if (!data || !data.success) {
          const errorMessage = data?.error || 'Erro desconhecido';
          throw new Error(errorMessage);
        }
      } else {
        throw new Error('Acesso não autorizado');
      }
      
      await createNotificationForLawyer(newStatus, currentProposal);
      
      const statusText = newStatus === 'aprovada' ? 'aprovada' : 'rejeitada';
      const message = newStatus === 'aprovada' 
        ? 'Sua proposta foi aprovada com sucesso. Em breve entraremos em contato.'
        : 'Sua resposta foi registrada. Obrigado pelo seu tempo.';

      toast({
        title: `Proposta ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}!`,
        description: message,
      });

      queryClient.invalidateQueries({ queryKey: ['proposals'] });

    } catch (error: any) {
      console.error('Error updating proposal status:', error);
      const errorMessage = error.message || "Não foi possível atualizar a proposta.";
      setUpdateError(errorMessage);
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    updateProposalStatus,
    updating,
    updateError,
  };
}