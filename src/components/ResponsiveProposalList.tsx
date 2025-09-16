"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { ProposalCard, type Proposal } from "./ProposalCard";
import { ProposalList } from "./ProposalList";
import { Loader2 } from "lucide-react";

interface ResponsiveProposalListProps {
  proposals: Proposal[];
  onSendEmail: (proposal: Proposal) => void;
  onSendWhatsApp: (proposal: Proposal) => void;
  onView: (proposal: Proposal) => void;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposal: Proposal) => void;
  onShareLink: (proposal: Proposal) => void;
  onDownloadPDF: (proposal: Proposal) => void;
  isGeneratingPdf: string | null;
}

export function ResponsiveProposalList(props: ResponsiveProposalListProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-4">
        {props.proposals.map((proposal) => (
          <ProposalCard key={proposal.id} {...props} proposal={proposal} />
        ))}
      </div>
    );
  }

  return <ProposalList {...props} />;
}