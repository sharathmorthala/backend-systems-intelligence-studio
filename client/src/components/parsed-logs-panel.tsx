import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Settings, ChevronLeft, ChevronRight, Play, Circle } from "lucide-react";
import type { LogEntry } from "@shared/schema";

interface ParsedLogsPanelProps {
  logs: LogEntry[];
  selectedLogId?: string;
  onSelectLog?: (logId: string) => void;
}

function getLevelColor(level: string): string {
  switch (level.toUpperCase()) {
    case "ERROR":
    case "FATAL":
      return "bg-red-500";
    case "WARN":
    case "WARNING":
      return "bg-yellow-500";
    case "INFO":
      return "bg-blue-500";
    default:
      return "bg-gray-400";
  }
}

function getLevelBadgeColor(level: string): string {
  switch (level.toUpperCase()) {
    case "ERROR":
    case "FATAL":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "WARN":
    case "WARNING":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "INFO":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ParsedLogsPanel({ logs, selectedLogId, onSelectLog }: ParsedLogsPanelProps) {
  if (logs.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Workflow Engine</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" data-testid="button-workflow-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">No Logs Parsed</h3>
            <p className="text-xs text-muted-foreground max-w-[180px]">
              Submit logs to see the workflow execution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workflowSteps = logs.slice(0, 4).map((log, index) => ({
    id: log.id,
    title: log.source || `Step ${index + 1}`,
    message: log.message.substring(0, 40),
    level: log.level,
    isActive: index === 1,
  }));

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Workflow Engine</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" data-testid="button-workflow-settings-active">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-3 p-4 pt-0">
        <ScrollArea className="flex-1">
          <div className="flex flex-col items-center gap-1">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="w-full">
                <div
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedLogId === step.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelectLog?.(step.id)}
                  data-testid={`log-entry-${step.id}`}
                >
                  <div className={`h-3 w-3 rounded-full ${getLevelColor(step.level)} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{step.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{step.message}</p>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="h-4 w-0.5 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Tasks:</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" data-testid="button-tasks-prev">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-tasks-next">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            {logs.slice(0, 3).map((log) => (
              <div key={log.id} className="flex items-center gap-2">
                <Circle className={`h-2 w-2 ${getLevelColor(log.level)} shrink-0`} />
                <span className="text-sm text-muted-foreground">{log.source}:</span>
                <span className="text-sm truncate flex-1">{log.message.substring(0, 25)}</span>
                <Badge variant="outline" className={`text-xs ${getLevelBadgeColor(log.level)}`}>
                  {log.level === "ERROR" ? "Incomplete" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" data-testid="button-page-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">1</span>
            <span className="text-xs text-muted-foreground">2</span>
            <Button variant="ghost" size="icon" data-testid="button-page-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-workflow-next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
