import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Send, Plus, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { proposalLimiter, checkRateLimit, formatRemainingTime } from '@/lib/rateLimiter';
import { nameSchema, emailSchema, phoneSchema, numericSchema, textSchema } from '@/lib/validation';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

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

  // Fetch clients when component mounts
  useEffect(() => {
    if (user && useExistingClient) {
      fetchClients();
    }
  }, [user, useExistingClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
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
      setFormData(prev => ({
        ...prev,
        clientName: client.name,
        clientEmail: client.email,
        clientPhone: client.phone,
      }));
    }
  };

  const handleUseExistingClientChange = (checked: boolean) => {
    setUseExistingClient(checked);
    if (!checked) {
      setSelectedClientId("");
      setClientSearch("");
      setFormData(prev => ({
        ...prev,
        clientName: "",
        clientEmail: "",
        clientPhone: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar propostas.",
        variant: "destructive",
      });
      return;
    }

    // Rate limiting check
    const rateLimitCheck = checkRateLimit(proposalLimiter, 'create_proposal', user.id);
    if (!rateLimitCheck.allowed) {
      const remainingTime = formatRemainingTime(rateLimitCheck.remainingTime || 0);
      toast({
        title: "Limite excedido",
        description: `Você está criando propostas muito rapidamente. Tente novamente em ${remainingTime}.`,
        variant: "destructive",
      });
      return;
    }

    // Input validation
    try {
      nameSchema.parse(formData.clientName);
      emailSchema.parse(formData.clientEmail);
      phoneSchema.parse(formData.clientPhone);
      
      const cedibleValue = parseFloat(formData.cedibleValue.replace(/[^\d,]/g, '').replace(',', '.'));
      const proposalValue = parseFloat(formData.proposalValue.replace(/[^\d,]/g, '').replace(',', '.'));
      
      numericSchema(0.01).parse(cedibleValue);
      numericSchema(0.01).parse(proposalValue);
      
      if (formData.processNumber) {
        textSchema(10, 50).parse(formData.processNumber);
      }
      if (formData.organizationName) {
        textSchema(2, 200).parse(formData.organizationName);
      }
      if (formData.description) {
        textSchema(0, 2000).parse(formData.description);
      }
    } catch (validationError: any) {
      toast({
        title: "Dados inválidos",
        description: validationError.errors?.[0]?.message || "Verifique os campos preenchidos",
        variant: "destructive",
      });
      return;
    }
    
    // Validação básica
    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone || 
        !formData.cedibleValue || !formData.proposalValue) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Get user's company_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil de usuário não encontrado');
      }

      let clientId = selectedClientId;

      // If using new client, create or find existing client
      if (!useExistingClient) {
        // First check if client already exists
        const { data: existingClient, error: clientSearchError } = await supabase
          .from('clients')
          .select('id')
          .eq('company_id', profile.company_id)
          .eq('email', formData.clientEmail)
          .maybeSingle();

        if (clientSearchError) throw clientSearchError;

        if (existingClient) {
          clientId = existingClient.id;
        } else {
          // Create new client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert([{
              company_id: profile.company_id,
              name: formData.clientName,
              email: formData.clientEmail,
              phone: formData.clientPhone
            }])
            .select('id')
            .single();

          if (clientError) throw clientError;
          clientId = newClient.id;
        }
      }

      // Create proposal (sensitive data will be stored separately)
      const proposalData = {
        company_id: profile.company_id,
        client_name: formData.clientName,
        process_number: formData.processNumber || null,
        organization_name: formData.organizationName || null,
        cedible_value: parseFloat(formData.cedibleValue.replace(/[^\d,]/g, '').replace(',', '.')),
        proposal_value: parseFloat(formData.proposalValue.replace(/[^\d,]/g, '').replace(',', '.')),
        receiver_type: formData.receiverType,
        description: formData.description || null,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      const { data: proposalResult, error: proposalError } = await supabase
        .from('proposals')
        .insert([proposalData])
        .select()
        .single();

      if (proposalError) throw proposalError;

      // Insert client contact data in separate table
      const { error: contactError } = await supabase
        .from('client_contacts')
        .insert([{
          proposal_id: proposalResult.id,
          client_id: clientId,
          email: formData.clientEmail,
          phone: formData.clientPhone
        }]);

      if (contactError) throw contactError;

      toast({
        title: "Proposta criada",
        description: "A proposta foi criada com sucesso!",
      });
      
      onSubmit();
      onClose();
      
    } catch (error) {
      console.error('Error creating proposal:', error);
      toast({
        title: "Erro ao criar proposta",
        description: "Não foi possível criar a proposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const formattedValue = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
    return formattedValue;
  };

  const handleCurrencyChange = (field: 'cedibleValue' | 'proposalValue') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: formatCurrency(value)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Preencha os dados da proposta:</CardTitle>
            <Badge className="mt-2 bg-success text-success-foreground">Envio Ativo</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Information */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Cliente
              </h3>

              {/* Toggle for existing vs new client */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-existing-client"
                  checked={useExistingClient}
                  onCheckedChange={handleUseExistingClientChange}
                />
                <Label htmlFor="use-existing-client">Usar cliente existente</Label>
              </div>

              {useExistingClient ? (
                <div className="space-y-4">
                  {/* Client search and selection */}
                  <div className="space-y-2">
                    <Label htmlFor="clientSearch">Buscar Cliente</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="clientSearch"
                        placeholder="Digite o nome ou email do cliente..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {clientSearch && (
                    <div className="space-y-2">
                      <Label>Selecionar Cliente</Label>
                      <Select value={selectedClientId} onValueChange={handleClientSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um cliente..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border shadow-md z-50">
                          {filteredClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                <span className="text-sm text-muted-foreground">{client.email}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {filteredClients.length === 0 && (
                            <SelectItem value="no-results" disabled>
                              Nenhum cliente encontrado
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Display selected client info */}
                  {selectedClientId && (
                    <div className="p-3 bg-muted/20 rounded-lg border">
                      <p className="text-sm font-medium">{formData.clientName}</p>
                      <p className="text-sm text-muted-foreground">{formData.clientEmail}</p>
                      <p className="text-sm text-muted-foreground">{formData.clientPhone}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome Completo*</Label>
                      <Input
                        id="clientName"
                        placeholder="Nome completo do cliente"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientEmail">E-mail*</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        placeholder="cliente@email.com"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Telefone/WhatsApp*</Label>
                    <Input
                      id="clientPhone"
                      placeholder="+55 67 99999-9999"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Process Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="processNumber">Número do processo:</Label>
                <Input
                  id="processNumber"
                  placeholder="Informe o número do processo..."
                  value={formData.processNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, processNumber: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organizationName">Nome do Órgão/Devedor</Label>
                <Input
                  id="organizationName"
                  placeholder="Nome da instituição"
                  value={formData.organizationName}
                  onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                />
              </div>
            </div>

            {/* Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedibleValue">Valor Cedível*</Label>
                <Input
                  id="cedibleValue"
                  placeholder="R$ 00,00"
                  value={formData.cedibleValue}
                  onChange={handleCurrencyChange('cedibleValue')}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proposalValue">Valor da proposta Aprovada*</Label>
                <Input
                  id="proposalValue"
                  placeholder="R$ 00,00"
                  value={formData.proposalValue}
                  onChange={handleCurrencyChange('proposalValue')}
                  required
                />
              </div>
            </div>

            {/* Receiver Type */}
            <div className="space-y-3">
              <Label>Selecione o tipo do recebedor*</Label>
              <RadioGroup
                value={formData.receiverType}
                onValueChange={(value: "advogado" | "autor" | "precatorio") => 
                  setFormData(prev => ({ ...prev, receiverType: value }))
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advogado" id="advogado" />
                  <Label htmlFor="advogado">Advogado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="autor" id="autor" />
                  <Label htmlFor="autor">Autor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="precatorio" id="precatorio" />
                  <Label htmlFor="precatorio">Precatório</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Descrição adicional da proposta..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-primary-hover text-primary-foreground px-8"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "SALVANDO..." : "SALVAR PROPOSTA"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}