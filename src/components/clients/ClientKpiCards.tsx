import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";

interface ClientKpiCardsProps {
  totalClients: number;
  newClientsThisMonth: number;
  clientsWithWhatsApp: number;
}

export function ClientKpiCards({ totalClients, newClientsThisMonth, clientsWithWhatsApp }: ClientKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold text-primary">{totalClients}</p>
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
              <p className="text-2xl font-bold text-warning">{clientsWithWhatsApp}</p>
            </div>
            <div className="p-2 rounded-full bg-warning/10"><Users className="w-6 h-6 text-warning" /></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}