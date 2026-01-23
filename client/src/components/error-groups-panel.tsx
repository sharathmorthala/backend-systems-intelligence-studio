import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers, AlertTriangle, AlertCircle, Info, XCircle } from "lucide-react";
import type { ErrorGroup } from "@shared/schema";

interface ErrorGroupsPanelProps {
  groups: ErrorGroup[];
  selectedGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
}

function getSeverityIcon(severity: ErrorGroup["severity"]) {
  switch (severity) {
    case "critical":
      return <XCircle className="h-4 w-4" />;
    case "high":
      return <AlertCircle className="h-4 w-4" />;
    case "medium":
      return <AlertTriangle className="h-4 w-4" />;
    case "low":
      return <Info className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getSeverityColor(severity: ErrorGroup["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/20";
    case "high":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function ErrorGroupsPanel({ groups, selectedGroupId, onSelectGroup }: ErrorGroupsPanelProps) {
  if (groups.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-muted">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Error Groups</CardTitle>
              <CardDescription>Clustered similar errors</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No Error Groups</h3>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Errors will be grouped by pattern after analysis
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
            <div className="p-2 rounded-md bg-destructive/10">
              <Layers className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Error Groups</CardTitle>
              <CardDescription>{groups.length} groups identified</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`p-4 rounded-md border cursor-pointer transition-colors hover-elevate ${
                  selectedGroupId === group.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
                onClick={() => onSelectGroup?.(group.id)}
                data-testid={`error-group-${group.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs border ${getSeverityColor(group.severity)}`}
                    >
                      {getSeverityIcon(group.severity)}
                      <span className="ml-1 capitalize">{group.severity}</span>
                    </Badge>
                    <span className="text-sm font-medium">{group.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {group.count}x
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-mono line-clamp-2 mb-2">
                  {group.sampleMessage}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>First: {new Date(group.firstOccurrence).toLocaleTimeString()}</span>
                  <span>Last: {new Date(group.lastOccurrence).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
