import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Type for profile data
export interface Profile {
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
}

// Fetch profile data
const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, avatar_url')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// Hook to get profile data
export const useProfile = () => {
  const { user } = useAuth();
  return useQuery<Profile | null, Error>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });
};

// Hook to update profile data
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updatedProfile: Partial<Profile>) => {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updatedProfile, updated_at: new Date().toISOString() })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
};

// Hook to update avatar
export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      toast({ title: "Avatar atualizado", description: "Sua foto de perfil foi alterada." });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    },
  });
};