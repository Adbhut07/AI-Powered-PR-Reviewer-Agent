# 🚀 AWS EC2 Quick Start Guide

## Step 1: Launch EC2 Instance (5 minutes)

1. **AWS Console** → EC2 → Launch Instance
2. **Settings**:
   - Name: `ai-pr-reviewer`
   - AMI: Ubuntu 22.04 LTS
   - Instance type: `t2.micro` (free tier)
   - Create new key pair: `ai-pr-reviewer-key.pem`
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443)
3. **Launch** and wait for "Running" status
4. Copy **Public IPv4 address**

## Step 2: Connect to EC2

```bash
# Set key permissions
chmod 400 ~/Downloads/ai-pr-reviewer-key.pem

# Connect (replace YOUR_EC2_IP)
ssh -i ~/Downloads/ai-pr-reviewer-key.pem ubuntu@YOUR_EC2_IP
```

## Step 3: Run Automated Setup

```bash
# Download and run setup script
curl -o setup-ec2.sh https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ec2.sh
chmod +x setup-ec2.sh
./setup-ec2.sh
```

**Or manually:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2, Nginx, PostgreSQL
sudo npm install -g pm2
sudo apt install -y nginx postgresql postgresql-contrib git

# Clone your repo
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Create .env file
nano .env
# (Add your GITHUB_TOKEN, WEBHOOK_SECRET, OPENAI_API_KEY, DATABASE_URL)

# Build and start
npm install
npm run build
npm run db:push
pm2 start npm --name "ai-pr-reviewer" -- start
pm2 save
pm2 startup
```

## Step 4: Configure Nginx

```bash
# Create config
sudo nano /etc/nginx/sites-available/ai-pr-reviewer
```

Add:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable and restart
sudo ln -s /etc/nginx/sites-available/ai-pr-reviewer /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

## Step 5: Set Up SSL (Optional)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Step 6: Configure GitHub Webhook

1. GitHub Repo → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `https://your-domain.com/api/webhook`
3. **Content type**: `application/json`
4. **Secret**: Your `WEBHOOK_SECRET`
5. **Events**: Pull requests
6. **Add webhook**

## 🎯 Quick Commands

```bash
# View status
pm2 status

# View logs
pm2 logs ai-pr-reviewer

# Restart app
pm2 restart ai-pr-reviewer

# Update app
cd ~/apps/YOUR_REPO
git pull
npm install
npm run build
pm2 restart ai-pr-reviewer

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

## 💰 Cost

- **Free Tier**: t2.micro (750 hours/month for 12 months)
- **After**: ~$8-10/month for t2.micro
- **Total**: ~$11-17/month with storage & data transfer

## ✅ Verification

```bash
# Test locally
curl http://localhost:3000/api/webhook/status

# Test externally
curl http://YOUR_DOMAIN_OR_IP/api/webhook/status
```

## 📚 Full Guide

See **AWS_EC2_DEPLOY.md** for complete documentation.

---

**Your app URL**: http://YOUR_EC2_IP (or https://your-domain.com)
**Webhook URL**: http://YOUR_EC2_IP/api/webhook

🎉 Done! Create a PR to test your AI reviewer!
