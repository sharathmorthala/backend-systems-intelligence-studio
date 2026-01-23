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
  Brain,
  FileText,
  CheckSquare,
  GitBranch,
  Github,
  Linkedin
} from "lucide-react";

const ENGINEER = {
  name: "Sharath Morthala",
  title: "Senior Backend & Platform Engineer",
  githubUrl: "https://github.com/sharathmorthala",
  linkedinUrl: "https://www.linkedin.com/in/sharath-morthala-2657a626b",
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
        description: "Used in production to build large-scale backend services, API layers, and platform components with emphasis on reliability, thread-safety, and maintainability."
      },
      {
        name: "Kotlin",
        icon: Code2,
        description: "Applied in modern JVM backend development using coroutines for async processing, null-safety for reduced runtime errors, and idiomatic patterns for cleaner service implementations."
      },
      {
        name: "REST APIs",
        icon: Server,
        description: "Designed and maintained production API contracts with focus on versioning, schema validation, backward compatibility, and consistent error handling across distributed systems."
      },
      {
        name: "Event-Driven Architecture",
        icon: Workflow,
        description: "Implemented asynchronous workflows using message brokers to decouple services, improve system resilience, and enable independent scaling of components."
      }
    ]
  },
  {
    title: "Platform & Reliability",
    skills: [
      {
        name: "Distributed Systems",
        icon: GitBranch,
        description: "Built and operated multi-service architectures handling consistency tradeoffs, partition tolerance, cross-region coordination, and data replication strategies."
      },
      {
        name: "Resilience Patterns",
        icon: Shield,
        description: "Implemented circuit breakers, retries with exponential backoff, bulkheads, and graceful degradation to maintain system availability during partial failures."
      },
      {
        name: "Observability",
        icon: Eye,
        description: "Established structured logging standards, designed metrics dashboards, and implemented distributed tracing to enable effective debugging and incident response."
      },
      {
        name: "Error Handling & Retries",
        icon: RotateCcw,
        description: "Designed idempotent operations with configurable retry policies, jitter, and dead-letter handling for reliable message processing in production systems."
      }
    ]
  },
  {
    title: "Data & Messaging",
    skills: [
      {
        name: "Kafka",
        icon: Radio,
        description: "Used in production systems to implement event-driven workflows, improve service decoupling, and support scalable asynchronous processing."
      },
      {
        name: "SQL / PostgreSQL",
        icon: Database,
        description: "Designed schemas, optimized complex queries, managed transaction isolation, and implemented data migration strategies for transactional backend services."
      },
      {
        name: "NoSQL",
        icon: HardDrive,
        description: "Applied document stores and key-value databases for specific access patterns requiring eventual consistency, horizontal scaling, and high write throughput."
      },
      {
        name: "Caching Strategies",
        icon: Layers,
        description: "Implemented multi-layer caching with appropriate invalidation policies, TTLs, and read-through patterns to reduce database load and improve response times."
      }
    ]
  },
  {
    title: "AI-Assisted Engineering",
    skills: [
      {
        name: "LLM Integration",
        icon: Brain,
        description: "Integrated LLM APIs into backend tooling with proper error handling, rate limiting, timeout management, and response validation for production reliability."
      },
      {
        name: "Prompt Design",
        icon: MessageSquare,
        description: "Crafted system prompts and structured output guidance to translate engineering problems into effective LLM queries with predictable response formats."
      },
      {
        name: "Structured AI Outputs",
        icon: FileText,
        description: "Validated LLM responses against typed schemas using Zod to ensure AI outputs integrate cleanly with typed backend systems and maintain data integrity."
      },
      {
        name: "Deterministic Fallbacks",
        icon: CheckSquare,
        description: "Designed to ensure core backend behavior remains predictable when AI services or external dependencies are unavailable."
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
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-engineer-name">{ENGINEER.name}</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-engineer-title">
                {ENGINEER.title}
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
                href={ENGINEER.githubUrl} 
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
                href={ENGINEER.linkedinUrl} 
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
                {ENGINEER.name} is a {ENGINEER.title} focused on distributed systems, reliability engineering, 
                API design, and production-grade AI integration. This toolkit reflects hands-on experience 
                building and operating scalable backend systems. Each tool addresses a specific challenge: 
                parsing logs for incident response, reviewing API contracts for consistency, advising on 
                resilience patterns, scanning code for platform risks, and evaluating system designs for 
                scalability. The architecture demonstrates responsible AI integration—structured outputs 
                and deterministic fallbacks ensure reliability regardless of external service availability.
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

          <div className="border-t pt-6 space-y-2">
            <p className="text-sm text-muted-foreground text-center" data-testid="text-footer-attribution">
              Designed and built by {ENGINEER.name}
            </p>
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
