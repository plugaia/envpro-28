import { Button } from "@/components/ui/button";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, User, Plus, Menu, X } from "lucide-react";
import { ProfilePopover } from "./ProfilePopover";
import { NotificationsPopover } from "./NotificationsPopover";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  onNewProposal: () => void;
}

export function Header({ onNewProposal }: HeaderProps) {
  const { open } = useSidebar();
  const { signOut } = useAuth();
  
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </SidebarTrigger>
        <div className="hidden sm:block">
          <h1 className="text-lg md:text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground hidden md:block">Gerencie suas propostas jurídicas</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          onClick={onNewProposal}
          className="bg-primary hover:bg-primary-hover text-primary-foreground px-3 md:px-4"
          size="sm"
        >
          <Plus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Nova Proposta</span>
        </Button>
        
        <NotificationsPopover>
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </NotificationsPopover>
        
        <ProfilePopover onSignOut={signOut}>
          <Button variant="ghost" size="sm" className="p-2">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </ProfilePopover>
      </div>
    </header>
  );
}