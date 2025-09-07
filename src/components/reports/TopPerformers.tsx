import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, CheckCircle, DollarSign } from "lucide-react";

interface TopPerformersProps {
  creatorPerformance: {
    id: string;
    name: string;
    totalProposals: number;
    approvedProposals: number;
    totalValue: number;
    conversionRate: number;
  }[];
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function TopPerformers({ creatorPerformance, formatCurrency, formatPercentage }: TopPerformersProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Mais Propostas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creatorPerformance
              .sort((a, b) => b.totalProposals - a.totalProposals)
              .slice(0, 3)
              .map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">#{index + 1}</span>
                    <span className="text-sm font-medium">{creator.name.split(' ')[1] || creator.name.split(' ')[0]} {creator.name.split(' ')[2] || ''}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {creator.totalProposals} propostas
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Maior Taxa de Aprovação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creatorPerformance
              .sort((a, b) => b.conversionRate - a.conversionRate)
              .slice(0, 3)
              .map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">#{index + 1}</span>
                    <span className="text-sm font-medium">{creator.name.split(' ')[1] || creator.name.split(' ')[0]} {creator.name.split(' ')[2] || ''}</span>
                  </div>
                  <Badge className="bg-success text-success-foreground text-xs">
                    {formatPercentage(creator.conversionRate)}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Maior Valor Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creatorPerformance
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, 3)
              .map((creator, index) => (
                <div key={creator.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-4">#{index + 1}</span>
                    <span className="text-sm font-medium">{creator.name.split(' ')[1] || creator.name.split(' ')[0]} {creator.name.split(' ')[2] || ''}</span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {formatCurrency(creator.totalValue)}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}