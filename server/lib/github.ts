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
  try {
    console.log(`Fetching PR files: owner=${owner}, repo=${repo}, PR=${prNumber}`);
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });
    console.log(`Successfully fetched ${files.length} files for PR #${prNumber}`);
    return files;
  } catch (error: any) {
    console.error(`Failed to fetch PR files: ${error.message}`);
    console.error(`Request details: owner=${owner}, repo=${repo}, PR=${prNumber}`);
    if (error.status === 404) {
      console.error("404 Error: PR not found. Please check:");
      console.error("1. The repository name and owner are correct");
      console.error("2. The PR number exists");
      console.error("3. Your GitHub token has 'pull_requests: read' permission");
      console.error("4. Your GitHub token has access to this repository");
    }
    throw error;
  }
}

export async function getPRDetails(owner: string, repo: string, prNumber: number) {
  try {
    console.log(`Fetching PR details: owner=${owner}, repo=${repo}, PR=${prNumber}`);
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    console.log(`Successfully fetched PR #${prNumber} details`);
    return pr;
  } catch (error: any) {
    console.error(`Failed to fetch PR details: ${error.message}`);
    console.error(`Request details: owner=${owner}, repo=${repo}, PR=${prNumber}`);
    if (error.status === 404) {
      console.error("404 Error: PR not found. Please check:");
      console.error("1. The repository name and owner are correct");
      console.error("2. The PR number exists");
      console.error("3. Your GitHub token has 'pull_requests: read' permission");
      console.error("4. Your GitHub token has access to this repository");
    }
    throw error;
  }
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
