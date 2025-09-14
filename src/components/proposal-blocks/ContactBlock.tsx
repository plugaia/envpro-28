import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export const ContactBlock = ({ lawyer }) => {
  if (!lawyer) return null;

  return (
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
  );
};