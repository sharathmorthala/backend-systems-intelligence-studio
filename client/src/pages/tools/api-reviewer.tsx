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
  FileCode, 
  Sparkles, 
  Loader2, 
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RotateCcw,
  Download
} from "lucide-react";

const SAMPLE_API = `{
  "request": {
    "method": "POST",
    "path": "/api/users",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "response": {
    "status": 200,
    "body": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "created": "2024-01-23"
    }
  }
}`;

interface ReviewResult {
  missingFields: string[];
  inconsistencies: string[];
  breakingChangeRisks: string[];
  bestPractices: string[];
  summary: string;
}

export default function ApiReviewer() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (apiContract: string): Promise<ReviewResult> => {
      const response = await apiRequest("POST", "/api/tools/api-review", { apiContract });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Review Complete", description: "API contract has been analyzed." });
    },
    onError: (error: Error) => {
      toast({ title: "Review Failed", description: error.message, variant: "destructive" });
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
    doc.text("API Contract Reviewer - Analysis Report", 14, y);
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
    
    if (result.missingFields.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Missing Fields", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.missingFields.forEach((field) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const fieldLines = doc.splitTextToSize(`- ${field}`, pageWidth - 28);
        doc.text(fieldLines, 14, y);
        y += fieldLines.length * 4 + 2;
      });
      y += 5;
    }
    
    if (result.inconsistencies.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Inconsistencies", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.inconsistencies.forEach((item) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const itemLines = doc.splitTextToSize(`- ${item}`, pageWidth - 28);
        doc.text(itemLines, 14, y);
        y += itemLines.length * 4 + 2;
      });
      y += 5;
    }
    
    if (result.breakingChangeRisks.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text("Breaking Change Risks", 14, y);
      y += 7;
      doc.setFontSize(9);
      result.breakingChangeRisks.forEach((risk) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const riskLines = doc.splitTextToSize(`- ${risk}`, pageWidth - 28);
        doc.text(riskLines, 14, y);
        y += riskLines.length * 4 + 2;
      });
      y += 5;
    }
    
    if (result.bestPractices.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
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
    
    doc.save("api-review-report.pdf");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <FileCode className="h-5 w-5 text-green-500" />
          </div>
          <h1 className="text-xl font-bold">API Contract Reviewer</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Review REST request/response JSON and OpenAPI specs. Identifies missing fields, inconsistent error models, and breaking changes.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3 lg:h-full">
          {/* Left: Input */}
          <Card className="flex flex-col min-h-[400px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">API Contract Input</CardTitle>
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
                    placeholder="Paste REST request/response JSON or OpenAPI spec..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent resize-none p-2 font-mono text-sm leading-5 focus:outline-none"
                    disabled={reviewMutation.isPending}
                    data-testid="textarea-api-input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(SAMPLE_API)}
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
                    <><Sparkles className="h-4 w-4 mr-2" />Review Contract</>
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

          {/* Center: Structured Analysis */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Contract Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileCode className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Submit an API contract to see analysis</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    {result.missingFields.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <h4 className="text-sm font-medium">Missing Fields</h4>
                        </div>
                        <div className="space-y-1 pl-6">
                          {result.missingFields.map((field, i) => (
                            <p key={i} className="text-sm text-muted-foreground">{field}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.inconsistencies.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <h4 className="text-sm font-medium">Inconsistencies</h4>
                        </div>
                        <div className="space-y-1 pl-6">
                          {result.inconsistencies.map((item, i) => (
                            <p key={i} className="text-sm text-muted-foreground">{item}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.breakingChangeRisks.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <h4 className="text-sm font-medium">Breaking Change Risks</h4>
                        </div>
                        <div className="space-y-1 pl-6">
                          {result.breakingChangeRisks.map((risk, i) => (
                            <p key={i} className="text-sm text-muted-foreground">{risk}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Right: LLM Insights */}
          <Card className="flex flex-col min-h-[350px] lg:min-h-0">
            <CardHeader className="pb-3 space-y-0">
              <CardTitle className="text-base">Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">AI recommendations will appear here</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4 pr-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>
                    {result.bestPractices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <div className="space-y-2">
                          {result.bestPractices.map((practice, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">{practice}</p>
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
