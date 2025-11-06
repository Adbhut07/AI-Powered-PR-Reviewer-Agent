#!/bin/bash

#############################################
# AWS EC2 Setup Script for AI PR Reviewer
# Run this script on your EC2 instance after connecting via SSH
#############################################

set -e  # Exit on any error

echo "================================================"
echo "  AI PR Reviewer - AWS EC2 Setup Script"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root (don't use sudo)"
    exit 1
fi

print_info "This script will install and configure your AI PR Reviewer application"
echo ""

# Step 1: Update system
print_info "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"
echo ""

# Step 2: Install Node.js
print_info "Step 2: Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi
echo ""

# Step 3: Install PM2
print_info "Step 3: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi
echo ""

# Step 4: Install Nginx
print_info "Step 4: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    print_success "Nginx installed"
else
    print_success "Nginx already installed"
fi
echo ""

# Step 5: Install PostgreSQL
print_info "Step 5: Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    print_success "PostgreSQL installed"
else
    print_success "PostgreSQL already installed"
fi
echo ""

# Step 6: Install Git
print_info "Step 6: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    print_success "Git installed"
else
    print_success "Git already installed"
fi
echo ""

# Step 7: Set up PostgreSQL database
print_info "Step 7: Setting up PostgreSQL database..."
read -p "Enter database name [aiprreviewer]: " DB_NAME
DB_NAME=${DB_NAME:-aiprreviewer}

read -p "Enter database user [aipruser]: " DB_USER
DB_USER=${DB_USER:-aipruser}

read -sp "Enter database password: " DB_PASSWORD
echo ""

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || print_info "Database already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || print_info "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
print_success "Database configured"
echo ""

# Step 8: Clone repository
print_info "Step 8: Setting up application..."
read -p "Enter your GitHub repository URL: " REPO_URL

APP_DIR="$HOME/apps"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Extract repo name from URL
REPO_NAME=$(basename -s .git "$REPO_URL")

if [ -d "$REPO_NAME" ]; then
    print_info "Directory already exists. Pulling latest changes..."
    cd "$REPO_NAME"
    git pull
else
    git clone "$REPO_URL"
    cd "$REPO_NAME"
fi
print_success "Application code ready"
echo ""

# Step 9: Set up environment variables
print_info "Step 9: Configuring environment variables..."
read -p "Enter your GitHub Token: " GITHUB_TOKEN
read -p "Enter your Webhook Secret: " WEBHOOK_SECRET
read -p "Enter your OpenAI API Key: " OPENAI_API_KEY
read -p "Enter application port [3000]: " APP_PORT
APP_PORT=${APP_PORT:-3000}

cat > .env << EOF
# Server Configuration
PORT=$APP_PORT
NODE_ENV=production

# GitHub Configuration
GITHUB_TOKEN=$GITHUB_TOKEN

# GitHub Webhook Secret
WEBHOOK_SECRET=$WEBHOOK_SECRET

# OpenAI Configuration
OPENAI_API_KEY=$OPENAI_API_KEY

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF

chmod 600 .env
print_success "Environment variables configured"
echo ""

# Step 10: Install dependencies and build
print_info "Step 10: Installing dependencies and building..."
npm install
npm run build
print_success "Application built"
echo ""

# Step 11: Run database migration
print_info "Step 11: Running database migration..."
npm run db:push
print_success "Database migration completed"
echo ""

# Step 12: Set up PM2
print_info "Step 12: Setting up PM2..."
pm2 delete ai-pr-reviewer 2>/dev/null || true
pm2 start npm --name "ai-pr-reviewer" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
print_success "PM2 configured"
echo ""

# Step 13: Configure Nginx
print_info "Step 13: Configuring Nginx..."
read -p "Enter your domain name (or EC2 public IP): " DOMAIN_NAME

sudo tee /etc/nginx/sites-available/ai-pr-reviewer > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/ai-pr-reviewer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
print_success "Nginx configured"
echo ""

# Step 14: Configure firewall
print_info "Step 14: Configuring firewall..."
read -p "Do you want to enable UFW firewall? (y/n) [n]: " ENABLE_UFW
if [ "$ENABLE_UFW" = "y" ]; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "y" | sudo ufw enable
    print_success "Firewall configured"
else
    print_info "Skipping firewall configuration"
fi
echo ""

# Step 15: SSL Certificate (optional)
print_info "Step 15: SSL Certificate setup..."
read -p "Do you want to set up SSL certificate with Let's Encrypt? (y/n) [n]: " SETUP_SSL
if [ "$SETUP_SSL" = "y" ]; then
    read -p "Enter your email for Let's Encrypt notifications: " SSL_EMAIL
    sudo apt install -y certbot python3-certbot-nginx
    sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $SSL_EMAIL
    print_success "SSL certificate installed"
else
    print_info "Skipping SSL setup. You can run this later: sudo certbot --nginx -d $DOMAIN_NAME"
fi
echo ""

# Final steps
echo "================================================"
print_success "Installation Complete!"
echo "================================================"
echo ""
echo "Your application is now running at:"
if [ "$SETUP_SSL" = "y" ]; then
    echo "  🌐 https://$DOMAIN_NAME"
else
    echo "  🌐 http://$DOMAIN_NAME"
fi
echo ""
echo "Webhook URL for GitHub:"
if [ "$SETUP_SSL" = "y" ]; then
    echo "  🔗 https://$DOMAIN_NAME/api/webhook"
else
    echo "  🔗 http://$DOMAIN_NAME/api/webhook"
fi
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs ai-pr-reviewer - View application logs"
echo "  pm2 restart ai-pr-reviewer - Restart application"
echo "  sudo systemctl status nginx - Check Nginx status"
echo ""
echo "Next steps:"
echo "  1. Go to your GitHub repository"
echo "  2. Settings → Webhooks → Add webhook"
echo "  3. Set Payload URL to your webhook URL above"
echo "  4. Set Content type to application/json"
echo "  5. Set Secret to your WEBHOOK_SECRET"
echo "  6. Select 'Pull requests' event"
echo "  7. Create a test PR to verify!"
echo ""
print_success "Setup complete! 🎉"
