import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, Building2, Mail, Lock } from 'lucide-react';
import { StepForm, RegisterFormData } from '@/components/StepForm';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
const Auth = () => {
  const navigate = useNavigate();
  const {
    signIn,
    signUp,
    loading
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const {
      error
    } = await signIn(loginForm.email, loginForm.password);
    if (!error) {
      navigate('/');
    }
    setIsLoading(false);
  };
  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      return;
    }
    setIsLoading(true);
    const {
      error
    } = await signUp(data.email, data.password, {
      firstName: data.firstName,
      lastName: data.lastName,
      cnpj: data.cnpj
    });
    setIsLoading(false);
    if (!error) {
      setRegisteredEmail(data.email);
      setShowEmailVerification(true);
    }
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Link>
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-foreground">EnvPRO</h1>
          </div>
          <p className="text-muted-foreground">
            Plataforma de Propostas Jurídicas
          </p>
        </div>

        <Card className="card-elegant">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="text-center pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="space-y-4">
                <div className="text-center mb-4">
                  <CardTitle className="text-xl text-foreground">Bem-vindo de volta</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar sua conta
                  </CardDescription>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input id="login-email" type="email" placeholder="seu@email.com" value={loginForm.email} onChange={e => setLoginForm(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Senha
                    </Label>
                    <Input id="login-password" type="password" placeholder="Sua senha" value={loginForm.password} onChange={e => setLoginForm(prev => ({
                    ...prev,
                    password: e.target.value
                  }))} required />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Entrando...
                      </> : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <StepForm onSubmit={handleRegister} isLoading={isLoading} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <EmailVerificationModal 
          isOpen={showEmailVerification} 
          onClose={() => {
            setShowEmailVerification(false);
            navigate('/');
          }} 
          email={registeredEmail} 
        />
      </div>
    </div>;
};
export default Auth;