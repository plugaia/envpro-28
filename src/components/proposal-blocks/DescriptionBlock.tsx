import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export const DescriptionBlock = ({ proposal }) => {
  if (!proposal.description) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Descrição da Proposta</CardTitle></CardHeader>
      <CardContent className="prose prose-sm max-w-none text-muted-foreground">
        <p>{proposal.description}</p>
      </CardContent>
    </Card>
  );
};