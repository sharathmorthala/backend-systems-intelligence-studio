import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { jsPDF } from "jspdf";
import { 
  Network, 
  Sparkles, 
  Loader2, 
  FileText,
  AlertTriangle,
  Activity,
  Server,
  Eye,
  RotateCcw,
  Download
} from "lucide-react";

const SAMPLE_DESIGN = `System: E-commerce Order Processing

Components:
1. Web Frontend - React SPA served via CDN
2. API Gateway - Single Node.js instance handling all requests
3. Order Service - Processes orders, writes to MySQL database
4. Payment Service - Integrates with Stripe API
5. Inventory Service - Checks stock levels from shared database
6. Notification Service - Sends emails via SendGrid

Data Flow:
- User places order via frontend
- API Gateway routes to Order Service
- Order Service calls Payment Service synchronously
- On success, Order Service updates inventory
- Notification Service is called synchronously to send confirmation

Database:
- Single MySQL instance for all services
- No read replicas
- 500GB storage, 90% utilized

Current Issues:
- Slow response times during peak hours
- Occasional order failures during payment processing
- Email delays affecting user experience`;

interface ReviewResult {
  bottlenecks: Array<{ component: string; description: string; severity: string }>;
  singlePointsOfFailure: Array<{ component: string; risk: string; mitigation: string }>;
  scalabilityConcerns: Array<{ area: string; description: string; recommendation: string }>;
  observabilityGaps: Array<{ area: string; description: string }>;
  summary: string;
}

export default function SystemReviewer() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (design: string): Promise<ReviewResult> => {
      const response = await apiRequest("POST", "/api/tools/system-review", { design });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      const totalIssues = data.bottlenecks.length + data.singlePointsOfFailure.length + 
                          data.scalabilityConcerns.length + data.observabilityGaps.length;
      toast({ title: "Review Complete", description: `Found ${totalIssues} areas of concern.` });
    },
    onError: (error: Error) => {
      toast({ title: "Review Failed", description: error.message, variant: "destructive" });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-600";
      case "medium": return "bg-yellow-500/10 text-yellow-600";
      case "low": return "bg-blue-500/10 text-blue-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleClear = () => {
    setInput("");
    setResult(null);
  };

  const handleExportPDF = () => {
    if (!result) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    doc.setFontSize(16);
    doc.text("System Design Reviewer - Analysis Report", 14, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
    y += 15;
    
    doc.setFontSize(12);
    doc.text("Summary", 14, y);
    y += 7;
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 28);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 5 + 10;
    
    if (result.bottlenecks.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Bottlenecks", 14, y);
      y += 7;
      result.bottlenecks.forEach((issue, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. [${issue.severity}] ${issue.component}`, 14, y);
        y += 5;
        const descLines = doc.splitTextToSize(issue.description, pageWidth - 28);
        doc.text(descLines, 18, y);
        y += descLines.length * 4 + 5;
      });
    }
    
    if (result.singlePointsOfFailure.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Single Points of Failure", 14, y);
      y += 7;
      result.singlePointsOfFailure.forEach((issue, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${issue.component}`, 14, y);
        y += 5;
        const riskLines = doc.splitTextToSize(`Risk: ${issue.risk}`, pageWidth - 28);
        doc.text(riskLines, 18, y);
        y += riskLines.length * 4 + 2;
        const mitLines = doc.splitTextToSize(`Mitigation: ${issue.mitigation}`, pageWidth - 28);
        doc.text(mitLines, 18, y);
        y += mitLines.length * 4 + 5;
      });
    }
    
    if (result.scalabilityConcerns.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Scalability Concerns", 14, y);
      y += 7;
      result.scalabilityConcerns.forEach((issue, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${issue.area}`, 14, y);
        y += 5;
        const descLines = doc.splitTextToSize(issue.description, pageWidth - 28);
        doc.text(descLines, 18, y);
        y += descLines.length * 4 + 2;
        const recLines = doc.splitTextToSize(`Recommendation: ${issue.recommendation}`, pageWidth - 28);
        doc.text(recLines, 18, y);
        y += recLines.length * 4 + 5;
      });
    }
    
    if (result.observabilityGaps.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Observability Gaps", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.observabilityGaps.forEach((issue) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const gapLines = doc.splitTextToSize(`- ${issue.area}: ${issue.description}`, pageWidth - 28);
        doc.text(gapLines, 14, y);
        y += gapLines.length * 4 + 2;
      });
    }
    
    doc.save("system-review-report.pdf");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Network className="h-5 w-5 text-red-500" />
          </div>
          <h1 className="text-xl font-bold">System Design Reviewer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Review system design descriptions for bottlenecks, single points of failure, scalability concerns, and observability gaps.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-[400px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">System Design</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
              <Textarea
                placeholder="Describe your system architecture, components, data flow, and current setup..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-h-[200px] font-mono text-sm resize-none"
                disabled={reviewMutation.isPending}
                data-testid="textarea-design-input"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_DESIGN)}
                  disabled={reviewMutation.isPending}
                  data-testid="button-load-sample"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Sample
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => reviewMutation.mutate(input)} 
                  disabled={!input.trim() || reviewMutation.isPending}
                  className="flex-1"
                  data-testid="button-review"
                >
                  {reviewMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Reviewing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Review Design</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={reviewMutation.isPending || (!input && !result)}
                  data-testid="button-clear"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              {result && (
                <Button
                  variant="outline"
                  onClick={handleExportPDF}
                  className="w-full"
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Center: Main Issues */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Network className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Submit a design description for review</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {result.bottlenecks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          <h4 className="text-sm font-medium">Bottlenecks ({result.bottlenecks.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.bottlenecks.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <span className="font-medium">{issue.component}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.singlePointsOfFailure.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Server className="h-4 w-4 text-orange-500" />
                          <h4 className="text-sm font-medium">Single Points of Failure ({result.singlePointsOfFailure.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.singlePointsOfFailure.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs">
                              <p className="font-medium mb-1">{issue.component}</p>
                              <p className="text-muted-foreground mb-1">{issue.risk}</p>
                              <p className="text-green-600 text-xs">{issue.mitigation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: Scalability & Observability */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Detailed recommendations will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    {result.scalabilityConcerns.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Scalability</h4>
                        </div>
                        <div className="space-y-2">
                          {result.scalabilityConcerns.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs">
                              <p className="font-medium mb-1">{issue.area}</p>
                              <p className="text-muted-foreground mb-1">{issue.description}</p>
                              <p className="text-green-600">{issue.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.observabilityGaps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-purple-500" />
                          <h4 className="text-sm font-medium">Observability Gaps</h4>
                        </div>
                        <div className="space-y-2">
                          {result.observabilityGaps.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-medium">{issue.area}</p>
                                <p className="text-xs text-muted-foreground">{issue.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
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
