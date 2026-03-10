import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { InvestigationsProvider } from "@/hooks/use-investigations";

// Pages
import Welcome from "@/pages/Welcome";
import InvestigationDashboard from "@/pages/InvestigationDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/investigate/:id" component={InvestigationDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <InvestigationsProvider>
          <SidebarProvider style={sidebarStyle}>
            <div className="flex h-screen w-full bg-[#0a0a0f] text-foreground font-sans overflow-hidden">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </SidebarProvider>
          <Toaster />
        </InvestigationsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;