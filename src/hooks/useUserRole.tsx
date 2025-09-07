import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'collaborator' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setUserRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('collaborator'); // Default to collaborator
    } finally {
      setLoading(false);
    }
  };

  return { userRole, loading };
}