import { useAuth } from "@/hooks/useAuth";

export function useUserRole() {
  const { userRole, loading } = useAuth();
  return { userRole, loading };
}