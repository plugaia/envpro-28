import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Database, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportLimiter, checkRateLimit, formatRemainingTime } from '@/lib/rateLimiter';

export function BackupExport() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportData = async () => {
    setIsExporting(true);
    
    // Rate limiting check
    const rateLimitCheck = checkRateLimit(exportLimiter, 'export_data');
    if (!rateLimitCheck.allowed) {
      const remainingTime = formatRemainingTime(rateLimitCheck.remainingTime || 0);
      toast({
        title: "Limite excedido",
        description: `Você está fazendo exports muito rapidamente. Tente novamente em ${remainingTime}.`,
        variant: "destructive",
      });
      setIsExporting(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('export_company_data');
      
      if (error) {
        throw error;
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-empresa-${format(new Date(), 'yyyy-MM-dd-HHmm', { locale: ptBR })}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup realizado com sucesso!",
        description: "Os dados da empresa foram exportados com segurança.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erro no backup",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportItems = [
    {
      icon: Database,
      title: "Dados da Empresa",
      description: "Informações cadastrais e configurações"
    },
    {
      icon: FileText,
      title: "Propostas",
      description: "Todas as propostas e contatos de clientes"
    },
    {
      icon: Calendar,
      title: "Histórico",
      description: "Notificações e logs de atividades"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Backup e Exportação
        </CardTitle>
        <CardDescription>
          Faça backup completo dos dados da sua empresa de forma segura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exportItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            onClick={async () => {
              setIsExporting(true);
              try {
                await handleExportData();
                // Log audit event for data export
                try {
                  await supabase.rpc('create_audit_log', {
                    p_action_type: 'DATA_EXPORTED',
                    p_new_data: { 
                      export_date: new Date().toISOString(),
                      action: 'company_data_exported'
                    }
                  });
                } catch (auditError) {
                  console.error('Audit log error:', auditError);
                }
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className="w-full md:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar Dados"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            O arquivo será baixado em formato JSON com todos os dados da empresa.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}