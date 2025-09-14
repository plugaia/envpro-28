import { Card, CardContent } from '@/components/ui/card';
const formatCurrency = (value: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

export const ValuesBlock = ({ proposal }) => (
  <div className="grid md:grid-cols-2 gap-4">
    <Card className="bg-muted/50"><CardContent className="p-4 text-center"><p className="text-sm text-muted-foreground">Valor Cedível</p><p className="text-2xl font-bold">{formatCurrency(proposal.cedible_value)}</p></CardContent></Card>
    <Card className="bg-primary/10 border-primary"><CardContent className="p-4 text-center"><p className="text-sm text-primary">Valor da Proposta</p><p className="text-2xl font-bold text-primary">{formatCurrency(proposal.proposal_value)}</p></CardContent></Card>
  </div>
);