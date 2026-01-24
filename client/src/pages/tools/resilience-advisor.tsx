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
  Shield, 
  Sparkles, 
  Loader2, 
  FileText,
  RefreshCw,
  Key,
  Zap,
  XCircle,
  RotateCcw,
  Download
} from "lucide-react";

const SAMPLE_SCENARIO = `Our payment service is experiencing intermittent failures when communicating with the external payment gateway. 

Current behavior:
- Requests timeout after 30 seconds
- No retry logic implemented
- Users see generic error messages
- Some payments are being processed twice when users retry

Expected behavior:
- Graceful handling of gateway unavailability
- Prevention of duplicate payments
- Clear feedback to users about payment status`;

interface ResilienceResult {
  retryStrategy: {
    recommendation: string;
    maxRetries: number;
    backoffType: string;
    initialDelay: string;
  };
  idempotency: {
    recommendation: string;
    keyStrategy: string;
    storageApproach: string;
  };
  circuitBreaker: {
    recommendation: string;
    threshold: string;
    timeout: string;
    halfOpenRequests: number;
  };
  doNotRetry: string[];
  summary: string;
}

export default function ResilienceAdvisor() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ResilienceResult | null>(null);

  const adviseMutation = useMutation({
    mutationFn: async (scenario: string): Promise<ResilienceResult> => {
      const response = await apiRequest("POST", "/api/tools/resilience-advice", { scenario });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Analysis Complete", description: "Resilience recommendations generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    },
  });

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
    doc.text("Resilience Strategy Advisor - Report", 14, y);
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
    
    doc.setFontSize(12);
    doc.text("Retry Strategy", 14, y);
    y += 7;
    doc.setFontSize(9);
    const retryLines = doc.splitTextToSize(result.retryStrategy.recommendation, pageWidth - 28);
    doc.text(retryLines, 14, y);
    y += retryLines.length * 4 + 2;
    doc.text(`Max Retries: ${result.retryStrategy.maxRetries}, Backoff: ${result.retryStrategy.backoffType}, Initial Delay: ${result.retryStrategy.initialDelay}`, 14, y);
    y += 10;
    
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("Idempotency", 14, y);
    y += 7;
    doc.setFontSize(9);
    const idempLines = doc.splitTextToSize(result.idempotency.recommendation, pageWidth - 28);
    doc.text(idempLines, 14, y);
    y += idempLines.length * 4 + 2;
    doc.text(`Key Strategy: ${result.idempotency.keyStrategy}, Storage: ${result.idempotency.storageApproach}`, 14, y);
    y += 10;
    
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.text("Circuit Breaker", 14, y);
    y += 7;
    doc.setFontSize(9);
    const cbLines = doc.splitTextToSize(result.circuitBreaker.recommendation, pageWidth - 28);
    doc.text(cbLines, 14, y);
    y += cbLines.length * 4 + 2;
    doc.text(`Threshold: ${result.circuitBreaker.threshold}, Timeout: ${result.circuitBreaker.timeout}`, 14, y);
    y += 10;
    
    if (result.doNotRetry.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Do Not Retry", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.doNotRetry.forEach((item) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const itemLines = doc.splitTextToSize(`- ${item}`, pageWidth - 28);
        doc.text(itemLines, 14, y);
        y += itemLines.length * 4 + 2;
      });
    }
    
    doc.save("resilience-strategy-report.pdf");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Shield className="h-5 w-5 text-purple-500" />
          </div>
          <h1 className="text-xl font-bold">Resilience Strategy Advisor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Get recommendations for retry strategies, idempotency, circuit breakers, and handling partial failures.
        </p>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid gap-4 lg:grid-cols-3 h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Failure Scenario</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
              <Textarea
                placeholder="Describe the failure scenario (timeouts, partial failures, retries, etc.)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-h-[200px] font-mono text-sm resize-none"
                disabled={adviseMutation.isPending}
                data-testid="textarea-scenario-input"
              />

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_SCENARIO)}
                  disabled={adviseMutation.isPending}
                  data-testid="button-load-sample"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Sample
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => adviseMutation.mutate(input)} 
                  disabled={!input.trim() || adviseMutation.isPending}
                  className="flex-1"
                  data-testid="button-analyze"
                >
                  {adviseMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Get Recommendations</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={adviseMutation.isPending || (!input && !result)}
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

          {/* Center: Structured Analysis */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Resilience Patterns</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Describe a failure scenario to get recommendations</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        <h4 className="text-sm font-medium">Retry Strategy</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.retryStrategy.recommendation}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">Max: {result.retryStrategy.maxRetries}</Badge>
                        <Badge variant="outline" className="text-xs">{result.retryStrategy.backoffType}</Badge>
                        <Badge variant="outline" className="text-xs">{result.retryStrategy.initialDelay}</Badge>
                      </div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-4 w-4 text-green-500" />
                        <h4 className="text-sm font-medium">Idempotency</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.idempotency.recommendation}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{result.idempotency.keyStrategy}</Badge>
                        <Badge variant="outline" className="text-xs">{result.idempotency.storageApproach}</Badge>
                      </div>
                    </div>

                    <div className="p-3 rounded-md border">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <h4 className="text-sm font-medium">Circuit Breaker</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{result.circuitBreaker.recommendation}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">{result.circuitBreaker.threshold}</Badge>
                        <Badge variant="outline" className="text-xs">{result.circuitBreaker.timeout}</Badge>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: LLM Insights */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">What NOT to Retry</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Critical guidance will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Do Not Retry</h4>
                      <div className="space-y-2">
                        {result.doNotRetry.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
