import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  Terminal, 
  LayoutDashboard, 
  FileSearch, 
  FileCode, 
  Shield, 
  Code, 
  Network,
  Settings,
  Github, 
  ExternalLink 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
];

const toolNavItems = [
  {
    title: "Log & Incident Analyzer",
    url: "/tools/log-analyzer",
    icon: FileSearch,
  },
  {
    title: "API Contract Reviewer",
    url: "/tools/api-reviewer",
    icon: FileCode,
  },
  {
    title: "Resilience Advisor",
    url: "/tools/resilience-advisor",
    icon: Shield,
  },
  {
    title: "Code Risk Scanner",
    url: "/tools/code-scanner",
    icon: Code,
  },
  {
    title: "System Design Reviewer",
    url: "/tools/system-reviewer",
    icon: Network,
  },
];

const settingsNavItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground leading-tight">AI Backend</h1>
            <h2 className="text-base font-bold text-sidebar-foreground leading-tight">Engineering</h2>
            <h3 className="text-base font-bold text-sidebar-foreground leading-tight">Toolkit</h3>
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/70 leading-relaxed">
          Production-minded tools for backend architecture, API design, and reliability engineering.
        </p>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-10"
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-9"
                    data-testid={`nav-${item.url.split('/').pop()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-10"
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            data-testid="button-github-view"
          >
            <Github className="h-4 w-4 mr-2" />
            View on GitHub
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              data-testid="button-replit"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Replit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              data-testid="button-github"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
