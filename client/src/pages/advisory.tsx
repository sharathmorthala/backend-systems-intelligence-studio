import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Handshake, CheckCircle } from "lucide-react";

export default function AdvisoryPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-advisory-title">
          Advisory & Collaboration
        </h1>
        <p className="text-muted-foreground" data-testid="text-advisory-subtitle">
          Backend reliability, system design, and AI-assisted engineering advisory.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <Card data-testid="card-advisory-content">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Engineering Advisory
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
              <div className="pt-4">
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
