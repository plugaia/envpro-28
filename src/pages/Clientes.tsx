import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFetchClients, useDeleteClient, type Client } from "@/hooks/useClients";
import { ClientFormModal } from "@/components/ClientFormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useFetchClients();
  const deleteClientMutation = useDeleteClient();

  const handleAddNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
  };

  const confirmDelete = () => {
    if (deletingClient) {
      deleteClientMutation.mutate(deletingClient.id);
      setDeletingClient(null);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.includes(searchTerm)
      );
    });
  }, [clients, searchTerm]);

  const newClientsThisMonth = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return clients.filter(client => {
      const createdAt = new Date(client.created_at);
      return createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    }).length;
  }, [clients]);

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
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary-hover text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </header>
      
      <main className="flex-1 p-6">
        {isLoading ? (
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
                    <Input placeholder="Buscar clientes por nome, email ou telefone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(client)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Editar"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(client)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
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
                  <p className="text-muted-foreground mb-4">{searchTerm ? "Ajuste sua busca ou" : ""} adicione um novo cliente para começar.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <ClientFormModal client={editingClient} isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
      <DeleteConfirmDialog isOpen={!!deletingClient} onClose={() => setDeletingClient(null)} onConfirm={confirmDelete} title="Excluir Cliente" description={deletingClient ? `Tem certeza que deseja excluir ${deletingClient.name}? Esta ação não pode ser desfeita.` : ""} loading={deleteClientMutation.isPending} />
    </div>
  );
};

export default Clientes;