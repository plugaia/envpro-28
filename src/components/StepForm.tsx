import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, User, Building2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import InputMask from 'react-input-mask';
import { supabase } from '@/integrations/supabase/client';

interface StepFormProps {
  onSubmit: (data: RegisterFormData) => void;
  isLoading: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  cnpj: string;
}

export const StepForm = ({ onSubmit, isLoading }: StepFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailValidation, setEmailValidation] = useState({ 
    isChecking: false, 
    isAvailable: true, 
    message: '' 
  });
  const totalSteps = 3;

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    cnpj: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Use useEffect to debounce email validation
  useEffect(() => {
    if (formData.email.includes('@') && formData.email.length > 5) {
      const timeoutId = setTimeout(() => {
        checkEmailAvailability(formData.email);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setEmailValidation({ isChecking: false, isAvailable: true, message: '' });
    }
  }, [formData.email]);

  const checkEmailAvailability = async (email: string) => {
    setEmailValidation({ isChecking: true, isAvailable: true, message: '' });
    
    try {
      const { data, error } = await supabase.functions.invoke('check-email-availability', {
        body: { email }
      });

      if (error) {
        console.error('Email check error:', error);
        setEmailValidation({ 
          isChecking: false, 
          isAvailable: true, 
          message: 'Não foi possível verificar disponibilidade' 
        });
        return;
      }

      setEmailValidation({ 
        isChecking: false, 
        isAvailable: data.available, 
        message: data.message 
      });
      
    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidation({ 
        isChecking: false, 
        isAvailable: true, 
        message: 'Erro ao verificar email' 
      });
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && emailValidation.isAvailable && !emailValidation.isChecking;
      case 2:
        return formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      case 3:
        return formData.cnpj;
      default:
        return false;
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Card className="card-elegant w-full max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-foreground">Criar Nova Conta</CardTitle>
        <CardDescription>
          Passo {currentStep} de {totalSteps} - Cadastre sua empresa
        </CardDescription>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Etapa 1: Dados Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Dados Pessoais</h3>
                <p className="text-sm text-muted-foreground">Informe seus dados básicos</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    placeholder="Seu nome"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    placeholder="Seu sobrenome"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    required
                    className={`pr-10 ${!emailValidation.isAvailable ? 'border-destructive' : emailValidation.message ? 'border-success' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValidation.isChecking && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                    {!emailValidation.isChecking && !emailValidation.isAvailable && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    {!emailValidation.isChecking && emailValidation.isAvailable && formData.email.includes('@') && emailValidation.message && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                </div>
                {emailValidation.message && (
                  <p className={`text-sm ${emailValidation.isAvailable ? 'text-success' : 'text-destructive'}`}>
                    {emailValidation.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Etapa 2: Senha */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Segurança</h3>
                <p className="text-sm text-muted-foreground">Crie uma senha segura</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Crie uma senha segura"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    required
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
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    required
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
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-sm text-destructive">As senhas não coincidem</p>
                )}
              </div>
            </div>
          )}

          {/* Etapa 3: CNPJ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">CNPJ</h3>
                <p className="text-sm text-muted-foreground">Informe o CNPJ da empresa</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <InputMask
                  mask="99.999.999/9999-99"
                  value={formData.cnpj}
                  onChange={(e) => updateFormData('cnpj', e.target.value)}
                >
                  {(inputProps: any) => (
                    <Input
                      {...inputProps}
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  )}
                </InputMask>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex items-center gap-2"
              >
                Próximo
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading || !isStepValid(currentStep)}
                className="flex items-center gap-2"
              >
                {isLoading ? 'Criando...' : 'Finalizar Cadastro'}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};