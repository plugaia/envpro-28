import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle } from "lucide-react";

interface KpiCardsProps {
  stats: {
    totalProposals: number;
    approvedProposals: number;
    pendingProposals: number;
    rejectedProposals: number;
    totalValue: number;
    approvedValue: number;
    avgValue: number;
    conversionRate: number;
  };
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function KpiCards({ stats, formatCurrency, formatPercentage }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Propostas</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProposals}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success">+12% vs mês anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <FileText className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa de Aprovação</p>
              <p className="text-2xl font-bold text-success">{formatPercentage(stats.conversionRate)}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success">+3.2% vs mês anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-full bg-success/10">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-xs text-success">+18% vs mês anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor Médio</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats.avgValue)}</p>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-xs text-destructive">-2.1% vs mês anterior</span>
              </div>
            </div>
            <div className="p-2 rounded-full bg-warning/10">
              <BarChart3 className="w-6 h-6 text-warning" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}