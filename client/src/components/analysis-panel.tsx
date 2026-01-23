import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Target, 
  AlertCircle, 
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Settings
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

export function AnalysisPanel({ analysis, usedFallback }: AnalysisPanelProps) {
  if (!analysis) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold">LLM-Assisted Analysis</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" data-testid="button-analysis-refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-analysis-settings">
                <Settings className="h-4 w-4" />
              </Button>
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
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">LLM-Assisted Analysis</CardTitle>
          <div className="flex items-center gap-1">
            {usedFallback && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 mr-1">
                Fallback
              </Badge>
            )}
            <Button variant="ghost" size="icon" data-testid="button-analysis-refresh-active">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-analysis-settings-active">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-[500px]">
          <div className="px-6 pb-6 space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Suggested Next Task</h4>
              {analysis.recommendations.length > 0 && (
                <div className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {analysis.recommendations[0].description}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Missing Data</h4>
              <div className="space-y-2">
                {analysis.missingContext.length > 0 ? (
                  analysis.missingContext.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2"
                      data-testid={`missing-context-${item.id}`}
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No missing data identified</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-md bg-muted/50 border">
              <p className="text-xs text-muted-foreground font-medium mb-2">Query result</p>
              <p className="text-sm font-medium mb-2">
                {analysis.rootCauses.length > 0 
                  ? `"${analysis.rootCauses[0].description.substring(0, 50)}..."`
                  : '"No critical issues found"'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                The provided case data has been analyzed. Found {analysis.rootCauses.length} potential root causes 
                and {analysis.recommendations.length} recommendations for investigation.
              </p>
              {analysis.missingContext.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <code className="text-xs text-muted-foreground font-mono">
                    {`{ missing_fields: [`}
                    {analysis.missingContext.map((m, i) => (
                      <span key={m.id}>
                        "{m.description.split(' ')[0]}"
                        {i < analysis.missingContext.length - 1 ? ", " : ""}
                      </span>
                    ))}
                    {`] }`}
                  </code>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3">Probable Causes</h4>
              <div className="space-y-2">
                {analysis.rootCauses.map((cause) => (
                  <div
                    key={cause.id}
                    className="flex items-start gap-2"
                    data-testid={`root-cause-${cause.id}`}
                  >
                    <Target className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">{cause.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getConfidenceColor(cause.confidence)}`}>
                          {cause.confidence}
                        </Badge>
                        {cause.affectedComponents.slice(0, 2).map((component) => (
                          <Badge key={component} variant="outline" className="text-xs font-mono">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Suggested Investigation</h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div
                    key={rec.id}
                    className="flex items-start gap-2"
                    data-testid={`recommendation-${rec.id}`}
                  >
                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
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
