import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  name: string;
  cnpj: string;
  responsible_phone: string;
  responsible_email: string;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip_code: string | null;
  logo_url: string | null;
}

const fetchCompany = async (userId: string): Promise<Company | null> => {
  const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('user_id', userId).single();
  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const { data, error } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
  if (error) throw new Error(error.message);
  return data;
};

export const useCompany = () => {
  const { user } = useAuth();
  return useQuery<Company | null, Error>({
    queryKey: ['company', user?.id],
    queryFn: () => fetchCompany(user!.id),
    enabled: !!user,
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updatedCompany: Partial<Company>) => {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user!.id).single();
      if (!profile) throw new Error("Perfil não encontrado");

      const { error } = await supabase.from('companies').update({ ...updatedCompany, updated_at: new Date().toISOString() }).eq('id', profile.company_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Empresa atualizada", description: "Os dados da empresa foram salvos." });
      queryClient.invalidateQueries({ queryKey: ['company', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
};