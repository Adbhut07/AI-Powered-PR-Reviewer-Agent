#!/bin/bash

#############################################
# Update Script for AI PR Reviewer on EC2
# Run this script to update your application
#############################################

set -e

echo "================================================"
echo "  Updating AI PR Reviewer"
echo "================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Navigate to app directory
APP_DIR="$HOME/apps"
if [ -z "$1" ]; then
    # Auto-detect app directory
    cd "$APP_DIR"
    APP_NAME=$(ls -d */ 2>/dev/null | head -n 1 | sed 's:/*$::')
    if [ -z "$APP_NAME" ]; then
        echo "Error: No application directory found in $APP_DIR"
        exit 1
    fi
    cd "$APP_NAME"
else
    cd "$APP_DIR/$1"
fi

print_info "Updating application in: $(pwd)"
echo ""

# Pull latest changes
print_info "Pulling latest changes from Git..."
git pull origin main || git pull origin master
print_success "Code updated"
echo ""

# Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies updated"
echo ""

# Build application
print_info "Building application..."
npm run build
print_success "Build completed"
echo ""

# Run migrations (optional)
read -p "Run database migrations? (y/n) [n]: " RUN_MIGRATIONS
if [ "$RUN_MIGRATIONS" = "y" ]; then
    print_info "Running database migrations..."
    npm run db:push
    print_success "Migrations completed"
    echo ""
fi

# Restart application
print_info "Restarting application..."
pm2 restart ai-pr-reviewer
print_success "Application restarted"
echo ""

# Show status
print_info "Current status:"
pm2 status ai-pr-reviewer
echo ""

print_success "Update completed! 🎉"
echo ""
echo "View logs with: pm2 logs ai-pr-reviewer"
