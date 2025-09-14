"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar as CalendarIcon, PlusCircle } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type FilterOptions = {
  search: string;
  status: string[];
  receiverType: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minValue?: number;
  maxValue?: number;
};

interface ProposalFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onNewProposal: () => void;
  totalCount: number;
  filteredCount: number;
}

const statusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "aprovada", label: "Aprovada" },
  { value: "rejeitada", label: "Rejeitada" },
];

const receiverTypeOptions = [
  { value: "advogado", label: "Advogado" },
  { value: "autor", label: "Autor" },
  { value: "precatorio", label: "Precatório" },
];

export function ProposalFilters({ filters, onFiltersChange, onNewProposal, totalCount, filteredCount }: ProposalFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: filters.dateFrom,
    to: filters.dateTo,
  });
  const [valueRange, setValueRange] = useState<[number, number]>([filters.minValue || 0, filters.maxValue || 500000]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    handleFilterChange("status", newStatus);
  };

  const handleReceiverTypeToggle = (type: string) => {
    const newReceiverType = filters.receiverType.includes(type)
      ? filters.receiverType.filter((t) => t !== type)
      : [...filters.receiverType, type];
    handleFilterChange("receiverType", newReceiverType);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    handleFilterChange("dateFrom", range?.from);
    handleFilterChange("dateTo", range?.to);
  };

  const handleValueRangeCommit = (range: [number, number]) => {
    setValueRange(range);
    handleFilterChange("minValue", range[0]);
    handleFilterChange("maxValue", range[1]);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      status: [],
      receiverType: [],
      dateFrom: undefined,
      dateTo: undefined,
      minValue: undefined,
      maxValue: undefined,
    });
    setDateRange(undefined);
    setValueRange([0, 500000]);
  };

  const activeFilterCount = [
    filters.search,
    filters.status.length > 0,
    filters.receiverType.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.minValue,
    filters.maxValue,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, processo, órgão..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 rounded-full px-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium leading-none">Filtros Avançados</h4>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Status</p>
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {statusOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleStatusToggle(option.value)}
                            className="cursor-pointer"
                          >
                            <div className={`mr-2 h-4 w-4 rounded-sm border ${filters.status.includes(option.value) ? 'bg-primary' : 'opacity-50'}`} />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Tipo de Recebedor</p>
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {receiverTypeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleReceiverTypeToggle(option.value)}
                            className="cursor-pointer"
                          >
                            <div className={`mr-2 h-4 w-4 rounded-sm border ${filters.receiverType.includes(option.value) ? 'bg-primary' : 'opacity-50'}`} />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Data de Criação</p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                              {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y", { locale: ptBR })
                          )
                        ) : (
                          <span>Escolha um período</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Valor da Proposta</p>
                  <Slider
                    min={0}
                    max={500000}
                    step={1000}
                    value={valueRange}
                    onValueCommit={handleValueRangeCommit}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ {valueRange[0].toLocaleString('pt-BR')}</span>
                    <span>R$ {valueRange[1].toLocaleString('pt-BR')}{valueRange[1] === 500000 ? '+' : ''}</span>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                    <X className="mr-2 h-4 w-4" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={onNewProposal} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Proposta
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCount} de {totalCount} propostas.
      </div>
    </div>
  );
}