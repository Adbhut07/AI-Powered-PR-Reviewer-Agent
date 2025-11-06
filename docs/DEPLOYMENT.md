# Deployment Guide - AI PR Reviewer

This guide covers multiple deployment options for your AI PR Reviewer application.

---

## 🚀 Option 1: Railway (Recommended)

Railway is the easiest option with built-in PostgreSQL database support.

### Steps:

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your repository

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a database
   - The `DATABASE_URL` will be automatically set

4. **Set Environment Variables**
   - Go to your project → Variables
   - Add these variables:
     ```
     GITHUB_TOKEN=your_github_token
     WEBHOOK_SECRET=your_webhook_secret
     OPENAI_API_KEY=your_openai_api_key
     NODE_ENV=production
     ```
   - `DATABASE_URL` is automatically set by Railway's PostgreSQL service

5. **Deploy**
   - Railway will automatically deploy your app
   - You'll get a URL like: `https://your-app.up.railway.app`

6. **Run Database Migration**
   - Go to your project → Service → Settings
   - Under "Deploy", add a custom start command (optional):
     ```
     npm run db:push && npm start
     ```
   - Or run manually using Railway CLI:
     ```bash
     npm install -g @railway/cli
     railway login
     railway link
     railway run npm run db:push
     ```

7. **Set Up GitHub Webhook**
   - Use your Railway URL: `https://your-app.up.railway.app/api/webhook`
   - Add it to your GitHub repository webhook settings

**Cost:** Free tier includes $5 credit/month (~500 hours)

---

## 🔧 Option 2: Render

Render offers a free tier and is similar to Railway.

### Steps:

1. **Sign up for Render**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Dashboard → New → PostgreSQL
   - Choose free tier
   - Copy the "Internal Database URL"

3. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name**: ai-pr-reviewer
     - **Environment**: Node
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Plan**: Free

4. **Set Environment Variables**
   - Go to Environment tab
   - Add:
     ```
     DATABASE_URL=your_postgres_internal_url
     GITHUB_TOKEN=your_github_token
     WEBHOOK_SECRET=your_webhook_secret
     OPENAI_API_KEY=your_openai_api_key
     NODE_ENV=production
     ```

5. **Deploy**
   - Render will build and deploy automatically
   - You'll get a URL like: `https://ai-pr-reviewer.onrender.com`

6. **Run Database Migration**
   - Go to Shell tab in your web service
   - Run: `npm run db:push`

**Cost:** Free tier (spins down after 15 min of inactivity, cold starts)

---

## ☁️ Option 3: DigitalOcean App Platform

Good balance of features and pricing.

### Steps:

1. **Sign up for DigitalOcean**
   - Go to https://cloud.digitalocean.com
   - Sign up and add payment method (free credits available)

2. **Create Database**
   - Create → Databases → PostgreSQL
   - Choose the $12/month plan (or higher)
   - Note the connection string

3. **Create App**
   - Create → Apps → GitHub
   - Select your repository
   - DigitalOcean will detect it as Node.js

4. **Configure Build**
   - **Build Command**: `npm install && npm run build`
   - **Run Command**: `npm start`

5. **Add Environment Variables**
   ```
   DATABASE_URL=your_postgres_connection_string
   GITHUB_TOKEN=your_github_token
   WEBHOOK_SECRET=your_webhook_secret
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=production
   ```

6. **Deploy and Run Migration**
   - Deploy the app
   - Use the console to run: `npm run db:push`

**Cost:** $5-12/month for the app + $12/month for database

---

## 🐳 Option 4: Fly.io

Great for Docker deployments with global edge network.

### Steps:

1. **Install Fly CLI**
   ```bash
   brew install flyctl
   # or
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create Dockerfile**
   (Already provided below)

3. **Sign up and Launch**
   ```bash
   fly auth signup
   cd /Users/adbhutsatsangi/Downloads/AIPRReviewer
   fly launch
   ```

4. **Create PostgreSQL Database**
   ```bash
   fly postgres create
   fly postgres attach <postgres-app-name>
   ```

5. **Set Environment Variables**
   ```bash
   fly secrets set GITHUB_TOKEN=your_token
   fly secrets set WEBHOOK_SECRET=your_secret
   fly secrets set OPENAI_API_KEY=your_key
   fly secrets set NODE_ENV=production
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

7. **Run Database Migration**
   ```bash
   fly ssh console
   npm run db:push
   ```

**Cost:** Free tier available (3 shared-cpu VMs, 3GB storage)

---

## 🔵 Option 5: Heroku (Traditional Option)

Still works but more expensive after removing free tier.

### Steps:

1. **Install Heroku CLI**
   ```bash
   brew install heroku/brew/heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set GITHUB_TOKEN=your_token
   heroku config:set WEBHOOK_SECRET=your_secret
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Run Migration**
   ```bash
   heroku run npm run db:push
   ```

**Cost:** Mini PostgreSQL ($5/month) + Eco Dyno ($5/month) = $10/month minimum

---

## 📦 Dockerfile (for Docker-based deployments)

Create this file if deploying to Fly.io or using Docker:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 🎯 Quick Comparison

| Platform | Free Tier | Database | Ease | Best For |
|----------|-----------|----------|------|----------|
| **Railway** ⭐ | $5 credit/month | ✅ Included | ⭐⭐⭐⭐⭐ | Quick setup |
| **Render** | Yes (sleeps) | ✅ Included | ⭐⭐⭐⭐ | Free tier |
| **Fly.io** | Yes | ✅ Included | ⭐⭐⭐ | Global edge |
| **DigitalOcean** | No | ✅ Managed | ⭐⭐⭐ | Production |
| **Heroku** | No | ✅ Add-on | ⭐⭐⭐⭐ | Traditional |

---

## 🔧 After Deployment

1. **Test your deployment**
   ```bash
   curl https://your-app-url.com/api/webhook/status
   ```

2. **Set up GitHub Webhook**
   - Go to your GitHub repo → Settings → Webhooks
   - Add webhook:
     - **Payload URL**: `https://your-app-url.com/api/webhook`
     - **Content type**: `application/json`
     - **Secret**: Your `WEBHOOK_SECRET`
     - **Events**: Pull requests

3. **Test with a PR**
   - Create a test Pull Request
   - Check the webhook delivery logs in GitHub
   - View the AI review comment on your PR

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test database connection
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

### Migration Issues
- Ensure `DATABASE_URL` is set correctly
- Run `npm run db:push` manually after deployment
- Check logs for any errors

### Webhook Not Triggering
- Verify webhook URL is accessible from internet
- Check webhook secret matches
- Review "Recent Deliveries" in GitHub webhook settings

---

## 📝 Notes

- Always use HTTPS URLs for webhooks (required by GitHub)
- Keep your API keys secure and never commit them
- Monitor your OpenAI API usage to avoid unexpected costs
- Consider setting up monitoring/logging (e.g., Sentry, LogRocket)

---

**Need Help?** Check the platform-specific documentation or the main README.md
