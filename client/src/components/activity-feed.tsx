import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GitPullRequest, 
  MessageSquare, 
  CheckCircle2, 
  Webhook,
  Activity as ActivityIcon
} from "lucide-react";
import { ActivityLog } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  activities: ActivityLog[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
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
        return "text-blue-600 dark:text-blue-400";
      case "review_completed":
        return "text-green-600 dark:text-green-400";
      case "comment_posted":
        return "text-purple-600 dark:text-purple-400";
      case "webhook_received":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card data-testid="card-activity-feed">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ActivityIcon className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <ActivityIcon className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = getEventIcon(activity.eventType);
                const colorClass = getEventColor(activity.eventType);
                
                return (
                  <div 
                    key={activity.id} 
                    className="flex gap-3 relative"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" data-testid={`text-activity-message-${activity.id}`}>
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-activity-time-${activity.id}`}>
                        {formatDistanceToNow(new Date(activity.timestamp!), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
