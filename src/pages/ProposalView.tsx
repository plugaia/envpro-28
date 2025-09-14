import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { XCircle, Clock, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhoneVerificationModal } from '@/components/PhoneVerificationModal';
import { type Database, type Json } from "@/integrations/supabase/types";
import { KeyInfoBlock } from '@/components/proposal-blocks/KeyInfoBlock';
import { ValuesBlock } from '@/components/proposal-blocks/ValuesBlock';
import { DescriptionBlock } from '@/components/proposal-blocks/DescriptionBlock';
import { CustomFieldsBlock } from '@/components/proposal-blocks/CustomFieldsBlock';
import { ContactBlock } from '@/components/proposal-blocks/ContactBlock';

type Proposal = Database['public']['Functions']['get_proposal_by_token']['Returns'][number];
type LawyerInfo = Database['public']['Functions']['get_lawyer_info']['Returns'][number];
type Template = Database['public']['Tables']['proposal_templates']['Row'];
type TemplateField = Database['public']['Tables']['template_fields']['Row'];
type TemplateWithFields = Template & { template_fields: TemplateField[], layout_config: Json | null };
type ProposalWithFullData = Proposal & { custom_fields_data?: { [key: string]: any }, template_id?: string };

const blockComponents = {
  key_info: KeyInfoBlock,
  values: ValuesBlock,
  description: DescriptionBlock,
  custom_fields: CustomFieldsBlock,
  contact: ContactBlock,
};

const ProposalView = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [proposal, setProposal] = useState<ProposalWithFullData | null>(null);
  const [lawyer, setLawyer] = useState<LawyerInfo | null>(null);
  const [template, setTemplate] = useState<TemplateWithFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      if (!token) {
        setError("Token de acesso não fornecido. Acesso negado.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: rpcError } = await supabase.rpc('get_proposal_by_token', { access_token: token });
        if (rpcError) throw rpcError;
        if (!data || data.length === 0) throw new Error("Proposta não encontrada ou o link expirou.");
        
        const fetchedProposal = data[0] as ProposalWithFullData;
        
        const { data: fullProposalData, error: fullProposalError } = await supabase
          .from('proposals')
          .select('custom_fields_data, template_id')
          .eq('id', fetchedProposal.id)
          .single();
        
        if (fullProposalError) throw new Error("Não foi possível carregar os detalhes da proposta.");
        
        fetchedProposal.custom_fields_data = fullProposalData.custom_fields_data;
        
        if (fullProposalData.template_id) {
          const { data: templateData, error: templateError } = await supabase
            .from('proposal_templates')
            .select('*, template_fields(*)')
            .eq('id', fullProposalData.template_id)
            .single();
          if (templateError) throw new Error("Não foi possível carregar o template da proposta.");
          setTemplate(templateData as TemplateWithFields);
        }
        
        setProposal(fetchedProposal);

        const { data: lawyerData, error: lawyerError } = await supabase.rpc('get_lawyer_info', { p_proposal_id: fetchedProposal.id });
        if (lawyerError) throw lawyerError;
        setLawyer(lawyerData?.[0] || null);

      } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao carregar a proposta.");
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id, token]);

  const handleAction = (type: 'approve' | 'reject') => {
    if (proposal?.status !== 'pendente') {
      toast({ title: "Ação não permitida", description: "Esta proposta já foi respondida.", variant: "destructive" });
      return;
    }
    setAction(type);
    setIsPhoneModalOpen(true);
  };

  const handlePhoneVerificationSuccess = async () => {
    if (!action || !proposal) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('update-proposal-status', {
        body: { proposalId: proposal.id, status: action === 'approve' ? 'aprovada' : 'rejeitada', accessToken: token }
      });
      if (error) throw error;

      setProposal(prev => prev ? { ...prev, status: action === 'approve' ? 'aprovada' : 'rejeitada' } : null);
      toast({ title: `Proposta ${action === 'approve' ? 'Aprovada' : 'Rejeitada'}!`, description: "Sua resposta foi registrada com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar status", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setIsPhoneModalOpen(false);
      setAction(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert variant="destructive" className="max-w-lg"><XCircle className="h-4 w-4" /><AlertTitle>Erro de Acesso</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      </div>
    );
  }

  if (!proposal) return null;

  const isExpired = new Date(proposal.valid_until) < new Date();
  const canTakeAction = proposal.status === 'pendente' && !isExpired;

  const statusInfo = {
    pendente: { text: "Pendente", icon: Clock, color: "text-warning-foreground", bg: "bg-warning" },
    aprovada: { text: "Aprovada", icon: CheckCircle, color: "text-success-foreground", bg: "bg-success" },
    rejeitada: { text: "Rejeitada", icon: XCircle, color: "text-destructive-foreground", bg: "bg-destructive" },
  };
  const currentStatus = statusInfo[proposal.status as keyof typeof statusInfo] || statusInfo.pendente;

  const layoutConfig = (template?.layout_config as any[]) || [];

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-card-foreground text-background p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">Proposta Jurídica</CardTitle>
                <CardDescription className="text-background/80">Processo de {proposal.client_name}</CardDescription>
              </div>
              <Badge className={`${currentStatus.bg} ${currentStatus.color} text-sm`}><currentStatus.icon className="w-4 h-4 mr-2" />{currentStatus.text}</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {isExpired && proposal.status === 'pendente' && <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Proposta Expirada</AlertTitle><AlertDescription>Esta proposta não pode mais ser aceita.</AlertDescription></Alert>}
            {proposal.status !== 'pendente' && <Alert variant={proposal.status === 'aprovada' ? 'success' : 'destructive'}><currentStatus.icon className="h-4 w-4" /><AlertTitle>Proposta Respondida</AlertTitle><AlertDescription>Esta proposta foi {proposal.status}.</AlertDescription></Alert>}
            
            {layoutConfig.map(block => {
              const BlockComponent = blockComponents[block.type as keyof typeof blockComponents];
              if (!BlockComponent) return <div key={block.id} className="text-red-500">Bloco desconhecido: {block.type}</div>;
              return <BlockComponent key={block.id} proposal={proposal} lawyer={lawyer} template={template} />;
            })}
          </CardContent>
          {canTakeAction && (
            <CardFooter className="p-6 bg-muted/50 border-t flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction('approve')}><ThumbsUp className="w-5 h-5 mr-2" />Aprovar Proposta</Button>
              <Button size="lg" className="w-full sm:w-auto" variant="destructive" onClick={() => handleAction('reject')}><ThumbsDown className="w-5 h-5 mr-2" />Rejeitar Proposta</Button>
            </CardFooter>
          )}
        </Card>
      </div>
      {proposal && <PhoneVerificationModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} proposalId={proposal.id} onVerified={handlePhoneVerificationSuccess} isSubmitting={isSubmitting} />}
    </div>
  );
};

export default ProposalView;