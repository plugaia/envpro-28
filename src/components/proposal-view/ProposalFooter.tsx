import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Mail, Phone } from "lucide-react";
import { ProposalDetails, LawyerInfo } from '@/hooks/useProposalDetails';

interface ProposalFooterProps {
  proposal: ProposalDetails;
  lawyerInfo: LawyerInfo | null;
}

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

export function ProposalFooter({ proposal, lawyerInfo }: ProposalFooterProps) {
  return (
    <div className="mt-8 bg-muted/30 rounded-lg p-6">
      <div className="text-center text-sm text-muted-foreground mb-6">
        <p className="flex items-center justify-center gap-2 mb-2">
          <Calendar className="w-4 h-4" />
          Válida até: {formatDate(proposal.valid_until)}
        </p>
      </div>

      {lawyerInfo && (
        <div className="border-t border-border pt-6">
          <h3 className="text-center text-lg font-semibold mb-4 text-foreground flex items-center justify-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Advogado Responsável
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Avatar className="w-20 h-20">
              <AvatarImage src={lawyerInfo.avatar_url || undefined} alt="Foto do advogado" />
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
        <p>© {new Date().getFullYear()} {proposal.companies?.name || 'LegalProp'} - Plataforma de Propostas Jurídicas</p>
      </div>
    </div>
  );
}