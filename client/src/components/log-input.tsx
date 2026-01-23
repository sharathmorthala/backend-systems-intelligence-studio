import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Sparkles, Loader2, Trash2, Code, Search, Expand, Copy } from "lucide-react";

interface LogInputProps {
  onAnalyze: (logs: string) => void;
  isLoading: boolean;
}

const SAMPLE_LOGS = `2024-01-23T10:15:32.123Z ERROR [PaymentService] Failed to process payment for order #12345
  at PaymentGateway.charge (payment-gateway.ts:145)
  at PaymentService.processPayment (payment-service.ts:89)
  at OrderController.checkout (order-controller.ts:234)
  Caused by: ConnectionTimeoutError: Connection to payment provider timed out after 30000ms

2024-01-23T10:15:33.456Z WARN [DatabasePool] Connection pool exhausted, waiting for available connection
  Pool stats: { active: 50, idle: 0, waiting: 12, max: 50 }

2024-01-23T10:15:34.789Z ERROR [PaymentService] Failed to process payment for order #12346
  at PaymentGateway.charge (payment-gateway.ts:145)
  at PaymentService.processPayment (payment-service.ts:89)
  at OrderController.checkout (order-controller.ts:234)
  Caused by: ConnectionTimeoutError: Connection to payment provider timed out after 30000ms

2024-01-23T10:15:35.012Z ERROR [AuthService] JWT validation failed for token starting with eyJhbGc...
  Error: TokenExpiredError: jwt expired
  at JwtValidator.verify (jwt-validator.ts:67)

2024-01-23T10:15:36.345Z INFO [HealthCheck] System health check passed
  Memory: 78% used, CPU: 45%, Disk: 62%

2024-01-23T10:15:37.678Z ERROR [PaymentService] Failed to process payment for order #12347
  at PaymentGateway.charge (payment-gateway.ts:145)
  at PaymentService.processPayment (payment-service.ts:89)
  Caused by: ConnectionTimeoutError: Connection to payment provider timed out after 30000ms

2024-01-23T10:15:38.901Z FATAL [Application] Unhandled promise rejection detected
  Error: ECONNREFUSED - Redis connection refused at 127.0.0.1:6379
  at RedisClient.connect (redis-client.ts:34)`;

export function LogInput({ onAnalyze, isLoading }: LogInputProps) {
  const [logs, setLogs] = useState("");
  const [filter, setFilter] = useState("");

  const handleSubmit = () => {
    if (logs.trim()) {
      onAnalyze(logs);
    }
  };

  const handleLoadSample = () => {
    setLogs(SAMPLE_LOGS);
  };

  const handleClear = () => {
    setLogs("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setLogs(content);
      };
      reader.readAsText(file);
    }
  };

  const lines = logs.split('\n');
  const lineCount = lines.filter(l => l.trim()).length;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 space-y-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Input Case JSON</CardTitle>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Code className="h-3 w-3" />
            JSON
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Enter the case details as JSON</p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex-1 min-h-0 rounded-md border bg-muted/30 overflow-hidden">
          <div className="flex items-center justify-end gap-1 p-1 border-b bg-muted/50">
            <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(logs)} data-testid="button-copy-logs">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-expand-editor">
              <Expand className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex h-[calc(100%-32px)] overflow-auto">
            <div className="select-none text-right pr-3 py-2 text-xs text-muted-foreground/50 font-mono bg-muted/20 min-w-[2rem]">
              {lines.map((_, i) => (
                <div key={i} className="leading-5">{i + 1}</div>
              ))}
            </div>
            <textarea
              placeholder={`Paste your application logs here...

Example:
2024-01-23T10:15:32.123Z ERROR [Service] Failed to process
  at module.function (file.ts:145)
  Caused by: Error message`}
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="flex-1 bg-transparent resize-none p-2 font-mono text-sm leading-5 focus:outline-none"
              disabled={isLoading}
              data-testid="textarea-log-input"
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!logs.trim() || isLoading}
          className="w-full"
          data-testid="button-analyze"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Validate Case
            </>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">
            <Code className="h-3 w-3 mr-1" />
            JSON
          </Badge>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter</span>
            <Search className="h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                disabled={isLoading}
                className="h-7 text-xs"
                data-testid="button-load-sample"
              >
                <FileText className="h-3 w-3 mr-1" />
                Sample
              </Button>
              <label>
                <input
                  type="file"
                  accept=".log,.txt,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  data-testid="input-file-upload"
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={isLoading}
                  className="h-7 text-xs"
                >
                  <span className="cursor-pointer" data-testid="button-upload-file">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </span>
                </Button>
              </label>
              {logs && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="h-7 text-xs"
                  data-testid="button-clear-logs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{lineCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
