#!/bin/bash
# Deployment Script for The Pet Kitchen
# Run this script to deploy updates

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="."
DEPLOY_USER="www-data"
DEPLOY_DIR="/var/www/thepetkitchen"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# 1. Backup current deployment
echo -e "${YELLOW}📦 Creating backup...${NC}"
if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    cp -r $DEPLOY_DIR "/backups/$BACKUP_NAME"
    echo -e "${GREEN}✅ Backup created: /backups/$BACKUP_NAME${NC}"
fi

# 2. Stop services
echo -e "${YELLOW}⏸️  Stopping services...${NC}"
pm2 stop pet-kitchen-api || true
systemctl stop nginx || true

# 3. Deploy backend
echo -e "${YELLOW}📦 Deploying backend...${NC}"
cd $BACKEND_DIR
npm install --production
pm2 restart pet-kitchen-api || pm2 start pm2.config.js
cd ..

# 4. Deploy frontend
echo -e "${YELLOW}📦 Deploying frontend...${NC}"
rsync -av --exclude='node_modules' --exclude='.git' --exclude='backend' \
    --exclude='docs' --exclude='.env' --exclude='*.md' \
    $FRONTEND_DIR/ $DEPLOY_DIR/

# Set permissions
chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR

# 5. Start services
echo -e "${YELLOW}▶️  Starting services...${NC}"
systemctl start nginx
pm2 start pet-kitchen-api || pm2 restart pet-kitchen-api

# 6. Verify deployment
echo -e "${YELLOW}🔍 Verifying deployment...${NC}"
sleep 2
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"

