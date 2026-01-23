import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode2 } from "lucide-react";
import type { LogEntry } from "@shared/schema";

interface ParsedLogsPanelProps {
  logs: LogEntry[];
  selectedLogId?: string;
  onSelectLog?: (logId: string) => void;
}

function getLevelColor(level: LogEntry["level"]) {
  switch (level) {
    case "DEBUG":
      return "bg-muted text-muted-foreground";
    case "INFO":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "WARN":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "ERROR":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "FATAL":
      return "bg-red-600/20 text-red-700 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ParsedLogsPanel({ logs, selectedLogId, onSelectLog }: ParsedLogsPanelProps) {
  if (logs.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted">
              <FileCode2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Parsed Logs</CardTitle>
              <CardDescription>Structured log entries</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <FileCode2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No Logs Parsed</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Enter logs and click Analyze to see structured entries
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10">
              <FileCode2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Parsed Logs</CardTitle>
              <CardDescription>{logs.length} entries parsed</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-md border cursor-pointer transition-colors hover-elevate ${
                  selectedLogId === log.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
                onClick={() => onSelectLog?.(log.id)}
                data-testid={`log-entry-${log.id}`}
              >
                <div className="flex items-start gap-2 flex-wrap mb-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs font-mono ${getLevelColor(log.level)}`}
                  >
                    {log.level}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.source && (
                    <span className="text-xs text-muted-foreground font-mono">
                      [{log.source}]
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono break-all line-clamp-2">
                  {log.message}
                </p>
                {log.stackTrace && (
                  <pre className="mt-2 text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded overflow-x-auto line-clamp-3">
                    {log.stackTrace}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
