import OpenAI from "openai";
import { ReviewFinding } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PRAnalysisResult {
  summary: string;
  findings: ReviewFinding[];
}

export async function analyzePRChanges(
  prTitle: string,
  prDescription: string,
  files: Array<{ filename: string; patch?: string; status: string }>,
  repository: string
): Promise<PRAnalysisResult> {
  const prompt = `You are an expert code reviewer analyzing a GitHub pull request. Provide a thorough review focusing on:
1. Code quality and best practices
2. Potential bugs or issues
3. Security vulnerabilities
4. Performance concerns
5. Merge conflicts or dependency issues

PR Title: ${prTitle}
Repository: ${repository}
Description: ${prDescription || "No description provided"}

Files Changed (${files.length}):
${files.map(f => `- ${f.filename} (${f.status})`).join('\n')}

Code Changes:
${files.map(f => {
  if (!f.patch) return `${f.filename}: No patch available (${f.status})`;
  return `\n=== ${f.filename} ===\n${f.patch.substring(0, 2000)}${f.patch.length > 2000 ? '\n... (truncated)' : ''}`;
}).join('\n\n')}

Please analyze this PR and respond with a JSON object containing:
1. "summary": A brief 1-2 sentence overview of the PR changes and your assessment
2. "findings": An array of specific issues found, each with:
   - "severity": "critical", "warning", or "info"
   - "title": Brief title of the issue
   - "description": Detailed explanation
   - "file": Filename where the issue is found (if applicable)
   - "suggestion": Recommended fix or improvement (if applicable)

Focus on actionable feedback. If no significant issues are found, still provide constructive suggestions.`;

  try {
    // Use GPT-4o-mini for cost-effective PR reviews
    // Costs: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
    // Alternative: "gpt-4o" for better quality at higher cost
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Changed from gpt-5 to reduce costs
      messages: [
        {
          role: "system",
          content: "You are an expert code reviewer. Analyze pull requests and provide detailed, actionable feedback in JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "PR analyzed successfully",
      findings: result.findings || [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze PR with AI: " + (error as Error).message);
  }
}
