import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Award } from "lucide-react";

interface InsightsSectionProps {
  stats: {
    pendingProposals: number;
    conversionRate: number;
  };
  creatorPerformance: {
    id: string;
    name: string;
    totalProposals: number;
    conversionRate: number;
  }[];
  formatPercentage: (value: number) => string;
}

export function InsightsSection({ stats, creatorPerformance, formatPercentage }: InsightsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights e Recomendações</CardTitle>
        <CardDescription>Análises automáticas baseadas nos dados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-success">Taxa de aprovação em alta</h4>
              <p className="text-sm text-muted-foreground">
                Sua taxa de aprovação aumentou {formatPercentage(stats.conversionRate)} no último mês. Continue focando em propostas similares às aprovadas recentemente.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-warning">Propostas pendentes</h4>
              <p className="text-sm text-muted-foreground">
                Você tem {stats.pendingProposals} propostas pendentes. Considere fazer follow-up com os clientes.
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-primary">Performance dos advogados</h4>
              <p className="text-sm text-muted-foreground">
                {creatorPerformance.length > 0 ? 
                  `${creatorPerformance[0].name} lidera com ${creatorPerformance[0].totalProposals} propostas e ${formatPercentage(creatorPerformance[0].conversionRate)} de aprovação.` :
                  'Nenhum dado de performance disponível ainda.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}