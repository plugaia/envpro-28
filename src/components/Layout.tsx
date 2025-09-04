import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ProposalForm } from "@/components/ProposalForm";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showProposalForm, setShowProposalForm] = useState(false);

  const handleNewProposal = () => {
    setShowProposalForm(true);
  };

  const handleSubmitProposal = () => {
    setShowProposalForm(false);
    // Refresh will be handled by the parent component
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col transition-all duration-200 ease-in-out">
          <Header onNewProposal={handleNewProposal} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30 min-h-0 transition-all duration-200 ease-in-out">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>
        
        {showProposalForm && (
          <ProposalForm
            onClose={() => setShowProposalForm(false)}
            onSubmit={handleSubmitProposal}
          />
        )}
      </div>
    </SidebarProvider>
  );
}