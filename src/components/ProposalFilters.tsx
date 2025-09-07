import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar, DollarSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface FilterOptions {
  search: string;
  status: string[];
  receiverType: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minValue?: number;
  maxValue?: number;
}

interface ProposalFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions = [
  { 
    value: "pendente", 
    label: "Pendente", 
    color: "bg-warning text-warning-foreground",
    dotColor: "bg-yellow-500"
  },
  { 
    value: "aprovada", 
    label: "Aprovada", 
    color: "bg-success text-success-foreground",
    dotColor: "bg-green-500"
  },
  { 
    value: "rejeitada", 
    label: "Rejeitada", 
    color: "bg-destructive text-destructive-foreground",
    dotColor: "bg-red-500"
  },
];

const receiverTypeOptions = [
  { value: "advogado", label: "Advogado" },
  { value: "autor", label: "Autor" },
  { value: "precatorio", label: "Precatório" },
];

export function ProposalFilters({ 
  filters, 
  onFiltersChange, 
  totalCount, 
  filteredCount 
}: ProposalFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const toggleReceiverType = (type: string) => {
    const newTypes = filters.receiverType.includes(type)
      ? filters.receiverType.filter(t => t !== type)
      : [...filters.receiverType, type];
    updateFilters({ receiverType: newTypes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      search: "",
      status: [],
      receiverType: [],
      dateFrom: undefined,
      dateTo: undefined,
      minValue: undefined,
      maxValue: undefined,
    });
  };

  const hasActiveFilters = filters.search || 
    filters.status.length > 0 || 
    filters.receiverType.length > 0 || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.minValue || 
    filters.maxValue;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        {/* Search and Quick Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente, processo ou e-mail..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <X className="w-4 h-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Results Count and Filter Tags */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Mostrando {filteredCount} de {totalCount} propostas
            </span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Filtros ativos
              </Badge>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            {statusOptions.map((status) => (
              <Badge
                key={status.value}
                variant={filters.status.includes(status.value) ? "default" : "outline"}
                className={`cursor-pointer transition-all text-xs flex items-center gap-1.5 ${
                  filters.status.includes(status.value) ? status.color : ""
                }`}
                onClick={() => toggleStatus(status.value)}
              >
                <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                {status.label}
              </Badge>
            ))}
          </div>

          {/* Receiver Type Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
            {receiverTypeOptions.map((type) => (
              <Badge
                key={type.value}
                variant={filters.receiverType.includes(type.value) ? "default" : "outline"}
                className="cursor-pointer transition-all text-xs"
                onClick={() => toggleReceiverType(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => updateFilters({ dateFrom: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-3 w-3" />
                      {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => updateFilters({ dateTo: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Min Value */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor Mínimo</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                   <Input
                     type="number"
                     placeholder="0,00"
                     value={filters.minValue?.toString() || ""}
                     onChange={(e) => {
                       const value = e.target.value;
                       updateFilters({ minValue: value ? parseFloat(value) : undefined });
                     }}
                     className="pl-8 text-sm"
                   />
                </div>
              </div>

              {/* Max Value */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor Máximo</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                   <Input
                     type="number"
                     placeholder="0,00"
                     value={filters.maxValue?.toString() || ""}
                     onChange={(e) => {
                       const value = e.target.value;
                       updateFilters({ maxValue: value ? parseFloat(value) : undefined });
                     }}
                     className="pl-8 text-sm"
                   />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}