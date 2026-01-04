# GitHub & Vercel Deployment Guide

## Step 1: Initialize Git Repository

```bash
cd "/Users/hamadi/Downloads/The Pet Kitchen Website"
git init
git add .
git commit -m "Initial commit - The Pet Kitchen website"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `the-pet-kitchen` (or your preferred name)
4. Description: "The Pet Kitchen e-commerce platform"
5. **Visibility**: Choose Private (recommended) or Public
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 3: Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/the-pet-kitchen.git

# Rename default branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

If you get authentication errors, you may need to:
- Use a Personal Access Token instead of password
- Set up SSH keys
- Use GitHub CLI: `gh auth login`

## Step 4: Deploy to Vercel

### Option A: Using Vercel Dashboard (Recommended for first time)

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub account)
2. Click "Add New Project"
3. Import your GitHub repository: `the-pet-kitchen`
4. **Project Settings**:
   - **Framework Preset**: "Other" (or "Vite" if you're using Vite)
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave empty (frontend only) OR `cd backend && npm install` if needed
   - **Output Directory**: Leave as `.` (root)
   - **Install Command**: Leave empty

5. **Environment Variables** (CRITICAL - Add these):
   ```
   # Frontend URL (will be set by Vercel automatically as VERCEL_URL)
   FRONTEND_URL=https://your-project.vercel.app
   
   # Database (you'll need to provide a hosted MySQL database)
   DB_HOST=your-database-host
   DB_USER=your-database-user
   DB_PASSWORD=your-database-password
   DB_NAME=your-database-name
   
   # JWT Secret (generate a new one for production)
   JWT_SECRET=your-secure-random-secret-key-here
   
   # MyFatoorah (your production keys)
   MYFATOORAH_API_KEY=your-production-api-key
   MYFATOORAH_BASE_URL=https://api.myfatoorah.com
   
   # Email (SMTP)
   OUTLOOK_EMAIL=no-reply@thepetkitchen.net
   OUTLOOK_PASSWORD=your-outlook-password
   OUTLOOK_NAME=The Pet Kitchen
   ADMIN_EMAIL=admin@thepetkitchen.net
   
   # API Configuration
   PORT=3000
   API_VERSION=v1
   NODE_ENV=production
   ```

6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd "/Users/hamadi/Downloads/The Pet Kitchen Website"
vercel

# Follow the prompts
# - Link to existing project or create new
# - Confirm settings
# - Deploy

# For production deployment
vercel --prod
```

## Step 5: Important Notes for Vercel Deployment

### ⚠️ Vercel Limitations:

1. **Serverless Functions Only**: Vercel is designed for serverless functions, not long-running Node.js servers
2. **Your backend won't work on Vercel directly** - You need to:
   - Deploy the backend separately (Railway, Render, Heroku, DigitalOcean, etc.)
   - OR convert backend routes to Vercel serverless functions
   - OR use a separate hosting service for the backend

### Recommended Architecture:

```
Frontend (Static HTML/CSS/JS) → Vercel ✅
Backend API (Node.js/Express) → Railway/Render/DigitalOcean ✅
Database (MySQL) → PlanetScale/Railway/AWS RDS ✅
```

### Option 1: Deploy Frontend Only to Vercel (Current Setup)

1. **Frontend** (static files): Deploy to Vercel ✅
2. **Backend API**: Deploy to [Railway](https://railway.app) or [Render](https://render.com) 
3. Update `FRONTEND_URL` and `API_BASE_URL` environment variables

### Option 2: Convert Backend to Serverless Functions (Advanced)

This requires restructuring your Express app into Vercel serverless functions.

## Step 6: Update Frontend API Configuration

If backend is hosted elsewhere, update `js/api.js`:

```javascript
// Change from:
const API_BASE_URL = 'http://localhost:8000/api/v1';

// To your backend URL:
const API_BASE_URL = 'https://your-backend-api.railway.app/api/v1';
// or
const API_BASE_URL = 'https://api.thepetkitchen.net/api/v1';
```

## Step 7: Database Setup for Production

You'll need a hosted MySQL database:
- [PlanetScale](https://planetscale.com) - MySQL compatible, free tier
- [Railway](https://railway.app) - MySQL databases, easy setup
- [AWS RDS](https://aws.amazon.com/rds) - Full MySQL, pay-as-you-go
- [DigitalOcean Managed Databases](https://www.digitalocean.com/products/managed-databases)

## Quick Deploy Checklist

- [ ] Git repository initialized
- [ ] Code committed
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Repository imported to Vercel
- [ ] Environment variables configured
- [ ] Backend hosting plan (Railway/Render/etc.)
- [ ] Database hosting plan (PlanetScale/Railway/etc.)
- [ ] API URLs updated in frontend
- [ ] Test deployment

## Troubleshooting

### Vercel Build Errors
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in `package.json`
- Check for syntax errors

### API Connection Errors
- Verify CORS is configured on backend
- Check backend URL is correct
- Verify environment variables are set

### Database Connection Errors
- Verify database credentials
- Check database allows connections from Vercel IPs
- Test connection from backend hosting service

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

