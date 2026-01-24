import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { jsPDF } from "jspdf";
import { 
  FileSearch, 
  Sparkles, 
  Loader2, 
  FileText, 
  Upload, 
  Trash2,
  Copy,
  Target,
  ChevronRight,
  AlertCircle,
  RotateCcw,
  Download
} from "lucide-react";
import type { AnalyzeLogsResponse } from "@shared/schema";

const SAMPLE_LOGS = `2024-01-23T10:15:32.123Z ERROR [PaymentService] Failed to process payment for order #12345
  at PaymentGateway.charge (payment-gateway.ts:145)
  at PaymentService.processPayment (payment-service.ts:89)
  Caused by: ConnectionTimeoutError: Connection to payment provider timed out after 30000ms

2024-01-23T10:15:33.456Z WARN [DatabasePool] Connection pool exhausted, waiting for available connection
  Pool stats: { active: 50, idle: 0, waiting: 12, max: 50 }

2024-01-23T10:15:34.789Z ERROR [PaymentService] Failed to process payment for order #12346
  at PaymentGateway.charge (payment-gateway.ts:145)
  Caused by: ConnectionTimeoutError: Connection to payment provider timed out after 30000ms

2024-01-23T10:15:35.012Z ERROR [AuthService] JWT validation failed for token starting with eyJhbGc...
  Error: TokenExpiredError: jwt expired
  at JwtValidator.verify (jwt-validator.ts:67)

2024-01-23T10:15:36.345Z INFO [HealthCheck] System health check passed
  Memory: 78% used, CPU: 45%, Disk: 62%

2024-01-23T10:15:38.901Z FATAL [Application] Unhandled promise rejection detected
  Error: ECONNREFUSED - Redis connection refused at 127.0.0.1:6379`;

function getConfidenceColor(confidence: "low" | "medium" | "high") {
  switch (confidence) {
    case "high": return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "medium": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "low": return "bg-red-500/10 text-red-600 dark:text-red-400";
  }
}

function getLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case "ERROR":
    case "FATAL": return "bg-red-500";
    case "WARN": return "bg-yellow-500";
    case "INFO": return "bg-blue-500";
    default: return "bg-gray-400";
  }
}

export default function LogAnalyzer() {
  const { toast } = useToast();
  const [logs, setLogs] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeLogsResponse | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (rawLogs: string): Promise<AnalyzeLogsResponse> => {
      const response = await apiRequest("POST", "/api/analyze", { rawLogs });
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast({
        title: data.usedFallback ? "Analysis Complete (Fallback)" : "Analysis Complete",
        description: `Found ${data.errorGroups.length} error groups from ${data.parsedLogs.length} log entries.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setLogs(e.target?.result as string);
      reader.readAsText(file);
    }
  };

  const handleClear = () => {
    setLogs("");
    setAnalysisResult(null);
  };

  const handleExportPDF = () => {
    if (!analysisResult) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    doc.setFontSize(16);
    doc.text("Log & Incident Analyzer - Analysis Report", 14, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
    y += 15;
    
    if (analysisResult.analysis?.summary) {
      doc.setFontSize(12);
      doc.text("Summary", 14, y);
      y += 7;
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(analysisResult.analysis.summary, pageWidth - 28);
      doc.text(summaryLines, 14, y);
      y += summaryLines.length * 5 + 10;
    }
    
    if (analysisResult.errorGroups.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Error Groups", 14, y);
      y += 7;
      
      analysisResult.errorGroups.forEach((group, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. [${group.severity}] ${group.label} (${group.count}x)`, 14, y);
        y += 6;
      });
      y += 5;
    }
    
    if (analysisResult.analysis?.rootCauses && analysisResult.analysis.rootCauses.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Probable Causes", 14, y);
      y += 7;
      doc.setFontSize(9);
      analysisResult.analysis.rootCauses.forEach((cause) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const causeLines = doc.splitTextToSize(`- [${cause.confidence}] ${cause.description}`, pageWidth - 28);
        doc.text(causeLines, 14, y);
        y += causeLines.length * 4 + 2;
      });
      y += 5;
    }
    
    if (analysisResult.analysis?.recommendations && analysisResult.analysis.recommendations.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Suggested Actions", 14, y);
      y += 7;
      doc.setFontSize(9);
      analysisResult.analysis.recommendations.forEach((rec, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const recLines = doc.splitTextToSize(`${i + 1}. ${rec.title}: ${rec.description}`, pageWidth - 28);
        doc.text(recLines, 14, y);
        y += recLines.length * 4 + 2;
      });
    }
    
    doc.save("log-analysis-report.pdf");
  };

  const lines = logs.split('\n');

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <FileSearch className="h-5 w-5 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold">Log & Incident Analyzer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyze application logs and stack traces. Groups similar errors, identifies root causes, and suggests investigation steps.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-[400px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Input Logs</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(logs)} data-testid="button-copy">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                    placeholder="Paste application logs or stack traces here..."
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                    className="flex-1 bg-transparent resize-none p-2 font-mono text-sm leading-5 focus:outline-none"
                    disabled={analyzeMutation.isPending}
                    data-testid="textarea-log-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogs(SAMPLE_LOGS)}
                  disabled={analyzeMutation.isPending}
                  data-testid="button-load-sample"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Sample
                </Button>
                <label>
                  <input type="file" accept=".log,.txt" className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer" data-testid="button-upload">
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </span>
                  </Button>
                </label>
                {logs && (
                  <Button variant="ghost" size="sm" onClick={() => setLogs("")} data-testid="button-clear">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => analyzeMutation.mutate(logs)} 
                  disabled={!logs.trim() || analyzeMutation.isPending}
                  className="flex-1"
                  data-testid="button-analyze"
                >
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Analyze Logs</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={analyzeMutation.isPending || (!logs && !analysisResult)}
                  data-testid="button-clear-all"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              {analysisResult && (
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
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Structured Analysis</CardTitle>
                {analysisResult && (
                  <Badge variant="secondary" className="text-xs" data-testid="badge-entry-count">
                    {analysisResult.parsedLogs.length} entries
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!analysisResult ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileSearch className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Submit logs to see structured analysis</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Parsed Logs</h4>
                      <div className="space-y-2">
                        {analysisResult.parsedLogs.slice(0, 6).map((log) => (
                          <div key={log.id} className="p-2 rounded-md border text-xs" data-testid={`log-${log.id}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`h-2 w-2 rounded-full ${getLevelColor(log.level)}`} />
                              <span className="font-medium">{log.source}</span>
                              <span className="text-muted-foreground">{log.level}</span>
                            </div>
                            <p className="text-muted-foreground truncate">{log.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Error Groups ({analysisResult.errorGroups.length})</h4>
                      <div className="space-y-2">
                        {analysisResult.errorGroups.map((group) => (
                          <div key={group.id} className="p-2 rounded-md border" data-testid={`group-${group.id}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{group.severity}</Badge>
                              <span className="text-xs text-muted-foreground">{group.count}x</span>
                            </div>
                            <p className="text-sm font-medium">{group.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: LLM Insights */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">LLM Insights</CardTitle>
                {analysisResult?.usedFallback && (
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600" data-testid="badge-fallback">Fallback</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!analysisResult?.analysis ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">AI-powered insights will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{analysisResult.analysis.summary}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Probable Causes</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.rootCauses.map((cause) => (
                          <div key={cause.id} className="flex items-start gap-2" data-testid={`cause-${cause.id}`}>
                            <Target className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm">{cause.description}</p>
                              <Badge className={`text-xs mt-1 ${getConfidenceColor(cause.confidence)}`}>
                                {cause.confidence}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {analysisResult.analysis.missingContext.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Missing Context</h4>
                        <div className="space-y-1">
                          {analysisResult.analysis.missingContext.map((item) => (
                            <div key={item.id} className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Actions</h4>
                      <div className="space-y-2">
                        {analysisResult.analysis.recommendations.map((rec, i) => (
                          <div key={rec.id} className="flex items-start gap-2" data-testid={`rec-${rec.id}`}>
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs shrink-0">
                              {i + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{rec.title}</p>
                              <p className="text-xs text-muted-foreground">{rec.description}</p>
                            </div>
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
