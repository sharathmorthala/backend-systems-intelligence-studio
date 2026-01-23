import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Code, 
  Sparkles, 
  Loader2, 
  FileText,
  AlertTriangle,
  Clock,
  Lock,
  Zap,
  Bug
} from "lucide-react";

const SAMPLE_CODE = `@Service
public class PaymentProcessor {
    
    @Autowired
    private PaymentGateway gateway;
    
    private static Map<String, Payment> cache = new HashMap<>();
    
    public Payment processPayment(PaymentRequest request) {
        // Blocking call without timeout
        Payment payment = gateway.charge(request);
        
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
    
    public List<Payment> getRecentPayments() {
        // N+1 query problem
        List<User> users = userRepository.findAll();
        return users.stream()
            .flatMap(u -> paymentRepository.findByUser(u).stream())
            .collect(Collectors.toList());
    }
}`;

interface ScanResult {
  blockingCalls: Array<{ line: number; description: string; severity: string }>;
  threadSafetyRisks: Array<{ line: number; description: string; severity: string }>;
  errorHandlingGaps: Array<{ line: number; description: string; severity: string }>;
  performanceConcerns: Array<{ line: number; description: string; severity: string }>;
  summary: string;
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
      toast({ title: "Scan Complete", description: `Found ${totalIssues} potential issues.` });
    },
    onError: (error: Error) => {
      toast({ title: "Scan Failed", description: error.message, variant: "destructive" });
    },
  });

  const lines = input.split('\n');

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-600";
      case "medium": return "bg-yellow-500/10 text-yellow-600";
      case "low": return "bg-blue-500/10 text-blue-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Code className="h-5 w-5 text-orange-500" />
          </div>
          <h1 className="text-xl font-bold">Backend Code Risk Scanner</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Scan Java or Kotlin code for blocking calls, thread-safety risks, error handling gaps, and performance concerns.
          <span className="text-yellow-600 ml-1">This is risk detection, not automated code review replacement.</span>
        </p>
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

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_CODE)}
                  disabled={scanMutation.isPending}
                  data-testid="button-load-sample"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Sample
                </Button>
              </div>

              <Button 
                onClick={() => scanMutation.mutate(input)} 
                disabled={!input.trim() || scanMutation.isPending}
                className="w-full"
                data-testid="button-scan"
              >
                {scanMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Scan Code</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Center: Risk Categories */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Risk Detection</CardTitle>
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
                    {result.blockingCalls.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-red-500" />
                          <h4 className="text-sm font-medium">Blocking Calls ({result.blockingCalls.length})</h4>
                        </div>
                        <div className="space-y-2">
                          {result.blockingCalls.map((issue, i) => (
                            <div key={i} className="p-2 rounded-md border text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
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
                            <div key={i} className="p-2 rounded-md border text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-xs ${getSeverityColor(issue.severity)}`}>{issue.severity}</Badge>
                                <span className="text-muted-foreground">Line {issue.line}</span>
                              </div>
                              <p className="text-muted-foreground">{issue.description}</p>
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

          {/* Right: More Issues */}
          <Card className="flex flex-col min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Additional Concerns</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Detailed analysis will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    {result.errorHandlingGaps.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Bug className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Error Handling Gaps</h4>
                        </div>
                        <div className="space-y-2">
                          {result.errorHandlingGaps.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-muted-foreground">Line {issue.line}: {issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.performanceConcerns.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <h4 className="text-sm font-medium">Performance</h4>
                        </div>
                        <div className="space-y-2">
                          {result.performanceConcerns.map((issue, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-muted-foreground">Line {issue.line}: {issue.description}</p>
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
