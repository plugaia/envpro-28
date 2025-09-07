import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";

interface MonthlyPerformanceProps {
  monthlyData: {
    month: string;
    proposals: number;
    approved: number;
    value: number;
  }[];
  formatCurrency: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function MonthlyPerformance({ monthlyData, formatCurrency, formatPercentage }: MonthlyPerformanceProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Mensal</CardTitle>
        <CardDescription>Evolução de propostas e aprovações nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyData.map((data) => (
            <div key={data.month} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="w-12 text-center">
                  <span className="text-sm font-medium">{data.month}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{data.proposals} propostas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm text-success">{data.approved} aprovadas</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary">{formatCurrency(data.value)}</div>
                <div className="text-xs text-muted-foreground">
                  {data.proposals > 0 ? formatPercentage((data.approved / data.proposals) * 100) : '0.0%'} aprovação
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}