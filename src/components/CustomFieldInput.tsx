import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import InputMask from 'react-input-mask';
import { type Database } from "@/integrations/supabase/types";

type TemplateField = Database['public']['Tables']['template_fields']['Row'];

interface CustomFieldInputProps {
  field: TemplateField;
  value: any;
  onChange: (value: any) => void;
}

const formatCurrency = (value: string | number): string => {
  if (typeof value === 'number') {
    value = value.toString();
  }
  const numericValue = (value || '').replace(/[^\d]/g, '');
  if (!numericValue) return "";
  const floatValue = parseFloat(numericValue) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(floatValue);
};

const parseCurrency = (value: string): number => {
  const numericValue = (value || '').replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(numericValue) || 0;
};

export const CustomFieldInput = ({ field, value, onChange }: CustomFieldInputProps) => {
  const id = `custom-${field.field_name}`;

  const renderInput = () => {
    switch (field.field_type) {
      case 'textarea':
        return <Textarea id={id} value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.is_required} />;
      
      case 'phone':
        return (
          <InputMask
            mask="+55 (99) 99999-9999"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.is_required}
          >
            {(inputProps: any) => <Input {...inputProps} id={id} type="tel" />}
          </InputMask>
        );

      case 'currency':
        return (
          <Input
            id={id}
            value={formatCurrency(value || 0)}
            onChange={(e) => onChange(parseCurrency(e.target.value))}
            required={field.is_required}
          />
        );

      case 'email':
      case 'number':
      case 'date':
        return <Input id={id} type={field.field_type} value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.is_required} />;
      
      case 'text':
      default:
        return <Input id={id} type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} required={field.is_required} />;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.field_label}{field.is_required && '*'}</Label>
      {renderInput()}
    </div>
  );
};