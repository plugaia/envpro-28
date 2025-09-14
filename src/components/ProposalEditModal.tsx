"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type Proposal } from "./ProposalCard";
import InputMask from 'react-input-mask';
import { type Database } from "@/integrations/supabase/types";

type Template = Database['public']['Tables']['proposal_templates']['Row'];
type TemplateField = Database['public']['Tables']['template_fields']['Row'];
type TemplateWithFields = Template & { template_fields: TemplateField[] };

interface ProposalEditModalProps {
  proposal: Proposal;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProposalEditModal({ proposal, isOpen, onClose, onUpdate }: ProposalEditModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [template, setTemplate] = useState<TemplateWithFields | null>(null);
  const [formData, setFormData] = useState({
    clientName: proposal.clientName,
    clientEmail: proposal.clientEmail,
    clientPhone: proposal.clientPhone,
    processNumber: proposal.processNumber || "",
    organizationName: proposal.organizationName || "",
    cedibleValue: proposal.cedibleValue,
    proposalValue: proposal.proposalValue,
    receiverType: proposal.receiverType,
    status: proposal.status,
    description: "",
    customFieldData: {} as { [key: string]: any },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchProposalDetails = async () => {
        setDetailsLoading(true);
        try {
          const { data: fullProposal, error: proposalError } = await supabase
            .from('proposals')
            .select('description, custom_fields_data, template_id')
            .eq('id', proposal.id)
            .single();

          if (proposalError) throw proposalError;

          const customData = fullProposal?.custom_fields_data as { [key: string]: any } || {};

          if (fullProposal?.template_id) {
            const { data: templateData, error: templateError } = await supabase
              .from('proposal_templates')
              .select('*, template_fields(*)')
              .eq('id', fullProposal.template_id)
              .single();
            if (templateError) throw templateError;
            setTemplate(templateData as TemplateWithFields);
          } else {
            setTemplate(null);
          }

          setFormData({
            clientName: proposal.clientName,
            clientEmail: proposal.clientEmail,
            clientPhone: proposal.clientPhone,
            processNumber: proposal.processNumber || "",
            organizationName: proposal.organizationName || "",
            cedibleValue: proposal.cedibleValue,
            proposalValue: proposal.proposalValue,
            receiverType: proposal.receiverType,
            status: proposal.status,
            description: fullProposal?.description || "",
            customFieldData: customData,
          });
        } catch (error) {
          console.error("Error fetching proposal details:", error);
          toast({ title: "Erro ao carregar detalhes", description: "Não foi possível carregar os dados completos da proposta.", variant: "destructive" });
          // Fallback to basic data
          setFormData({
            clientName: proposal.clientName,
            clientEmail: proposal.clientEmail,
            clientPhone: proposal.clientPhone,
            processNumber: proposal.processNumber || "",
            organizationName: proposal.organizationName || "",
            cedibleValue: proposal.cedibleValue,
            proposalValue: proposal.proposalValue,
            receiverType: proposal.receiverType,
            status: proposal.status,
            description: proposal.description || "",
            customFieldData: {},
          });
        } finally {
          setDetailsLoading(false);
        }
      };

      fetchProposalDetails();
    }
  }, [proposal, isOpen, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update proposal (sensitive data handled separately)
      const { error: proposalError } = await supabase
        .from('proposals')
        .update({
          client_name: formData.clientName,
          process_number: formData.processNumber || null,
          organization_name: formData.organizationName || null,
          cedible_value: formData.cedibleValue,
          proposal_value: formData.proposalValue,
          receiver_type: formData.receiverType,
          status: formData.status,
          description: formData.description || null,
          custom_fields_data: formData.customFieldData,
          updated_at: new Date().toISOString()
        })
        .eq('id', proposal.id);

      if (proposalError) throw proposalError;

      // Update client contact data in separate table
      const { error: contactError } = await supabase
        .from('client_contacts')
        .upsert({
          proposal_id: proposal.id,
          email: formData.clientEmail,
          phone: formData.clientPhone,
        }, { onConflict: 'proposal_id' });

      if (contactError) throw contactError;

      toast({
        title: "Proposta atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFieldData: {
        ...prev.customFieldData,
        [fieldName]: value,
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proposta</DialogTitle>
        </DialogHeader>

        {detailsLoading ? (
          <div className="flex items-center justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email do Cliente *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange("clientEmail", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone do Cliente *</Label>
              <InputMask
                mask="+55 (99) 99999-9999"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange("clientPhone", e.target.value)}
                required
              >
                {(inputProps: any) => (
                  <Input
                    {...inputProps}
                    id="clientPhone"
                    placeholder="+55 (DD) 99999-9999"
                    type="tel"
                  />
                )}
              </InputMask>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processNumber">Número do Processo</Label>
                <Input
                  id="processNumber"
                  value={formData.processNumber}
                  onChange={(e) => handleInputChange("processNumber", e.target.value)}
                  placeholder="Ex: 0000000-00.0000.0.00.0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Órgão/Devedor</Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                  placeholder="Ex: Prefeitura Municipal"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedibleValue">Valor Cedível (R$) *</Label>
                <Input
                  id="cedibleValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cedibleValue}
                  onChange={(e) => handleInputChange("cedibleValue", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposalValue">Valor da Proposta (R$) *</Label>
                <Input
                  id="proposalValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.proposalValue}
                  onChange={(e) => handleInputChange("proposalValue", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiverType">Tipo de Receptor *</Label>
                <Select
                  value={formData.receiverType}
                  onValueChange={(value) => handleInputChange("receiverType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advogado">Advogado</SelectItem>
                    <SelectItem value="autor">Autor</SelectItem>
                    <SelectItem value="precatorio">Precatório</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descrição adicional da proposta..."
                rows={3}
              />
            </div>

            {template && template.template_fields.length > 0 && (
              <div className="space-y-4 p-4 border-t">
                <h3 className="font-medium text-foreground">Campos Personalizados: {template.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.template_fields.sort((a, b) => a.order - b.order).map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`custom-${field.field_name}`}>{field.field_label}{field.is_required && '*'}</Label>
                      {field.field_type === 'textarea' ? (
                        <Textarea id={`custom-${field.field_name}`} value={formData.customFieldData[field.field_name] || ''} onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)} required={field.is_required} />
                      ) : (
                        <Input id={`custom-${field.field_name}`} type={field.field_type} value={formData.customFieldData[field.field_name] || ''} onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)} required={field.is_required} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}