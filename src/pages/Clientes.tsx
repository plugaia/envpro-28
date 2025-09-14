import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import InputMask from 'react-input-mask';
import { useClients, type Client } from "@/hooks/useClients";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { nameSchema, emailSchema, phoneSchema } from "@/lib/validation";

const Clientes = () => {
  const { toast } = useToast();
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        email: editingClient.email,
        phone: editingClient.phone,
      });
      setShowForm(true);
    } else {
      setFormData({ name: "", email: "", phone: "" });
    }
  }, [editingClient]);

  const handleOpenForm = (client: Client | null) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      nameSchema.parse(formData.name);
      emailSchema.parse(formData.email);
      phoneSchema.parse(formData.phone);
    } catch (validationError: any) {
      toast({
        title: "Dados inválidos",
        description: validationError.errors?.[0]?.message || "Verifique os campos preenchidos",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    if (editingClient) {
      await updateClient(editingClient.id, formData);
    } else {
      await addClient(formData);
    }
    
    setIsSubmitting(false);
    handleCloseForm();
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    await deleteClient(deletingClient.id);
    setDeletingClient(null);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchTerm)
    );
  });

  const newClientsThisMonth = clients.filter(client => {
    const clientDate = new Date(client.created_at);
    const today = new Date();
    return clientDate.getMonth() === today.getMonth() && clientDate.getFullYear() === today.getFullYear();
  }).length;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus clientes cadastrados</p>
          </div>
        </div>
        <Button onClick={() => handleOpenForm(null)} className="bg-primary hover:bg-primary-hover text-primary-foreground">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="card-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total de Clientes</p>
                      <p className="text-2xl font-bold text-primary">{clients.length}</p>
                    </div>
                    <div className="p-2 rounded-full bg-primary/10"><Users className="w-6 h-6 text-primary" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Novos este mês</p>
                      <p className="text-2xl font-bold text-success">{newClientsThisMonth}</p>
                    </div>
                    <div className="p-2 rounded-full bg-success/10"><Plus className="w-6 h-6 text-success" /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Com WhatsApp</p>
                      <p className="text-2xl font-bold text-warning">{clients.filter(c => c.phone).length}</p>
                    </div>
                    <div className="p-2 rounded-full bg-warning/10"><Users className="w-6 h-6 text-warning" /></div>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                  <Badge variant="secondary">{filteredClients.length} de {clients.length} clientes</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>WhatsApp</TableHead><TableHead>Data de Cadastro</TableHead><TableHead className="text-center">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell><div className="font-medium">{client.name}</div></TableCell>
                          <TableCell className="text-muted-foreground">{client.email}</TableCell>
                          <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(client.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenForm(client)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Editar"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeletingClient(client)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
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
              <Card className="card-elegant"><CardContent className="text-center py-12"><Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3><p className="text-muted-foreground mb-4">{searchTerm ? "Ajuste sua busca ou" : ""} adicione um novo cliente para começar.</p></CardContent></Card>
            )}
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCloseForm} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo*</Label>
                  <Input id="name" placeholder="Nome do cliente" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail*</Label>
                  <Input id="email" type="email" placeholder="cliente@email.com" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp*</Label>
                  <InputMask mask="+55 (99) 99999-9999" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} required>
                    {(inputProps: any) => <Input {...inputProps} id="phone" placeholder="+55 (DD) 99999-9999" type="tel" />}
                  </InputMask>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleCloseForm} className="flex-1" disabled={isSubmitting}>Cancelar</Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary-hover" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar Cliente"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <DeleteConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir ${deletingClient?.name}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

export default Clientes;