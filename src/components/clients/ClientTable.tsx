import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Users } from "lucide-react";
import { type Client } from "@/hooks/useClients";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  formatDate: (dateString: string) => string;
  searchTerm: string;
}

export function ClientTable({ clients, onEdit, onDelete, formatDate, searchTerm }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <Card className="card-elegant">
        <CardContent className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mb-4">{searchTerm ? "Ajuste sua busca ou" : ""} adicione um novo cliente para começar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elegant">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Data de Cadastro</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell><div className="font-medium">{client.name}</div></TableCell>
                  <TableCell className="text-muted-foreground">{client.email}</TableCell>
                  <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(client.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(client)} className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" title="Editar"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => onDelete(client)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Excluir"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}