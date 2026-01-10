# Railway Backend Setup - Step by Step Guide

This guide will walk you through configuring Railway backend and connecting it to your Vercel frontend.

## Prerequisites Checklist
- [ ] GitHub account with `the-pet-kitchen` repository
- [ ] Railway account (sign up at railway.app with GitHub)
- [ ] Vercel account (you already have this)
- [ ] Your `.env` file values ready (from `backend/.env`)

---

## STEP 1: Create Railway Project

1. **Go to Railway**: https://railway.app
2. **Sign in** with your GitHub account
3. Click **"New Project"** (top right)
4. Select **"Deploy from GitHub repo"**
5. Choose your repository: **`the-pet-kitchen`**
6. Railway will ask: **"Configure Project"**
   - Select **"Empty Project"** (we'll add services manually)
   - OR if it auto-detects, we'll configure it next

**✅ Checkpoint**: You should see a new Railway project dashboard

---

## STEP 2: Add Backend Service

1. In your Railway project, click **"+ New"** button
2. Select **"GitHub Repo"** (if not already connected)
3. Choose **`the-pet-kitchen`** repository
4. Railway will start deploying - **STOP HERE!**

5. **Before deployment completes**, click on the service (it will be named something like "the-pet-kitchen")
6. Click **"Settings"** tab
7. Scroll to **"Root Directory"**
8. Set **Root Directory** to: `backend`
9. Click **"Save"**

**✅ Checkpoint**: Root directory is set to `backend`

---

## STEP 3: Add MySQL Database

1. In your Railway project dashboard, click **"+ New"** again
2. Select **"Database"**
3. Select **"Add MySQL"**
4. Railway will create a MySQL database automatically
5. Click on the **MySQL service** that was just created
6. Go to **"Variables"** tab
7. **COPY these values** (you'll need them):
   - `MYSQLHOST` (this is your DB_HOST)
   - `MYSQLUSER` (this is your DB_USER)
   - `MYSQLPASSWORD` (this is your DB_PASSWORD)
   - `MYSQLDATABASE` (this is your DB_NAME)
   - `MYSQLPORT` (usually 3306)

**✅ Checkpoint**: You have MySQL database credentials copied

---

## STEP 4: Configure Backend Environment Variables

1. Go back to your **backend service** (not the MySQL one)
2. Click **"Variables"** tab
3. Click **"+ New Variable"** button
4. Add each variable **ONE BY ONE** (click "+ New Variable" after each):

### Server Configuration:
```
NODE_ENV = production
```
```
PORT = 3000
```
```
API_VERSION = v1
```

### Frontend URL (Your Vercel URL):
```
FRONTEND_URL = https://the-pet-kitcheng.vercel.app
```

### Database Configuration (Use values from STEP 3):
```
DB_HOST = [paste MYSQLHOST from MySQL service]
```
```
DB_PORT = 3306
```
```
DB_USER = [paste MYSQLUSER from MySQL service]
```
```
DB_PASSWORD = [paste MYSQLPASSWORD from MySQL service]
```
```
DB_NAME = [paste MYSQLDATABASE from MySQL service]
```

### JWT Secret (Generate a new one for production):
```
JWT_SECRET = [generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
```
*Run this command locally and paste the output*

### MyFatoorah (Your payment gateway):
```
MYFATOORAH_API_KEY = [your actual MyFatoorah API key]
```
```
MYFATOORAH_BASE_URL = https://api.myfatoorah.com
```
*(Use https://apitest.myfatoorah.com for testing)*

### Email Configuration:
```
OUTLOOK_EMAIL = no-reply@thepetkitchen.net
```
```
OUTLOOK_PASSWORD = [your actual Outlook password]
```
```
OUTLOOK_NAME = The Pet Kitchen
```
```
ADMIN_EMAIL = admin@thepetkitchen.net
```
*(or your admin email)*

### Optional:
```
HIGH_VALUE_ORDER_THRESHOLD = 50
```
```
TEST_EMAIL = hamadeyee@gmail.com
```

**✅ Checkpoint**: All environment variables are added in Railway

---

## STEP 5: Configure Build Settings

1. Still in your **backend service**, go to **"Settings"** tab
2. Scroll to **"Build Command"**
3. Set it to: `npm install`
4. Scroll to **"Start Command"**
5. Set it to: `npm start`
6. **Root Directory** should already be: `backend` (from STEP 2)
7. Click **"Save"** if you made changes

**✅ Checkpoint**: Build settings are configured

---

## STEP 6: Deploy and Get Backend URL

1. Railway should auto-deploy, but if not:
   - Go to **"Deployments"** tab
   - Click **"Redeploy"** if needed
2. Wait for deployment to complete (check the logs)
3. Once deployed successfully, go to **"Settings"** tab
4. Scroll to **"Networking"** section
5. Click **"Generate Domain"** (if no domain shown)
6. **COPY the domain** - it will look like:
   ```
   https://your-app-name.up.railway.app
   ```
   **THIS IS YOUR BACKEND URL!** Save it somewhere.

**✅ Checkpoint**: You have your Railway backend URL

---

## STEP 7: Run Database Migrations

1. Railway provides a MySQL connection. You can:
   
   **Option A: Use Railway's MySQL Service** (Easiest)
   - Click on your **MySQL service**
   - Go to **"Connect"** tab
   - Railway provides connection details
   - Use a MySQL client (like MySQL Workbench, TablePlus, or command line)
   - Connect using the credentials from STEP 3
   - Run `backend/database/schema.sql` to create tables

   **Option B: Use Railway CLI** (Advanced)
   ```bash
   railway login
   railway link
   railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < backend/database/schema.sql
   ```

   **Option C: Add as Railway Script** (Recommended)
   - Create a one-time script to run migrations
   - We'll add this in the next step

**✅ Checkpoint**: Database tables are created

---

## STEP 8: Create Database Migration Script

1. In your local project, create a file: `backend/scripts/run-migrations.js`

2. Add this content:
```javascript
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Running database migrations...');
    await connection.query(schema);
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigrations();
```

3. Commit and push this file to GitHub
4. In Railway, you can run this script using Railway CLI:
   ```bash
   railway run node backend/scripts/run-migrations.js
   ```

**✅ Checkpoint**: Database is set up with all tables

---

## STEP 9: Test Backend API

1. Your Railway backend should be running at: `https://your-app.up.railway.app`
2. Test it by opening in browser:
   ```
   https://your-app.up.railway.app/api/v1/health
   ```
   (You might need to add a health endpoint, or test with)
   ```
   https://your-app.up.railway.app/api/v1/auth/check
   ```
3. Check Railway **"Logs"** tab for any errors
4. If you see errors, check:
   - Environment variables are correct
   - Database connection is working
   - Port is set correctly (Railway uses PORT environment variable)

**✅ Checkpoint**: Backend API is responding

---

## STEP 10: Connect Vercel Frontend to Railway Backend

1. Go to **Vercel Dashboard**: https://vercel.com
2. Select your **`the-pet-kitchen`** project
3. Go to **"Settings"** → **"Environment Variables"**
4. Click **"+ Add New"**
5. Add this variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-app.up.railway.app` (your Railway URL from STEP 6)
   - **Environment**: Select all (Production, Preview, Development)
6. Click **"Save"**
7. Go to **"Deployments"** tab
8. Click **"..."** on the latest deployment
9. Click **"Redeploy"**
10. Wait for redeployment to complete

**✅ Checkpoint**: Frontend is connected to backend

---

## STEP 11: Update Frontend API Configuration

The frontend should automatically detect the environment variable, but let's verify:

1. Check `js/api.js` - it should use `process.env.NEXT_PUBLIC_API_URL`
2. If not working, we need to update the code (see troubleshooting)

**Alternative**: Update code directly if environment variable doesn't work:

1. Edit `js/api.js`
2. Find the line that says: `return 'http://localhost:8000';`
3. Replace with your Railway URL:
   ```javascript
   return 'https://your-app.up.railway.app';
   ```
4. Commit and push:
   ```bash
   git add js/api.js
   git commit -m "Update API URL to Railway backend"
   git push
   ```
5. Vercel will auto-redeploy

**✅ Checkpoint**: Frontend is using Railway backend URL

---

## STEP 12: Configure CORS on Backend

CORS should already be configured in `backend/server.js`, but verify:

1. Check that `FRONTEND_URL` environment variable in Railway matches your Vercel URL
2. The code already allows `*.vercel.app` domains, so this should work automatically
3. If you get CORS errors, check Railway logs

**✅ Checkpoint**: CORS is configured correctly

---

## STEP 13: Final Testing

1. **Test Frontend**: Open your Vercel site
2. **Open Browser Console** (F12)
3. Look for: `🔗 API Base URL: https://your-railway-url.up.railway.app/api/v1`
4. **Test Features**:
   - Try to sign up / log in
   - Check if API calls are working
   - Look for errors in console

5. **Common Issues**:
   - **"Cannot connect"**: Check Railway URL is correct
   - **CORS errors**: Check FRONTEND_URL in Railway
   - **Database errors**: Check database credentials and migrations
   - **500 errors**: Check Railway logs

**✅ Checkpoint**: Everything is working!

---

## Troubleshooting

### Backend won't start
- Check Railway **Logs** tab for errors
- Verify all environment variables are set
- Check `npm start` works locally

### Database connection errors
- Verify database credentials in Railway
- Check MySQL service is running
- Test connection manually

### Frontend can't connect
- Verify `NEXT_PUBLIC_API_URL` in Vercel
- Check Railway backend URL is correct
- Look for CORS errors in browser console

### CORS errors
- Verify `FRONTEND_URL` in Railway matches Vercel URL
- Check Railway logs for CORS rejections
- Ensure backend/server.js has correct CORS config

---

## Quick Reference

**Railway Backend URL**: `https://your-app.up.railway.app` (get this from Railway after deployment)  
**Vercel Frontend URL**: `https://the-pet-kitcheng.vercel.app` ✅  
**Database**: MySQL service in Railway (credentials in Variables tab)

**Important Environment Variables**:
- Railway: `FRONTEND_URL` = your Vercel URL
- Vercel: `NEXT_PUBLIC_API_URL` = your Railway URL

---

## Success Checklist

- [ ] Railway project created
- [ ] Backend service added with root directory `backend`
- [ ] MySQL database added
- [ ] All environment variables added to Railway
- [ ] Build settings configured
- [ ] Backend deployed and URL obtained
- [ ] Database migrations run
- [ ] Backend API responding
- [ ] Vercel environment variable `NEXT_PUBLIC_API_URL` set
- [ ] Frontend redeployed
- [ ] Connection tested and working

---

Need help? Check Railway logs and Vercel deployment logs for specific errors!

