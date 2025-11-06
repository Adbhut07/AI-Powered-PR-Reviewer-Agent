# 🤖 AI PR Reviewer

An intelligent AI-powered Agentic tool that automatically reviews GitHub Pull Requests and provides detailed, actionable feedback on code quality, security vulnerabilities, best practices, and potential bugs. 
This app is build for my 

**Note:** This AI-powered agent was originally built as a supporting tool for one of my other projects — designed to automatically review GitHub Pull Requests with intelligent, actionable insights.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

---

## 📑 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [GitHub Token Setup](#-github-token-setup)
- [OpenAI API Setup](#-openai-api-setup)
- [Database Setup](#-database-setup)
- [Webhook Configuration](#-webhook-configuration)
- [Usage](#-usage)
- [Available Scripts](#-available-scripts)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)
- [Cost Optimization](#-cost-optimization)
- [Security](#-security)
- [Contributing](#-contributing)

---

## ✨ Features

- 🔍 **Automated Code Review**: AI analyzes PRs for bugs, security issues, and code quality
- 🎯 **Multi-Level Severity**: Categorizes findings as Critical, Warning, or Info
- 📊 **Interactive Dashboard**: View all PR reviews and activity logs in real-time
- 🔔 **Real-time Webhooks**: Instant review triggering when PRs are opened, updated, or reopened
- 💡 **Smart Suggestions**: Get actionable feedback with specific recommendations
- 🎨 **Modern UI**: Built with React, shadcn/ui, and Tailwind CSS with dark mode support
- 🚀 **Fast & Efficient**: Uses GPT-4o-mini for cost-effective reviews
- 🔒 **Secure**: Webhook signature verification with HMAC SHA-256
- 📝 **Detailed Comments**: AI posts comprehensive review comments directly on GitHub PRs
- 📈 **Activity Tracking**: Monitor all webhook events and review history

---

## � Demo

### How It Works

1. **Create/Update a PR** → GitHub sends webhook
2. **Server Receives Event** → Verifies signature & fetches PR data
3. **AI Analysis** → OpenAI analyzes code changes
4. **Review Posted** → Comment appears on GitHub PR
5. **Dashboard Updated** → View results in web interface

### Dashboard Views

- **📊 Dashboard**: Overview of all PR reviews with status indicators
- **📋 Activity**: Real-time activity log of all events
- **⚙️ Settings**: Configure webhook and view connection status

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- ✅ **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- ✅ **GitHub Account** with repository access
- ✅ **OpenAI API Account** with billing enabled - [Sign up](https://platform.openai.com/)
- ✅ **Git** installed on your machine

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Adbhut07/AI-Powered-PR-Reviewer-Agent
cd AI-Powered-PR-Reviewer-Agent
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

---

## ⚙️ Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Environment Variables

Edit the `.env` file with your credentials:

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_token_here

# Webhook Security
WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/aiprreviewer

# Application Port (optional)
PORT=5000
```

---

## 🔑 GitHub Token Setup

Your GitHub token needs specific permissions to access PRs and post comments.

### Option 1: Fine-Grained Personal Access Token (Recommended)

1. **Navigate to GitHub Settings**
   - Visit: https://github.com/settings/tokens?type=beta
   - Click **"Generate new token"** (Fine-grained)

2. **Configure Token Details**
   - **Token name**: `AI-PR-Reviewer` (or any name)
   - **Expiration**: 90 days (recommended)
   - **Repository access**: Select **"Only select repositories"**
   - Choose your target repository

3. **Set Repository Permissions**
   
   Under **"Repository permissions"**, configure:
   
   | Permission | Access Level | Required |
   |------------|-------------|----------|
   | Pull requests | **Read and write** | ✅ Yes |
   | Contents | **Read-only** | ✅ Yes |
   | Issues | **Read and write** | ✅ Yes |
   | Metadata | **Read-only** | ✅ Auto-included |

4. **Generate & Save Token**
   - Click **"Generate token"**
   - Copy the token immediately (you won't see it again!)
   - Paste it in your `.env` file as `GITHUB_TOKEN`

### Option 2: Classic Personal Access Token

1. **Navigate to GitHub Settings**
   - Visit: https://github.com/settings/tokens/new

2. **Configure Token**
   - **Note**: `AI-PR-Reviewer`
   - **Expiration**: 90 days
   - **Select scopes**:
     - ✅ `repo` (Full control of private repositories)

3. **Generate & Save**
   - Click **"Generate token"**
   - Copy and paste in `.env` as `GITHUB_TOKEN`

### Verify Token

Run this command to verify your token works:

```bash
node verify-github-token.js
```

Expected output:
```
✅ Token is valid
✅ Successfully accessed PR #X
✅ Successfully fetched files from PR #X
```

---

## 🤖 OpenAI API Setup

### 1. Create OpenAI Account

- Sign up at: https://platform.openai.com/signup

### 2. Add Billing (Required)

**Important**: You must add a payment method to use the API.

1. Visit: https://platform.openai.com/account/billing
2. Click **"Add payment method"**
3. Add a credit/debit card
4. Set a monthly budget limit (recommended: $10)

### 3. Generate API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name it: `PR-Reviewer`
4. Copy the key (starts with `sk-...`)
5. Paste in `.env` as `OPENAI_API_KEY`

### 4. Cost Estimates

Using **GPT-4o-mini** (default):

| Usage | Cost |
|-------|------|
| Per PR review | ~$0.001-0.005 |
| 100 PR reviews | ~$0.10-0.50 |
| 1000 PR reviews | ~$1.00-5.00 |

**Monthly estimate**: $5-10 for active development

### Free Credits

New OpenAI accounts receive **$5 in free credits** (expires after 3 months).

---

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create Database**
   ```bash
   # Login to PostgreSQL
   psql postgres

   # Create database and user
   CREATE DATABASE aiprreviewer;
   CREATE USER aipruser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aiprreviewer TO aipruser;
   \q
   ```

3. **Update .env**
   ```bash
   DATABASE_URL=postgresql://aipruser:your_password@localhost:5432/aiprreviewer
   ```

### Option 2: Cloud Database (Recommended for Production)

#### Neon (Free Tier Available)
1. Sign up: https://neon.tech/
2. Create a new project
3. Copy the connection string
4. Paste in `.env` as `DATABASE_URL`

### Initialize Database Schema

```bash
npm run db:push
```

This creates all necessary tables:
- `pr_reviews` - Stores PR review data
- `activity_logs` - Tracks all events
- `webhook_events` - Records webhook deliveries

---

## 🔔 Webhook Configuration

### Generate Webhook Secret

```bash
# Generate a secure random secret
openssl rand -hex 32
```

Copy the output and add to `.env` as `WEBHOOK_SECRET`.

### Local Development with ngrok

For local testing, you need to expose your server to the internet:

1. **Install ngrok**
   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start Your Application**
   ```bash
   npm run dev
   ```

3. **Expose Local Server**
   ```bash
   # In a new terminal
   ngrok http 5000
   ```

4. **Copy the HTTPS URL**
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:5000
   ```

### Configure GitHub Webhook

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click **Settings** → **Webhooks** → **Add webhook**

2. **Configure Webhook**
   
   | Field | Value |
   |-------|-------|
   | **Payload URL** | `https://your-domain.com/api/webhook` |
   | **Content type** | `application/json` |
   | **Secret** | Your `WEBHOOK_SECRET` from `.env` |
   | **SSL verification** | ✅ Enable SSL verification |

3. **Select Events**
   - Choose **"Let me select individual events"**
   - ✅ Check **"Pull requests"**
   - ✅ Uncheck everything else

4. **Activate**
   - ✅ Check **"Active"**
   - Click **"Add webhook"**

### Verify Webhook

1. Create a test PR in your repository
2. Check **Recent Deliveries** in webhook settings
3. Should see **200/202** response
4. Check your application logs for activity

---

## 🎯 Usage

### Start the Application

#### Development Mode
```bash
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api

#### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Create a Test PR

1. Make changes in a branch
2. Create a Pull Request
3. The AI will automatically:
   - Receive webhook notification
   - Fetch PR details and file changes
   - Analyze code with OpenAI
   - Post review comment on GitHub
   - Update dashboard

### View Dashboard

Navigate to http://localhost:5000 and explore:

- **Dashboard Tab**: View all PR reviews
  - PR number and title
  - Repository name
  - Status (pending, in_progress, completed, error)
  - Number of findings
  - Link to GitHub PR

- **Activity Tab**: See real-time events
  - Webhook received
  - PR opened
  - Review started
  - Review completed
  - Comment posted

- **Settings Tab**: Configuration status
  - Webhook URL
  - Connection status
  - Events received today
  - Last event timestamp

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Production
npm run build            # Build frontend and backend for production
npm start               # Run production server

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio (database GUI)

# Type Checking
npm run check           # Run TypeScript type checking

# Verification
node verify-github-token.js    # Verify GitHub token permissions
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching & caching
- **Lucide React** - Icon library
- **Framer Motion** - Animations
- **next-themes** - Dark mode support

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL** - Database
- **Octokit** - GitHub API client
- **OpenAI SDK** - AI integration
- **express-session** - Session management

### DevOps & Tools
- **Vite** - Build tool
- **ESBuild** - JavaScript bundler
- **Drizzle Kit** - Database migrations
- **TSX** - TypeScript execution

---

## 📁 Project Structure

```
AI-Powered-PR-Reviewer-Agent/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   └── src/
│       ├── components/       # React components
│       │   ├── ui/          # shadcn/ui components
│       │   ├── header.tsx
│       │   ├── pr-review-card.tsx
│       │   └── activity-feed.tsx
│       ├── pages/           # Page components
│       │   ├── dashboard.tsx
│       │   ├── activity.tsx
│       │   └── settings.tsx
│       ├── hooks/           # Custom React hooks
│       ├── lib/             # Utilities
│       └── App.tsx          # Root component
│
├── server/                   # Backend Node.js application
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API routes & webhook handler
│   ├── storage.ts          # Database operations
│   ├── vite.ts             # Vite dev server integration
│   └── lib/
│       ├── github.ts       # GitHub API functions
│       └── openai.ts       # OpenAI integration
│
├── shared/                   # Shared types & schemas
│   └── schema.ts           # Zod schemas & TypeScript types
│
├── .env                     # Environment variables (create this)
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

---

## � API Endpoints

### Webhook Endpoint
```
POST /api/webhook
```
- Receives GitHub webhook events
- Verifies signature
- Triggers PR review process

### Get All Reviews
```
GET /api/reviews
```
- Returns all PR reviews
- Response: Array of review objects

### Get Activity Logs
```
GET /api/activity?limit=50
```
- Returns activity logs
- Query params: `limit` (default: 50)

### Get Webhook Status
```
GET /api/webhook/status
```
- Returns webhook configuration status
- Includes: URL, connection status, events count

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Webhook Returns 400 Error

**Error**: `Invalid webhook payload`

**Solution**:
- Verify `WEBHOOK_SECRET` matches in both `.env` and GitHub
- Check webhook payload format in GitHub delivery logs
- Ensure "Content type" is set to `application/json`

#### 2. GitHub API Returns 404

**Error**: `Not Found - GET /repos/owner/repo/pulls/123`

**Solutions**:
```bash
# Verify token has access
node verify-github-token.js

# Common causes:
# - Token doesn't have "pull_requests: read" permission
# - Token doesn't have access to the repository
# - Repository name or owner is incorrect
# - Token has expired
```

**Fix**: [Regenerate GitHub token](#-github-token-setup) with correct permissions

#### 3. OpenAI API Returns 429

**Error**: `You exceeded your current quota`

**Solutions**:
- ✅ Add billing to OpenAI account
- ✅ Check usage: https://platform.openai.com/account/usage
- ✅ Verify API key is active
- ✅ Consider using gpt-4o-mini (cheaper)

#### 4. Database Connection Failed

**Error**: `Connection terminated` or `ECONNREFUSED`

**Solutions**:
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Verify DATABASE_URL format
DATABASE_URL=postgresql://user:password@host:port/database
```

#### 5. ngrok Timeout Issues

**Error**: Webhook timeouts in local development

**Solution**:
- ngrok free tier has limitations
- Use ngrok paid tier or deploy to cloud
- Check ngrok session hasn't expired

### Debug Mode

Enable detailed logging:

```bash
# Add to .env
DEBUG=true
NODE_ENV=development
```

Check logs in terminal for detailed error messages.

### Webhook Debugging

1. **GitHub Webhook Logs**
   - Go to: Repository → Settings → Webhooks
   - Click on your webhook
   - Check "Recent Deliveries"
   - View request/response for each delivery

2. **Application Logs**
   - Terminal will show all webhook events
   - Look for error messages
   - Check signature verification status

### Getting Help

If issues persist:
1. Check terminal logs carefully
2. Review GitHub webhook delivery logs
3. Verify all environment variables
4. Test each component individually using verification scripts

---

## 💰 Cost Optimization

### Reduce OpenAI Costs

The application is already configured with **GPT-4o-mini** for cost optimization.

#### Model Comparison

| Model | Input Cost | Output Cost | Best For |
|-------|------------|------------|----------|
| **gpt-4o-mini** ⭐ | $0.15/1M | $0.60/1M | Most cost-effective |
| gpt-4o | $2.50/1M | $10.00/1M | Better quality |
| gpt-4-turbo | $10.00/1M | $30.00/1M | Legacy |

#### Change Model

Edit `server/lib/openai.ts`:

```typescript
// Current (cost-effective)
model: "gpt-4o-mini"

// Higher quality (more expensive)
model: "gpt-4o"
```

### Limit Review Scope

To reduce token usage, modify the file patch truncation in `server/lib/openai.ts`:

```typescript
// Current: 2000 characters per file
f.patch.substring(0, 2000)

// Reduce to 1000 for smaller PRs
f.patch.substring(0, 1000)
```

### Set OpenAI Budget Limits

1. Go to: https://platform.openai.com/account/billing/limits
2. Set monthly budget limit (e.g., $10)
3. Enable email notifications at 75% and 90%

---

## 🔒 Security

### Best Practices

- ✅ **Never commit `.env` file** - Add to `.gitignore`
- ✅ **Use strong webhook secrets** - Generate with `openssl rand -hex 32`
- ✅ **Verify webhook signatures** - Already implemented with HMAC SHA-256
- ✅ **Use environment variables** - Never hardcode credentials
- ✅ **Set token expiration** - Use 90-day tokens
- ✅ **Minimum permissions** - Grant only required GitHub permissions
- ✅ **HTTPS only** - Use SSL for webhook endpoint
- ✅ **Regular rotation** - Rotate tokens periodically

### Token Security

```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env

# Should show:
# .env
# .env.local
```

### Revoke Compromised Tokens

If a token is exposed:
1. **GitHub**: Settings → Developer settings → Tokens → Revoke
2. **OpenAI**: Account → API keys → Revoke key
3. Generate new tokens immediately
4. Update `.env` file
5. Restart application

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---
