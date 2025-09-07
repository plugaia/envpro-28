import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Users, Calendar, CheckCircle, Award, Crown, Medal } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      const pendingProposals = proposals?.filter(p => p.status === 'pendente').length || 0;
      const rejectedProposals = proposals?.filter(p => p.status === 'rejeitada').length || 0;
      
      const totalValue = proposals?.reduce((sum, p) => sum + parseFloat(p.proposal_value.toString()), 0) || 0;
      const approvedValue = proposals?.filter(p => p.status === 'aprovada')
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
      proposals?.forEach(proposal => {
        const creatorId = proposal.created_by || 'sistema';
        const creatorName = 'Sistema'; // Simplified for now
        
        if (!creatorStats.has(creatorId)) {
          creatorStats.set(creatorId, {
            id: creatorId,
            name: creatorName,
            email: `${creatorName.toLowerCase()}@legalprop.com`,
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
              
              {/* KPI Cards */}
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

              {/* Status Overview */}
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

              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Mensal</CardTitle>
                  <CardDescription>Evolução de propostas e aprovações nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyData.map((data, index) => (
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

              {/* Lawyer Performance */}
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

              {/* Top Performers */}
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

              {/* Insights */}
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
                          Sua taxa de aprovação aumentou 3.2% no último mês. Continue focando em propostas similares às aprovadas recentemente.
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

            </div>
            )}
          </main>
        </div>
    );
};

export default Relatorios;