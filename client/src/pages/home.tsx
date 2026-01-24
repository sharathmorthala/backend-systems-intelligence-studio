import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileSearch, 
  FileCode, 
  Shield, 
  Code, 
  Network,
  Package,
  ArrowRight
} from "lucide-react";

const tools = [
  {
    id: "log-analyzer",
    title: "Log & Incident Analyzer",
    description: "Analyze application logs and stack traces. Groups similar errors, identifies root causes, and suggests investigation steps.",
    icon: FileSearch,
    href: "/tools/log-analyzer",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "api-reviewer",
    title: "API Contract Reviewer",
    description: "Review REST request/response JSON and OpenAPI specs. Identifies missing fields, inconsistent error models, and breaking changes.",
    icon: FileCode,
    href: "/tools/api-reviewer",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "resilience-advisor",
    title: "Resilience Strategy Advisor",
    description: "Get recommendations for retry strategies, idempotency, circuit breakers, and handling partial failures.",
    icon: Shield,
    href: "/tools/resilience-advisor",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "code-scanner",
    title: "Backend Code Risk Scanner",
    description: "Scan Java, Kotlin, JavaScript, and Python code for runtime error risks, blocking calls, thread-safety issues, and error-handling gaps.",
    icon: Code,
    href: "/tools/code-scanner",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "system-reviewer",
    title: "System Design Reviewer",
    description: "Review system design descriptions for bottlenecks, single points of failure, scalability concerns, and observability gaps.",
    icon: Network,
    href: "/tools/system-reviewer",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "dependency-analyzer",
    title: "Dependency Risk Analyzer",
    description: "Analyze dependency manifests (pom.xml, package.json, build.gradle) for vulnerabilities, unsafe versions, and supply-chain risks.",
    icon: Package,
    href: "/tools/dependency-analyzer",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

export default function Home() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-dashboard-title">Backend Systems Intelligence Studio</h1>
        <p className="text-muted-foreground leading-relaxed max-w-3xl" data-testid="text-dashboard-subtitle">
          Production-minded backend analysis tools for engineers building reliable, scalable systems.
          This studio combines deterministic analysis with AI-assisted reasoning to evaluate logs, APIs, 
          code, dependencies, and system designs—without replacing engineering judgment.
        </p>
      </div>

      <div className="flex-1 p-6 pt-2">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.id} href={tool.href}>
              <Card 
                className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/50 hover-elevate"
                data-testid={`tile-${tool.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                      <tool.icon className={`h-5 w-5 ${tool.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg mt-3">{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          LLMs are used as assistants. Deterministic backend logic remains the source of truth.
        </p>
      </div>
    </div>
  );
}
