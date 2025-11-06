import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebhookEvent, WebhookStatus } from "@shared/schema";
import { verifyWebhookSignature, getPRFiles, getPRDetails, postReviewComment } from "./lib/github";
import { analyzePRChanges } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to parse raw body for webhook verification
  app.use("/api/webhook", (req, res, next) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      (req as any).rawBody = data;
      next();
    });
  });

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

      if (!signature || !rawBody) {
        return res.status(400).json({ error: "Missing signature or body" });
      }

      // Verify webhook signature
      const webhookSecret = process.env.WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
      }

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }

      const event: WebhookEvent = JSON.parse(rawBody);
      const action = event.action;

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
        return res.json({ message: "Event acknowledged but not processed" });
      }

      const pr = event.pull_request;
      const owner = event.repository.owner.login;
      const repo = event.repository.name;
      const prNumber = pr.number;

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

      // Start async review process (don't wait for it)
      processPRReview(owner, repo, prNumber, review.id).catch((error) => {
        console.error("Error processing PR review:", error);
      });

      res.json({ message: "Webhook received, review started" });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Internal server error" });
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
