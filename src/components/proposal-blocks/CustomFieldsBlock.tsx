import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatDate = (date: string) => format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

export const CustomFieldsBlock = ({ proposal, template }) => {
  if (!template || !proposal.custom_fields_data || template.template_fields.length === 0) return null;

  const hasVisibleFields = template.template_fields.some(field => proposal.custom_fields_data?.[field.field_name]);

  if (!hasVisibleFields) return null;

  return (
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
  );
};