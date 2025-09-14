import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, FileText, User, Building, Briefcase, Calendar, Phone, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
const formatDate = (date: string) => format(new Date(date), "dd/MM/yyyy", { locale: ptBR }); // Shorter date format

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
  <div className="flex items-center gap-3 text-sm">
    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    <span className="font-medium text-foreground">{label}:</span>
    <span className="text-muted-foreground truncate">{value}</span>
  </div>
);

export const CompactLayout = ({ proposal, lawyer, template, canTakeAction, handleAction, isExpired }) => {
  const statusInfo = {
    pendente: { text: "Pendente", icon: Clock, color: "text-warning-foreground", bg: "bg-warning" },
    aprovada: { text: "Aprovada", icon: CheckCircle, color: "text-success-foreground", bg: "bg-success" },
    rejeitada: { text: "Rejeitada", icon: XCircle, color: "text-destructive-foreground", bg: "bg-destructive" },
  };
  const currentStatus = statusInfo[proposal.status as keyof typeof statusInfo] || statusInfo.pendente;

  return (
    <Card className="overflow-hidden w-full">
      <CardHeader className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold">Proposta para {proposal.client_name}</CardTitle>
            <CardDescription className="text-sm">Processo: {proposal.process_number || 'N/A'}</CardDescription>
          </div>
          <Badge className={`${currentStatus.bg} ${currentStatus.color} text-xs`}>
            <currentStatus.icon className="w-3 h-3 mr-1.5" />
            {currentStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 grid md:grid-cols-3 gap-6">
        {/* Left Column - Key Info */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader className="p-3"><CardTitle className="text-base">Valores</CardTitle></CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Cedível</span>
                <span className="font-semibold">{formatCurrency(proposal.cedible_value)}</span>
              </div>
              <div className="flex justify-between items-baseline text-primary">
                <span className="text-sm">Proposta</span>
                <span className="font-bold text-lg">{formatCurrency(proposal.proposal_value)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3"><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
            <CardContent className="p-3 space-y-3">
              <DetailItem icon={User} label="Cliente" value={proposal.client_name} />
              <DetailItem icon={Building} label="Órgão" value={proposal.organization_name || 'N/A'} />
              <DetailItem icon={Calendar} label="Validade" value={formatDate(proposal.valid_until)} />
            </CardContent>
          </Card>

          {lawyer && (
            <Card>
              <CardHeader className="p-3"><CardTitle className="text-base">Seu Contato</CardTitle></CardHeader>
              <CardContent className="p-3 space-y-3">
                <DetailItem icon={User} label="Nome" value={`${lawyer.first_name} ${lawyer.last_name}`} />
                {lawyer.phone && <DetailItem icon={Phone} label="Telefone" value={lawyer.phone} />}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Description & Custom Fields */}
        <div className="md:col-span-2 space-y-4">
          {isExpired && proposal.status === 'pendente' && (
            <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Proposta Expirada</AlertTitle><AlertDescription>Esta proposta expirou em {formatDate(proposal.valid_until)}.</AlertDescription></Alert>
          )}
          {proposal.status !== 'pendente' && (
            <Alert variant={proposal.status === 'aprovada' ? 'success' : 'destructive'}><currentStatus.icon className="h-4- w-4" /><AlertTitle>Proposta Respondida</AlertTitle><AlertDescription>Esta proposta foi {proposal.status}.</AlertDescription></Alert>
          )}

          {proposal.description && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Descrição da Proposta</h4>
              <div className="prose prose-sm max-w-none text-muted-foreground text-sm border p-3 rounded-md bg-muted/20">
                <p>{proposal.description}</p>
              </div>
            </div>
          )}

          {template && proposal.custom_fields_data && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Detalhes Adicionais</h4>
              <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                {template.template_fields.sort((a, b) => a.order - b.order).map(field => {
                  const value = proposal.custom_fields_data?.[field.field_name];
                  if (!value) return null;
                  return (
                    <DetailItem key={field.id} icon={FileText} label={field.field_label} value={field.field_type === 'date' ? formatDate(value) : value} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {canTakeAction && (
        <CardFooter className="p-4 bg-muted/50 border-t flex items-center justify-center gap-4">
          <Button size="sm" className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction('approve')}><ThumbsUp className="w-4 h-4 mr-2" />Aprovar</Button>
          <Button size="sm" className="w-full sm:w-auto" variant="destructive" onClick={() => handleAction('reject')}><ThumbsDown className="w-4 h-4 mr-2" />Rejeitar</Button>
        </CardFooter>
      )}
    </Card>
  );
};