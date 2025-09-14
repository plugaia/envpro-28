import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, Plus, Edit, Trash2, X, GripVertical, Copy, Blocks } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { type Database, type Json } from "@/integrations/supabase/types";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Template = Database['public']['Tables']['proposal_templates']['Row'];
type TemplateField = Database['public']['Tables']['template_fields']['Row'];
type TemplateWithFields = Template & { template_fields: TemplateField[], layout_config: Json | null };

const Templates = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateWithFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<TemplateWithFields> | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithFields | null>(null);

  const fetchTemplates = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select(`*, template_fields(*)`)
        .order('name');
      
      if (error) throw error;
      setTemplates(data as TemplateWithFields[] || []);
    } catch (error: any) {
      toast({ title: "Erro ao carregar templates", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (isAdmin) {
      fetchTemplates();
    } else {
      setLoading(false);
    }
  }, [isAdmin, user, authLoading]);

  const handleOpenDialog = (template: Partial<TemplateWithFields> | null) => {
    setEditingTemplate(template);
    setShowDialog(true);
  };

  const handleDuplicate = (templateToDuplicate: TemplateWithFields) => {
    const newTemplateSeed: Partial<TemplateWithFields> = {
      ...templateToDuplicate,
      name: `${templateToDuplicate.name} (Cópia)`,
      template_fields: templateToDuplicate.template_fields.map(f => {
        const newField: Partial<TemplateField> = { ...f };
        delete newField.id;
        delete newField.template_id;
        return newField;
      })
    };
    delete newTemplateSeed.id;
    
    handleOpenDialog(newTemplateSeed);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      const { error } = await supabase.from('proposal_templates').delete().eq('id', deletingTemplate.id);
      if (error) throw error;
      toast({ title: "Template excluído", description: "O template foi removido com sucesso." });
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Acesso Negado</CardTitle><CardDescription>Apenas administradores podem gerenciar templates.</CardDescription></CardHeader>
          <CardContent><p>Contate o administrador da sua empresa para obter acesso a esta funcionalidade.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Templates de Propostas</h2>
          <p className="text-base text-muted-foreground">Crie e gerencie seus templates para agilizar a criação de propostas.</p>
        </div>
        <Button onClick={() => handleOpenDialog(null)}><Plus className="w-4 h-4 mr-2" /> Novo Template</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nome do Template</TableHead><TableHead>Nº de Campos</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {templates.length > 0 ? templates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.template_fields.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template)}><Copy className="w-4 h-4 mr-2" /> Duplicar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(template)}><Edit className="w-4 h-4 mr-2" /> Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingTemplate(template)}><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">Nenhum template criado ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showDialog && <TemplateFormDialog isOpen={showDialog} onClose={() => setShowDialog(false)} template={editingTemplate} onSave={fetchTemplates} />}
      <DeleteConfirmDialog isOpen={!!deletingTemplate} onClose={() => setDeletingTemplate(null)} onConfirm={handleDelete} title="Excluir Template" description={`Tem certeza que deseja excluir o template "${deletingTemplate?.name}"? Esta ação não pode ser desfeita.`} />
    </div>
  );
};

const generateFieldName = (label: string) => {
  return label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '_');
};

interface TemplateFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template: Partial<TemplateWithFields> | null;
  onSave: () => void;
}

const SortableFieldItem = ({ field, updateField, removeField }: { field: Partial<TemplateField>, updateField: (id: any, updatedField: Partial<TemplateField>) => void, removeField: (id: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id! });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/50">
      <GripVertical {...attributes} {...listeners} className="w-5 h-5 mt-8 text-muted-foreground cursor-grab" />
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2"><Label>Rótulo do Campo</Label><Input value={field.field_label} onChange={(e) => updateField(field.id!, { field_label: e.target.value })} placeholder="Ex: Valor da Causa" /></div>
        <div className="space-y-2"><Label>Tipo do Campo</Label><Select value={field.field_type} onValueChange={(value) => updateField(field.id!, { field_type: value as any })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">Texto Curto</SelectItem><SelectItem value="textarea">Texto Longo</SelectItem><SelectItem value="number">Número</SelectItem><SelectItem value="date">Data</SelectItem></SelectContent></Select></div>
        <div className="space-y-2"><Label>Obrigatório</Label><div className="flex items-center h-10"><Switch checked={field.is_required} onCheckedChange={(checked) => updateField(field.id!, { is_required: checked })} /></div></div>
      </div>
      <Button variant="ghost" size="icon" className="mt-6 text-destructive hover:text-destructive" onClick={() => removeField(field.id!)}><X className="w-4 h-4" /></Button>
    </div>
  );
};

const blockNames = {
  key_info: "Informações Chave",
  values: "Valores",
  description: "Descrição",
  custom_fields: "Campos Personalizados",
  contact: "Contato do Responsável",
};

const SortableLayoutItem = ({ block }: { block: { id: string, type: string } }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
      <GripVertical {...attributes} {...listeners} className="w-5 h-5 text-muted-foreground cursor-grab" />
      <Blocks className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">{blockNames[block.type as keyof typeof blockNames] || block.type}</span>
    </div>
  );
};

const TemplateFormDialog = ({ isOpen, onClose, template, onSave }: TemplateFormDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(template?.name || "");
  const [description, setDescription] = useState(template?.description || "");
  const [fields, setFields] = useState<Partial<TemplateField>[]>(template?.template_fields?.sort((a, b) => a.order - b.order) || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultLayout = [
    { type: 'key_info', id: 'key_info' }, { type: 'values', id: 'values' }, { type: 'description', id: 'description' }, { type: 'custom_fields', id: 'custom_fields' }, { type: 'contact', id: 'contact' }
  ];
  const [layout, setLayout] = useState(template?.layout_config ? (template.layout_config as any[]) : defaultLayout);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const addField = () => {
    const newField: Partial<TemplateField> = { id: `new-${Date.now()}`, field_label: "", field_name: "", field_type: "text", is_required: false, order: fields.length };
    setFields([...fields, newField]);
  };

  const updateField = (id: any, updatedField: Partial<TemplateField>) => {
    setFields(fields.map(f => {
      if (f.id === id) {
        const newField = { ...f, ...updatedField };
        if (updatedField.field_label !== undefined && updatedField.field_label !== f.field_label) {
          newField.field_name = generateFieldName(updatedField.field_label);
        }
        return newField;
      }
      return f;
    }));
  };

  const removeField = (id: any) => setFields(fields.filter((f) => f.id !== id));

  const handleDragEnd = (event: { active: any; over: any; }, context: 'fields' | 'layout') => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const setter = context === 'fields' ? setFields : setLayout;
      setter((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!name) {
      toast({ title: "Erro de validação", description: "O nome do template é obrigatório.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('user_id', user.id).single();
      if (!profile) throw new Error("Perfil não encontrado.");

      const { data: savedTemplate, error: templateError } = await supabase.from('proposal_templates').upsert({
        id: template?.id, company_id: profile.company_id, name, description, created_by: user.id, layout_config: layout,
      }).select().single();
      
      if (templateError) throw templateError;

      const fieldsToSave = fields.map((field, index) => ({
        id: field.id?.startsWith('new-') ? undefined : field.id, template_id: savedTemplate.id, field_label: field.field_label, field_name: field.field_name || generateFieldName(field.field_label || ''), field_type: field.field_type, is_required: field.is_required, order: index,
      }));

      const fieldsToDelete = template?.id && template.template_fields ? template.template_fields.filter(oldField => !fieldsToSave.some(newField => newField.id === oldField.id)).map(f => f.id) : [];
      if (fieldsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('template_fields').delete().in('id', fieldsToDelete);
        if (deleteError) throw deleteError;
      }

      const { error: fieldsError } = await supabase.from('template_fields').upsert(fieldsToSave);
      if (fieldsError) throw fieldsError;

      toast({ title: "Template salvo!", description: "O template foi salvo com sucesso." });
      onSave();
      onClose();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader><DialogTitle>{template?.id ? "Editar Template" : "Novo Template"}</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto p-1 pr-4 space-y-6">
          <div className="space-y-2"><Label htmlFor="template-name">Nome do Template</Label><Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Proposta de Honorários" /></div>
          <div className="space-y-2"><Label htmlFor="template-description">Texto Base da Proposta (Descrição)</Label><Textarea id="template-description" value={description || ''} onChange={(e) => setDescription(e.target.value)} placeholder="Insira o texto padrão que aparecerá na descrição da proposta..." rows={5} /></div>
          <Alert><AlertTitle className="text-sm font-semibold">Variáveis Disponíveis</AlertTitle><AlertDescription className="text-xs">Use as variáveis abaixo no texto. Elas serão substituídas pelos dados da proposta.<div className="flex flex-wrap gap-1 mt-2"><Badge variant="outline">{'{{client_name}}'}</Badge><Badge variant="outline">{'{{process_number}}'}</Badge><Badge variant="outline">{'{{organization_name}}'}</Badge><Badge variant="outline">{'{{cedible_value}}'}</Badge><Badge variant="outline">{'{{proposal_value}}'}</Badge></div></AlertDescription></Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium mb-2">Campos do Formulário</h3>
              <div className="space-y-3"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'fields')}><SortableContext items={fields.map(f => f.id!)} strategy={verticalListSortingStrategy}>{fields.map((field) => (<SortableFieldItem key={field.id} field={field} updateField={updateField} removeField={removeField} />))}</SortableContext></DndContext><Button variant="outline" onClick={addField}><Plus className="w-4 h-4 mr-2" /> Adicionar Campo</Button></div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Layout da Proposta</h3>
              <div className="space-y-3"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'layout')}><SortableContext items={layout.map(b => b.id)} strategy={verticalListSortingStrategy}>{layout.map((block) => (<SortableLayoutItem key={block.id} block={block} />))}</SortableContext></DndContext></div>
            </div>
          </div>
        </div>
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button></DialogClose><Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Template"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Templates;