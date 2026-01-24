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
  LayoutDashboard, 
  FileSearch, 
  FileCode, 
  Shield, 
  Code, 
  Network,
  BookOpen,
  User,
  Github,
  Package,
  Mail
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
  {
    title: "Dependency Analyzer",
    url: "/tools/dependency-analyzer",
    icon: Package,
  },
];

const bottomNavItems = [
  {
    title: "About the Engineer",
    url: "/about",
    icon: User,
  },
  {
    title: "Contact",
    url: "/contact",
    icon: Mail,
  },
  {
    title: "Documentation",
    url: "/documentation",
    icon: BookOpen,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <span className="font-mono text-lg font-bold text-primary">&gt;_</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground leading-tight">Backend Systems</h1>
            <h2 className="text-base font-bold text-sidebar-foreground leading-tight">Intelligence Studio</h2>
          </div>
        </div>
        <p className="text-xs text-sidebar-foreground/70 leading-relaxed">
          Production-minded backend analysis tools for engineers building reliable, scalable systems.
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
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-10"
                    data-testid={`nav-${item.url.slice(1)}`}
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
          <a
            href="https://github.com/sharathmorthala"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
              data-testid="button-github-view"
            >
              <Github className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </a>
          <p className="text-xs text-sidebar-foreground/50 text-center">
            Built by Sharath Morthala
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
