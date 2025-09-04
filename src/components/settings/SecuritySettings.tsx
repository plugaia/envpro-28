import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackupExport } from "@/components/BackupExport";
import { AuditLogs } from "@/components/AuditLogs";
import { Shield } from "lucide-react";

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurações de Segurança
          </CardTitle>
          <CardDescription>
            Gerencie a segurança e backup dos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Autenticação</h4>
                <ul className="space-y-1">
                  <li>✅ Senhas seguras obrigatórias</li>
                  <li>✅ Rate limiting ativo</li>
                  <li>✅ Validação de entrada</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Dados</h4>
                <ul className="space-y-1">
                  <li>✅ Criptografia em trânsito</li>
                  <li>✅ Logs de auditoria</li>
                  <li>✅ Backup automático</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup e Exportação */}
      <BackupExport />

      {/* Logs de Auditoria */}
      <AuditLogs />
    </div>
  );
}