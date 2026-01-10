# Quick Configuration Reference

## Your URLs

✅ **Vercel Frontend**: `https://the-pet-kitcheng.vercel.app`  
⏳ **Railway Backend**: `https://your-app.up.railway.app` (get from Railway after deployment)

## Railway Environment Variables Checklist

When setting up Railway backend, make sure to add:

```env
FRONTEND_URL=https://the-pet-kitcheng.vercel.app
```

This is **critical** for CORS to work correctly!

## Vercel Environment Variable

After you get your Railway backend URL, add to Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-railway-url.up.railway.app
   Environment: Production, Preview, Development (select all)
   ```
3. Redeploy your Vercel site

## Quick Test

Once both are configured:

1. Open: `https://the-pet-kitcheng.vercel.app`
2. Open browser console (F12)
3. You should see: `🔗 API Base URL: https://your-railway-url.up.railway.app/api/v1`
4. If you see errors, check:
   - Railway backend is running (check Railway logs)
   - `FRONTEND_URL` in Railway matches your Vercel URL
   - `NEXT_PUBLIC_API_URL` in Vercel matches your Railway URL
   - CORS is configured correctly

## Connection Flow

```
User Browser
    ↓
https://the-pet-kitcheng.vercel.app (Vercel Frontend)
    ↓
API Calls via NEXT_PUBLIC_API_URL
    ↓
https://your-railway-url.up.railway.app/api/v1 (Railway Backend)
    ↓
MySQL Database (Railway)
```

