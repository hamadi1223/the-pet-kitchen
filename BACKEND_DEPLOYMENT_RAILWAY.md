# Deploy Backend to Railway (Quick Guide)

## Why Railway?
- ✅ Free tier available
- ✅ Easy Node.js deployment
- ✅ Built-in MySQL database option
- ✅ Automatic HTTPS
- ✅ Environment variables management

## Step 1: Deploy Backend to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `the-pet-kitchen` repository
   - Select the `backend` folder as the root

3. **Configure Build**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Railway will auto-detect Node.js

4. **Add Environment Variables**:
   Click "Variables" tab and add:
   ```
   NODE_ENV=production
   PORT=3000
   
   # Database (we'll add MySQL next)
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   
   # JWT
   JWT_SECRET=your-secure-random-secret-key-min-32-chars
   
   # MyFatoorah
   MYFATOORAH_API_KEY=your-production-api-key
   MYFATOORAH_BASE_URL=https://api.myfatoorah.com
   
   # Email
   OUTLOOK_EMAIL=no-reply@thepetkitchen.net
   OUTLOOK_PASSWORD=your-outlook-password
   OUTLOOK_NAME=The Pet Kitchen
   ADMIN_EMAIL=admin@thepetkitchen.net
   
   # Frontend URL (your Vercel URL)
   FRONTEND_URL=https://the-pet-kitcheng.vercel.app
   
   # API
   API_VERSION=v1
   ```

5. **Add MySQL Database**:
   - In Railway project, click "+ New"
   - Select "Database" → "Add MySQL"
   - Railway will create a MySQL database
   - Copy the connection details and update your environment variables:
     - `DB_HOST` = provided host
     - `DB_USER` = provided user
     - `DB_PASSWORD` = provided password
     - `DB_NAME` = provided database name

6. **Run Database Migrations**:
   - Railway provides a MySQL connection
   - Use Railway's MySQL service or connect via MySQL client
   - Run your `backend/database/schema.sql` to create tables

7. **Deploy**:
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

## Step 2: Update Frontend API URL

Once Railway gives you a backend URL (e.g., `https://your-backend.railway.app`):

1. Update `js/api.js` to use the Railway URL
2. Or set it via Vercel environment variables

## Step 3: Update Vercel Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

Add:
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

Then update `js/api.js` to read from this variable.

## Alternative: Quick Fix - Update API URL Directly

Update `js/api.js` line 17 to:
```javascript
return 'https://your-backend.railway.app'; // Replace with your Railway URL
```

Then commit and push to GitHub. Vercel will auto-deploy.

## Step 4: Configure CORS

Make sure your backend `server.js` allows requests from Vercel:

```javascript
app.use(cors({
  origin: [
    'https://the-pet-kitcheng.vercel.app',
    'https://the-pet-kitchen.vercel.app',
    // Add your Vercel domains
  ]
}));
```

## Quick Checklist

- [ ] Backend deployed to Railway
- [ ] Database created and migrations run
- [ ] Environment variables set in Railway
- [ ] Backend URL copied from Railway
- [ ] Frontend API URL updated
- [ ] CORS configured on backend
- [ ] Test API connection

## Troubleshooting

**Backend not starting?**
- Check Railway logs
- Verify `package.json` has correct `start` script
- Check environment variables are set

**Database connection errors?**
- Verify database credentials in Railway
- Check database is running
- Test connection from Railway's MySQL service

**CORS errors?**
- Add Vercel domain to CORS whitelist
- Check backend logs for CORS errors

