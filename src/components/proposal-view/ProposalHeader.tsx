import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ProposalDetails } from '@/hooks/useProposalDetails';

interface ProposalHeaderProps {
  proposal: ProposalDetails;
}

const statusConfig = {
  pendente: { color: "bg-warning text-warning-foreground", label: "Aguardando Resposta" },
  aprovada: { color: "bg-success text-success-foreground", label: "Proposta Aprovada" },
  rejeitada: { color: "bg-destructive text-destructive-foreground", label: "Proposta Rejeitada" }
};

export function ProposalHeader({ proposal }: ProposalHeaderProps) {
  return (
    <>
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
        <div className="card-elegant mb-8 overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cara(o) Sr(a).</p>
                <h2 className="text-2xl font-bold text-foreground">
                  {proposal.client_name}
                </h2>
              </div>
              <Badge className={statusConfig[proposal.status].color}>
                {statusConfig[proposal.status].label}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}