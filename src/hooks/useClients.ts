import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { type Client } from '@/types/client';

export function useClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (clientData: Omit<Client, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;
    try {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user.id).single();
      if (!profile) throw new Error("Perfil não encontrado.");

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, company_id: profile.company_id }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchClients(); // Re-fetch to get the sorted list
      toast({ title: "Cliente adicionado", description: `${data.name} foi adicionado com sucesso.` });
      return data;
    } catch (error: any) {
      toast({ title: "Erro ao adicionar cliente", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const updateClient = async (clientId: string, updates: Partial<Omit<Client, 'id' | 'company_id'>>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;

      await fetchClients(); // Re-fetch to get the sorted list
      toast({ title: "Cliente atualizado", description: `${data.name} foi atualizado com sucesso.` });
      return data;
    } catch (error: any) {
      toast({ title: "Erro ao atualizar cliente", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      await fetchClients(); // Re-fetch to update the list
      toast({ title: "Cliente removido", description: "O cliente foi removido com sucesso." });
      return true;
    } catch (error: any) {
      toast({ title: "Erro ao remover cliente", description: error.message, variant: "destructive" });
      return false;
    }
  };

  return { clients, loading, fetchClients, addClient, updateClient, deleteClient };
}