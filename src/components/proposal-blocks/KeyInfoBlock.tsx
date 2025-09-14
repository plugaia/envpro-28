import { User, Building, Briefcase, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export const KeyInfoBlock = ({ proposal }) => (
  <div className="grid md:grid-cols-2 gap-6">
    <InfoSection icon={User} title="Cliente" value={proposal.client_name} />
    <InfoSection icon={Briefcase} title="Processo Nº" value={proposal.process_number || 'N/A'} />
    <InfoSection icon={Building} title="Órgão/Devedor" value={proposal.organization_name || 'N/A'} />
    <InfoSection icon={Calendar} title="Validade da Proposta" value={formatDate(proposal.valid_until)} />
  </div>
);