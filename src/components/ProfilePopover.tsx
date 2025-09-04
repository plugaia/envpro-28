import { User, Settings, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

interface ProfilePopoverProps {
  children: React.ReactNode;
  onSignOut: () => void;
}

export function ProfilePopover({ children, onSignOut }: ProfilePopoverProps) {
  const { user } = useAuth();

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {user?.user_metadata?.firstName && user?.user_metadata?.lastName 
                  ? `${user.user_metadata.firstName} ${user.user_metadata.lastName}`
                  : 'Usuário'
                }
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm h-8"
            onClick={() => window.location.href = '/configuracoes?tab=profile'}
          >
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm h-8"
            onClick={() => window.location.href = '/configuracoes'}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm h-8"
            onClick={() => window.location.href = '/configuracoes?tab=security'}
          >
            <Shield className="w-4 h-4 mr-2" />
            Privacidade
          </Button>
          <Separator className="my-2" />
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm h-8 text-destructive hover:text-destructive"
            onClick={onSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}