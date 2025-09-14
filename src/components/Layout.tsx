import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";

interface LayoutProps {
  children: ReactNode;
  onNewProposal: () => void;
}

export function Layout({ children, onNewProposal }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-all duration-200 ease-in-out">
          <Header onNewProposal={onNewProposal} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30 min-h-0 transition-all duration-200 ease-in-out">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}