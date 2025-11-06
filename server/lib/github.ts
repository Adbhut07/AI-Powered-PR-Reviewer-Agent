import { Octokit } from "@octokit/rest";
import crypto from "crypto";
import { ReviewFinding } from "@shared/schema";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");
    
    // Ensure both buffers are the same length to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);
    
    if (sigBuffer.length !== digestBuffer.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(sigBuffer, digestBuffer);
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

export async function getPRFiles(owner: string, repo: string, prNumber: number) {
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  return files;
}

export async function getPRDetails(owner: string, repo: string, prNumber: number) {
  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return pr;
}

export async function postReviewComment(
  owner: string,
  repo: string,
  prNumber: number,
  summary: string,
  findings: ReviewFinding[]
) {
  let commentBody = `## 🤖 AI Code Review\n\n${summary}\n\n`;

  if (findings.length === 0) {
    commentBody += `### ✅ No Issues Found\n\nGreat job! The AI review didn't find any significant issues with this PR.`;
  } else {
    const criticalFindings = findings.filter(f => f.severity === "critical");
    const warningFindings = findings.filter(f => f.severity === "warning");
    const infoFindings = findings.filter(f => f.severity === "info");

    if (criticalFindings.length > 0) {
      commentBody += `### 🚨 Critical Issues (${criticalFindings.length})\n\n`;
      criticalFindings.forEach((finding, idx) => {
        commentBody += formatFinding(finding, idx + 1);
      });
    }

    if (warningFindings.length > 0) {
      commentBody += `### ⚠️ Warnings (${warningFindings.length})\n\n`;
      warningFindings.forEach((finding, idx) => {
        commentBody += formatFinding(finding, idx + 1);
      });
    }

    if (infoFindings.length > 0) {
      commentBody += `### ℹ️ Suggestions (${infoFindings.length})\n\n`;
      infoFindings.forEach((finding, idx) => {
        commentBody += formatFinding(finding, idx + 1);
      });
    }
  }

  commentBody += `\n\n---\n*Powered by PR Review AI*`;

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: commentBody,
  });
}

function formatFinding(finding: ReviewFinding, index: number): string {
  let text = `**${index}. ${finding.title}**\n\n`;
  
  if (finding.file) {
    text += `📁 File: \`${finding.file}\`${finding.line ? ` (Line ${finding.line})` : ''}\n\n`;
  }
  
  text += `${finding.description}\n\n`;
  
  if (finding.suggestion) {
    text += `💡 **Suggestion:** ${finding.suggestion}\n\n`;
  }
  
  return text;
}
