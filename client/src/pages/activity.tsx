import { useQuery } from "@tanstack/react-query";
import { ActivityLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { 
  GitPullRequest, 
  MessageSquare, 
  CheckCircle2, 
  Webhook,
  Activity as ActivityIcon,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow, format } from "date-fns";

export default function Activity() {
  const { data: activities, isLoading, error } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "pr_opened":
        return GitPullRequest;
      case "review_completed":
        return CheckCircle2;
      case "comment_posted":
        return MessageSquare;
      case "webhook_received":
        return Webhook;
      default:
        return ActivityIcon;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "pr_opened":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "review_completed":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "comment_posted":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400";
      case "webhook_received":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">
            Activity Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete history of webhook events and PR reviews
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load activity log. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4" data-testid="list-activities">
            {activities.map((activity) => {
              const Icon = getEventIcon(activity.eventType);
              const colorClass = getEventColor(activity.eventType);
              
              return (
                <Card key={activity.id} className="hover-elevate" data-testid={`card-activity-${activity.id}`}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1" data-testid={`text-activity-message-${activity.id}`}>
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span data-testid={`text-activity-time-${activity.id}`}>
                            {formatDistanceToNow(new Date(activity.timestamp!), { addSuffix: true })}
                          </span>
                          <span>•</span>
                          <span>
                            {format(new Date(activity.timestamp!), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <pre className="text-xs font-mono overflow-x-auto">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border rounded-lg bg-muted/20" data-testid="empty-activity">
            <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as the system processes PR events
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
