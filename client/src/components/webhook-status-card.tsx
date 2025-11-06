import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, CheckCircle2, AlertCircle } from "lucide-react";
import { WebhookStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface WebhookStatusCardProps {
  status: WebhookStatus;
}

export function WebhookStatusCard({ status }: WebhookStatusCardProps) {
  return (
    <Card data-testid="card-webhook-status">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhook Status
          </CardTitle>
          {status.configured ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium text-green-600 dark:text-green-400" data-testid="text-webhook-active">
                Active
              </span>
            </div>
          ) : (
            <Badge variant="secondary" data-testid="badge-webhook-inactive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Events Today</div>
          <div className="text-2xl font-semibold" data-testid="text-events-today">
            {status.eventsToday}
          </div>
        </div>
        
        {status.lastEventTime && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Last Event</div>
            <div className="text-sm" data-testid="text-last-event">
              {formatDistanceToNow(new Date(status.lastEventTime), { addSuffix: true })}
            </div>
          </div>
        )}

        {!status.configured && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Configure the webhook in Settings to start receiving PR events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
