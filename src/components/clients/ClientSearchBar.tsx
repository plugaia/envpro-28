import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface ClientSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredClientsCount: number;
  totalClientsCount: number;
}

export function ClientSearchBar({ searchTerm, setSearchTerm, filteredClientsCount, totalClientsCount }: ClientSearchBarProps) {
  return (
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
          <Badge variant="secondary">{filteredClientsCount} de {totalClientsCount} clientes</Badge>
        </div>
      </CardContent>
    </Card>
  );
}