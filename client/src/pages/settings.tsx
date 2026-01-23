import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Key, Zap, Shield, Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface HealthStatus {
  status: string;
  timestamp: string;
  hasApiKey: boolean;
}

export default function SettingsPage() {
  const { data: health } = useQuery<HealthStatus>({
    queryKey: ["/api/health"],
    refetchInterval: 30000,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <Settings className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure API keys, LLM settings, and toolkit preferences.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <CardTitle className="text-base">API Configuration</CardTitle>
              </div>
              <CardDescription>
                Configure the Hugging Face API key for LLM-powered analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <Label>Hugging Face API Key</Label>
                  <p className="text-xs text-muted-foreground">
                    Used for Mixtral-8x7B-Instruct model inference
                  </p>
                </div>
                <Badge 
                  variant={health?.hasApiKey ? "default" : "secondary"}
                  className={health?.hasApiKey ? "bg-green-500/10 text-green-600" : ""}
                  data-testid="badge-api-key-status"
                >
                  {health?.hasApiKey ? "Configured" : "Not Set"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input 
                  type="password" 
                  placeholder="hf_..." 
                  disabled
                  className="font-mono text-sm"
                  data-testid="input-api-key"
                />
                <Button variant="outline" disabled data-testid="button-save-key">
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                API keys are managed through environment variables. Set HUGGINGFACE_API_KEY in your environment.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <CardTitle className="text-base">LLM Settings</CardTitle>
              </div>
              <CardDescription>
                Configure how the LLM integration behaves.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <Label>Use Fallback Analysis</Label>
                  <p className="text-xs text-muted-foreground">
                    Use deterministic fallback when LLM is unavailable
                  </p>
                </div>
                <Switch defaultChecked disabled data-testid="switch-fallback" />
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <Label>Model</Label>
                  <p className="text-xs text-muted-foreground">
                    LLM model used for analysis
                  </p>
                </div>
                <Badge variant="outline" data-testid="badge-model">Mixtral-8x7B-Instruct</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <CardTitle className="text-base">System Status</CardTitle>
              </div>
              <CardDescription>
                Current system health and status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm" data-testid="text-api-status-label">API Status</span>
                <Badge 
                  variant={health?.status === "ok" ? "default" : "destructive"}
                  className={health?.status === "ok" ? "bg-green-500/10 text-green-600" : ""}
                  data-testid="badge-api-status"
                >
                  {health?.status === "ok" ? "Healthy" : "Unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm" data-testid="text-llm-status-label">LLM Integration</span>
                <Badge 
                  variant={health?.hasApiKey ? "default" : "secondary"}
                  className={health?.hasApiKey ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"}
                  data-testid="badge-llm-status"
                >
                  {health?.hasApiKey ? "Ready" : "Fallback Mode"}
                </Badge>
              </div>
              {health?.timestamp && (
                <p className="text-xs text-muted-foreground pt-2">
                  Last checked: {new Date(health.timestamp).toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">About This Toolkit</p>
                  <p>
                    The AI-Assisted Backend Engineering Toolkit demonstrates production-minded 
                    engineering practices. All tools use the Hugging Face Inference API with 
                    deterministic fallback behavior ensuring reliability even when the LLM is unavailable.
                  </p>
                </div>
              </div>
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
