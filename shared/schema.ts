import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PR Review Schema
export const prReviews = pgTable("pr_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prNumber: integer("pr_number").notNull(),
  prTitle: text("pr_title").notNull(),
  repository: text("repository").notNull(),
  repositoryOwner: text("repository_owner").notNull(),
  author: text("author").notNull(),
  status: text("status").notNull(), // 'pending', 'in_progress', 'completed', 'error'
  findings: jsonb("findings").$type<ReviewFinding[]>().default([]),
  summary: text("summary"),
  reviewedAt: timestamp("reviewed_at").defaultNow(),
  prUrl: text("pr_url").notNull(),
  headSha: text("head_sha").notNull(),
});

// Activity Log Schema
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'pr_opened', 'review_completed', 'comment_posted', 'webhook_received'
  message: text("message").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// TypeScript types for review findings
export type ReviewFinding = {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
};

// Webhook Event type
export type WebhookEvent = {
  action: string;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    user: {
      login: string;
    };
    head: {
      sha: string;
    };
    base: {
      repo: {
        name: string;
        owner: {
          login: string;
        };
        full_name: string;
      };
    };
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
    full_name: string;
  };
};

// Zod schemas and types
export const insertPRReviewSchema = createInsertSchema(prReviews).omit({
  id: true,
  reviewedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertPRReview = z.infer<typeof insertPRReviewSchema>;
export type PRReview = typeof prReviews.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Webhook status type
export type WebhookStatus = {
  configured: boolean;
  lastEventTime?: string;
  eventsToday: number;
  url: string;
};
