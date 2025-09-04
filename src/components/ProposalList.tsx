import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MessageCircle, Eye, Calendar, DollarSign, FileText, Share, Download, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Proposal } from "@/components/ProposalCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProposalListProps {
  proposals: Proposal[];
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

export function ProposalList({ proposals, onSendEmail, onSendWhatsApp, onView, onEdit, onDelete }: ProposalListProps) {
  const { toast } = useToast();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yy", { locale: ptBR });
  };

  const handleShareLink = (proposal: Proposal) => {
    const shareUrl = `${window.location.origin}/proposta/${proposal.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link copiado!",
        description: "O link da proposta foi copiado para a área de transferência.",
      });
    }).catch(() => {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive",
      });
    });
  };

  const handleSendEmail = async (proposal: Proposal) => {
    // Check if user can view client details before sending email
    if (!proposal.canViewClientDetails) {
      toast({
        title: "Acesso restrito",
        description: "Apenas administradores podem enviar emails com dados de contato dos clientes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('send-proposal-email', {
        body: { 
          proposalId: proposal.id,
          recipientEmail: proposal.clientEmail
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Email enviado!",
        description: `Proposta enviada para ${proposal.clientEmail}`,
      });

      // Log audit event
      try {
        await supabase.rpc('create_audit_log', {
          p_action_type: 'EMAIL_SENT',
          p_table_name: 'proposals',
          p_record_id: proposal.id,
          p_new_data: { recipient_email: proposal.clientEmail, action: 'email_sent' }
        });
      } catch (auditError) {
        console.error('Audit log error:', auditError);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (proposal: Proposal) => {
    try {
      const response = await supabase.functions.invoke('generate-proposal-pdf', {
        body: { proposalId: proposal.id }
      });

      if (response.error) throw response.error;

      // Convert the response data to proper format
      let pdfBlob;
      if (response.data instanceof ArrayBuffer) {
        pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      } else if (typeof response.data === 'string') {
        // If it's base64 or string, convert it
        const binaryString = atob(response.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfBlob = new Blob([bytes], { type: 'application/pdf' });
      } else {
        // Fallback - treat as raw data
        pdfBlob = new Blob([new Uint8Array(response.data)], { type: 'application/pdf' });
      }
      
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposta-${proposal.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF gerado com sucesso",
        description: "O arquivo PDF foi baixado automaticamente.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
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
                          onClick={() => handleSendEmail(proposal)}
                          className="h-7 w-7 p-0"
                          title="Enviar por Email"
                          disabled={!proposal.canViewClientDetails}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                         <Button
                           size="sm"
                           variant="ghost"
                           onClick={async () => {
                             try {
                               // Generate secure access token
                               const { data: tokenData, error } = await supabase
                                 .rpc('create_proposal_access_token', { p_proposal_id: proposal.id });
                               
                               if (error) throw error;
                               
                               const proposalUrl = `${window.location.origin}/proposta/${proposal.id}?token=${tokenData}`;
                               
                               // Create WhatsApp message with proposal link
                               const message = encodeURIComponent(
                                 `Olá ${proposal.clientName}! 

Temos uma proposta de antecipação de crédito judicial de *R$ ${proposal.proposalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}* para seu processo.

Para visualizar os detalhes e aceitar a proposta, clique no link:
${proposalUrl}

Equipe EnvPRO 📋⚖️`
                               );
                               
                                // Use client's phone number for WhatsApp
                                const phoneNumber = proposal.clientPhone?.replace(/[^\d]/g, '') || "";
                                
                                const whatsappUrl = phoneNumber 
                                  ? `https://wa.me/+55${phoneNumber}?text=${message}`
                                  : `https://wa.me/?text=${message}`;
                               
                               window.open(whatsappUrl, '_blank');

                               toast({
                                 title: "WhatsApp aberto", 
                                 description: phoneNumber 
                                   ? `Conversa iniciada com ${proposal.clientName}`
                                   : `Mensagem preparada para ${proposal.clientName}`,
                               });

                               // Log audit event
                               try {
                                 await supabase.rpc('create_audit_log', {
                                   p_action_type: 'WHATSAPP_SENT',
                                   p_table_name: 'proposals',
                                   p_record_id: proposal.id,
                                   p_new_data: { phone_number: phoneNumber, action: 'whatsapp_sent' }
                                 });
                               } catch (auditError) {
                                 console.error('Audit log error:', auditError);
                               }
                             } catch (error) {
                               console.error('Error generating WhatsApp link:', error);
                               toast({
                                 title: "Erro",
                                 description: "Não foi possível gerar o link seguro.",
                                 variant: "destructive",
                               });
                             }
                           }}
                           className="h-7 w-7 p-0"
                           title="Enviar por WhatsApp"
                           disabled={!proposal.canViewClientDetails}
                         >
                           <MessageCircle className="w-3 h-3" />
                         </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              // Generate secure access token
                              const { data: tokenData, error } = await supabase
                                .rpc('create_proposal_access_token', { p_proposal_id: proposal.id });
                              
                              if (error) throw error;
                              
                              const shareUrl = `${window.location.origin}/proposta/${proposal.id}?token=${tokenData}`;
                              await navigator.clipboard.writeText(shareUrl);
                              
                              toast({
                                title: "Link copiado!",
                                description: "O link seguro da proposta foi copiado para a área de transferência.",
                              });

                              // Log audit event
                              try {
                                await supabase.rpc('create_audit_log', {
                                  p_action_type: 'SHARE_LINK_GENERATED',
                                  p_table_name: 'proposals',
                                  p_record_id: proposal.id,
                                  p_new_data: { action: 'share_link_generated' }
                                });
                              } catch (auditError) {
                                console.error('Audit log error:', auditError);
                              }
                            } catch (error) {
                              console.error('Error generating share link:', error);
                              toast({
                                title: "Erro ao copiar",
                                description: "Não foi possível copiar o link. Tente novamente.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="h-7 w-7 p-0"
                          title="Compartilhar Link"
                        >
                          <Share className="w-3 h-3" />
                        </Button>
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => handleDownloadPDF(proposal)}
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