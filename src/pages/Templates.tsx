import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, LayoutTemplate, MoreHorizontal, Brush } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TemplateBuilder } from "@/components/TemplateBuilder";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

// Define types for clarity
export interface TemplateField {
  id?: string;
  field_label: string;
  field_name: string;
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'email' | 'phone';
  is_required: boolean;
  order: number;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  fields: TemplateField[];
}

export default function Templates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<ProposalTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: templatesData, error: templatesError } = await supabase
        .from('proposal_templates')
        .select(`
          id,
          name,
          description,
          created_at,
          template_fields (
            id,
            field_label,
            field_name,
            field_type,
            is_required,
            order
          )
        `)
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      const formattedTemplates = templatesData.map(t => ({
        ...t,
        fields: t.template_fields.sort((a, b) => a.order - b.order)
      })) as ProposalTemplate[];

      setTemplates(formattedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível buscar os modelos de proposta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBuilder = (template: ProposalTemplate | null = null) => {
    setEditingTemplate(template);
    setIsBuilderOpen(true);
  };

  const handleSave = () => {
    setIsBuilderOpen(false);
    setEditingTemplate(null);
    fetchTemplates(); // Refresh list
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;

    try {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', deletingTemplate.id);

      if (error) throw error;

      toast({
        title: "Template excluído",
        description: `O modelo "${deletingTemplate.name}" foi removido.`,
      });
      setDeletingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível remover o modelo.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Modelos de Proposta</h1>
          <p className="text-base text-muted-foreground">Crie e gerencie campos personalizados para suas propostas.</p>
        </div>
        <Button onClick={() => handleOpenBuilder()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modelos Salvos</CardTitle>
          <CardDescription>
            Aqui estão todos os modelos de proposta que você criou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando modelos...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LayoutTemplate className="mx-auto h-12 w-12 opacity-50 mb-4" />
              <h3 className="text-lg font-semibold">Nenhum modelo encontrado</h3>
              <p>Clique em "Novo Modelo" para criar seu primeiro.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Modelo</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.fields.length}</TableCell>
                    <TableCell>{format(new Date(template.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link to={`/templates/${template.id}/design`}>
                              <Brush className="mr-2 h-4 w-4" />
                              Design
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenBuilder(template)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingTemplate(template)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isBuilderOpen && (
        <TemplateBuilder
          isOpen={isBuilderOpen}
          onClose={() => {
            setIsBuilderOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSave}
          templateToEdit={editingTemplate}
        />
      )}

      {deletingTemplate && (
        <DeleteConfirmDialog
          isOpen={!!deletingTemplate}
          onClose={() => setDeletingTemplate(null)}
          onConfirm={handleDelete}
          title="Excluir Modelo"
          description={`Tem certeza que deseja excluir o modelo "${deletingTemplate.name}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}