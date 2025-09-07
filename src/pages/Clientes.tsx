import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFetchClients, useDeleteClient, type Client } from "@/hooks/useClients";
import { ClientFormModal } from "@/components/ClientFormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ClientKpiCards } from "@/components/clients/ClientKpiCards";
import { ClientSearchBar } from "@/components/clients/ClientSearchBar";
import { ClientTable } from "@/components/clients/ClientTable";

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

  const clientsWithWhatsApp = useMemo(() => {
    return clients.filter(client => client.phone && client.phone.replace(/[^\d]/g, '').length >= 10).length;
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
            <ClientKpiCards 
              totalClients={clients.length} 
              newClientsThisMonth={newClientsThisMonth} 
              clientsWithWhatsApp={clientsWithWhatsApp} 
            />

            <ClientSearchBar 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm} 
              filteredClientsCount={filteredClients.length} 
              totalClientsCount={clients.length} 
            />

            <ClientTable 
              clients={filteredClients} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              formatDate={formatDate}
              searchTerm={searchTerm}
            />
          </div>
        )}
      </main>

      <ClientFormModal 
        client={editingClient} 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
      <DeleteConfirmDialog 
        isOpen={!!deletingClient} 
        onClose={() => setDeletingClient(null)} 
        onConfirm={confirmDelete} 
        title="Excluir Cliente" 
        description={deletingClient ? `Tem certeza que deseja excluir ${deletingClient.name}? Esta ação não pode ser desfeita.` : ""} 
        loading={deleteClientMutation.isPending} 
      />
    </div>
  );
};

export default Clientes;