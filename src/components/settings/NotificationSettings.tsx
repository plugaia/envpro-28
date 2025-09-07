import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, Save } from "lucide-react";

export function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false
  });

  useEffect(() => {
    // Load notification preferences from localStorage
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing notification preferences:', error);
      }
    }
  }, []);

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
      
      toast({
        title: "Preferências salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as preferências.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferências de Notificações
        </CardTitle>
        <CardDescription>
          Configure como você deseja receber notificações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba atualizações sobre propostas por email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={notifications.email}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, email: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações no navegador
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={notifications.push}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, push: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">Notificações por SMS</Label>
              <p className="text-sm text-muted-foreground">
                Receba alertas importantes via SMS
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={notifications.sms}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, sms: checked }))
              }
            />
          </div>
        </div>

        <Button 
          onClick={handleSaveNotifications} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Preferências"}
        </Button>
      </CardContent>
    </Card>
  );
}