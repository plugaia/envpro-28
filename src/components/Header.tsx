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
    <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors md:hidden">
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </SidebarTrigger>
        <div className="hidden sm:block">
          <h1 className="text-lg md:text-xl font-semibold text-foreground">Dashboard</h1>
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
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="w-4 h-4" />
          </Button>
        </NotificationsPopover>
        
        <ProfilePopover onSignOut={signOut}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="w-4 h-4" />
          </Button>
        </ProfilePopover>
      </div>
    </header>
  );
}