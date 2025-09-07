import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";
import NotFound from "./NotFound";

import { useProposalDetails } from "@/hooks/useProposalDetails";
import { useProposalActions } from "@/hooks/useProposalActions";
import { ProposalHeader } from "@/components/proposal-view/ProposalHeader";
import { ProposalDetailsSection } from "@/components/proposal-view/ProposalDetailsSection";
import { ProposalActionButtons } from "@/components/proposal-view/ProposalActionButtons";
import { ProposalFooter } from "@/components/proposal-view/ProposalFooter";
import { supabase } from "@/integrations/supabase/client"; // Import supabase for phone verification

const ProposalView = () => {
  const { proposalId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('token');

  const {
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
    fetchProposal, // Keep fetchProposal if needed for re-fetching after verification
  } = useProposalDetails();

  const {
    updateProposalStatus,
    updating,
    updateError,
  } = useProposalActions();

  const handlePhoneVerification = async (digits: string) => {
    if (digits.length !== 4 || !/^\d{4}$/.test(digits)) {
      setVerificationError("Digite exatamente 4 dígitos.");
      return;
    }

    try {
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
        // Optionally re-fetch proposal details if they depend on verification status
        // await fetchProposal(); 
      } else {
        setVerificationError("Os últimos 4 dígitos do seu celular não conferem.");
      }
    } catch (error) {
      console.error('Error verifying phone digits:', error);
      setVerificationError("Erro na verificação. Tente novamente.");
    }
  };

  const handleAccept = () => {
    if (proposal) {
      updateProposalStatus('aprovada', proposal, accessToken);
    }
  };

  const handleReject = () => {
    if (proposal) {
      updateProposalStatus('rejeitada', proposal, accessToken);
    }
  };
  
  if (!proposalId) {
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

  if (!isVerified) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <ProposalHeader proposal={proposal} />

      <div className="max-w-4xl mx-auto px-4 -mt-8 pb-12">
        <Card className="card-elegant mb-8 overflow-hidden">
          <ProposalDetailsSection proposal={proposal} companyLogoUrl={companyLogoUrl} />
          <ProposalActionButtons 
            proposal={proposal} 
            updating={updating} 
            updateError={updateError} 
            onAccept={handleAccept} 
            onReject={handleReject} 
          />
        </Card>
        <ProposalFooter proposal={proposal} lawyerInfo={lawyerInfo} />
      </div>
    </div>
  );
};

export default ProposalView;