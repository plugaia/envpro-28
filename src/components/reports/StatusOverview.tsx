import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatusOverviewProps {
  stats: {
    totalProposals: number;
    approvedProposals: number;
    pendingProposals: number;
    rejectedProposals: number;
    totalValue: number;
    approvedValue: number;
  };
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function StatusOverview({ stats, formatCurrency, formatPercentage }: StatusOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="card-elegant">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Status das Propostas</CardTitle>
          <CardDescription>Distribuição por status atual</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-sm">Aprovadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.approvedProposals}</span>
                <Badge className="bg-success text-success-foreground">
                  {stats.totalProposals > 0 ? formatPercentage((stats.approvedProposals / stats.totalProposals) * 100) : '0.0%'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.pendingProposals}</span>
                <Badge className="bg-warning text-warning-foreground">
                  {stats.totalProposals > 0 ? formatPercentage((stats.pendingProposals / stats.totalProposals) * 100) : '0.0%'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span className="text-sm">Rejeitadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{stats.rejectedProposals}</span>
                <Badge className="bg-destructive text-destructive-foreground">
                  {stats.totalProposals > 0 ? formatPercentage((stats.rejectedProposals / stats.totalProposals) * 100) : '0.0%'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Valores por Status</CardTitle>
          <CardDescription>Distribuição financeira</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm">Valor Total</span>
              </div>
              <span className="font-bold text-primary">{formatCurrency(stats.totalValue)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-sm">Valor Aprovado</span>
              </div>
              <span className="font-bold text-success">{formatCurrency(stats.approvedValue)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted"></div>
                <span className="text-sm">Valor Médio</span>
              </div>
              <span className="font-bold">{formatCurrency(stats.avgValue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}