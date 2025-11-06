# PR Review AI

An AI-powered GitHub pull request review agent that automatically analyzes PRs for conflicts, bugs, and code quality issues using OpenAI's GPT-5 model.

## Overview

This application listens for GitHub webhook events and automatically reviews pull requests when they are opened, updated, or reopened. It uses OpenAI to analyze code changes and posts detailed review comments directly on GitHub PRs.

## Features

- **Automated PR Reviews**: AI-powered analysis of code changes for bugs, security issues, and best practices
- **Real-time Webhook Processing**: Instant review triggering on PR events
- **Detailed Findings**: Categorized issues (Critical, Warning, Info) with actionable suggestions
- **Activity Tracking**: Complete history of webhook events and review activities
- **Beautiful Dashboard**: Modern UI showing recent reviews, webhook status, and activity feed
- **Dark Mode Support**: Full theme support with light and dark modes

## Tech Stack

### Frontend
- React with Wouter (routing)
- TanStack Query (data fetching)
- Shadcn UI (component library)
- Tailwind CSS (styling)
- TypeScript

### Backend
- Express.js
- OpenAI API (GPT-5 model)
- GitHub API (@octokit/rest)
- In-memory storage

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── header.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   ├── pr-review-card.tsx
│   │   │   ├── webhook-status-card.tsx
│   │   │   └── activity-feed.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── activity.tsx
│   │   │   └── settings.tsx
│   │   └── App.tsx
│   └── index.html
├── server/
│   ├── lib/
│   │   ├── github.ts         # GitHub API integration
│   │   └── openai.ts         # OpenAI integration
│   ├── routes.ts             # API routes and webhook handler
│   ├── storage.ts            # In-memory data storage
│   └── index.ts
├── shared/
│   └── schema.ts             # Shared TypeScript types and schemas
└── design_guidelines.md      # UI/UX design guidelines
```

## Environment Variables

Required secrets (configured in Replit Secrets):

- `GITHUB_TOKEN` - GitHub Personal Access Token with `repo` scope
- `OPENAI_API_KEY` - OpenAI API key for GPT-5 access
- `WEBHOOK_SECRET` - Secret string for webhook signature verification

## Setup Instructions

### 1. Configure Secrets
All three environment variables are already configured in Replit Secrets.

### 2. Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to "Webhooks" → "Add webhook"
3. Set Payload URL to: `https://your-replit-url/api/webhook`
4. Set Content type to: `application/json`
5. Enter your WEBHOOK_SECRET value
6. Select "Let me select individual events" and check:
   - ✅ Pull requests
7. Ensure "Active" is checked
8. Click "Add webhook"

### 3. Test the Integration

1. Open a new pull request in your repository
2. The webhook will trigger the AI review automatically
3. Check the dashboard to see the review status
4. View the AI-generated comment on your GitHub PR

## API Endpoints

- `GET /api/reviews` - Retrieve all PR reviews
- `GET /api/activity` - Get activity logs (default limit: 50)
- `GET /api/webhook/status` - Check webhook configuration status
- `POST /api/webhook` - GitHub webhook endpoint (receives PR events)

## Data Models

### PRReview
- `prNumber` - Pull request number
- `prTitle` - PR title
- `repository` - Full repository name
- `author` - PR author username
- `status` - Review status (pending, in_progress, completed, error)
- `findings` - Array of review findings
- `summary` - AI-generated summary
- `prUrl` - GitHub PR URL

### ReviewFinding
- `severity` - critical | warning | info
- `title` - Brief issue title
- `description` - Detailed explanation
- `file` - Affected filename
- `line` - Line number (optional)
- `suggestion` - Recommended fix

### ActivityLog
- `eventType` - Type of event (pr_opened, review_completed, etc.)
- `message` - Human-readable message
- `metadata` - Additional event data
- `timestamp` - Event timestamp

## How It Works

1. **Webhook Event**: GitHub sends a webhook when a PR is opened/updated
2. **Signature Verification**: The webhook signature is verified for security
3. **Event Processing**: The PR details and file changes are fetched via GitHub API
4. **AI Analysis**: OpenAI GPT-5 analyzes the code changes
5. **Comment Posting**: The AI review is posted as a comment on the PR
6. **Dashboard Update**: The review appears in the dashboard with findings

## AI Review Process

The AI analyzes PRs for:
- Code quality and best practices
- Potential bugs or issues
- Security vulnerabilities
- Performance concerns
- Merge conflicts and dependency issues

Findings are categorized by severity:
- 🚨 **Critical**: Must be addressed before merging
- ⚠️ **Warning**: Should be reviewed and considered
- ℹ️ **Info**: Suggestions for improvement

## User Preferences

- Theme preference is saved to localStorage
- Default theme: light mode
- Responsive design works on desktop, tablet, and mobile

## Recent Changes

- **2025-11-06**: Initial implementation with full MVP features
  - GitHub webhook integration with signature verification
  - OpenAI GPT-5 powered PR analysis
  - Dashboard with review cards and activity feed
  - Settings page with webhook configuration
  - Complete activity log page
  - Dark mode support
  - In-memory storage for reviews and activity

## Notes

- This application uses in-memory storage. Data will be lost on restart.
- For production use, consider migrating to PostgreSQL database.
- The AI model (GPT-5) is configured with a token limit of 8192 for analysis.
- Large PRs with many file changes may be truncated in the analysis prompt.
