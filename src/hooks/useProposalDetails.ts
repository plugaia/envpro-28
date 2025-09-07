import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ProposalDetails {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  process_number: string | null;
  organization_name: string | null;
  cedible_value: number;
  proposal_value: number;
  receiver_type: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  created_at: string;
  updated_at: string;
  valid_until: string;
  description: string | null;
  created_by: string | null;
  can_view_client_details: boolean;
  companies: {
    name: string;
    logo_url: string | null;
  } | null;
}

export interface LawyerInfo {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
}

interface UseProposalDetailsResult {
  proposal: ProposalDetails | null;
  lawyerInfo: LawyerInfo | null;
  companyLogoUrl: string | null;
  loading: boolean;
  showNotFound: boolean;
  isVerified: boolean;
  showVerification: boolean;
  setIsVerified: (verified: boolean) => void;
  setShowVerification: (show: boolean) => void;
  verificationError: string;
  setVerificationError: (error: string) => void;
  fetchProposal: () => Promise<void>;
}

export function useProposalDetails(): UseProposalDetailsResult {
  const { proposalId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [proposal, setProposal] = useState<ProposalDetails | null>(null);
  const [lawyerInfo, setLawyerInfo] = useState<LawyerInfo | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotFound, setShowNotFound] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('token');

  const [isVerified, setIsVerified] = useState(!!user);
  const [showVerification, setShowVerification] = useState(!user && !!accessToken);

  const fetchLawyerInfo = async (createdByUserId: string, currentProposalId: string) => {
    if (!createdByUserId) return;
    try {
      const { data: lawyerData, error: lawyerError } = await supabase
        .rpc('get_lawyer_info', { p_proposal_id: currentProposalId });

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

  const fetchProposal = async () => {
    try {
      setLoading(true);
      let proposalDataFromRpc: any = null;
      let currentCompanyId: string | null = null;

      if (accessToken) {
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('get_proposal_by_token', { access_token: accessToken });

        if (tokenError) throw tokenError;

        if (tokenData && tokenData.length > 0) {
          proposalDataFromRpc = tokenData[0];
          setCompanyLogoUrl(proposalDataFromRpc.company_logo_url);
          setIsVerified(false);
          setShowVerification(true);
        } else {
          throw new Error('Token inválido ou expirado');
        }
      } else if (user) {
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

      let companyDetails = {
        name: proposalDataFromRpc.company_name || 'Empresa',
        logo_url: proposalDataFromRpc.company_logo_url || null
      };

      if (currentCompanyId && !companyLogoUrl) {
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

      const finalProposal: ProposalDetails = {
        ...proposalDataFromRpc,
        companies: companyDetails,
        status: proposalDataFromRpc.status as 'pendente' | 'aprovada' | 'rejeitada',
      };

      setProposal(finalProposal);
      await fetchLawyerInfo(finalProposal.created_by!, proposalId!);

    } catch (error: any) {
      console.error('Error fetching proposal:', error);
      setShowNotFound(true);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível carregar a proposta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId, user, accessToken]);

  return {
    proposal,
    lawyerInfo,
    companyLogoUrl,
    loading,
    showNotFound,
    isVerified,
    showVerification,
    setIsVerified,
    setShowVerification,
    verificationError,
    setVerificationError,
    fetchProposal,
  };
}