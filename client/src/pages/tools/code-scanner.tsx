import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { jsPDF } from "jspdf";
import { 
  Code, 
  Sparkles, 
  Loader2, 
  FileText,
  Clock,
  Lock,
  Zap,
  Bug,
  CheckCircle,
  Info,
  RotateCcw,
  Download,
  AlertTriangle
} from "lucide-react";

const SAMPLE_CODE = `public String fetchUserData(Request request) throws IOException {
    Response response = httpClient.newCall(request).execute();
    return response.body().string();
}`;

const SAMPLE_CODE_EXTENDED = `@Service
public class PaymentProcessor {
    
    @Autowired
    private PaymentGateway gateway;
    
    private static Map<String, Payment> cache = new HashMap<>();
    
    public Payment processPayment(PaymentRequest request) {
        // Blocking call without timeout
        Future<Payment> future = executor.submit(() -> gateway.charge(request));
        Payment payment = future.get();
        
        // Non-thread-safe cache access
        cache.put(request.getId(), payment);
        
        // Swallowing exception
        try {
            notifyUser(payment);
        } catch (Exception e) {
            // ignore
        }
        
        return payment;
    }
    
    public String fetchData(Request request) throws IOException {
        Response response = httpClient.newCall(request).execute();
        return response.body().string();
    }
}`;

interface CodeRisk {
  line: number;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface ScanResult {
  blockingCalls: CodeRisk[];
  threadSafetyRisks: CodeRisk[];
  errorHandlingGaps: CodeRisk[];
  performanceConcerns: CodeRisk[];
  bestPractices: string[];
  summary: string;
  llmInsights: string | null;
  usedFallback: boolean;
  language?: string;
  parserUsed?: string;
}

export default function CodeScanner() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (code: string): Promise<ScanResult> => {
      const response = await apiRequest("POST", "/api/tools/code-scan", { code });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      const totalIssues = data.blockingCalls.length + data.threadSafetyRisks.length + 
                          data.errorHandlingGaps.length + data.performanceConcerns.length;
      const highCount = [...data.blockingCalls, ...data.threadSafetyRisks, 
                         ...data.errorHandlingGaps, ...data.performanceConcerns]
                         .filter(r => r.severity === "high").length;
      toast({ 
        title: "Scan Complete", 
        description: totalIssues > 0 
          ? `Found ${totalIssues} risks (${highCount} high severity).`
          : "No risks detected by current ruleset."
      });
    },
    onError: (error: Error) => {
      toast({ title: "Scan Failed", description: error.message, variant: "destructive" });
    },
  });

  const lines = input.split('\n');

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
    doc.text("Backend Code Risk Scanner - Analysis Report", 14, y);
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
    
    const allRisks = [
      ...result.blockingCalls.map(r => ({ ...r, category: "Blocking Call" })),
      ...result.threadSafetyRisks.map(r => ({ ...r, category: "Thread Safety" })),
      ...result.errorHandlingGaps.map(r => ({ ...r, category: "Error Handling" })),
      ...result.performanceConcerns.map(r => ({ ...r, category: "Performance" })),
    ];
    
    if (allRisks.length > 0) {
      doc.setFontSize(12);
      doc.text("Detected Risks", 14, y);
      y += 7;
      
      allRisks.forEach((risk, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. [${risk.severity.toUpperCase()}] ${risk.category} - Line ${risk.line}`, 14, y);
        y += 5;
        const descLines = doc.splitTextToSize(risk.description, pageWidth - 28);
        doc.text(descLines, 18, y);
        y += descLines.length * 4 + 5;
      });
    }
    
    if (result.bestPractices.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      y += 5;
      doc.setFontSize(12);
      doc.text("Best Practices", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.bestPractices.forEach((practice) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const practiceLines = doc.splitTextToSize(`- ${practice}`, pageWidth - 28);
        doc.text(practiceLines, 14, y);
        y += practiceLines.length * 4 + 2;
      });
    }
    
    doc.save("code-risk-analysis.pdf");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "low": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const totalIssues = result 
    ? result.blockingCalls.length + result.threadSafetyRisks.length + 
      result.errorHandlingGaps.length + result.performanceConcerns.length 
    : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Code className="h-5 w-5 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold" data-testid="text-tool-title">Backend Code Risk Scanner</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Scan Java, Kotlin, JavaScript, and Python backend code for runtime error risks, blocking calls, 
          thread-safety issues, and error-handling gaps. Deterministic static analysis runs first. 
          AI explains why detected risks matter—without inventing new ones.
        </p>
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-xs text-muted-foreground ml-2">
            This tool highlights potential risk patterns, not guaranteed failures. 
            It complements static analysis tools—it does not replace them.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid gap-4 lg:grid-cols-3 h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Code Input</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 min-h-0 rounded-md border bg-muted/30 overflow-hidden">
                <div className="flex h-full overflow-auto">
                  <div className="select-none text-right pr-3 py-2 text-xs text-muted-foreground/50 font-mono bg-muted/20 min-w-[2rem]">
                    {lines.map((_, i) => (
                      <div key={i} className="leading-5">{i + 1}</div>
                    ))}
                  </div>
                  <textarea
                    placeholder="Paste Java or Kotlin backend code..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent resize-none p-2 font-mono text-sm leading-5 focus:outline-none"
                    disabled={scanMutation.isPending}
                    data-testid="textarea-code-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_CODE)}
                  disabled={scanMutation.isPending}
                  data-testid="button-sample-minimal"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Minimal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_CODE_EXTENDED)}
                  disabled={scanMutation.isPending}
                  data-testid="button-sample-extended"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Extended
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => scanMutation.mutate(input)} 
                  disabled={!input.trim() || scanMutation.isPending}
                  className="flex-1"
                  data-testid="button-scan"
                >
                  {scanMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Scan Code</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={scanMutation.isPending || (!input && !result)}
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

          {/* Center: Risk Categories + Best Practices */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Risk Detection</CardTitle>
                {result && (
                  <Badge variant={totalIssues > 0 ? "destructive" : "secondary"} className="text-xs">
                    {totalIssues} {totalIssues === 1 ? "risk" : "risks"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Code className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Submit code to detect potential risks</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {totalIssues === 0 && (
                      <div className="p-3 rounded-md border border-green-500/20 bg-green-500/5">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">No risks detected by current ruleset</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This does not guarantee correctness. Consider additional static analysis tools.
                        </p>
                      </div>
                    )}

                    {result.blockingCalls.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <h4 className="text-sm font-medium">Blocking Calls ({result.blockingCalls.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.blockingCalls.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs" data-testid={`risk-blocking-${i}`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                <span className="text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.threadSafetyRisks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-orange-500" />
                          <h4 className="text-sm font-medium">Thread Safety ({result.threadSafetyRisks.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.threadSafetyRisks.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs" data-testid={`risk-thread-${i}`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                <span className="text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.errorHandlingGaps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bug className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Error Handling ({result.errorHandlingGaps.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.errorHandlingGaps.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs" data-testid={`risk-error-${i}`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                <span className="text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.performanceConcerns.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <h4 className="text-sm font-medium">Performance ({result.performanceConcerns.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.performanceConcerns.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs" data-testid={`risk-perf-${i}`}>
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <Badge variant="outline" className="text-xs">{issue.type}</Badge>
                                <span className="text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Practices Section */}
                    {result.bestPractices.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <h4 className="text-sm font-medium">Best Practices</h4>
                        </div>
                        <ul className="space-y-1">
                          {result.bestPractices.map((practice, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{practice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: Summary + LLM Insights */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Analysis Insights</CardTitle>
                {result && (
                  <Badge variant={result.usedFallback ? "secondary" : "default"} className="text-xs">
                    {result.usedFallback ? "Deterministic" : "AI-Enhanced"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">AI insights will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground" data-testid="text-summary">{result.summary}</p>
                    </div>

                    {result.usedFallback && totalIssues > 0 && (
                      <div className="p-3 rounded-md border border-yellow-500/20 bg-yellow-500/5">
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <Info className="h-4 w-4" />
                          <span className="text-xs font-medium">AI insights unavailable</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Deterministic risk analysis completed. LLM explanations could not be generated.
                        </p>
                      </div>
                    )}

                    {result.llmInsights && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">AI Explanation</h4>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap p-3 rounded-md bg-muted/50" data-testid="text-llm-insights">
                          {result.llmInsights}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">How Detection Works</h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">1.</span>
                          <span><strong>Deterministic rules</strong> detect risks using pattern matching</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">2.</span>
                          <span><strong>LLM</strong> explains why each risk matters (does not invent risks)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">3.</span>
                          <span><strong>Fallback</strong> ensures tool works even without AI</span>
                        </li>
                      </ul>
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
