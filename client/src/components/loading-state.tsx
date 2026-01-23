import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Brain, Sparkles } from "lucide-react";

interface LoadingStateProps {
  stage: "parsing" | "analyzing" | "grouping";
}

export function LoadingState({ stage }: LoadingStateProps) {
  const stages = [
    { id: "parsing", label: "Parsing logs", description: "Extracting structured data from raw logs" },
    { id: "analyzing", label: "AI Analysis", description: "Identifying patterns and root causes" },
    { id: "grouping", label: "Grouping errors", description: "Clustering similar errors together" },
  ];

  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Brain className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Analyzing Your Logs</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Our AI is processing your logs to identify errors, patterns, and provide actionable recommendations.
            </p>

            <div className="w-full max-w-md space-y-3">
              {stages.map((s, index) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                    index < currentIndex
                      ? "bg-green-500/10"
                      : index === currentIndex
                      ? "bg-primary/10"
                      : "bg-muted/50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    index < currentIndex
                      ? "bg-green-500 text-white"
                      : index === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {index < currentIndex ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : index === currentIndex ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${
                      index <= currentIndex ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton placeholders */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
