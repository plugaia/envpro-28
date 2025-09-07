import React from 'react';
import { CardContent } from "@/components/ui/card";
import { FileText, DollarSign, Building } from "lucide-react";
import { ProposalDetails } from '@/hooks/useProposalDetails';

interface ProposalDetailsSectionProps {
  proposal: ProposalDetails;
  companyLogoUrl: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function ProposalDetailsSection({ proposal, companyLogoUrl }: ProposalDetailsSectionProps) {
  return (
    <CardContent className="p-6">
      <p className="text-muted-foreground mb-6">
        Para a apresentação da proposta levamos em consideração o tipo de precatório, a ordem cronológica e o prazo estimado para recebimento. Diante do grande atraso previsto para o pagamento do seu crédito, antecipar o seu recebimento lhe trará o efetivo resultado do processo judicial e o poderá utilizar seu dinheiro da forma que quiser.
      </p>

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
    </CardContent>
  );
}