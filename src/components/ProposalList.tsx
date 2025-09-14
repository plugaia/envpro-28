import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MessageCircle, Eye, Calendar, DollarSign, FileText, Share, Download, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Proposal } from "@/components/ProposalCard";

interface ProposalListProps {
  proposals: Proposal[];
  onSendEmail: (proposal: Proposal) => void;
  onSendWhatsApp: (proposal: Proposal) => void;
  onView: (proposal: Proposal) => void;
  onEdit: (proposal: Proposal) => void;
  onDelete: (proposal: Proposal) => void;
  onShareLink: (proposal: Proposal) => void;
  onDownloadPDF: (proposal: Proposal) => void;
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

export function ProposalList({ 
  proposals, 
  onSendEmail, 
  onSendWhatsApp, 
  onView, 
  onEdit, 
  onDelete,
  onShareLink,
  onDownloadPDF
}: ProposalListProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yy", { locale: ptBR });
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma proposta encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Ajuste os filtros ou crie uma nova proposta jurídica
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[200px]">Cliente</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[120px] text-right">Valor Cedível</TableHead>
                <TableHead className="w-[120px] text-right">Proposta</TableHead>
                <TableHead className="w-[80px]">Data</TableHead>
                <TableHead className="w-[100px]">Responsável</TableHead>
                <TableHead className="w-[250px] text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                      <div>
                        <div className="font-medium text-sm leading-tight">
                          {proposal.clientName}
                        </div>
                        {proposal.canViewClientDetails ? (
                          <div className="text-xs text-muted-foreground mt-1">
                            {proposal.clientEmail}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground mt-1">
                            Email restrito
                          </div>
                        )}
                      </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={`${statusColors[proposal.status]} text-xs`}>
                      {statusLabels[proposal.status]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {receiverTypeLabels[proposal.receiverType]}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(proposal.cedibleValue)}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(proposal.proposalValue)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(proposal.createdAt)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {proposal.assignee && (
                      <div className="text-sm font-medium">
                        {proposal.assignee}
                      </div>
                    )}
                  </TableCell>
                  
                   <TableCell>
                     <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onSendEmail(proposal)}
                          className="h-7 w-7 p-0"
                          title="Enviar por Email"
                          disabled={!proposal.canViewClientDetails}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={() => onSendWhatsApp(proposal)}
                           className="h-7 w-7 p-0"
                           title="Enviar por WhatsApp"
                           disabled={!proposal.canViewClientDetails}
                         >
                           <MessageCircle className="w-3 h-3" />
                         </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShareLink(proposal)}
                          className="h-7 w-7 p-0"
                          title="Compartilhar Link"
                        >
                          <Share className="w-3 h-3" />
                        </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => onDownloadPDF(proposal)}
                         className="h-7 w-7 p-0"
                         title="Baixar PDF"
                       >
                         <Download className="w-3 h-3" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => onEdit(proposal)}
                         className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                         title="Editar"
                       >
                         <Edit className="w-3 h-3" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => onDelete(proposal)}
                         className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                         title="Excluir"
                       >
                         <Trash2 className="w-3 h-3" />
                       </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => onView(proposal)}
                         className="h-7 w-7 p-0"
                         title="Visualizar"
                       >
                         <Eye className="w-3 h-3" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}