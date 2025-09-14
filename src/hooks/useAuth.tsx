import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { authLimiter, checkRateLimit, formatRemainingTime } from '@/lib/rateLimiter';
import { nameSchema, emailSchema, passwordSchema, cnpjSchema } from '@/lib/validation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'collaborator' | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    cnpj: string;
  }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'collaborator' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      }
    };

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserRole(currentUser.id);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);

      if (event === 'SIGNED_IN') {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    supabase.auth.getSession().then(({ data: { session } }) => {
      // Manually trigger the handler to check for an existing session on load.
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData: {
    firstName: string;
    lastName: string;
    cnpj: string;
  }) => {
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(authLimiter, 'signup', email);
    if (!rateLimitCheck.allowed) {
      const remainingTime = formatRemainingTime(rateLimitCheck.remainingTime || 0);
      return {
        error: {
          message: `Muitas tentativas de cadastro. Tente novamente em ${remainingTime}.`
        } as AuthError
      };
    }

    // Input validation
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      nameSchema.parse(userData.firstName);
      nameSchema.parse(userData.lastName);
      // CNPJ is only required if it's not an empty string (i.e., for new company registration)
      if (userData.cnpj) {
        cnpjSchema.parse(userData.cnpj);
      }
    } catch (validationError: any) {
      return {
        error: {
          message: `Dados inválidos: ${validationError.errors?.[0]?.message || 'Verifique os campos preenchidos'}`
        } as AuthError
      };
    }
    const redirectUrl = `http://localhost:8080/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          cnpj: userData.cnpj,
        }
      }
    });

    if (error) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      // Only call create-user-profile if CNPJ is provided (new company registration)
      // For team invitations (empty CNPJ), the profile is created by accept_team_invitation RPC.
      if (userData.cnpj) { // Check if CNPJ is provided
        try {
          const { error: profileError } = await supabase.functions.invoke('create-user-profile', {
            body: {
              userId: data.user.id,
              userData: {
                firstName: userData.firstName,
                lastName: userData.lastName,
                cnpj: userData.cnpj,
                responsibleEmail: email,
              }
            }
          });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            toast({
              title: "Erro no cadastro",
              description: "Falha ao criar perfil do usuário. Tente novamente.",
              variant: "destructive",
            });
            return { error: profileError as AuthError };
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
          toast({
            title: "Erro no cadastro",
            description: "Falha ao criar perfil do usuário. Tente novamente.",
            variant: "destructive",
          });
          return { error: profileError as AuthError };
        }
      }
      return { error: null };
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(authLimiter, 'signin', email);
    if (!rateLimitCheck.allowed) {
      const remainingTime = formatRemainingTime(rateLimitCheck.remainingTime || 0);
      return {
        error: {
          message: `Muitas tentativas de login. Tente novamente em ${remainingTime}.`
        } as AuthError
      };
    }

    // Input validation
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (validationError: any) {
      return {
        error: {
          message: `Dados inválidos: ${validationError.errors?.[0]?.message || 'Email ou senha inválidos'}`
        } as AuthError
      };
    };

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.user) {
      // Log successful login to audit_logs
      try {
        await supabase.rpc('create_audit_log', {
          p_action_type: 'LOGIN_SUCCESS',
          p_new_data: { action: 'user_logged_in' }
        });
      } catch (auditError) {
        console.error('Audit log error for login:', auditError);
      }
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    isAdmin: userRole === 'admin',
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};