import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type ProposalTemplate, type TemplateField } from "@/pages/Templates";
import { useAuth } from "@/hooks/useAuth";

interface TemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  templateToEdit: ProposalTemplate | null;
}

export function TemplateBuilder({ isOpen, onClose, onSave, templateToEdit }: TemplateBuilderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setDescription(templateToEdit.description || "");
      setFields(templateToEdit.fields.map(f => ({...f})));
    } else {
      setName("");
      setDescription("");
      setFields([]);
    }
  }, [templateToEdit, isOpen]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '_')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const addField = () => {
    const newField: TemplateField = {
      field_label: "Novo Campo",
      field_name: `novo_campo_${fields.length + 1}`,
      field_type: "text",
      is_required: false,
      order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updatedField: Partial<TemplateField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updatedField };
    if (updatedField.field_label) {
      newFields[index].field_name = slugify(updatedField.field_label);
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome do modelo é obrigatório", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Upsert template
      const { data: templateData, error: templateError } = await supabase
        .from('proposal_templates')
        .upsert({
          id: templateToEdit?.id,
          name,
          description,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      const templateId = templateData.id;

      // Sync fields
      const existingFieldIds = templateToEdit?.fields.map(f => f.id).filter(Boolean) || [];
      const currentFieldIds = fields.map(f => f.id).filter(Boolean);
      const fieldsToDelete = existingFieldIds.filter(id => !currentFieldIds.includes(id));

      if (fieldsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('template_fields')
          .delete()
          .in('id', fieldsToDelete);
        if (deleteError) throw deleteError;
      }

      const fieldsToUpsert = fields.map((field, index) => ({
        id: field.id,
        template_id: templateId,
        field_label: field.field_label,
        field_name: slugify(field.field_label),
        field_type: field.field_type,
        is_required: field.is_required,
        order: index,
      }));

      if (fieldsToUpsert.length > 0) {
        const { error: fieldsError } = await supabase
          .from('template_fields')
          .upsert(fieldsToUpsert);
        if (fieldsError) throw fieldsError;
      }

      toast({ title: "Modelo salvo com sucesso!" });
      onSave();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({ title: "Erro ao salvar modelo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{templateToEdit ? "Editar Modelo" : "Criar Novo Modelo"}</DialogTitle>
          <DialogDescription>
            Configure o nome, descrição e os campos personalizados para este modelo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-1 pr-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do Modelo</Label>
            <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template-description">Descrição (Opcional)</Label>
            <Textarea id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="space-y-4">
            <Label>Campos Personalizados</Label>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="flex items-start gap-2 p-4 border rounded-lg bg-muted/50">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-8 cursor-grab" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Rótulo do Campo</Label>
                      <Input value={field.field_label} onChange={(e) => updateField(index, { field_label: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo do Campo</Label>
                      <Select value={field.field_type} onValueChange={(value) => updateField(index, { field_type: value as TemplateField['field_type'] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto Curto</SelectItem>
                          <SelectItem value="textarea">Texto Longo</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between md:justify-start gap-4 pt-6">
                       <div className="flex items-center space-x-2">
                        <Switch id={`required-${index}`} checked={field.is_required} onCheckedChange={(checked) => updateField(index, { is_required: checked })} />
                        <Label htmlFor={`required-${index}`}>Obrigatório</Label>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeField(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addField}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Campo
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Modelo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}