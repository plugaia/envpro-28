import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PhoneVerificationModal } from '@/components/PhoneVerificationModal';
import { type Database } from "@/integrations/supabase/types";
import { DefaultLayout } from '@/components/proposal-layouts/DefaultLayout';

type Proposal = Database['public']['Functions']['get_proposal_by_token']['Returns'][number];
type LawyerInfo = Database['public']['Functions']['get_lawyer_info']['Returns'][number];
type Template = Database['public']['Tables']['proposal_templates']['Row'];
type TemplateField = Database['public']['Tables']['template_fields']['Row'];
type VisualTemplate = Database['public']['Tables']['visual_templates']['Row'];
type TemplateWithFields = Template & { template_fields: TemplateField[], visual_templates: VisualTemplate | null };
type ProposalWithFullData = Proposal & { custom_fields_data?: { [key: string]: any }, template_id?: string };

// Map component names from the database to actual React components
const layoutComponents = {
  'DefaultLayout': DefaultLayout,
  // Add other layouts here as they are created
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
        setProposal(fetchedProposal);

        const { data: fullProposalData, error: fullProposalError } = await supabase
          .from('proposals')
          .select('custom_fields_data, template_id')
          .eq('id', fetchedProposal.id)
          .single();
        
        if (fullProposalError) console.error("Could not fetch custom fields", fullProposalError);
        
        if (fullProposalData) {
          fetchedProposal.custom_fields_data = fullProposalData.custom_fields_data;
          
          if (fullProposalData.template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('proposal_templates')
              .select('*, template_fields(*), visual_templates(*)')
              .eq('id', fullProposalData.template_id)
              .single();
            if (templateError) console.error("Could not fetch template definition", templateError);
            else setTemplate(templateData as TemplateWithFields);
          }
        }

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
        body: {
          proposalId: proposal.id,
          status: action === 'approve' ? 'aprovada' : 'rejeitada',
          accessToken: token,
        }
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
        <Alert variant="destructive" className="max-w-lg">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Erro de Acesso</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!proposal) return null;

  const isExpired = new Date(proposal.valid_until) < new Date();
  const canTakeAction = proposal.status === 'pendente' && !isExpired;

  const LayoutComponent = template?.visual_templates?.component_name 
    ? layoutComponents[template.visual_templates.component_name as keyof typeof layoutComponents] 
    : DefaultLayout;

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <LayoutComponent 
          proposal={proposal}
          lawyer={lawyer}
          template={template}
          canTakeAction={canTakeAction}
          handleAction={handleAction}
          isExpired={isExpired}
        />
      </div>
      {proposal && <PhoneVerificationModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} proposalId={proposal.id} onVerified={handlePhoneVerificationSuccess} isSubmitting={isSubmitting} />}
    </div>
  );
};

export default ProposalView;