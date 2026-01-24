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
  Package, 
  Sparkles, 
  Loader2, 
  FileText,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ArrowUpCircle,
  AlertCircle,
  RotateCcw,
  Download
} from "lucide-react";

const SAMPLE_PACKAGE_JSON = `{
  "name": "my-backend-service",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "4.17.15",
    "moment": "^2.29.1",
    "request": "^2.88.2",
    "axios": "1.6.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "typescript": "^5.0.0"
  }
}`;

const SAMPLE_POM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<project>
    <dependencies>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-core</artifactId>
            <version>2.14.1</version>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.9.8</version>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-core</artifactId>
            <version>5.3.10</version>
        </dependency>
        <dependency>
            <groupId>commons-collections</groupId>
            <artifactId>commons-collections</artifactId>
            <version>3.2.1</version>
        </dependency>
    </dependencies>
</project>`;

interface DependencyRisk {
  name: string;
  version: string;
  riskLevel: "high" | "moderate" | "low";
  reason: string;
}

interface AnalysisResult {
  detectedRisks: Array<{ issue: string; severity: "high" | "moderate" | "low" }>;
  dependencies: DependencyRisk[];
  recommendations: string[];
  summary: string;
  usedFallback: boolean;
}

export default function DependencyAnalyzer() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (manifest: string): Promise<AnalysisResult> => {
      const response = await apiRequest("POST", "/api/tools/dependency-analyze", { manifest });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      const highRiskCount = data.detectedRisks.filter(r => r.severity === "high").length;
      toast({ 
        title: "Analysis Complete", 
        description: `Found ${data.detectedRisks.length} risks (${highRiskCount} high severity).` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "moderate": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "low": return "bg-green-500/10 text-green-600 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high": return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "moderate": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low": return <ShieldCheck className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
    doc.text("Dependency Risk & Vulnerability Analyzer - Report", 14, y);
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
    
    if (result.detectedRisks.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Detected Risks", 14, y);
      y += 7;
      result.detectedRisks.forEach((risk, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. [${risk.severity.toUpperCase()}]`, 14, y);
        y += 5;
        const issueLines = doc.splitTextToSize(risk.issue, pageWidth - 28);
        doc.text(issueLines, 18, y);
        y += issueLines.length * 4 + 5;
      });
    }
    
    if (result.dependencies.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Dependencies Analysis", 14, y);
      y += 7;
      result.dependencies.forEach((dep, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${dep.name} (${dep.version}) - Risk: ${dep.riskLevel}`, 14, y);
        y += 5;
        if (dep.reason) {
          const reasonLines = doc.splitTextToSize(dep.reason, pageWidth - 28);
          doc.text(reasonLines, 18, y);
          y += reasonLines.length * 4 + 3;
        }
      });
    }
    
    if (result.recommendations.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Recommendations", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.recommendations.forEach((rec, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const recLines = doc.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 28);
        doc.text(recLines, 14, y);
        y += recLines.length * 4 + 2;
      });
    }
    
    doc.save("dependency-analysis-report.pdf");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-cyan-500/10">
            <Package className="h-5 w-5 text-cyan-500" />
          </div>
          <h1 className="text-xl font-bold" data-testid="text-tool-title">Dependency Risk & Vulnerability Analyzer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyze dependency manifests for known vulnerabilities, outdated libraries, and supply-chain risks.
          <span className="text-yellow-600 dark:text-yellow-400 ml-1">Supports pom.xml, package.json, and build.gradle.</span>
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-[400px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Manifest Input</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 min-h-0 rounded-md border bg-muted/30 overflow-hidden">
                <textarea
                  placeholder="Paste pom.xml, package.json, or build.gradle contents..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full h-full bg-transparent resize-none p-3 font-mono text-sm leading-5 focus:outline-none"
                  disabled={analyzeMutation.isPending}
                  data-testid="textarea-manifest-input"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_PACKAGE_JSON)}
                  disabled={analyzeMutation.isPending}
                  data-testid="button-sample-npm"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  npm Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_POM_XML)}
                  disabled={analyzeMutation.isPending}
                  data-testid="button-sample-pom"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Maven Sample
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => analyzeMutation.mutate(input)} 
                  disabled={!input.trim() || analyzeMutation.isPending}
                  className="flex-1"
                  data-testid="button-analyze"
                >
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Analyze Dependencies</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  disabled={analyzeMutation.isPending || (!input && !result)}
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

          {/* Center: Detected Risks */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Detected Risks</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Submit a manifest to detect risks</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {result.usedFallback && (
                      <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          AI insights unavailable. Deterministic risk analysis completed.
                        </p>
                      </div>
                    )}
                    
                    {result.detectedRisks.length === 0 ? (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10">
                        <ShieldCheck className="h-5 w-5 text-green-500" />
                        <p className="text-sm text-green-600 dark:text-green-400">No significant risks detected</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {result.detectedRisks.map((risk, i) => (
                          <div key={i} className="p-2 rounded-md border text-xs">
                            <div className="flex items-start gap-2">
                              {getSeverityIcon(risk.severity)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs ${getSeverityColor(risk.severity)}`}>
                                    {risk.severity}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground">{risk.issue}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {result.dependencies.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Dependency Breakdown</h4>
                        <div className="space-y-1">
                          {result.dependencies.slice(0, 10).map((dep, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-md border text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono truncate">{dep.name}</p>
                                <p className="text-muted-foreground truncate">{dep.version}</p>
                              </div>
                              <Badge className={`text-xs shrink-0 ${getSeverityColor(dep.riskLevel)}`}>
                                {dep.riskLevel}
                              </Badge>
                            </div>
                          ))}
                          {result.dependencies.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{result.dependencies.length - 10} more dependencies
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: Recommendations */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Actionable guidance will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>

                    {result.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Action Items</h4>
                        <div className="space-y-2">
                          {result.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <ArrowUpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <p className="text-xs text-muted-foreground">{rec}</p>
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
          This analyzer highlights dependency risk patterns and known indicators. It is not a replacement for enterprise vulnerability scanners or continuous security tooling.
        </p>
      </div>
    </div>
  );
}
