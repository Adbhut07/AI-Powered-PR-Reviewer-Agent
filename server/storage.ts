import { 
  type PRReview, 
  type InsertPRReview, 
  type ActivityLog, 
  type InsertActivityLog 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // PR Reviews
  createPRReview(review: InsertPRReview): Promise<PRReview>;
  getPRReview(id: string): Promise<PRReview | undefined>;
  getPRReviewByPR(prNumber: number, repository: string): Promise<PRReview | undefined>;
  getAllPRReviews(): Promise<PRReview[]>;
  updatePRReview(id: string, updates: Partial<PRReview>): Promise<PRReview | undefined>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getAllActivityLogs(limit?: number): Promise<ActivityLog[]>;
  getActivityLogsToday(): Promise<number>;
}

export class MemStorage implements IStorage {
  private prReviews: Map<string, PRReview>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.prReviews = new Map();
    this.activityLogs = new Map();
  }

  // PR Reviews
  async createPRReview(insertReview: InsertPRReview): Promise<PRReview> {
    const id = randomUUID();
    const review: PRReview = {
      ...insertReview,
      id,
      findings: (insertReview.findings as any) ?? [],
      summary: insertReview.summary ?? null,
      reviewedAt: new Date(),
    };
    this.prReviews.set(id, review);
    return review;
  }

  async getPRReview(id: string): Promise<PRReview | undefined> {
    return this.prReviews.get(id);
  }

  async getPRReviewByPR(prNumber: number, repository: string): Promise<PRReview | undefined> {
    return Array.from(this.prReviews.values()).find(
      (review) => review.prNumber === prNumber && review.repository === repository
    );
  }

  async getAllPRReviews(): Promise<PRReview[]> {
    const reviews = Array.from(this.prReviews.values());
    return reviews.sort((a, b) => 
      new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime()
    );
  }

  async updatePRReview(id: string, updates: Partial<PRReview>): Promise<PRReview | undefined> {
    const review = this.prReviews.get(id);
    if (!review) return undefined;
    
    const updated = { ...review, ...updates };
    this.prReviews.set(id, updated);
    return updated;
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      metadata: (insertLog.metadata as Record<string, any>) ?? null,
      timestamp: new Date(),
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getAllActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    const logs = Array.from(this.activityLogs.values());
    const sorted = logs.sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
    return sorted.slice(0, limit);
  }

  async getActivityLogsToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.activityLogs.values()).filter(
      (log) => new Date(log.timestamp!).getTime() >= today.getTime()
    ).length;
  }
}

export const storage = new MemStorage();
