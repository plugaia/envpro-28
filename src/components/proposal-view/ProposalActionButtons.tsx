import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, AlertCircle } from "lucide-react";
import { ProposalDetails } from '@/hooks/useProposalDetails';

interface ProposalActionButtonsProps {
  proposal: ProposalDetails;
  updating: boolean;
  updateError: string | null;
  onAccept: () => void;
  onReject: () => void;
}

export function ProposalActionButtons({ proposal, updating, updateError, onAccept, onReject }: ProposalActionButtonsProps) {
  return (
    <>
      {updateError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      {proposal.status === 'pendente' && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={onAccept}
            size="lg"
            disabled={updating}
            className="bg-success hover:bg-success/90 text-success-foreground px-8"
          >
            <Check className="w-5 h-5 mr-2" />
            {updating ? "Processando..." : "Aceitar Proposta"}
          </Button>
          <Button 
            onClick={onReject}
            variant="outline"
            size="lg"
            disabled={updating}
            className="px-8"
          >
            <X className="w-5 h-5 mr-2" />
            {updating ? "Processando..." : "Recusar Proposta"}
          </Button>
        </div>
      )}

      {proposal.status === 'aprovada' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-success mb-2">Proposta Aprovada!</h3>
          <p className="text-muted-foreground">Em breve entraremos em contato para prosseguir com o processo.</p>
        </div>
      )}

      {proposal.status === 'rejeitada' && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-destructive mb-2">Proposta Recusada</h3>
          <p className="text-muted-foreground">Agradecemos pela consideração. Caso mude de opinião, entre em contato conosco.</p>
        </div>
      )}
    </>
  );
}