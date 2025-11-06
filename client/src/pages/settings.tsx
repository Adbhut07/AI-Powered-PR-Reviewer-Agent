import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, ExternalLink, AlertCircle, Github } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { WebhookStatus } from "@shared/schema";

export default function Settings() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: webhookStatus } = useQuery<WebhookStatus>({
    queryKey: ["/api/webhook/status"],
  });

  const webhookUrl = webhookStatus?.url || `${window.location.origin}/api/webhook`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Webhook URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure your GitHub webhook and review preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Webhook Configuration */}
          <Card data-testid="card-webhook-config">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                GitHub Webhook Configuration
              </CardTitle>
              <CardDescription>
                Set up a webhook in your GitHub repository to enable automatic PR reviews
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-webhook-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyToClipboard}
                    data-testid="button-copy-url"
                    aria-label="Copy webhook URL"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this URL when configuring the webhook in your GitHub repository settings
                </p>
              </div>

              <Separator />

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Instructions</AlertTitle>
                <AlertDescription className="mt-2 space-y-2 text-sm">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Go to your GitHub repository settings</li>
                    <li>Navigate to "Webhooks" and click "Add webhook"</li>
                    <li>Paste the webhook URL above into the "Payload URL" field</li>
                    <li>Set "Content type" to <code className="bg-muted px-1 py-0.5 rounded text-xs">application/json</code></li>
                    <li>Enter your webhook secret (the WEBHOOK_SECRET you configured)</li>
                    <li>Select "Let me select individual events" and check:</li>
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Pull requests</li>
                    </ul>
                    <li>Ensure "Active" is checked and click "Add webhook"</li>
                  </ol>
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="gap-2"
                      data-testid="button-github-docs"
                    >
                      <a
                        href="https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View GitHub Documentation
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              {webhookStatus?.configured && (
                <Alert className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-900 dark:text-green-100">Webhook Active</AlertTitle>
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Your webhook is configured and receiving events from GitHub
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card data-testid="card-api-config">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage your API keys and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">GitHub Token</div>
                    <div className="text-xs text-muted-foreground">
                      Used to fetch PR data and post comments
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Configured
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">OpenAI API Key</div>
                    <div className="text-xs text-muted-foreground">
                      Powers the AI code review analysis
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Configured
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">Webhook Secret</div>
                    <div className="text-xs text-muted-foreground">
                      Secures webhook endpoint verification
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      Configured
                    </span>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  API keys are managed through environment variables and cannot be changed from this interface.
                  Contact your administrator to update credentials.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
