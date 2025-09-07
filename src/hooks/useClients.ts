import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

// Fetch clients for the current user's company
const fetchClients = async (userId: string): Promise<Client[]> => {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', userId)
    .single();

  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, phone, created_at')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const useFetchClients = () => {
  const { user } = useAuth();
  return useQuery<Client[], Error>({
    queryKey: ['clients', user?.id],
    queryFn: () => fetchClients(user!.id),
    enabled: !!user,
  });
};

// Add a new client
export const useAddClient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newClient: Omit<Client, 'id' | 'created_at'>) => {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user!.id).single();
      if (!profile) throw new Error("Profile not found");

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...newClient, company_id: profile.company_id }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Cliente adicionado", description: "O novo cliente foi salvo com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    },
  });
};

// Update an existing client
export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updatedClient: Omit<Client, 'created_at'>) => {
      const { error } = await supabase
        .from('clients')
        .update({ name: updatedClient.name, email: updatedClient.email, phone: updatedClient.phone })
        .eq('id', updatedClient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cliente atualizado", description: "As informações do cliente foram salvas." });
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });
};

// Delete a client
export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Cliente removido", description: "O cliente foi removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    },
  });
};