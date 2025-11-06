import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  GitPullRequest,
  XCircle
} from "lucide-react";
import { PRReview } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface PRReviewCardProps {
  review: PRReview;
}

export function PRReviewCard({ review }: PRReviewCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          label: "Review Complete",
          variant: "default" as const,
          color: "text-green-600 dark:text-green-400",
        };
      case "in_progress":
        return {
          icon: Clock,
          label: "In Progress",
          variant: "secondary" as const,
          color: "text-blue-600 dark:text-blue-400",
        };
      case "error":
        return {
          icon: XCircle,
          label: "Error",
          variant: "destructive" as const,
          color: "text-red-600 dark:text-red-400",
        };
      default:
        return {
          icon: Clock,
          label: "Pending",
          variant: "secondary" as const,
          color: "text-muted-foreground",
        };
    }
  };

  const statusConfig = getStatusConfig(review.status);
  const StatusIcon = statusConfig.icon;
  
  const criticalCount = review.findings?.filter(f => f.severity === "critical").length || 0;
  const warningCount = review.findings?.filter(f => f.severity === "warning").length || 0;
  const infoCount = review.findings?.filter(f => f.severity === "info").length || 0;

  return (
    <Card className="hover-elevate" data-testid={`card-review-${review.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <GitPullRequest className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-xs text-muted-foreground" data-testid={`text-repo-${review.id}`}>
                {review.repository}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                #{review.prNumber}
              </span>
            </div>
            <h3 className="font-medium text-base line-clamp-2 mb-2" data-testid={`text-pr-title-${review.id}`}>
              {review.prTitle}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span data-testid={`text-author-${review.id}`}>by {review.author}</span>
              <span>•</span>
              <span data-testid={`text-time-${review.id}`}>
                {formatDistanceToNow(new Date(review.reviewedAt!), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Badge 
            variant={statusConfig.variant}
            className="gap-1.5 flex-shrink-0"
            data-testid={`badge-status-${review.id}`}
          >
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {review.summary && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-summary-${review.id}`}>
            {review.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {criticalCount > 0 && (
              <div className="flex items-center gap-1.5" data-testid={`count-critical-${review.id}`}>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-medium">{criticalCount} Critical</span>
              </div>
            )}
            {warningCount > 0 && (
              <div className="flex items-center gap-1.5" data-testid={`count-warning-${review.id}`}>
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-xs font-medium">{warningCount} Warning</span>
              </div>
            )}
            {infoCount > 0 && (
              <div className="flex items-center gap-1.5" data-testid={`count-info-${review.id}`}>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium">{infoCount} Info</span>
              </div>
            )}
            {review.findings?.length === 0 && review.status === "completed" && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">No issues found</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
            data-testid={`button-view-pr-${review.id}`}
          >
            <a href={review.prUrl} target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
