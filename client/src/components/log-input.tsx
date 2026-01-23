import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Sparkles, Loader2, Trash2 } from "lucide-react";

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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Log Input</CardTitle>
            <CardDescription>Paste logs or upload a file</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            disabled={isLoading}
            data-testid="button-load-sample"
          >
            <FileText className="h-4 w-4 mr-2" />
            Load Sample
          </Button>
          <label>
            <input
              type="file"
              accept=".log,.txt"
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
            >
              <span className="cursor-pointer" data-testid="button-upload-file">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </span>
            </Button>
          </label>
          {logs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
              data-testid="button-clear-logs"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        
        <div className="flex-1 min-h-0">
          <Textarea
            placeholder="Paste your application logs, stack traces, or error messages here...

Example formats supported:
- Standard log files (timestamp, level, message)
- Stack traces with line numbers
- JSON-formatted logs
- Custom log formats"
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            className="h-full min-h-[300px] font-mono text-sm resize-none"
            disabled={isLoading}
            data-testid="textarea-log-input"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {logs ? `${logs.split('\n').filter(l => l.trim()).length} lines` : 'No logs entered'}
          </p>
          <Button 
            onClick={handleSubmit} 
            disabled={!logs.trim() || isLoading}
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
                Analyze Logs
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
