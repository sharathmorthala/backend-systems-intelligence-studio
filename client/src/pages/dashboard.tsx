import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LogInput } from "@/components/log-input";
import { ParsedLogsPanel } from "@/components/parsed-logs-panel";
import { ErrorGroupsPanel } from "@/components/error-groups-panel";
import { AnalysisPanel } from "@/components/analysis-panel";
import { LoadingState } from "@/components/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Terminal, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import type { AnalyzeLogsResponse } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeLogsResponse | null>(null);
  const [loadingStage, setLoadingStage] = useState<"parsing" | "analyzing" | "grouping">("parsing");
  const [selectedLogId, setSelectedLogId] = useState<string>();
  const [selectedGroupId, setSelectedGroupId] = useState<string>();

  const analyzeMutation = useMutation({
    mutationFn: async (rawLogs: string): Promise<AnalyzeLogsResponse> => {
      setLoadingStage("parsing");
      
      // Simulate stage transitions for better UX
      setTimeout(() => setLoadingStage("analyzing"), 500);
      setTimeout(() => setLoadingStage("grouping"), 1500);
      
      const response = await apiRequest("POST", "/api/analyze", { rawLogs });
      const data = await response.json();
      return data as AnalyzeLogsResponse;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      if (data.usedFallback) {
        toast({
          title: "Analysis Complete (Fallback Mode)",
          description: "AI service was unavailable. Results generated using deterministic fallback.",
          variant: "default",
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: `Found ${data.errorGroups.length} error groups from ${data.parsedLogs.length} log entries.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (logs: string) => {
    setAnalysisResult(null);
    setSelectedLogId(undefined);
    setSelectedGroupId(undefined);
    analyzeMutation.mutate(logs);
  };

  const stats = analysisResult && analysisResult.parsedLogs ? {
    total: analysisResult.parsedLogs.length,
    errors: analysisResult.parsedLogs.filter(l => l.level === "ERROR" || l.level === "FATAL").length,
    groups: analysisResult.errorGroups?.length || 0,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">Log Analyzer</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">AI-Assisted Incident Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {stats && (
                <div className="hidden md:flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{stats.total} logs</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">{stats.errors} errors</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">{stats.groups} groups</span>
                  </div>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {analyzeMutation.isPending ? (
          <LoadingState stage={loadingStage} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left Column - Log Input */}
            <div className="lg:col-span-4">
              <LogInput 
                onAnalyze={handleAnalyze} 
                isLoading={analyzeMutation.isPending} 
              />
            </div>

            {/* Center Column - Parsed Logs & Error Groups */}
            <div className="lg:col-span-4 space-y-6">
              <ParsedLogsPanel 
                logs={analysisResult?.parsedLogs || []}
                selectedLogId={selectedLogId}
                onSelectLog={setSelectedLogId}
              />
              <ErrorGroupsPanel 
                groups={analysisResult?.errorGroups || []}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
              />
            </div>

            {/* Right Column - AI Analysis */}
            <div className="lg:col-span-4">
              <AnalysisPanel 
                analysis={analysisResult?.analysis || null}
                usedFallback={analysisResult?.usedFallback}
              />
            </div>
          </div>
        )}

        {/* Status Footer */}
        {analysisResult && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Analysis ID: {analysisResult.id.slice(0, 8)}
            </Badge>
            <span>|</span>
            <span>{new Date(analysisResult.createdAt).toLocaleString()}</span>
            {analysisResult.usedFallback && (
              <>
                <span>|</span>
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">
                  Fallback Mode
                </Badge>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
