import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileSearch,
  FileCode,
  Shield,
  Code,
  Network,
  Package,
  Users,
  Lightbulb,
  CheckCircle,
  XCircle,
  Cpu,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const toolDocs = [
  {
    id: "log-analyzer",
    icon: FileSearch,
    title: "Log & Incident Analyzer",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    purpose: "Analyze application logs and stack traces to identify incident patterns and root causes.",
    whatItDoes: [
      "Groups similar errors",
      "Highlights recurring failures",
      "Identifies likely root causes",
      "Suggests investigation paths",
    ],
    whatItDoesNot: [
      "It does not auto-fix issues",
      "It does not replace observability tooling",
    ],
  },
  {
    id: "api-reviewer",
    icon: FileCode,
    title: "API Contract Reviewer",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    purpose: "Review REST request/response JSON and OpenAPI specifications for contract risks.",
    whatItDoes: [
      "Detects missing or inconsistent fields",
      "Flags breaking changes",
      "Identifies error model inconsistencies",
    ],
    whatItDoesNot: [
      "It does not generate APIs",
      "It does not enforce schemas automatically",
    ],
  },
  {
    id: "resilience-advisor",
    icon: Shield,
    title: "Resilience Strategy Advisor",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    purpose: "Evaluate failure scenarios and recommend resilience patterns.",
    whatItDoes: [
      "Suggests retries, timeouts, circuit breakers",
      "Highlights unsafe retry patterns",
      "Identifies idempotency requirements",
    ],
    whatItDoesNot: [
      "It does not implement resilience automatically",
      "It does not simulate traffic",
    ],
  },
  {
    id: "code-scanner",
    icon: Code,
    title: "Backend Code Risk Scanner",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    purpose: "Statically analyze backend code for runtime and design risks.",
    supportedLanguages: ["Java", "Kotlin", "JavaScript", "Python"],
    whatItDoes: [
      "Detects blocking calls",
      "Flags thread-safety risks",
      "Identifies unsafe access patterns",
      "Highlights error-handling gaps",
    ],
    howItWorks: "Deterministic pattern detection runs first. LLM explains why detected risks matter.",
    whatItDoesNot: [
      "It is not a full static analyzer",
      "It does not replace linters or SAST tools",
    ],
  },
  {
    id: "system-reviewer",
    icon: Network,
    title: "System Design Reviewer",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    purpose: "Review system design descriptions for architectural risks.",
    whatItDoes: [
      "Identifies bottlenecks",
      "Flags single points of failure",
      "Highlights observability gaps",
      "Evaluates scalability concerns",
    ],
    whatItDoesNot: [
      "It does not generate system designs",
      "It does not replace architecture reviews",
    ],
  },
  {
    id: "dependency-analyzer",
    icon: Package,
    title: "Dependency Risk Analyzer",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    purpose: "Analyze dependency manifests for known risks.",
    supportedFiles: ["pom.xml", "build.gradle", "package.json"],
    whatItDoes: [
      "Highlights vulnerable dependencies",
      "Flags outdated versions",
      "Identifies supply-chain risk patterns",
    ],
    whatItDoesNot: [
      "It does not replace enterprise vulnerability scanners",
      "It does not perform runtime dependency resolution",
    ],
  },
];

const targetAudience = [
  "Backend Engineers",
  "Platform Engineers",
  "Senior / Staff Engineers",
  "Technical Leads",
  "Engineers preparing for system design or architecture discussions",
];

export default function DocumentationPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-doc-title">
          Backend Systems Intelligence Studio
        </h1>
        <p className="text-muted-foreground" data-testid="text-doc-subtitle">
          Production-minded backend analysis tools for engineers building reliable, scalable systems.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* What Is This? */}
          <Card data-testid="card-what-is-this">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                What Is This?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Backend Systems Intelligence Studio is a professional engineering toolkit designed to 
                analyze backend systems through a combination of <strong>deterministic analysis</strong> and 
                <strong> AI-assisted reasoning</strong>.
              </p>
              <p className="text-muted-foreground">
                It focuses on how production systems fail, how APIs evolve, how code degrades under load, 
                and how system designs scale over time.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm">
                  This platform <strong>does not replace engineering judgment</strong>. It augments it by making 
                  risks, inconsistencies, and design gaps easier to surface and reason about.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Who Is This For? */}
          <Card data-testid="card-who-is-this-for">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Who Is This For?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {targetAudience.map((audience, index) => (
                  <Badge 
                    key={audience} 
                    variant="secondary" 
                    className="text-sm py-1.5"
                    data-testid={`badge-audience-${index}`}
                  >
                    {audience}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Emphasis on <strong>production systems</strong>, <strong>reliability</strong>, 
                <strong> scalability</strong>, and <strong>long-term maintainability</strong>.
              </p>
            </CardContent>
          </Card>

          {/* Design Philosophy */}
          <Card className="border-primary/20 bg-primary/5" data-testid="card-design-philosophy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Design Philosophy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Core Principles:</h4>
                <ul className="space-y-2">
                  {[
                    "Deterministic analysis runs first",
                    "AI is used for explanation, not decision-making",
                    "Structured outputs over free-form text",
                    "Explicit fallbacks when AI is unavailable",
                    "Tools reflect real-world engineering tradeoffs",
                  ].map((principle) => (
                    <li key={principle} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {principle}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tool Documentation */}
          <div data-testid="section-tool-docs">
            <h2 className="text-xl font-bold mb-4">Tool Documentation</h2>
            <Accordion type="multiple" className="space-y-3">
              {toolDocs.map((tool) => (
                <AccordionItem 
                  key={tool.id} 
                  value={tool.id}
                  className="border rounded-lg px-4"
                  data-testid={`accordion-${tool.id}`}
                >
                  <AccordionTrigger 
                    className="hover:no-underline py-4"
                    data-testid={`accordion-trigger-${tool.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                        <tool.icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      <span className="font-semibold text-left">{tool.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4" data-testid={`accordion-content-${tool.id}`}>
                    <div className="space-y-4 pt-2">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Purpose</h4>
                        <p className="text-sm text-muted-foreground">{tool.purpose}</p>
                      </div>

                      {tool.supportedLanguages && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Supported Languages</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {tool.supportedLanguages.map((lang) => (
                              <Badge key={lang} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {tool.supportedFiles && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Supported Files</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {tool.supportedFiles.map((file) => (
                              <Badge key={file} variant="outline" className="text-xs font-mono">
                                {file}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            What it does
                          </h4>
                          <ul className="space-y-1">
                            {tool.whatItDoes.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            What it does not do
                          </h4>
                          <ul className="space-y-1">
                            {tool.whatItDoesNot.map((item) => (
                              <li key={item} className="text-sm text-muted-foreground">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {tool.howItWorks && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                          <strong>How it works:</strong> {tool.howItWorks}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Advisory & Collaboration */}
          <Card data-testid="card-advisory-collaboration">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Advisory & Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Backend Systems Intelligence Studio reflects how I approach backend reliability, 
                system design, and AI-assisted engineering decisions in real production environments.
              </p>
              <p className="text-muted-foreground">
                I occasionally collaborate with engineering teams and early-stage companies to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Review backend architectures and system designs
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Identify reliability, scalability, and failure-mode risks
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Analyze API contracts and error models
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  Advise on internal tooling, platform strategy, and AI-assisted engineering workflows
                </li>
              </ul>
              <p className="text-sm text-muted-foreground">
                This work is exploratory and advisory in nature, focused on helping teams reason 
                clearly about backend systems as they scale.
              </p>
              <div className="pt-2">
                <p className="text-muted-foreground mb-4">
                  If this perspective aligns with challenges your team is facing, feel free to reach out.
                </p>
                <Link href="/contact">
                  <Button data-testid="button-advisory-contact">
                    Get in Touch
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t p-3 bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          LLMs are used as assistants. Deterministic backend logic remains the source of truth.
        </p>
      </div>
    </div>
  );
}
