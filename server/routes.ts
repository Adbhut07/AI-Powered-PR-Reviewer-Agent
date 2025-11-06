import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebhookEvent, WebhookStatus } from "@shared/schema";
import { verifyWebhookSignature, getPRFiles, getPRDetails, postReviewComment } from "./lib/github";
import { analyzePRChanges } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all PR reviews
  app.get("/api/reviews", async (_req: Request, res: Response) => {
    try {
      const reviews = await storage.getAllPRReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  // Get activity logs
  app.get("/api/activity", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const activities = await storage.getAllActivityLogs(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get webhook status
  app.get("/api/webhook/status", async (_req: Request, res: Response) => {
    try {
      const eventsToday = await storage.getActivityLogsToday();
      const activities = await storage.getAllActivityLogs(1);
      const lastEventTime = activities.length > 0 ? activities[0].timestamp : undefined;

      const status: WebhookStatus = {
        configured: eventsToday > 0 || activities.length > 0,
        lastEventTime: lastEventTime?.toISOString(),
        eventsToday,
        url: `${process.env.REPLIT_DOMAINS?.split(',')[0] ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/webhook`,
      };

      res.json(status);
    } catch (error) {
      console.error("Error fetching webhook status:", error);
      res.status(500).json({ error: "Failed to fetch webhook status" });
    }
  });

  // GitHub webhook endpoint
  app.post("/api/webhook", async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-hub-signature-256"] as string;
      const rawBody = (req as any).rawBody;

      console.log("Webhook received:", {
        hasSignature: !!signature,
        hasRawBody: !!rawBody,
        hasBody: !!req.body,
        contentType: req.headers['content-type']
      });

      if (!signature || !rawBody) {
        console.error("Missing signature or body", { hasSignature: !!signature, hasRawBody: !!rawBody });
        return res.status(400).json({ error: "Missing signature or body" });
      }

      // Verify webhook signature
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      const rawBodyString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
      
      if (!verifyWebhookSignature(rawBodyString, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event: WebhookEvent = req.body; // Use parsed body from express.json()
      
      // Log the event action to help debug
      console.log("Webhook event action:", event?.action);
      
      // Validate webhook payload structure
      if (!event || !event.pull_request || !event.repository) {
        console.error("Invalid webhook payload structure", { 
          hasEvent: !!event, 
          hasPR: !!event?.pull_request, 
          hasRepo: !!event?.repository,
          action: event?.action
        });
        // Return 200 for non-PR events to acknowledge receipt
        if (event && !event.pull_request) {
          console.log("Ignoring non-pull_request event");
          return res.status(200).json({ message: "Event acknowledged but not a pull_request event" });
        }
        return res.status(400).json({ error: "Invalid webhook payload" });
      }

      const action = event.action;
      const prNumber = event.pull_request.number;

      console.log(`Webhook received: ${action} on PR #${prNumber} from ${event.repository.full_name}`);

      // Respond immediately to GitHub
      res.status(202).json({ message: "Webhook received, processing started" });

      // Process asynchronously after response is sent
      setImmediate(async () => {
        try {
          // Log webhook event
          await storage.createActivityLog({
            eventType: "webhook_received",
            message: `Webhook received: ${action} on PR #${event.pull_request.number}`,
            metadata: {
              action,
              prNumber: event.pull_request.number,
              repository: event.repository.full_name,
            },
          });

          // Only process opened, synchronize (updated), and reopened events
          if (!["opened", "synchronize", "reopened"].includes(action)) {
            console.log(`Skipping action: ${action}`);
            return;
          }

          const pr = event.pull_request;
          const owner = event.repository.owner.login;
          const repo = event.repository.name;
          const prNumber = pr.number;

          console.log(`Processing PR review: owner=${owner}, repo=${repo}, PR=${prNumber}`);

          // Log PR opened event
          await storage.createActivityLog({
            eventType: "pr_opened",
            message: `PR #${prNumber} ${action}: ${pr.title}`,
            metadata: {
              prNumber,
              repository: event.repository.full_name,
              author: pr.user.login,
            },
          });

          // Create or update review record
          let review = await storage.getPRReviewByPR(prNumber, event.repository.full_name);
          
          if (!review) {
            review = await storage.createPRReview({
              prNumber,
              prTitle: pr.title,
              repository: event.repository.full_name,
              repositoryOwner: owner,
              author: pr.user.login,
              status: "pending",
              findings: [],
              summary: null,
              prUrl: pr.html_url,
              headSha: pr.head.sha,
            });
          } else {
            await storage.updatePRReview(review.id, {
              status: "in_progress",
              headSha: pr.head.sha,
            });
          }

          // Start async review process
          processPRReview(owner, repo, prNumber, review.id).catch((error) => {
            console.error("Error processing PR review:", error);
          });
        } catch (error) {
          console.error("Error in webhook processing:", error);
        }
      });
    } catch (error) {
      console.error("Webhook error:", error);
      
      // If we haven't sent a response yet, send error response
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Async function to process PR review
async function processPRReview(
  owner: string,
  repo: string,
  prNumber: number,
  reviewId: string
) {
  try {
    // Update status to in_progress
    await storage.updatePRReview(reviewId, { status: "in_progress" });

    // Fetch PR details and files
    const [prDetails, files] = await Promise.all([
      getPRDetails(owner, repo, prNumber),
      getPRFiles(owner, repo, prNumber),
    ]);

    // Analyze with AI
    const analysis = await analyzePRChanges(
      prDetails.title,
      prDetails.body || "",
      files.map((f) => ({
        filename: f.filename,
        patch: f.patch,
        status: f.status,
      })),
      `${owner}/${repo}`
    );

    // Update review with findings
    await storage.updatePRReview(reviewId, {
      status: "completed",
      summary: analysis.summary,
      findings: analysis.findings,
    });

    // Post comment to GitHub
    await postReviewComment(
      owner,
      repo,
      prNumber,
      analysis.summary,
      analysis.findings
    );

    // Log completion
    await storage.createActivityLog({
      eventType: "review_completed",
      message: `Review completed for PR #${prNumber} - found ${analysis.findings.length} issues`,
      metadata: {
        prNumber,
        repository: `${owner}/${repo}`,
        findingsCount: analysis.findings.length,
      },
    });

    await storage.createActivityLog({
      eventType: "comment_posted",
      message: `AI review comment posted to PR #${prNumber}`,
      metadata: {
        prNumber,
        repository: `${owner}/${repo}`,
      },
    });
  } catch (error) {
    console.error("Error in PR review process:", error);
    
    await storage.updatePRReview(reviewId, {
      status: "error",
      summary: `Review failed: ${(error as Error).message}`,
    });

    await storage.createActivityLog({
      eventType: "review_completed",
      message: `Review failed for PR #${prNumber}: ${(error as Error).message}`,
      metadata: {
        prNumber,
        error: (error as Error).message,
      },
    });
  }
}
