"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, User, Search, LayoutTemplate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { proposalLimiter, checkRateLimit, formatRemainingTime } from '@/lib/rateLimiter';
import { nameSchema, emailSchema, phoneSchema, numericSchema, textSchema } from '@/lib/validation';
import InputMask from 'react-input-mask';
import { type Database } from "@/integrations/supabase/types";

type Client = Database['public']['Tables']['clients']['Row'];
type Template = Database['public']['Tables']['proposal_templates']['Row'];
type TemplateField = Database['public']['Tables']['template_fields']['Row'];
type TemplateWithFields = Template & { template_fields: TemplateField[] };

interface ProposalFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function ProposalForm({ onClose, onSubmit }: ProposalFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [useExistingClient, setUseExistingClient] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearch, setClientSearch] = useState("");
  
  const [templates, setTemplates] = useState<TemplateWithFields[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customFieldData, setCustomFieldData] = useState<{ [key: string]: any }>({});
  const [rawDescription, setRawDescription] = useState("");

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "", 
    clientPhone: "",
    processNumber: "",
    organizationName: "",
    cedibleValue: "",
    proposalValue: "",
    receiverType: "advogado" as "advogado" | "autor" | "precatorio",
    description: "",
  });

  useEffect(() => {
    if (user) {
      if (useExistingClient) fetchClients();
      fetchTemplates();
    }
  }, [user, useExistingClient]);

  useEffect(() => {
    if (!selectedTemplateId) return;

    const parsedDescription = rawDescription
      .replace(/{{client_name}}/g, formData.clientName || '')
      .replace(/{{process_number}}/g, formData.processNumber || '')
      .replace(/{{organization_name}}/g, formData.organizationName || '')
      .replace(/{{cedible_value}}/g, formData.cedibleValue || 'R$ 0,00')
      .replace(/{{proposal_value}}/g, formData.proposalValue || 'R$ 0,00');

    setFormData(prev => ({ ...prev, description: parsedDescription }));

  }, [formData.clientName, formData.processNumber, formData.organizationName, formData.cedibleValue, formData.proposalValue, rawDescription, selectedTemplateId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({ title: "Erro ao carregar clientes", variant: "destructive" });
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase.from('proposal_templates').select(`*, template_fields(*)`).order('name');
      if (error) throw error;
      setTemplates(data as TemplateWithFields[] || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({ title: "Erro ao carregar templates", variant: "destructive" });
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientId(clientId);
      setFormData(prev => ({ ...prev, clientName: client.name, clientEmail: client.email, clientPhone: client.phone }));
    }
  };

  const handleUseExistingClientChange = (checked: boolean) => {
    setUseExistingClient(checked);
    if (!checked) {
      setSelectedClientId("");
      setClientSearch("");
      setFormData(prev => ({ ...prev, clientName: "", clientEmail: "", clientPhone: "" }));
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const newTemplateId = templateId === 'none' ? '' : templateId;
    setSelectedTemplateId(newTemplateId);
    const template = templates.find(t => t.id === newTemplateId);
    if (template) {
      const templateDescription = template.description || "";
      setRawDescription(templateDescription);
      const initialCustomData: { [key: string]: any } = {};
      template.template_fields.forEach(field => {
        initialCustomData[field.field_name] = '';
      });
      setCustomFieldData(initialCustomData);
    } else {
      setRawDescription("");
      setFormData(prev => ({ ...prev, description: "" }));
      setCustomFieldData({});
    }
  };

  const handleCustomFieldChange = (fieldName: string, value: any) => {
    setCustomFieldData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Erro de autenticação", variant: "destructive" });
      return;
    }

    const rateLimitCheck = checkRateLimit(proposalLimiter, 'create_proposal', user.id);
    if (!rateLimitCheck.allowed) {
      toast({ title: "Limite excedido", description: `Tente novamente em ${formatRemainingTime(rateLimitCheck.remainingTime || 0)}.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Validation
      nameSchema.parse(formData.clientName);
      emailSchema.parse(formData.clientEmail);
      phoneSchema.parse(formData.clientPhone);
      const cedibleValue = parseFloat(formData.cedibleValue.replace(/[^\d,]/g, '').replace(',', '.'));
      const proposalValue = parseFloat(formData.proposalValue.replace(/[^\d,]/g, '').replace(',', '.'));
      numericSchema(0.01).parse(cedibleValue);
      numericSchema(0.01).parse(proposalValue);
      if (formData.processNumber) textSchema(10, 50).parse(formData.processNumber);
      if (formData.organizationName) textSchema(2, 200).parse(formData.organizationName);
      if (formData.description) textSchema(0, 5000).parse(formData.description);

      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate) {
        for (const field of selectedTemplate.template_fields) {
          if (field.is_required && !customFieldData[field.field_name]) {
            throw new Error(`O campo "${field.field_label}" é obrigatório.`);
          }
        }
      }

      const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('user_id', user.id).single();
      if (profileError || !profile) throw new Error('Perfil de usuário não encontrado');

      let clientId = selectedClientId;
      if (!useExistingClient) {
        const { data: existingClient } = await supabase.from('clients').select('id').eq('company_id', profile.company_id).eq('email', formData.clientEmail).maybeSingle();
        if (existingClient) {
          clientId = existingClient.id;
        } else {
          const { data: newClient, error: clientError } = await supabase.from('clients').insert([{ company_id: profile.company_id, name: formData.clientName, email: formData.clientEmail, phone: formData.clientPhone }]).select('id').single();
          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      const proposalData = {
        company_id: profile.company_id,
        client_name: formData.clientName,
        process_number: formData.processNumber || null,
        organization_name: formData.organizationName || null,
        cedible_value: cedibleValue,
        proposal_value: proposalValue,
        receiver_type: formData.receiverType,
        description: formData.description || null,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        template_id: selectedTemplateId || null,
        custom_fields_data: Object.keys(customFieldData).length > 0 ? customFieldData : null,
      };

      const { data: proposalResult, error: proposalError } = await supabase.from('proposals').insert([proposalData]).select().single();
      if (proposalError) throw proposalError;

      const { error: contactError } = await supabase.from('client_contacts').insert([{ proposal_id: proposalResult.id, client_id: clientId, email: formData.clientEmail, phone: formData.clientPhone }]);
      if (contactError) throw contactError;

      toast({ title: "Proposta criada", description: "A proposta foi criada com sucesso!" });
      onSubmit();
      onClose();
    } catch (error: any) {
      toast({ title: "Dados inválidos", description: error.message || "Verifique os campos preenchidos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return "";
    const floatValue = parseFloat(numericValue) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(floatValue);
  };

  const handleCurrencyChange = (field: 'cedibleValue' | 'proposalValue') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: formatCurrency(value) }));
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Preencha os dados da proposta:</CardTitle>
            <Badge className="mt-2 bg-success text-success-foreground">Envio Ativo</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium text-foreground flex items-center gap-2"><User className="w-4 h-4" />Informações do Cliente</h3>
              <div className="flex items-center space-x-2"><Switch id="use-existing-client" checked={useExistingClient} onCheckedChange={handleUseExistingClientChange} /><Label htmlFor="use-existing-client">Usar cliente existente</Label></div>
              {useExistingClient ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientSearch">Buscar Cliente</Label>
                    <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="clientSearch" placeholder="Digite o nome ou email do cliente..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="pl-10" /></div>
                  </div>
                  {clientSearch && (
                    <div className="space-y-2">
                      <Label>Selecionar Cliente</Label>
                      <Select value={selectedClientId} onValueChange={handleClientSelect}>
                        <SelectTrigger><SelectValue placeholder="Escolha um cliente..." /></SelectTrigger>
                        <SelectContent>
                          {filteredClients.map((client) => (<SelectItem key={client.id} value={client.id}><div className="flex flex-col"><span className="font-medium">{client.name}</span><span className="text-sm text-muted-foreground">{client.email}</span></div></SelectItem>))}
                          {filteredClients.length === 0 && (<SelectItem value="no-results" disabled>Nenhum cliente encontrado</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedClientId && (<div className="p-3 bg-muted/20 rounded-lg border"><p className="text-sm font-medium">{formData.clientName}</p><p className="text-sm text-muted-foreground">{formData.clientEmail}</p><p className="text-sm text-muted-foreground">{formData.clientPhone}</p></div>)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="clientName">Nome Completo*</Label><Input id="clientName" placeholder="Nome completo do cliente" value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} required /></div>
                    <div className="space-y-2"><Label htmlFor="clientEmail">E-mail*</Label><Input id="clientEmail" type="email" placeholder="cliente@email.com" value={formData.clientEmail} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} required /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="clientPhone">Telefone/WhatsApp*</Label><InputMask mask="+55 (99) 99999-9999" value={formData.clientPhone} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} required>{(inputProps: any) => (<Input {...inputProps} id="clientPhone" placeholder="+55 (DD) 99999-9999" type="tel" />)}</InputMask></div>
                </div>
              )}
            </div>

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium text-foreground flex items-center gap-2"><LayoutTemplate className="w-4 h-4" />Informações da Proposta</h3>
              <div className="space-y-2">
                <Label htmlFor="template">Usar Template (Opcional)</Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger id="template"><SelectValue placeholder="Selecione um template..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {templates.map(template => (<SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="processNumber">Número do processo:</Label><Input id="processNumber" placeholder="Informe o número do processo..." value={formData.processNumber} onChange={(e) => setFormData(prev => ({ ...prev, processNumber: e.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="organizationName">Nome do Órgão/Devedor</Label><Input id="organizationName" placeholder="Nome da instituição" value={formData.organizationName} onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="cedibleValue">Valor Cedível*</Label><Input id="cedibleValue" placeholder="R$ 0,00" value={formData.cedibleValue} onChange={handleCurrencyChange('cedibleValue')} required /></div>
                <div className="space-y-2"><Label htmlFor="proposalValue">Valor da proposta Aprovada*</Label><Input id="proposalValue" placeholder="R$ 0,00" value={formData.proposalValue} onChange={handleCurrencyChange('proposalValue')} required /></div>
              </div>
              <div className="space-y-3">
                <Label>Selecione o tipo do recebedor*</Label>
                <RadioGroup value={formData.receiverType} onValueChange={(value: "advogado" | "autor" | "precatorio") => setFormData(prev => ({ ...prev, receiverType: value }))} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="advogado" id="advogado" /><Label htmlFor="advogado">Advogado</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="autor" id="autor" /><Label htmlFor="autor">Autor</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="precatorio" id="precatorio" /><Label htmlFor="precatorio">Precatório</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (será preenchida pelo template)</Label>
                <Textarea id="description" placeholder="Descrição adicional da proposta..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={5} readOnly={!!selectedTemplateId} />
                {selectedTemplateId && <p className="text-xs text-muted-foreground mt-1">A descrição é preenchida automaticamente. Para editar, desmarque o template ou altere o conteúdo na página de Templates.</p>}
              </div>
            </div>

            {selectedTemplate && selectedTemplate.template_fields.length > 0 && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium text-foreground">Campos do Template: {selectedTemplate.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.template_fields.sort((a, b) => a.order - b.order).map(field => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={`custom-${field.field_name}`}>{field.field_label}{field.is_required && '*'}</Label>
                      {field.field_type === 'textarea' ? (
                        <Textarea id={`custom-${field.field_name}`} value={customFieldData[field.field_name] || ''} onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)} required={field.is_required} />
                      ) : (
                        <Input id={`custom-${field.field_name}`} type={field.field_type} value={customFieldData[field.field_name] || ''} onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)} required={field.is_required} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-hover text-primary-foreground px-8"><Send className="w-4 h-4 mr-2" />{loading ? "SALVANDO..." : "SALVAR PROPOSTA"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}