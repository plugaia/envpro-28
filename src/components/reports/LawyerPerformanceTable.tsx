import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Crown, Medal } from "lucide-react";

interface LawyerPerformanceTableProps {
  creatorPerformance: {
    id: string;
    name: string;
    email: string;
    totalProposals: number;
    approvedProposals: number;
    totalValue: number;
    conversionRate: number;
  }[];
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function LawyerPerformanceTable({ creatorPerformance, formatCurrency, formatPercentage }: LawyerPerformanceTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Ranking de Advogados
        </CardTitle>
        <CardDescription>Performance dos advogados por número de propostas e taxa de aprovação</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {creatorPerformance.map((creator, index) => (
            <div key={creator.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                  {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                  {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                  {index === 2 && <Medal className="w-4 h-4 text-amber-600" />}
                  {index > 2 && <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>}
                </div>
                <div>
                  <div className="font-medium text-foreground">{creator.name}</div>
                  <div className="text-xs text-muted-foreground">{creator.email}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary">{creator.totalProposals}</div>
                  <div className="text-xs text-muted-foreground">Propostas</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-success">{creator.approvedProposals}</div>
                  <div className="text-xs text-muted-foreground">Aprovadas</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-warning">{formatPercentage(creator.conversionRate)}</div>
                  <div className="text-xs text-muted-foreground">Taxa</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{formatCurrency(creator.totalValue)}</div>
                  <div className="text-xs text-muted-foreground">Valor Total</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}