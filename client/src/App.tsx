import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { FileText, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import Home from "@/pages/home";
import LogAnalyzer from "@/pages/tools/log-analyzer";
import ApiReviewer from "@/pages/tools/api-reviewer";
import ResilienceAdvisor from "@/pages/tools/resilience-advisor";
import CodeScanner from "@/pages/tools/code-scanner";
import SystemReviewer from "@/pages/tools/system-reviewer";
import DependencyAnalyzer from "@/pages/tools/dependency-analyzer";
import DocumentationPage from "@/pages/documentation";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/tools/log-analyzer" component={LogAnalyzer} />
      <Route path="/tools/api-reviewer" component={ApiReviewer} />
      <Route path="/tools/resilience-advisor" component={ResilienceAdvisor} />
      <Route path="/tools/code-scanner" component={CodeScanner} />
      <Route path="/tools/system-reviewer" component={SystemReviewer} />
      <Route path="/tools/dependency-analyzer" component={DependencyAnalyzer} />
      <Route path="/documentation" component={DocumentationPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function HamburgerMenuButton() {
  const { toggleSidebar, open, openMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      data-testid="button-sidebar-toggle"
      aria-label="Toggle sidebar menu"
      aria-expanded={isOpen}
      aria-controls="sidebar"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="log-analyzer-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-4 px-6 py-3 border-b bg-background">
                  <div className="flex items-center gap-4">
                    <HamburgerMenuButton />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href="/documentation">
                      <Button variant="outline" data-testid="button-documentation">
                        <FileText className="h-4 w-4 mr-2" />
                        Documentation
                      </Button>
                    </Link>
                    <ThemeToggle />
                  </div>
                </header>
                <main className="flex-1 overflow-auto bg-muted/30">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
