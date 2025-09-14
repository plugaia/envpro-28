import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Package, Text, Hash, Calendar, Mail, Phone } from 'lucide-react';
import { type ProposalTemplate, type TemplateField } from './Templates';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateData extends ProposalTemplate {
  fields: TemplateField[];
}

const iconMap = {
  text: <Text className="h-4 w-4" />,
  textarea: <Text className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
};

export default function TemplateDesigner() {
  const { templateId } = useParams<{ templateId: string }>();
  const { toast } = useToast();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    
    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('proposal_templates')
          .select(`
            *,
            fields:template_fields(*)
          `)
          .eq('id', templateId)
          .single();

        if (error) throw error;
        
        const templateData = {
          ...data,
          fields: data.fields.sort((a, b) => a.order - b.order)
        } as TemplateData;

        setTemplate(templateData);
      } catch (error) {
        console.error("Error fetching template:", error);
        toast({
          title: "Erro ao carregar modelo",
          description: "Não foi possível encontrar os dados do modelo.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, toast]);

  const handleSaveLayout = async () => {
    if (!template) return;
    setSaving(true);
    try {
      // For now, we just save a placeholder. We will implement the actual layout saving later.
      const layout_config = { message: "Layout will be saved here." };

      const { error } = await supabase
        .from('proposal_templates')
        .update({ layout_config })
        .eq('id', template.id);

      if (error) throw error;

      toast({ title: "Layout salvo com sucesso!" });
    } catch (error) {
      console.error("Error saving layout:", error);
      toast({ title: "Erro ao salvar layout", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-1/4 mb-4" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="col-span-3 h-[60vh]" />
          <Skeleton className="col-span-9 h-[60vh]" />
        </div>
      </div>
    );
  }

  if (!template) {
    return <div className="p-6 text-center">Modelo não encontrado.</div>;
  }

  return (
    <DndContext collisionDetection={closestCenter}>
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link to="/templates"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{template.name}</h1>
              <p className="text-sm text-muted-foreground">Modo Design</p>
            </div>
          </div>
          <Button onClick={handleSaveLayout} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Layout'}
          </Button>
        </header>
        <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
          {/* Sidebar with available fields */}
          <aside className="col-span-3 overflow-y-auto border rounded-lg">
            <Card className="h-full shadow-none border-none">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Campos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {template.fields.map(field => (
                  <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md bg-background cursor-grab">
                    {iconMap[field.field_type]}
                    <span className="text-sm font-medium">{field.field_label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Canvas area */}
          <main className="col-span-9 bg-muted/50 border rounded-lg p-4 overflow-y-auto">
            <div className="bg-white h-full w-full max-w-4xl mx-auto shadow-lg p-8">
              <h2 className="text-center text-muted-foreground">Arraste os campos aqui para montar sua proposta</h2>
            </div>
          </main>
        </div>
      </div>
    </DndContext>
  );
}