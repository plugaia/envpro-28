import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, FileText, Calendar, DollarSign, Building, User, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotFound from "./NotFound";

const ProposalView = () => {
  const { proposalId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<any>(null);
  const [status, setStatus] = useState<'pendente' | 'aprovada' | 'rejeitada'>('pendente');
  const [loading, setLoading] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [lawyerInfo, setLawyerInfo] = useState<any>(null);
  const [showNotFound, setShowNotFound] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  
  // Check if this is a token-based access (URL contains token parameter)
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('token');
  
  const [isVerified, setIsVerified] = useState(!!user); // Authenticated users skip verification
  const [showVerification, setShowVerification] = useState(!user && !!accessToken);
  
  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId, user, accessToken]);

  const fetchProposal = async () => {
    try {
      setLoading(true);
      let proposalDataFromRpc: any = null;
      let currentCompanyId: string | null = null;

      if (accessToken) {
        // Public access via token - now includes company logo
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('get_proposal_by_token', { access_token: accessToken });
          
        if (tokenError) throw tokenError;
        
        if (tokenData && tokenData.length > 0) {
          proposalDataFromRpc = tokenData[0];
          // Now we have company_logo_url from the RPC function
          setCompanyLogoUrl(proposalDataFromRpc.company_logo_url);
          setIsVerified(false);
          setShowVerification(true);
        } else {
          throw new Error('Token inválido ou expirado');
        }
      } else if (user) {
        // Authenticated user access
        const { data: secureData, error: secureError } = await supabase
          .rpc('get_proposal_by_id', { p_proposal_id: proposalId });
          
        if (secureError) throw secureError;
        
        if (secureData && secureData.length > 0) {
          proposalDataFromRpc = secureData[0];
          currentCompanyId = proposalDataFromRpc.company_id;
        } else {
          throw new Error('Proposta não encontrada ou sem permissão de acesso');
        }
      } else {
        throw new Error('Acesso não autorizado');
      }

      if (!proposalDataFromRpc) {
        throw new Error('No proposal data found');
      }

      // Fetch company details for authenticated users
      let companyDetails = { 
        name: proposalDataFromRpc.company_name || 'Empresa', 
        logo_url: proposalDataFromRpc.company_logo_url || null 
      };
      
      if (currentCompanyId) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', currentCompanyId)
          .single();

        if (companyError) {
          console.warn('Error fetching company details:', companyError);
        } else if (companyData) {
          companyDetails = { name: companyData.name, logo_url: companyData.logo_url };
          setCompanyLogoUrl(companyData.logo_url);
        }
      }

      const finalProposal = {
        ...proposalDataFromRpc,
        companies: companyDetails,
        client_email: proposalDataFromRpc.client_email || null,
        client_phone: proposalDataFromRpc.client_phone || null,
        can_view_client_details: proposalDataFromRpc.can_view_client_details || false,
      };
      
      setProposal(finalProposal);
      setStatus(finalProposal.status as 'pendente' | 'aprovada' | 'rejeitada');
      
      // Fetch lawyer information for all proposals
      await fetchLawyerInfo(finalProposal.created_by);
      
    } catch (error) {
      console.error('Error fetching proposal:', error);
      setShowNotFound(true);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a proposta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyerInfo = async (createdByUserId: string) => {
    if (!createdByUserId) return;
    try {
      // Use RPC function to get lawyer information
      const { data: lawyerData, error: lawyerError } = await supabase
        .rpc('get_lawyer_info', { p_proposal_id: proposalId });

      if (lawyerError) {
        console.error('Error fetching lawyer info:', lawyerError);
        return;
      }

      if (lawyerData && lawyerData.length > 0) {
        setLawyerInfo(lawyerData[0]);
      }
    } catch (error) {
      console.error('Error in fetchLawyerInfo:', error);
    }
  };

  const handlePhoneVerification = async (digits: string) => {
    if (digits.length !== 4 || !/^\d{4}$/.test(digits)) {
      setVerificationError("Digite exatamente 4 dígitos.");
      return;
    }

    try {
      // Verify the last 4 digits of the client's phone using Supabase function
      const { data: isValid, error } = await supabase
        .rpc('verify_phone_digits', { 
          p_proposal_id: proposalId, 
          p_last_digits: digits 
        });

      if (error) throw error;

      if (isValid) {
        setIsVerified(true);
        setShowVerification(false);
        setVerificationError("");
        toast({
          title: "Verificação concluída",
          description: "Acesso liberado para visualizar a proposta.",
        });
      } else {
        setVerificationError("Os últimos 4 dígitos do seu celular não conferem.");
      }
    } catch (error) {
      console.error('Error verifying phone digits:', error);
      setVerificationError("Erro na verificação. Tente novamente.");
    }
  };

  const createNotificationForLawyer = async (newStatus: 'aprovada' | 'rejeitada') => {
    if (!proposal?.created_by) return;

    try {
      const statusText = newStatus === 'aprovada' ? 'aprovada' : 'rejeitada';
      const { error } = await supabase.functions.invoke('create-notification', {
        body: {
          user_id: proposal.created_by,
          title: `Proposta ${statusText}`,
          message: `A proposta de ${proposal.client_name} foi ${statusText} pelo cliente.`,
          type: 'proposal',
          data: { 
            proposal_id: proposalId,
            client_name: proposal.client_name,
            status: newStatus,
            proposal_value: proposal.proposal_value
          }
        }
      });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error sending notification to lawyer:', error);
    }
  };
  
  if (!proposalId) {
    setShowNotFound(true);
    return <NotFound />;
  }

  if (showNotFound) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!proposal && !loading) {
    return <NotFound />;
  }

  // Show verification modal for non-authenticated users
  if (!user && !isVerified) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Proposta Protegida</h2>
              <p className="text-muted-foreground mb-4">
                Para acessar esta proposta, digite os últimos 4 dígitos do seu celular cadastrado.
              </p>
              <Button onClick={() => setShowVerification(true)} className="w-full">
                Inserir Senha
              </Button>
            </CardContent>
          </Card>
        </div>
        <PhoneVerificationModal
          isOpen={showVerification}
          clientPhone="****-****" // Don't expose phone number
          onVerify={handlePhoneVerification}
          onClose={() => setShowVerification(false)}
          error={verificationError}
        />
      </>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const handleAccept = async () => {
    try {
      if (user) {
        // Authenticated user - update in database directly
        const { error } = await supabase
          .from('proposals')
          .update({ status: 'aprovada' })
          .eq('id', proposalId);

        if (error) throw error;
      } else if (accessToken) {
        // Public user with token - use Edge Function
        const { data, error } = await supabase.functions.invoke('update-proposal-status', {
          body: {
            proposalId: proposalId,
            accessToken: accessToken,
            newStatus: 'aprovada'
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error('Failed to update proposal status');
      }

      setStatus('aprovada');
      
      // Create notification for the lawyer who created the proposal
      await createNotificationForLawyer('aprovada');
      
      toast({
        title: "Proposta Aprovada!",
        description: "Sua proposta foi aprovada com sucesso. Em breve entraremos em contato.",
      });
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a proposta.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      if (user) {
        // Authenticated user - update in database directly
        const { error } = await supabase
          .from('proposals')
          .update({ status: 'rejeitada' })
          .eq('id', proposalId);

        if (error) throw error;
      } else if (accessToken) {
        // Public user with token - use Edge Function
        const { data, error } = await supabase.functions.invoke('update-proposal-status', {
          body: {
            proposalId: proposalId,
            accessToken: accessToken,
            newStatus: 'rejeitada'
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error('Failed to update proposal status');
      }

      setStatus('rejeitada');
      
      // Create notification for the lawyer who created the proposal
      await createNotificationForLawyer('rejeitada');
      
      toast({
        title: "Proposta Rejeitada",
        description: "Sua resposta foi registrada. Obrigado pelo seu tempo.",
      });
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a proposta.",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    pendente: { color: "bg-warning text-warning-foreground", label: "Aguardando Resposta" },
    aprovada: { color: "bg-success text-success-foreground", label: "Proposta Aprovada" },
    rejeitada: { color: "bg-destructive text-destructive-foreground", label: "Proposta Rejeitada" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Hero Section - Improved mobile responsivity */}
      <div className="hero-gradient text-white py-8 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4">
            Proposta de Antecipação
          </h1>
          <p className="text-base sm:text-lg md:text-xl opacity-90 max-w-2xl mx-auto px-2">
            {proposal.description || "Seu futuro está nas suas mãos! Antecipe seus créditos judiciais e abra caminho para novas possibilidades."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-12">
        {/* Status Card */}
        <Card className="card-elegant mb-8 overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cara(o) Sr(a).</p>
                <h2 className="text-2xl font-bold text-foreground">
                  {proposal.client_name}
                </h2>
              </div>
              <Badge className={statusConfig[status].color}>
                {statusConfig[status].label}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            <p className="text-muted-foreground mb-6">
              Para a apresentação da proposta levamos em consideração o tipo de precatório, a ordem cronológica e o prazo estimado para recebimento. Diante do grande atraso previsto para o pagamento do seu crédito, antecipar o seu recebimento lhe trará o efetivo resultado do processo judicial e o poderá utilizar seu dinheiro da forma que quiser.
            </p>

            {/* Process Details */}
            {(proposal.process_number || proposal.organization_name) && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                PROCESSO DEVEDOR VALOR CEDÍVEL
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {proposal.process_number && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Número do processo</p>
                  <p className="text-sm text-muted-foreground">{proposal.process_number}</p>
                </div>
                )}
                
                {proposal.organization_name && (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Nome do Órgão/Devedor</p>
                  <p className="text-sm text-muted-foreground">{proposal.organization_name}</p>
                </div>
                )}
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Valor Cedível</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(proposal.cedible_value)}</p>
                </div>
              </div>
            </div>
            )}

            {/* Proposal Approved */}
            <div className="flex items-center justify-between bg-muted rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Logo da empresa" className="w-full h-full object-contain" />
                  ) : (
                    <img src="/placeholder.svg" alt="Dinheiro" className="w-full h-full object-contain" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Proposta Aprovada</h3>
                  <p className="text-sm text-muted-foreground">Pagamento garantido pelo {proposal.companies?.name || 'Banco'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(proposal.proposal_value)}
                </p>
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground mb-8">
              <p>A presente proposta não tem força pré-contratual, estando sujeita à aprovação da saúde fiscal do cedente e análise processual.</p>
            </div>

            {/* Action Buttons */}
            {status === 'pendente' && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={handleAccept}
                  size="lg"
                  className="bg-success hover:bg-success/90 text-success-foreground px-8"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Aceitar Proposta
                </Button>
                <Button 
                  onClick={handleReject}
                  variant="outline"
                  size="lg"
                  className="px-8"
                >
                  <X className="w-5 h-5 mr-2" />
                  Recusar Proposta
                </Button>
              </div>
            )}

            {status === 'aprovada' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-success-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-success mb-2">Proposta Aprovada!</h3>
                <p className="text-muted-foreground">Em breve entraremos em contato para prosseguir com o processo.</p>
              </div>
            )}

            {status === 'rejeitada' && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-destructive-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-destructive mb-2">Proposta Recusada</h3>
                <p className="text-muted-foreground">Agradecemos pela consideração. Caso mude de opinião, entre em contato conosco.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer with Lawyer Information */}
        <div className="mt-8 bg-muted/30 rounded-lg p-6">
          <div className="text-center text-sm text-muted-foreground mb-6">
            <p className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Válida até: {formatDate(proposal.valid_until)}
            </p>
          </div>

          {/* Lawyer Information in Footer */}
          {lawyerInfo && (
            <div className="border-t border-border pt-6">
              <h3 className="text-center text-lg font-semibold mb-4 text-foreground flex items-center justify-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Advogado Responsável
              </h3>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={lawyerInfo.avatar_url} alt="Foto do advogado" />
                  <AvatarFallback className="text-xl font-semibold">
                    {lawyerInfo.first_name?.[0]?.toUpperCase() || 'A'}
                    {lawyerInfo.last_name?.[0]?.toUpperCase() || ''}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-lg text-foreground mb-3">
                    {lawyerInfo.first_name} {lawyerInfo.last_name}
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span>{lawyerInfo.email}</span>
                    </div>
                    {lawyerInfo.phone && (
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        <span>{lawyerInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-6 pt-4 border-t border-border">
            <p>© 2025 {proposal.companies?.name || 'LegalProp'} - Plataforma de Propostas Jurídicas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalView;