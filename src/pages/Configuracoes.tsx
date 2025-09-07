import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { CompanySettings } from "@/components/settings/CompanySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { UserSettings } from "@/components/settings/UserSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Palette,
  Users
} from "lucide-react";

export default function Configuracoes() {
  const { userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 h-full">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-base text-muted-foreground">Gerencie suas preferências e configurações da conta</p>
      </div>

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="profile" className="space-y-8 h-full flex flex-col">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-3'} bg-muted/50 p-1 rounded-lg`}>
            <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-background">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Tema</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="company" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Empresa</span>
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Usuários</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-background">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Segurança</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <TabsContent value="profile" className="space-y-6 mt-0 h-full">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0 h-full">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="theme" className="space-y-6 mt-0 h-full">
              <ThemeSettings />
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="company" className="space-y-6 mt-0 h-full">
                  <CompanySettings />
                </TabsContent>

                <TabsContent value="users" className="space-y-6 mt-0 h-full">
                  <UserSettings />
                </TabsContent>

                <TabsContent value="security" className="space-y-6 mt-0 h-full">
                  <SecuritySettings />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}