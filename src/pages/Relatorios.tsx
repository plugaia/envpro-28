import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { KpiCards } from "@/components/reports/KpiCards";
import { StatusOverview } from "@/components/reports/StatusOverview";
import { MonthlyPerformance } from "@/components/reports/MonthlyPerformance";
import { LawyerPerformanceTable } from "@/components/reports/LawyerPerformanceTable";
import { TopPerformers } from "@/components/reports/TopPerformers";
import { InsightsSection } from "@/components/reports/InsightsSection";

const Relatorios = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProposals: 0,
    approvedProposals: 0,
    pendingProposals: 0,
    rejectedProposals: 0,
    totalValue: 0,
    approvedValue: 0,
    avgValue: 0,
    conversionRate: 0
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [creatorPerformance, setCreatorPerformance] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user, selectedPeriod]);

  const fetchReportsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - parseInt(selectedPeriod));

      // Fetch proposals using secure function with role-based access
      const { data: proposals, error } = await supabase
        .rpc('get_user_proposals');

      if (error) throw error;

      // Filter by date range and calculate basic stats  
      const filteredProposals = proposals?.filter((p: any) => {
        const proposalDate = new Date(p.created_at);
        return proposalDate >= startDate;
      }) || [];

      const totalProposals = filteredProposals.length;
      const approvedProposals = filteredProposals.filter((p: any) => p.status === 'aprovada').length;
      const pendingProposals = filteredProposals.filter(p => p.status === 'pendente').length || 0;
      const rejectedProposals = filteredProposals.filter(p => p.status === 'rejeitada').length || 0;
      
      const totalValue = filteredProposals.reduce((sum, p) => sum + parseFloat(p.proposal_value.toString()), 0) || 0;
      const approvedValue = filteredProposals.filter(p => p.status === 'aprovada')
        .reduce((sum, p) => sum + parseFloat(p.proposal_value.toString()), 0) || 0;
      const avgValue = totalProposals > 0 ? totalValue / totalProposals : 0;
      const conversionRate = totalProposals > 0 ? (approvedProposals / totalProposals) * 100 : 0;

      setStats({
        totalProposals,
        approvedProposals,
        pendingProposals,
        rejectedProposals,
        totalValue,
        approvedValue,
        avgValue,
        conversionRate
      });

      // Calculate monthly data (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date();
        monthEnd.setMonth(monthEnd.getMonth() - i + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        const monthProposals = proposals?.filter(p => {
          const proposalDate = new Date(p.created_at);
          return proposalDate >= monthStart && proposalDate <= monthEnd;
        }) || [];

        const monthApproved = monthProposals.filter(p => p.status === 'aprovada').length;
        const monthValue = monthProposals.reduce((sum, p) => sum + parseFloat(p.proposal_value.toString()), 0);

        monthlyStats.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
          proposals: monthProposals.length,
          approved: monthApproved,
          value: monthValue
        });
      }
      setMonthlyData(monthlyStats);

      // Calculate creator performance
      const creatorStats = new Map();
      // Fetch profiles to get actual names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email');

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));

      proposals?.forEach(proposal => {
        const creatorId = proposal.created_by || 'unknown';
        const profile = profilesMap.get(creatorId);
        const creatorName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Usuário Desconhecido';
        const creatorEmail = profile?.email || 'N/A';
        
        if (!creatorStats.has(creatorId)) {
          creatorStats.set(creatorId, {
            id: creatorId,
            name: creatorName,
            email: creatorEmail,
            totalProposals: 0,
            approvedProposals: 0,
            rejectedProposals: 0,
            pendingProposals: 0,
            totalValue: 0,
            approvedValue: 0,
            avgValue: 0,
            conversionRate: 0
          });
        }

        const creator = creatorStats.get(creatorId);
        creator.totalProposals++;
        creator.totalValue += parseFloat(proposal.proposal_value.toString());

        if (proposal.status === 'aprovada') {
          creator.approvedProposals++;
          creator.approvedValue += parseFloat(proposal.proposal_value.toString());
        } else if (proposal.status === 'rejeitada') {
          creator.rejectedProposals++;
        } else if (proposal.status === 'pendente') {
          creator.pendingProposals++;
        }
      });

      // Calculate derived stats for creators
      const creatorArray = Array.from(creatorStats.values()).map(creator => ({
        ...creator,
        avgValue: creator.totalProposals > 0 ? creator.totalValue / creator.totalProposals : 0,
        conversionRate: creator.totalProposals > 0 ? (creator.approvedProposals / creator.totalProposals) * 100 : 0
      }));

      // Sort by total proposals descending
      creatorArray.sort((a, b) => b.totalProposals - a.totalProposals);
      setCreatorPerformance(creatorArray);

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Análise de desempenho e estatísticas</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md z-50">
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-6">
            <KpiCards stats={stats} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
            <StatusOverview stats={stats} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
            <MonthlyPerformance monthlyData={monthlyData} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
            <LawyerPerformanceTable creatorPerformance={creatorPerformance} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
            <TopPerformers creatorPerformance={creatorPerformance} formatCurrency={formatCurrency} formatPercentage={formatPercentage} />
            <InsightsSection stats={stats} creatorPerformance={creatorPerformance} formatPercentage={formatPercentage} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Relatorios;