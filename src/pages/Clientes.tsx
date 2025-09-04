import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  createdAt: Date;
}

const Clientes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [showEditClientForm, setShowEditClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClientData, setNewClientData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
  });
  const [editClientData, setEditClientData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch clients using secure function with role-based access
      const { data: proposals, error } = await supabase
        .rpc('get_user_proposals');

      if (error) throw error;

      // Create unique clients list - only use data user has permission to see
      const uniqueClients = new Map();
      proposals?.forEach((proposal: any) => {
        const key = proposal.client_email;
        if (!uniqueClients.has(key)) {
          const [firstName, ...lastNameParts] = proposal.client_name.split(' ');
          const lastName = lastNameParts.join(' ') || '';
          
          uniqueClients.set(key, {
            id: key, // Use email as unique identifier
            firstName,
            lastName,
            email: proposal.client_email,
            whatsapp: proposal.client_phone || '',
            createdAt: new Date(proposal.created_at)
          });
        }
      });

      setClients(Array.from(uniqueClients.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClientData.firstName || !newClientData.lastName || !newClientData.email || !newClientData.whatsapp) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const newClient: Client = {
      id: crypto.randomUUID(),
      ...newClientData,
      createdAt: new Date(),
    };

    setClients(prev => [newClient, ...prev]);
    setNewClientData({ firstName: "", lastName: "", email: "", whatsapp: "" });
    setShowNewClientForm(false);
    
    toast({
      title: "Cliente adicionado",
      description: `${newClientData.firstName} ${newClientData.lastName} foi adicionado com sucesso.`,
    });
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setClients(prev => prev.filter(c => c.id !== clientId));
    
    toast({
      title: "Cliente removido",
      description: `${client?.firstName} ${client?.lastName} foi removido.`,
    });
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setEditClientData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      whatsapp: client.whatsapp,
    });
    setShowEditClientForm(true);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editClientData.firstName || !editClientData.lastName || !editClientData.email || !editClientData.whatsapp) {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (!editingClient) return;

    setClients(prev => prev.map(client => 
      client.id === editingClient.id 
        ? { ...client, ...editClientData }
        : client
    ));

    setShowEditClientForm(false);
    setEditingClient(null);
    setEditClientData({ firstName: "", lastName: "", email: "", whatsapp: "" });
    
    toast({
      title: "Cliente atualizado",
      description: `${editClientData.firstName} ${editClientData.lastName} foi atualizado com sucesso.`,
    });
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.whatsapp.includes(searchTerm)
    );
  });

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus clientes cadastrados</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setShowNewClientForm(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </header>
      
      <main className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="card-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total de Clientes</p>
                        <p className="text-2xl font-bold text-primary">{clients.length}</p>
                      </div>
                      <div className="p-2 rounded-full bg-primary/10">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Novos este mês</p>
                        <p className="text-2xl font-bold text-success">3</p>
                      </div>
                      <div className="p-2 rounded-full bg-success/10">
                        <Plus className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="card-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Com WhatsApp</p>
                        <p className="text-2xl font-bold text-warning">{clients.length}</p>
                      </div>
                      <div className="p-2 rounded-full bg-warning/10">
                        <Users className="w-6 h-6 text-warning" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search */}
              <Card className="card-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar clientes por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Badge variant="secondary">
                      {filteredClients.length} de {clients.length} clientes
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Clients Table */}
              <Card className="card-elegant">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Nome</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">WhatsApp</TableHead>
                          <TableHead className="font-semibold">Data de Cadastro</TableHead>
                          <TableHead className="text-center font-semibold">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredClients.map((client) => (
                          <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="font-medium">
                                {client.firstName} {client.lastName}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{client.email}</TableCell>
                            <TableCell className="text-muted-foreground">{client.whatsapp}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClient(client)}
                                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {filteredClients.length === 0 && (
                <Card className="card-elegant">
                  <CardContent className="text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? "Ajuste sua busca ou" : ""} adicione um novo cliente para começar.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* New Client Form Modal */}
              {showNewClientForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Novo Cliente</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowNewClientForm(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Nome*</Label>
                            <Input
                              id="firstName"
                              placeholder="Nome"
                              value={newClientData.firstName}
                              onChange={(e) => setNewClientData(prev => ({ ...prev, firstName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Sobrenome*</Label>
                            <Input
                              id="lastName"
                              placeholder="Sobrenome"
                              value={newClientData.lastName}
                              onChange={(e) => setNewClientData(prev => ({ ...prev, lastName: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail*</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="cliente@email.com"
                            value={newClientData.email}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp*</Label>
                          <Input
                            id="whatsapp"
                            placeholder="+55 67 99999-9999"
                            value={newClientData.whatsapp}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNewClientForm(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary-hover"
                          >
                            Salvar Cliente
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Edit Client Form Modal */}
              {showEditClientForm && editingClient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Editar Cliente</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowEditClientForm(false);
                            setEditingClient(null);
                            setEditClientData({ firstName: "", lastName: "", email: "", whatsapp: "" });
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleUpdateClient} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="editFirstName">Nome*</Label>
                            <Input
                              id="editFirstName"
                              placeholder="Nome"
                              value={editClientData.firstName}
                              onChange={(e) => setEditClientData(prev => ({ ...prev, firstName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editLastName">Sobrenome*</Label>
                            <Input
                              id="editLastName"
                              placeholder="Sobrenome"
                              value={editClientData.lastName}
                              onChange={(e) => setEditClientData(prev => ({ ...prev, lastName: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="editEmail">E-mail*</Label>
                          <Input
                            id="editEmail"
                            type="email"
                            placeholder="cliente@email.com"
                            value={editClientData.email}
                            onChange={(e) => setEditClientData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="editWhatsapp">WhatsApp*</Label>
                          <Input
                            id="editWhatsapp"
                            placeholder="+55 67 99999-9999"
                            value={editClientData.whatsapp}
                            onChange={(e) => setEditClientData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowEditClientForm(false);
                              setEditingClient(null);
                              setEditClientData({ firstName: "", lastName: "", email: "", whatsapp: "" });
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary-hover"
                          >
                            Salvar Alterações
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

            </div>
            )}
          </main>
        </div>
    );
};

export default Clientes;