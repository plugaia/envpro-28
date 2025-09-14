import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { type ProposalTemplate, type TemplateField } from './Templates';
import { Skeleton } from '@/components/ui/skeleton';
import SidebarPalette from '@/components/template-designer/SidebarPalette';
import CanvasBlock from '@/components/template-designer/CanvasBlock';
import { LayoutBlock } from '@/components/template-designer/types';
// ADIÇÃO: importar gerador de id
import { newId } from '@/components/template-designer/types';

interface TemplateData extends ProposalTemplate {
  fields: TemplateField[];
  layout_config?: any;
}

export default function TemplateDesigner() {
  const { templateId } = useParams<{ templateId: string }>();
  const { toast } = useToast();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!templateId) return;
    const fetchTemplate = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('proposal_templates')
        .select(`
          *,
          fields:template_fields(*)
        `)
        .eq('id', templateId)
        .single();

      if (error) {
        console.error("Error fetching template:", error);
        toast({
          title: "Erro ao carregar modelo",
          description: "Não foi possível encontrar os dados do modelo.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const templateData = {
        ...data,
        fields: (data as any).fields?.sort((a: any, b: any) => a.order - b.order) || []
      } as TemplateData;

      setTemplate(templateData);

      // Carrega layout_config se existir e normaliza IDs dos blocos
      const parsedRaw = Array.isArray(templateData.layout_config) ? (templateData.layout_config as any[]) : [];
      const normalized: LayoutBlock[] = parsedRaw.map((b: any, idx: number) => ({
        ...b,
        id: (typeof b?.id === 'string' && b.id.length > 0) ? b.id : `blk_${idx}_${newId()}`
      }));
      setBlocks(normalized);
      setLoading(false);
    };

    fetchTemplate();
  }, [templateId, toast]);

  const handleAddBlock = (block: LayoutBlock) => {
    setBlocks((prev) => [...prev, block]);
  };

  const handleUpdateBlock = (id: string, updated: LayoutBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev.slice();
      const arr = prev.slice();
      const [moved] = arr.splice(oldIndex, 1);
      arr.splice(newIndex, 0, moved);
      return arr;
    });
  };

  const handleSaveLayout = async () => {
    if (!template) return;
    setSaving(true);

    const { error } = await supabase
      .from('proposal_templates')
      .update({ layout_config: blocks })
      .eq('id', template.id);

    if (error) {
      console.error("Error saving layout:", error);
      toast({ title: "Erro ao salvar layout", variant: "destructive" });
    } else {
      toast({ title: "Layout salvo com sucesso!" });
    }
    setSaving(false);
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

  const sortableIds = useMemo(() => blocks.map((b) => b.id), [blocks]);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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
          <aside className="col-span-3 overflow-y-auto border rounded-lg">
            <SidebarPalette fields={template.fields} onAdd={handleAddBlock} />
          </aside>

          <main className="col-span-9 bg-muted/50 border rounded-lg p-4 overflow-y-auto">
            <div className="bg-white min-h-[70vh] w-full max-w-4xl mx-auto shadow-lg p-8 space-y-3">
              {/* Mantém SortableContext sempre presente para árvore consistente */}
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {blocks.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">
                    Arraste para reordenar e use a paleta ao lado para adicionar elementos.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {blocks.map((block) => (
                      <CanvasBlock
                        key={block.id}
                        block={block}
                        onChange={(updated) => handleUpdateBlock(block.id, updated)}
                        onDelete={() => handleDeleteBlock(block.id)}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </div>
          </main>
        </div>
      </div>
    </DndContext>
  );
}