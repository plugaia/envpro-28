import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Mail, MessageCircle, Eye, MoreHorizontal, Calendar, DollarSign, Share, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface Proposal {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  processNumber?: string;
  organizationName?: string;
  cedibleValue: number;
  proposalValue: number;
  receiverType: "advogado" | "autor" | "precatorio";
  status: "pendente" | "aprovada" | "rejeitada";
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  canViewClientDetails?: boolean; // New field for role-based access control
}

interface ProposalCardProps {
  proposal: Proposal;
  onSendEmail: (proposal: Proposal) => void;
  onSendWhatsApp: (proposal: Proposal) => void;
  onView: (proposal: Proposal) => void;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposal: Proposal) => void;
}

const statusColors = {
  pendente: "bg-warning text-warning-foreground",
  aprovada: "bg-success text-success-foreground",
  rejeitada: "bg-destructive text-destructive-foreground",
};

const statusLabels = {
  pendente: "Pendente",
  aprovada: "Aprovada", 
  rejeitada: "Rejeitada",
};

const receiverTypeLabels = {
  advogado: "Advogado",
  autor: "Autor",
  precatorio: "Precatório",
};

export function ProposalCard({ proposal, onSendEmail, onSendWhatsApp, onView, onEdit, onDelete }: ProposalCardProps) {
  const { toast } = useToast();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleShareLink = async () => {
    try {
      // Generate secure access token
      const { data: tokenData, error } = await supabase
        .rpc('create_proposal_access_token', { p_proposal_id: proposal.id });
      
      if (error) throw error;
      
      const shareUrl = `${window.location.origin}/proposta/${proposal.id}?token=${tokenData}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({
          title: "Link copiado!",
          description: "O link seguro da proposta foi copiado para a área de transferência.",
        });
      }).catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente novamente.",
          variant: "destructive",
        });
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link seguro.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (proposal: Proposal) => {
    try {
      const response = await supabase.functions.invoke('send-proposal-email', {
        body: { proposalId: proposal.id }
      });

      if (response.error) throw response.error;

      toast({
        title: "Email enviado!",
        description: `Proposta enviada para ${proposal.clientEmail}`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="card-elegant hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg text-card-foreground">
              {proposal.clientName}
            </h3>
            {proposal.canViewClientDetails ? (
              <p className="text-sm text-muted-foreground">{proposal.clientEmail}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Email restrito</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[proposal.status]}>
              {statusLabels[proposal.status]}
            </Badge>
            <Badge variant="outline">
              {receiverTypeLabels[proposal.receiverType]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {proposal.processNumber && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Processo:</span>
            <span className="text-muted-foreground">{proposal.processNumber}</span>
          </div>
        )}
        
        {proposal.organizationName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Órgão/Devedor:</span>
            <span className="text-muted-foreground">{proposal.organizationName}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor Cedível</p>
            <p className="font-semibold text-sm">{formatCurrency(proposal.cedibleValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Proposta</p>
            <p className="font-semibold text-sm text-primary">{formatCurrency(proposal.proposalValue)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{format(proposal.createdAt, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>
          {proposal.assignee && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{proposal.assignee}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendEmail(proposal)}
              className="flex items-center gap-1"
              disabled={!proposal.canViewClientDetails}
            >
              <Mail className="w-3 h-3" />
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendWhatsApp(proposal)}
              className="flex items-center gap-1"
              disabled={!proposal.canViewClientDetails}
            >
              <MessageCircle className="w-3 h-3" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareLink}
              className="flex items-center gap-1"
            >
              <Share className="w-3 h-3" />
              Link
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(proposal)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(proposal)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(proposal)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}