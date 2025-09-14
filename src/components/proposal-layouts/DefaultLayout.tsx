import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, FileText, User, Building, Briefcase, Calendar, Phone, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
const formatDate = (date: string) => format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

const InfoSection = ({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string }) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-muted rounded-full mt-1"><Icon className="w-4 h-4 text-muted-foreground" /></div>
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

export const DefaultLayout = ({ proposal, lawyer, template, canTakeAction, handleAction, isExpired }) => {
  const statusInfo = {
    pendente: { text: "Pendente", icon: Clock, color: "text-warning-foreground", bg: "bg-warning" },
    aprovada: { text: "Aprovada", icon: CheckCircle, color: "text-success-foreground", bg: "bg-success" },
    rejeitada: { text: "Rejeitada", icon: XCircle, color: "text-destructive-foreground", bg: "bg-destructive" },
  };
  const currentStatus = statusInfo[proposal.status as keyof typeof statusInfo] || statusInfo.pendente;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-card-foreground text-background p-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl md:text-3xl font-bold">Proposta Jurídica</CardTitle>
            <CardDescription className="text-background/80">Processo de {proposal.client_name}</CardDescription>
          </div>
          <Badge className={`${currentStatus.bg} ${currentStatus.color} text-sm`}>
            <currentStatus.icon className="w-4 h-4 mr-2" />
            {currentStatus.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {isExpired && proposal.status === 'pendente' && (
          <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Proposta Expirada</AlertTitle><AlertDescription>Esta proposta expirou em {formatDate(proposal.valid_until)} e não pode mais ser aceita.</AlertDescription></Alert>
        )}
        {proposal.status !== 'pendente' && (
          <Alert variant={proposal.status === 'aprovada' ? 'success' : 'destructive'}><currentStatus.icon className="h-4- w-4" /><AlertTitle>Proposta Respondida</AlertTitle><AlertDescription>Esta proposta foi {proposal.status} e não pode mais ser alterada.</AlertDescription></Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <InfoSection icon={User} title="Cliente" value={proposal.client_name} />
          <InfoSection icon={Briefcase} title="Processo Nº" value={proposal.process_number || 'N/A'} />
          <InfoSection icon={Building} title="Órgão/Devedor" value={proposal.organization_name || 'N/A'} />
          <InfoSection icon={Calendar} title="Validade da Proposta" value={formatDate(proposal.valid_until)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-muted/50"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Valor Cedível</p><p className="text-2xl font-bold">{formatCurrency(proposal.cedible_value)}</p></CardContent></Card>
          <Card className="bg-primary/10 border-primary"><CardContent className="p-4 text-center"><p className="text-sm text-primary">Valor da Proposta</p><p className="text-2xl font-bold text-primary">{formatCurrency(proposal.proposal_value)}</p></CardContent></Card>
        </div>

        {proposal.description && (
          <Card><CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Descrição da Proposta</CardTitle></CardHeader><CardContent className="prose prose-sm max-w-none text-muted-foreground"><p>{proposal.description}</p></CardContent></Card>
        )}

        {template && proposal.custom_fields_data && (
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Detalhes Adicionais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {template.template_fields.sort((a, b) => a.order - b.order).map(field => {
                const value = proposal.custom_fields_data?.[field.field_name];
                if (!value) return null;
                return (
                  <div key={field.id} className="grid grid-cols-3 gap-4 text-sm">
                    <strong className="col-span-1 text-foreground">{field.field_label}:</strong>
                    <p className="col-span-2 text-muted-foreground">{field.field_type === 'date' ? formatDate(value) : value}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {lawyer && (
          <Card className="bg-muted/50">
            <CardHeader><CardTitle className="text-lg">Seu Contato</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              <img src={lawyer.avatar_url || '/placeholder.svg'} alt="Advogado" className="w-16 h-16 rounded-full" />
              <div>
                <p className="font-bold text-foreground">{lawyer.first_name} {lawyer.last_name}</p>
                <p className="text-sm text-muted-foreground">{lawyer.email}</p>
                {lawyer.phone && <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1"><Phone className="w-3 h-3" /> {lawyer.phone}</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
      {canTakeAction && (
        <CardFooter className="p-6 bg-muted/50 border-t flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="w-full sm:w-auto bg-success hover:bg-success/90 text-success-foreground" onClick={() => handleAction('approve')}><ThumbsUp className="w-5 h-5 mr-2" />Aprovar Proposta</Button>
          <Button size="lg" className="w-full sm:w-auto" variant="destructive" onClick={() => handleAction('reject')}><ThumbsDown className="w-5 h-5 mr-2" />Rejeitar Proposta</Button>
        </CardFooter>
      )}
    </Card>
  );
};