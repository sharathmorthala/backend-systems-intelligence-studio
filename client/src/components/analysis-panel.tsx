import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Target, 
  AlertCircle, 
  Lightbulb,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  Shield,
  Search,
  Wrench
} from "lucide-react";
import type { AnalysisResult } from "@shared/schema";

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  usedFallback?: boolean;
}

function getConfidenceColor(confidence: "low" | "medium" | "high") {
  switch (confidence) {
    case "high":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "low":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
  }
}

function getImportanceColor(importance: "optional" | "recommended" | "critical") {
  switch (importance) {
    case "critical":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "recommended":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "optional":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
}

function getPriorityColor(priority: "low" | "medium" | "high") {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "low":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  }
}

function getCategoryIcon(category: "investigation" | "mitigation" | "prevention") {
  switch (category) {
    case "investigation":
      return <Search className="h-4 w-4" />;
    case "mitigation":
      return <Wrench className="h-4 w-4" />;
    case "prevention":
      return <Shield className="h-4 w-4" />;
  }
}

export function AnalysisPanel({ analysis, usedFallback }: AnalysisPanelProps) {
  if (!analysis) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted">
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
              <CardDescription>Insights and recommendations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No Analysis Yet</h3>
            <p className="text-sm text-muted-foreground max-w-[220px]">
              Submit logs to get AI-powered analysis with root cause detection
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
              <CardDescription>Insights and recommendations</CardDescription>
            </div>
          </div>
          {usedFallback && (
            <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
              Fallback Mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Summary</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {analysis.summary}
              </p>
            </div>

            <Separator />

            {/* Root Causes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-destructive" />
                <h4 className="font-medium">Probable Causes</h4>
                <Badge variant="secondary" className="text-xs">
                  {analysis.rootCauses.length}
                </Badge>
              </div>
              <div className="space-y-3 pl-6">
                {analysis.rootCauses.map((cause) => (
                  <div
                    key={cause.id}
                    className="p-3 rounded-md border bg-card"
                    data-testid={`root-cause-${cause.id}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <CircleDot className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm">{cause.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap ml-6">
                      <Badge className={`text-xs ${getConfidenceColor(cause.confidence)}`}>
                        {cause.confidence} confidence
                      </Badge>
                      {cause.affectedComponents.map((component) => (
                        <Badge key={component} variant="outline" className="text-xs font-mono">
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Missing Context */}
            {analysis.missingContext.length > 0 && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <h4 className="font-medium">Missing Context</h4>
                    <Badge variant="secondary" className="text-xs">
                      {analysis.missingContext.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 pl-6">
                    {analysis.missingContext.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                        data-testid={`missing-context-${item.id}`}
                      >
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm">{item.description}</p>
                        </div>
                        <Badge className={`text-xs shrink-0 ${getImportanceColor(item.importance)}`}>
                          {item.importance}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Suggested Investigation</h4>
                <Badge variant="secondary" className="text-xs">
                  {analysis.recommendations.length}
                </Badge>
              </div>
              <div className="space-y-3 pl-6">
                {analysis.recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-md border bg-card"
                    data-testid={`recommendation-${rec.id}`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm mb-1">{rec.title}</h5>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-9">
                      <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryIcon(rec.category)}
                        <span className="ml-1 capitalize">{rec.category}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
