import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Proposal } from '@/components/ProposalCard';
import { useToast } from '@/hooks/use-toast';

// Function to fetch proposals
const fetchProposals = async (): Promise<Proposal[]> => {
  const { data, error } = await supabase.rpc('get_user_proposals');
  if (error) throw new Error(error.message);

  // Transform data to match Proposal interface
  return data.map((proposal: any) => ({
    id: proposal.id,
    clientName: proposal.client_name,
    clientEmail: proposal.client_email,
    clientPhone: proposal.client_phone,
    processNumber: proposal.process_number,
    organizationName: proposal.organization_name,
    cedibleValue: parseFloat(proposal.cedible_value.toString()),
    proposalValue: parseFloat(proposal.proposal_value.toString()),
    receiverType: proposal.receiver_type,
    status: proposal.status,
    createdAt: new Date(proposal.created_at),
    updatedAt: new Date(proposal.updated_at),
    assignee: "Sistema",
    canViewClientDetails: proposal.can_view_client_details,
  }));
};

// Hook to use the proposals query
export const useFetchProposals = () => {
  return useQuery<Proposal[], Error>({
    queryKey: ['proposals'],
    queryFn: fetchProposals,
  });
};

// Hook for deleting a proposal with optimistic update
export const useDeleteProposal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (proposalId: string) => {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);
      if (error) throw new Error(error.message);
    },
    onMutate: async (deletedProposalId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['proposals'] });

      // Snapshot the previous value
      const previousProposals = queryClient.getQueryData<Proposal[]>(['proposals']);

      // Optimistically update to the new value
      queryClient.setQueryData<Proposal[]>(['proposals'], (old) =>
        old ? old.filter((proposal) => proposal.id !== deletedProposalId) : []
      );

      toast({
        title: "Proposta removida!",
        description: "A proposta foi removida da lista.",
      });

      // Return a context object with the snapshotted value
      return { previousProposals };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context we returned from onMutate to roll back
      if (context?.previousProposals) {
        queryClient.setQueryData(['proposals'], context.previousProposals);
      }
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a proposta. A lista foi restaurada.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });
};