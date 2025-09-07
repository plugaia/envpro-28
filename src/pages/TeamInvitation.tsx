import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import InputMask from 'react-input-mask';

interface InvitationData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  is_valid: boolean;
}

export default function TeamInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    whatsappNumber: ''
  });

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      // Use the secure function to get invitation details
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('get_invitation_for_registration', { p_invitation_token: token });

      if (invitationError) throw invitationError;

      if (!invitationData || invitationData.length === 0 || !invitationData[0].is_valid) {
        throw new Error('Convite inválido ou expirado');
      }

      const invitation = invitationData[0];
      setInvitation({
        id: invitation.invitation_id,
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        company_name: invitation.company_name,
        is_valid: invitation.is_valid
      });

    } catch (error) {
      console.error('Error fetching invitation:', error);
      toast({
        title: "Convite inválido",
        description: "Este convite não é válido ou já expirou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (!invitation) return;

    setRegistering(true);

    try {
      // Create user account
      const { error: signUpError } = await signUp(invitation.email, formData.password, {
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        cnpj: '' // Empty CNPJ for team invitations since company already exists
      });

      if (signUpError) throw signUpError;

      // Get the created user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Falha ao obter dados do usuário');

      // Accept the invitation
      const { error: acceptError } = await supabase
        .rpc('accept_team_invitation', {
          p_invitation_token: token,
          p_user_id: user.id,
          p_phone: formData.whatsappNumber // Pass the phone number from the form
        });

      if (acceptError) throw acceptError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo à equipe! Você já pode começar a usar a plataforma.",
      });

      // Redirect to main app
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Convite Inválido</h2>
            <p className="text-muted-foreground mb-4">
              Este convite não é válido ou já expirou.
            </p>
            <Button onClick={() => navigate('/')}>
              Ir para página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-4 card-elegant">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Bem-vindo à equipe!</CardTitle>
          <CardDescription>
            Você foi convidado para fazer parte da <strong>{invitation.company_name}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Dados do convite:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Nome:</strong> {invitation.first_name} {invitation.last_name}</p>
              <p><strong>Email:</strong> {invitation.email}</p>
              <p><strong>Empresa:</strong> {invitation.company_name}</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número do WhatsApp</Label>
              <InputMask
                mask="+55 (99) 99999-9999"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="whatsapp"
                    placeholder="+55 (DD) 99999-9999"
                    type="tel"
                    required
                  />
                )}
              </InputMask>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-sm text-destructive">As senhas não coincidem</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={registering || formData.password !== formData.confirmPassword}
            >
              {registering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aceitar Convite e Criar Conta
                </>
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ao criar sua conta, você aceita fazer parte da equipe da {invitation.company_name}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}