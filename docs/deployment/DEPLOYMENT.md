# The Pet Kitchen - Deployment Guide

Complete guide for deploying The Pet Kitchen website to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Server Configuration](#server-configuration)
7. [Post-Deployment](#post-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16+ installed
- MySQL 8.0+ installed
- PM2 installed globally (`npm install -g pm2`)
- Domain name configured
- SSL certificate (for HTTPS)

## Pre-Deployment Setup

### 1. Clone/Download Project

```bash
# If using git
git clone <repository-url>
cd "The Pet Kitchen Website"

# Or extract downloaded ZIP file
```

### 2. Backend Environment Configuration

```bash
cd backend
cp .env.example .env
# Edit .env with your production values
nano .env  # or use your preferred editor
```

**Required .env variables:**
- `NODE_ENV=production`
- `PORT=8000` (or your preferred port)
- `FRONTEND_URL=https://yourdomain.com`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- `MYFATOORAH_API_KEY` and `MYFATOORAH_BASE_URL`
- `TEST_DISABLE_MYFATOORAH=false` (for production)

### 3. Install Dependencies

```bash
cd backend
npm install --production
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE pet_kitchen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Run Migrations

```bash
# Run in order:
mysql -u your_user -p pet_kitchen_db < backend/database/schema.sql
mysql -u your_user -p pet_kitchen_db < backend/database/subscriptions_migration.sql
mysql -u your_user -p pet_kitchen_db < backend/database/meal_plans_migration.sql
```

### 3. Create Admin User

```bash
cd backend
node scripts/create-admin.js
# Follow prompts to create admin account
```

## Backend Deployment

### Option 1: PM2 (Recommended)

```bash
cd backend
npm run pm2:start
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

### Option 2: Systemd Service

Create `/etc/systemd/system/pet-kitchen-api.service`:

```ini
[Unit]
Description=The Pet Kitchen API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable pet-kitchen-api
sudo systemctl start pet-kitchen-api
```

### Option 3: Manual Start

```bash
cd backend
npm start
```

## Frontend Deployment

The frontend files are static HTML/CSS/JS. Upload to your web server:

### Files to Upload:
```
/
├── index.html
├── account.html
├── admin.html
├── cart.html
├── login.html
├── signup.html
├── meal-plans.html
├── subscriptions.html
├── events.html
├── instructions.html
├── order-confirmation.html
├── payment-success.html
├── payment-failed.html
├── checkout-success-test.html
├── robots.txt
├── css/
├── js/
└── assets/
```

**Do NOT upload:**
- `backend/` folder (unless deploying backend separately)
- `docs/` folder
- `.git/` folder
- `node_modules/` folders
- `.env` files

## Server Configuration

### Nginx Configuration

Create `/etc/nginx/sites-available/thepetkitchen`:

```nginx
server {
    listen 80;
    server_name thepetkitchen.net www.thepetkitchen.net;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name thepetkitchen.net www.thepetkitchen.net;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # Frontend (static files)
    root /var/www/thepetkitchen;
    index index.html;
    
    # API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/thepetkitchen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration

If using Apache, create `.htaccess` in root:

```apache
# Enable rewrite engine
RewriteEngine On

# API proxy (if using Apache as reverse proxy)
# ProxyPass /api http://localhost:8000/api
# ProxyPassReverse /api http://localhost:8000/api

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(?!api).*$ /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check backend health
curl https://yourdomain.com/api/health

# Check PM2 status
pm2 status

# Check logs
pm2 logs pet-kitchen-api
```

### 2. Test Functionality

- [ ] User registration
- [ ] User login
- [ ] Pet questionnaire
- [ ] Add to cart
- [ ] Checkout process
- [ ] Payment flow (test mode first)
- [ ] Admin dashboard access
- [ ] All CRUD operations

### 3. Monitor Logs

```bash
# PM2 logs
pm2 logs pet-kitchen-api

# System logs
sudo journalctl -u pet-kitchen-api -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### 4. Set Up Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u user -p database_name > /backups/db_$DATE.sql
```

## Troubleshooting

### Backend Not Starting

1. Check Node.js version: `node --version`
2. Check dependencies: `cd backend && npm install`
3. Check .env file: Ensure all required variables are set
4. Check port availability: `netstat -tulpn | grep 8000`
5. Check logs: `pm2 logs` or `npm start` for errors

### Database Connection Issues

1. Verify database credentials in `.env`
2. Check MySQL is running: `sudo systemctl status mysql`
3. Test connection: `mysql -u user -p -h host database`
4. Check firewall rules

### API Not Accessible

1. Check CORS settings in `backend/server.js`
2. Verify `FRONTEND_URL` in `.env` matches your domain
3. Check reverse proxy configuration
4. Verify firewall allows port 8000

### Frontend Not Loading

1. Check file permissions: `chmod -R 755 /var/www/thepetkitchen`
2. Check Nginx/Apache error logs
3. Verify static file paths in HTML
4. Check browser console for errors

## Security Checklist

- [ ] `.env` file is not in repository
- [ ] Strong JWT_SECRET is set
- [ ] Database uses strong password
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Admin password is changed from default
- [ ] Firewall rules are configured
- [ ] Regular backups are scheduled

## Support

For issues or questions:
1. Check logs first
2. Review this deployment guide
3. Check `DEPLOYMENT_CHECKLIST.md` for detailed checklist

---

**Last Updated**: 2025
**Version**: 1.0
