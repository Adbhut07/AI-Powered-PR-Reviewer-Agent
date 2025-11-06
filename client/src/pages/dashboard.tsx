import { useQuery } from "@tanstack/react-query";
import { PRReview, WebhookStatus, ActivityLog } from "@shared/schema";
import { PRReviewCard } from "@/components/pr-review-card";
import { WebhookStatusCard } from "@/components/webhook-status-card";
import { ActivityFeed } from "@/components/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, GitPullRequest } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useQuery<PRReview[]>({
    queryKey: ["/api/reviews"],
  });

  const { data: webhookStatus, isLoading: statusLoading } = useQuery<WebhookStatus>({
    queryKey: ["/api/webhook/status"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity"],
  });

  const isLoading = reviewsLoading || statusLoading || activitiesLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor AI-powered PR reviews and webhook activity
          </p>
        </div>

        {reviewsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load reviews. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Reviews */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Reviews</h2>
              {reviews && reviews.length > 0 && (
                <span className="text-sm text-muted-foreground" data-testid="text-review-count">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-6 space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4" data-testid="list-reviews">
                {reviews.map((review) => (
                  <PRReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-lg bg-muted/20" data-testid="empty-reviews">
                <GitPullRequest className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No PR reviews yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Configure the webhook in your GitHub repository to start receiving automated PR reviews
                </p>
                <Link href="/settings">
                  <Button data-testid="button-configure-webhook">
                    Configure Webhook
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar - Status and Activity */}
          <div className="space-y-6">
            {statusLoading ? (
              <div className="border rounded-lg p-6">
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-16" />
              </div>
            ) : webhookStatus ? (
              <WebhookStatusCard status={webhookStatus} />
            ) : null}

            {activitiesLoading ? (
              <div className="border rounded-lg p-6">
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : activities ? (
              <ActivityFeed activities={activities} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
