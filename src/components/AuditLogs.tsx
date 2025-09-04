import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Clock, User, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  action_type: string;
  table_name?: string;
  record_id?: string;
  created_at: string;
  old_data?: any;
  new_data?: any;
}

const actionTypeLabels: Record<string, string> = {
  'DATA_EXPORT': 'Exportação de Dados',
  'PROPOSAL_CREATED': 'Proposta Criada',
  'PROPOSAL_UPDATED': 'Proposta Atualizada',
  'PROPOSAL_DELETED': 'Proposta Excluída',
  'USER_INVITED': 'Usuário Convidado',
  'SETTINGS_UPDATED': 'Configurações Alteradas',
  'PROFILE_UPDATED': 'Perfil Atualizado'
};

const actionTypeColors: Record<string, string> = {
  'DATA_EXPORT': 'bg-blue-100 text-blue-800',
  'PROPOSAL_CREATED': 'bg-green-100 text-green-800',
  'PROPOSAL_UPDATED': 'bg-yellow-100 text-yellow-800',
  'PROPOSAL_DELETED': 'bg-red-100 text-red-800',
  'USER_INVITED': 'bg-purple-100 text-purple-800',
  'SETTINGS_UPDATED': 'bg-orange-100 text-orange-800',
  'PROFILE_UPDATED': 'bg-indigo-100 text-indigo-800'
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Get unique user IDs
      const userIds = [...new Set(logsData?.map(log => log.user_id) || [])];
      
      // Fetch user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Create profiles lookup
      const profilesLookup = profilesData?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      setLogs(logsData || []);
      setProfiles(profilesLookup);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const profile = profiles[userId];
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    return 'Usuário Desconhecido';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Carregando logs...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          Histórico de ações sensíveis realizadas na plataforma
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log de auditoria encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {log.action_type === 'DATA_EXPORT' && <Database className="h-4 w-4 text-blue-600" />}
                    {log.action_type.includes('PROPOSAL') && <Shield className="h-4 w-4 text-green-600" />}
                    {log.action_type.includes('USER') && <User className="h-4 w-4 text-purple-600" />}
                    {!['DATA_EXPORT', 'PROPOSAL_CREATED', 'PROPOSAL_UPDATED', 'PROPOSAL_DELETED', 'USER_INVITED'].includes(log.action_type) && 
                     <Clock className="h-4 w-4 text-gray-600" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="secondary"
                        className={actionTypeColors[log.action_type] || 'bg-gray-100 text-gray-800'}
                      >
                        {actionTypeLabels[log.action_type] || log.action_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        por {getUserName(log.user_id)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                    
                    {log.table_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tabela: {log.table_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}