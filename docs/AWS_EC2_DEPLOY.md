# 🚀 Deploy to AWS EC2 - Complete Guide

This guide will help you deploy your AI PR Reviewer on AWS EC2.

## 📋 What You'll Need

- AWS Account (free tier eligible)
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- Your environment variables ready:
  - GITHUB_TOKEN
  - WEBHOOK_SECRET
  - OPENAI_API_KEY
  - DATABASE_URL

---

## 🏗️ Architecture Overview

```
Internet → EC2 Instance (Ubuntu) → PostgreSQL (RDS or same EC2)
           ├── Node.js App (PM2)
           ├── Nginx (Reverse Proxy)
           └── SSL Certificate (Let's Encrypt)
```

---

## 📝 Step-by-Step Deployment

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to EC2 Dashboard

2. **Launch Instance**
   - Click **"Launch Instance"**
   - **Name**: `ai-pr-reviewer`

3. **Choose AMI**
   - Select: **Ubuntu Server 22.04 LTS** (Free tier eligible)

4. **Choose Instance Type**
   - Select: **t2.micro** (Free tier: 750 hours/month)
   - Or **t3.micro** for better performance

5. **Create Key Pair**
   - Click **"Create new key pair"**
   - Name: `ai-pr-reviewer-key`
   - Type: RSA
   - Format: `.pem` (Mac/Linux) or `.ppk` (Windows)
   - Download and save securely

6. **Network Settings**
   - ✅ Allow SSH (port 22) from **My IP**
   - ✅ Allow HTTP (port 80) from **Anywhere**
   - ✅ Allow HTTPS (port 443) from **Anywhere**

7. **Configure Storage**
   - **Size**: 20 GB (Free tier: up to 30 GB)
   - **Type**: General Purpose SSD (gp3)

8. **Launch Instance**
   - Click **"Launch Instance"**
   - Wait for instance to be running

9. **Allocate Elastic IP (Optional but Recommended)**
   - Go to **Elastic IPs** in EC2 dashboard
   - Click **"Allocate Elastic IP address"**
   - Associate it with your instance
   - This gives you a permanent IP address

---

### Step 2: Connect to EC2 Instance

#### For Mac/Linux:

```bash
# Set permissions for key file
chmod 400 ~/Downloads/ai-pr-reviewer-key.pem

# Connect to instance (replace with your IP)
ssh -i ~/Downloads/ai-pr-reviewer-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### For Windows:
Use PuTTY or Windows Terminal with the .ppk file

---

### Step 3: Install Required Software

Once connected to your EC2 instance:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx

# Install PostgreSQL (if not using RDS)
sudo apt install -y postgresql postgresql-contrib

# Install Git
sudo apt install -y git
```

---

### Step 4: Set Up PostgreSQL Database

#### Option A: PostgreSQL on Same EC2 Instance

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE aiprreviewer;
CREATE USER aipruser WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE aiprreviewer TO aipruser;
\q

# Allow local connections
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Add this line:
# local   aiprreviewer    aipruser                                md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

Your DATABASE_URL will be:
```
postgresql://aipruser:your_secure_password_here@localhost:5432/aiprreviewer
```

#### Option B: Use AWS RDS (Recommended for Production)

1. Go to **RDS** in AWS Console
2. Create database:
   - Engine: PostgreSQL
   - Template: Free tier
   - DB instance identifier: `ai-pr-reviewer-db`
   - Master username: `postgres`
   - Master password: Create secure password
   - Public access: No (only from EC2)
3. Configure security group to allow EC2 to connect
4. Get the endpoint URL from RDS dashboard

Your DATABASE_URL will be:
```
postgresql://postgres:password@your-rds-endpoint.amazonaws.com:5432/aiprreviewer
```

---

### Step 5: Clone and Set Up Application

```bash
# Create application directory
cd /home/ubuntu
mkdir apps
cd apps

# Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Create .env file
nano .env
```

Add these environment variables to `.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here

# GitHub Webhook Secret
WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DATABASE_URL=postgresql://aipruser:your_password@localhost:5432/aiprreviewer
```

Save and exit (Ctrl+X, then Y, then Enter)

```bash
# Make .env file readable only by owner
chmod 600 .env

# Build the application
npm run build

# Run database migration
npm run db:push

# Test the application
npm start
# If it works, press Ctrl+C to stop
```

---

### Step 6: Set Up PM2 (Process Manager)

```bash
# Start application with PM2
pm2 start npm --name "ai-pr-reviewer" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup systemd
# Copy and run the command it outputs

# Check status
pm2 status

# View logs
pm2 logs ai-pr-reviewer

# Other useful PM2 commands:
# pm2 restart ai-pr-reviewer
# pm2 stop ai-pr-reviewer
# pm2 delete ai-pr-reviewer
```

---

### Step 7: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ai-pr-reviewer
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com;  # Replace with your domain or EC2 IP

    # Increase body size for webhook payloads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Save and exit, then:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ai-pr-reviewer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

### Step 8: Set Up SSL Certificate (HTTPS)

#### If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot will automatically configure Nginx for HTTPS!

#### If using EC2 IP only:

You can use a service like ngrok for temporary HTTPS, or use the HTTP endpoint for testing (not recommended for production).

---

### Step 9: Configure Security Group

In AWS Console:

1. Go to **EC2** → **Security Groups**
2. Select your instance's security group
3. Edit **Inbound Rules**:
   - Type: SSH, Port: 22, Source: My IP
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
   - Type: Custom TCP, Port: 3000, Source: Localhost only (for debugging)

---

### Step 10: Test Your Deployment

```bash
# Check if app is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test the API locally
curl http://localhost:3000/api/webhook/status

# Test from outside (replace with your domain/IP)
curl http://YOUR_DOMAIN_OR_IP/api/webhook/status
```

You should get a JSON response!

---

### Step 11: Set Up GitHub Webhook

1. Go to your **GitHub repository**
2. **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-domain.com/api/webhook` (or `http://your-ec2-ip/api/webhook`)
   - **Content type**: `application/json`
   - **Secret**: Your `WEBHOOK_SECRET` from .env
   - **Events**: Select "Pull requests"
   - **Active**: ✅ Check this
4. Click **"Add webhook"**
5. Test by creating a Pull Request!

---

## 🔄 Updating Your Application

```bash
# SSH into your server
ssh -i ~/Downloads/ai-pr-reviewer-key.pem ubuntu@YOUR_EC2_IP

# Navigate to app directory
cd /home/ubuntu/apps/YOUR_REPO

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart the application
pm2 restart ai-pr-reviewer

# Check logs
pm2 logs ai-pr-reviewer
```

---

## 📊 Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs ai-pr-reviewer

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor Resources

```bash
# Check CPU, Memory, Disk
htop  # Install with: sudo apt install htop

# Check disk space
df -h

# Check memory
free -h

# PM2 monitoring
pm2 monit
```

### Database Maintenance

```bash
# Connect to database
psql -U aipruser -d aiprreviewer

# Check table sizes
\dt+

# Vacuum database (cleanup)
VACUUM ANALYZE;
```

---

## 🐛 Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs ai-pr-reviewer --lines 100

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart application
pm2 restart ai-pr-reviewer
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# View error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Issues

```bash
# Test database connection
psql -U aipruser -d aiprreviewer -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Webhook Not Working

1. Check if webhook URL is accessible from internet
2. Verify webhook secret matches
3. Check GitHub webhook delivery logs
4. Review PM2 logs: `pm2 logs ai-pr-reviewer`

---

## 💰 Cost Estimation

**Free Tier (First 12 Months):**
- t2.micro EC2: Free (750 hours/month)
- 30 GB Storage: Free
- 15 GB Data Transfer: Free

**After Free Tier:**
- t2.micro EC2: ~$8-10/month
- 20 GB Storage: ~$2/month
- Data Transfer: ~$1-5/month
- **Total: ~$11-17/month**

**With RDS PostgreSQL:**
- Add ~$15-25/month for db.t3.micro

---

## 🔐 Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure Firewall**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Secure SSH**
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port

4. **Regular Backups**
   - Use AWS snapshots for EC2
   - Backup database regularly
   - Store .env file securely

5. **Monitor Logs**
   - Set up CloudWatch for monitoring
   - Review logs regularly
   - Set up alerts for errors

---

## 📚 Useful Commands Reference

```bash
# PM2 Commands
pm2 start npm --name "ai-pr-reviewer" -- start
pm2 restart ai-pr-reviewer
pm2 stop ai-pr-reviewer
pm2 delete ai-pr-reviewer
pm2 logs ai-pr-reviewer
pm2 monit

# Nginx Commands
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl status nginx
sudo nginx -t

# PostgreSQL Commands
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl restart postgresql
psql -U aipruser -d aiprreviewer

# System Commands
sudo reboot
sudo shutdown -h now
df -h  # Disk space
free -h  # Memory
htop  # Process monitor
```

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched and running
- [ ] SSH key downloaded and secured
- [ ] Connected to EC2 instance
- [ ] Node.js, PM2, Nginx installed
- [ ] PostgreSQL set up (local or RDS)
- [ ] Application cloned and dependencies installed
- [ ] .env file created with all variables
- [ ] Application built successfully
- [ ] Database migration completed
- [ ] PM2 started and configured
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (if using domain)
- [ ] Security group configured
- [ ] Application accessible from internet
- [ ] GitHub webhook configured
- [ ] Test PR created and reviewed successfully

---

**Congratulations! Your AI PR Reviewer is now live on AWS EC2! 🎉**

Need help? Check the logs or review the troubleshooting section above.
