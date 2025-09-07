import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { authLimiter, checkRateLimit, formatRemainingTime } from '@/lib/rateLimiter';
import { userRegistrationSchema, emailSchema, passwordSchema } from '@/lib/validation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso.",
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

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
      // Basic validation for required fields
      if (!userData.firstName || !userData.lastName || !userData.cnpj) {
        throw new Error('Todos os campos são obrigatórios');
      }
    } catch (validationError: any) {
      return {
        error: {
          message: `Dados inválidos: ${validationError.message || 'Verifique os campos preenchidos'}`
        } as AuthError
      };
    }
    const redirectUrl = `${window.location.origin}/`;
    
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
      // Create user profile and company
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
          return { error };
        } else {
          // Return success to trigger modal
          return { error: null };
        }
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        toast({
          title: "Erro no cadastro",
          description: "Falha ao criar perfil do usuário. Tente novamente.",
          variant: "destructive",
        });
      }
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
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
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
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};