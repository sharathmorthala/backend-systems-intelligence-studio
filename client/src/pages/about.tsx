import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Code2, 
  Server, 
  Workflow, 
  Database, 
  MessageSquare, 
  Shield, 
  Eye, 
  RotateCcw,
  Radio,
  HardDrive,
  Layers,
  Cpu,
  Brain,
  FileText,
  CheckSquare,
  GitBranch
} from "lucide-react";

interface Skill {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: {
    applied: string;
    depth: string;
    connection: string;
  };
}

interface SkillSection {
  title: string;
  skills: Skill[];
}

const skillSections: SkillSection[] = [
  {
    title: "Backend Core",
    skills: [
      {
        name: "Java",
        icon: Code2,
        tooltip: {
          applied: "Code Risk Scanner tool for detecting blocking calls and thread-safety issues",
          depth: "Production-level static analysis and pattern detection",
          connection: "Core language for enterprise backend systems and concurrency patterns"
        }
      },
      {
        name: "Kotlin",
        icon: Code2,
        tooltip: {
          applied: "Code Risk Scanner with Kotlin-specific coroutine and null-safety analysis",
          depth: "Modern JVM development with idiomatic patterns",
          connection: "Preferred for new backend services with cleaner syntax and safety features"
        }
      },
      {
        name: "REST APIs",
        icon: Server,
        tooltip: {
          applied: "API Contract Reviewer for validating request/response schemas",
          depth: "Full lifecycle: design, versioning, breaking change detection",
          connection: "Foundation of service-to-service communication in distributed systems"
        }
      },
      {
        name: "Event-Driven Architecture",
        icon: Workflow,
        tooltip: {
          applied: "System Design Reviewer for identifying decoupling opportunities",
          depth: "Async messaging patterns, event sourcing, CQRS considerations",
          connection: "Enables loose coupling and scalability in platform architectures"
        }
      }
    ]
  },
  {
    title: "Platform & Reliability",
    skills: [
      {
        name: "Distributed Systems",
        icon: GitBranch,
        tooltip: {
          applied: "System Design Reviewer for bottleneck and SPOF detection",
          depth: "CAP theorem tradeoffs, consistency models, partition handling",
          connection: "Core discipline for building scalable, fault-tolerant platforms"
        }
      },
      {
        name: "Resilience Patterns",
        icon: Shield,
        tooltip: {
          applied: "Resilience Strategy Advisor for retry, circuit breaker, and bulkhead configs",
          depth: "Pattern selection, timeout tuning, graceful degradation strategies",
          connection: "Critical for production systems handling partial failures"
        }
      },
      {
        name: "Observability",
        icon: Eye,
        tooltip: {
          applied: "Log & Incident Analyzer for structured log parsing and error grouping",
          depth: "Logging standards, metrics design, distributed tracing patterns",
          connection: "Essential for debugging and maintaining production systems"
        }
      },
      {
        name: "Error Handling & Retries",
        icon: RotateCcw,
        tooltip: {
          applied: "Resilience Advisor for idempotency guidance and retry strategies",
          depth: "Exponential backoff, jitter, dead-letter handling, poison pill detection",
          connection: "Directly impacts system reliability under transient failures"
        }
      }
    ]
  },
  {
    title: "Data & Messaging",
    skills: [
      {
        name: "Kafka",
        icon: Radio,
        tooltip: {
          applied: "System Design Reviewer for messaging bottleneck analysis",
          depth: "Consumer groups, partitioning strategies, exactly-once semantics",
          connection: "Event backbone for high-throughput distributed architectures"
        }
      },
      {
        name: "SQL / PostgreSQL",
        icon: Database,
        tooltip: {
          applied: "Toolkit persistence layer with Drizzle ORM integration",
          depth: "Query optimization, indexing, transaction isolation levels",
          connection: "Primary data store for transactional backend services"
        }
      },
      {
        name: "NoSQL",
        icon: HardDrive,
        tooltip: {
          applied: "System Design Reviewer for data model recommendations",
          depth: "Document stores, key-value patterns, eventual consistency handling",
          connection: "Complements relational stores for specific access patterns"
        }
      },
      {
        name: "Caching Strategies",
        icon: Layers,
        tooltip: {
          applied: "System Design Reviewer for performance bottleneck resolution",
          depth: "Cache invalidation, TTL policies, read-through vs write-through",
          connection: "Performance layer between application and data stores"
        }
      }
    ]
  },
  {
    title: "AI-Assisted Engineering",
    skills: [
      {
        name: "LLM Integration",
        icon: Brain,
        tooltip: {
          applied: "All 5 toolkit tools via Hugging Face Inference API",
          depth: "API integration, response parsing, error handling, rate limiting",
          connection: "Extends engineering tools with contextual analysis capabilities"
        }
      },
      {
        name: "Prompt Design",
        icon: MessageSquare,
        tooltip: {
          applied: "Tool-specific prompts for log analysis, code review, and design feedback",
          depth: "System prompts, structured output guidance, context optimization",
          connection: "Translates engineering problems into effective LLM queries"
        }
      },
      {
        name: "Structured AI Outputs",
        icon: FileText,
        tooltip: {
          applied: "Zod schema validation for all LLM responses",
          depth: "JSON parsing, type safety, response normalization",
          connection: "Ensures AI outputs integrate cleanly with typed systems"
        }
      },
      {
        name: "Deterministic Fallbacks",
        icon: CheckSquare,
        tooltip: {
          applied: "Every tool has rule-based fallback when LLM is unavailable",
          depth: "Pattern matching, heuristics, graceful degradation logic",
          connection: "Guarantees tool reliability independent of external AI services"
        }
      }
    ]
  }
];

function SkillCard({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className="flex items-center gap-2 p-3 rounded-md border bg-card hover-elevate cursor-default"
          data-testid={`skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{skill.name}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3 space-y-2" data-testid={`tooltip-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Applied in</p>
          <p className="text-sm">{skill.tooltip.applied}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Depth</p>
          <p className="text-sm">{skill.tooltip.depth}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Connection</p>
          <p className="text-sm">{skill.tooltip.connection}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-primary/10">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">About the Engineer</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-page-subtitle">
              Senior Backend & Platform Engineer focused on distributed systems, reliability, API design, and production-grade AI integration.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Intro Paragraph */}
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed" data-testid="text-intro">
                This toolkit reflects real backend engineering practices developed through hands-on experience 
                with production systems. Each tool addresses common challenges in backend development: parsing 
                logs for incident response, reviewing API contracts for consistency, advising on resilience 
                patterns, scanning code for platform risks, and evaluating system designs for scalability. 
                The underlying architecture demonstrates responsible AI integration with structured outputs 
                and deterministic fallbacks—ensuring reliability regardless of external service availability.
              </p>
            </CardContent>
          </Card>

          {/* Skill Map */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold" data-testid="text-skill-map-title">Skill Map</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {skillSections.map((section) => (
                <Card key={section.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base" data-testid={`text-section-${section.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {section.skills.map((skill) => (
                        <SkillCard key={skill.name} skill={skill} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground text-center" data-testid="text-footer-note">
              This page reflects engineering experience and design philosophy demonstrated throughout the toolkit.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t bg-muted/30 px-6 py-3">
        <p className="text-xs text-muted-foreground text-center" data-testid="text-disclaimer">
          LLMs are used as assistants. Deterministic backend logic remains the source of truth.
        </p>
      </footer>
    </div>
  );
}
