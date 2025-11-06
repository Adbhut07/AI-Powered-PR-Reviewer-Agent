# 🎯 Quick Deployment Reference

## Fastest Way: Railway (5 minutes)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/REPO.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Visit: https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add PostgreSQL database (New → Database → PostgreSQL)

3. **Set Variables**
   - GITHUB_TOKEN
   - WEBHOOK_SECRET  
   - OPENAI_API_KEY
   - NODE_ENV=production

4. **Run Migration**
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway run npm run db:push
   ```

5. **Get Your URL**
   - Settings → Domains → Generate Domain
   - Copy: `https://your-app.up.railway.app`

6. **Setup GitHub Webhook**
   - Repo Settings → Webhooks → Add webhook
   - URL: `https://your-app.up.railway.app/api/webhook`
   - Secret: Your WEBHOOK_SECRET
   - Events: Pull requests

## Alternative: Render (Free with Cold Starts)

1. Visit https://render.com
2. New → PostgreSQL → Free tier
3. New → Web Service → Connect repo
4. Build: `npm install && npm run build`
5. Start: `npm start`
6. Add environment variables
7. Run migration in Shell tab

## Alternative: Fly.io (Global Edge)

```bash
brew install flyctl
flyctl auth signup
cd /Users/adbhutsatsangi/Downloads/AIPRReviewer
fly launch
fly postgres create
fly secrets set GITHUB_TOKEN=xxx WEBHOOK_SECRET=xxx OPENAI_API_KEY=xxx
fly deploy
```

---

See **RAILWAY_DEPLOY.md** for detailed Railway instructions
See **DEPLOYMENT.md** for all deployment options
