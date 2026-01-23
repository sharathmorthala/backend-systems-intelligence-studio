import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
  GitBranch,
  Github,
  Linkedin
} from "lucide-react";

const ENGINEER_CONFIG = {
  name: "Engineer Name",
  githubUrl: "https://github.com",
  linkedinUrl: "https://linkedin.com",
};

interface Skill {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
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
        description: "Used for building large-scale backend services, API layers, and platform components with emphasis on reliability and maintainability."
      },
      {
        name: "Kotlin",
        icon: Code2,
        description: "Applied in modern JVM backend development with coroutines, null-safety, and idiomatic patterns for cleaner service implementations."
      },
      {
        name: "REST APIs",
        icon: Server,
        description: "Designed and maintained API contracts with focus on versioning, schema validation, and backward compatibility across distributed systems."
      },
      {
        name: "Event-Driven Architecture",
        icon: Workflow,
        description: "Designed and implemented asynchronous workflows using message brokers to decouple services and improve system resilience."
      }
    ]
  },
  {
    title: "Platform & Reliability",
    skills: [
      {
        name: "Distributed Systems",
        icon: GitBranch,
        description: "Built and operated multi-service architectures handling consistency tradeoffs, partition tolerance, and cross-region coordination."
      },
      {
        name: "Resilience Patterns",
        icon: Shield,
        description: "Implemented circuit breakers, retries with backoff, bulkheads, and graceful degradation to handle partial failures in production."
      },
      {
        name: "Observability",
        icon: Eye,
        description: "Established logging standards, structured metrics, and distributed tracing to enable effective debugging and incident response."
      },
      {
        name: "Error Handling & Retries",
        icon: RotateCcw,
        description: "Designed idempotent operations with exponential backoff, jitter, and dead-letter handling for reliable message processing."
      }
    ]
  },
  {
    title: "Data & Messaging",
    skills: [
      {
        name: "Kafka",
        icon: Radio,
        description: "Operated Kafka clusters for event streaming, managing consumer groups, partitioning strategies, and exactly-once semantics."
      },
      {
        name: "SQL / PostgreSQL",
        icon: Database,
        description: "Designed schemas, optimized queries, and managed transaction isolation for transactional backend services at scale."
      },
      {
        name: "NoSQL",
        icon: HardDrive,
        description: "Applied document stores and key-value databases for specific access patterns requiring eventual consistency and horizontal scaling."
      },
      {
        name: "Caching Strategies",
        icon: Layers,
        description: "Implemented cache layers with appropriate invalidation policies, TTLs, and read-through patterns to reduce database load."
      }
    ]
  },
  {
    title: "AI-Assisted Engineering",
    skills: [
      {
        name: "LLM Integration",
        icon: Brain,
        description: "Integrated LLM APIs into backend tooling with proper error handling, rate limiting, and response validation for production use."
      },
      {
        name: "Prompt Design",
        icon: MessageSquare,
        description: "Crafted system prompts and structured output guidance to translate engineering problems into effective LLM queries."
      },
      {
        name: "Structured AI Outputs",
        icon: FileText,
        description: "Validated LLM responses against typed schemas to ensure AI outputs integrate cleanly with backend systems."
      },
      {
        name: "Deterministic Fallbacks",
        icon: CheckSquare,
        description: "Ensures core system behavior remains predictable when AI or external services are unavailable."
      }
    ]
  }
];

function SkillCard({ skill }: { skill: Skill }) {
  const Icon = skill.icon;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          type="button"
          className="flex items-center gap-2 p-3 rounded-md border bg-card hover-elevate cursor-default text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          data-testid={`skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        >
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{skill.name}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs p-3" 
        data-testid={`tooltip-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
      >
        <p className="text-sm leading-relaxed">{skill.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              data-testid="link-github"
            >
              <a 
                href={ENGINEER_CONFIG.githubUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              asChild
              data-testid="link-linkedin"
            >
              <a 
                href={ENGINEER_CONFIG.linkedinUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground leading-relaxed" data-testid="text-intro">
                This toolkit reflects backend engineering practices developed through hands-on work 
                with production systems. Each tool addresses a specific challenge: parsing logs for 
                incident response, reviewing API contracts for consistency, advising on resilience 
                patterns, scanning code for platform risks, and evaluating system designs for scalability. 
                The architecture demonstrates responsible AI integration—structured outputs and 
                deterministic fallbacks ensure reliability regardless of external service availability.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <h2 className="text-lg font-semibold" data-testid="text-skill-map-title">Skill Map</h2>
            <p className="text-sm text-muted-foreground">
              Hover or focus on any skill to see how it applies to backend and platform engineering.
            </p>
            
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
