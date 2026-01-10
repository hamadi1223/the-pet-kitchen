# Quick Fix: Connect Vercel Frontend to Backend

## Current Situation
✅ Frontend is deployed on Vercel  
❌ Backend API is not deployed yet  
❌ Frontend can't connect to backend

## Solution: Deploy Backend to Railway

### Step 1: Deploy Backend (5 minutes)

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `the-pet-kitchen` repository
5. **Important**: Set Root Directory to `backend`
6. Railway will auto-detect Node.js
7. Add environment variables (see below)
8. Railway will give you a URL like: `https://your-app.railway.app`

### Step 2: Add Environment Variables in Railway

In Railway project → Variables tab:

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://the-pet-kitcheng.vercel.app
```

# Database (add MySQL service first, then copy credentials)
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=railway

# JWT
JWT_SECRET=your-secure-random-secret-key-here-min-32-chars

# MyFatoorah
MYFATOORAH_API_KEY=your-key
MYFATOORAH_BASE_URL=https://api.myfatoorah.com

# Email
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=your-password
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=admin@thepetkitchen.net

# API
API_VERSION=v1
```

### Step 3: Add MySQL Database in Railway

1. In Railway project, click "+ New"
2. Select "Database" → "Add MySQL"
3. Railway creates database automatically
4. Copy connection details to environment variables

### Step 4: Run Database Migrations

1. Connect to Railway MySQL (use Railway's MySQL service or MySQL client)
2. Run `backend/database/schema.sql` to create tables

### Step 5: Update Frontend API URL

Once Railway gives you a backend URL (e.g., `https://your-backend.railway.app`):

**Option A: Via Vercel Environment Variables (Recommended)**

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```
3. Redeploy (Vercel will auto-redeploy)

**Option B: Update Code Directly**

Update `js/api.js` line 17:
```javascript
return 'https://your-backend.railway.app'; // Your Railway URL
```

Then commit and push:
```bash
git add js/api.js
git commit -m "Update API URL to Railway backend"
git push
```

### Step 6: Verify Connection

1. Open your Vercel site
2. Open browser console (F12)
3. Check for: `🔗 API Base URL: https://your-backend.railway.app/api/v1`
4. Try logging in or using the site
5. Check for CORS errors in console

## Quick Checklist

- [ ] Backend deployed to Railway
- [ ] MySQL database added in Railway
- [ ] Environment variables set in Railway
- [ ] Database migrations run
- [ ] Backend URL copied
- [ ] Frontend API URL updated (via Vercel env var or code)
- [ ] CORS configured (already done in code)
- [ ] Test connection

## Troubleshooting

**"Cannot connect to server" error?**
- Check Railway backend is running (view logs)
- Verify API URL is correct
- Check browser console for exact error

**CORS errors?**
- Backend CORS is already configured for Vercel domains
- Make sure `FRONTEND_URL` in Railway matches your Vercel URL

**Database errors?**
- Verify MySQL credentials in Railway
- Check database migrations ran successfully
- View Railway logs for database connection errors

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs

