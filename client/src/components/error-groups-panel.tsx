import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Layers, AlertTriangle, AlertCircle, XCircle, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import type { ErrorGroup } from "@shared/schema";

interface ErrorGroupsPanelProps {
  groups: ErrorGroup[];
  selectedGroupId?: string;
  onSelectGroup?: (groupId: string) => void;
}

function getSeverityIcon(severity: ErrorGroup["severity"]) {
  switch (severity) {
    case "critical":
      return <XCircle className="h-3 w-3" />;
    case "high":
      return <AlertCircle className="h-3 w-3" />;
    case "medium":
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return <Circle className="h-3 w-3" />;
  }
}

function getSeverityColor(severity: ErrorGroup["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-red-500 text-white";
    case "medium":
      return "bg-yellow-500 text-white";
    case "low":
      return "bg-blue-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function ErrorGroupsPanel({ groups, selectedGroupId, onSelectGroup }: ErrorGroupsPanelProps) {
  if (groups.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Error Groups</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">No Error Groups</h3>
            <p className="text-xs text-muted-foreground max-w-[180px]">
              Errors will be grouped by pattern after analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Error Groups</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {groups.length} groups
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col gap-3 p-4 pt-0">
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`p-3 rounded-md border cursor-pointer transition-colors ${
                  selectedGroupId === group.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectGroup?.(group.id)}
                data-testid={`error-group-${group.id}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getSeverityColor(group.severity)}`}>
                      {getSeverityIcon(group.severity)}
                      <span className="ml-1 capitalize">{group.severity}</span>
                    </Badge>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{group.count}x</span>
                </div>
                <p className="text-sm font-medium mb-1">{group.label}</p>
                <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                  {group.sampleMessage}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" data-testid="button-groups-prev">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">1</span>
            <Button variant="ghost" size="icon" data-testid="button-groups-next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
