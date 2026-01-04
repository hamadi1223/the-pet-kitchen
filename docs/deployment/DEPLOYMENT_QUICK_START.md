# Quick Deployment Guide

Fast deployment guide for The Pet Kitchen website.

## ⚡ 5-Minute Setup

### 1. Backend Setup (2 minutes)

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install --production
npm start
```

### 2. Database Setup (1 minute)

```bash
mysql -u root -p
CREATE DATABASE pet_kitchen_db;
exit

mysql -u root -p pet_kitchen_db < database/schema.sql
mysql -u root -p pet_kitchen_db < database/subscriptions_migration.sql
mysql -u root -p pet_kitchen_db < database/meal_plans_migration.sql
```

### 3. Create Admin (30 seconds)

```bash
cd backend
node scripts/create-admin.js
```

### 4. Frontend Upload (1 minute)

Upload these folders/files to your web server:
- All `.html` files
- `css/` folder
- `js/` folder
- `assets/` folder
- `robots.txt`

### 5. Configure Server (30 seconds)

Point your domain to the frontend files and proxy `/api` to `http://localhost:8000`

## ✅ Done!

Your site should now be live. Test:
- Visit your domain
- Try logging in with admin account
- Test the questionnaire
- Test checkout (in test mode)

## 🔧 Common Issues

**Backend not starting?**
- Check `.env` file exists and has correct values
- Check port 8000 is available
- Check database connection

**API not working?**
- Verify backend is running
- Check CORS settings
- Verify `FRONTEND_URL` in `.env`

**Database errors?**
- Ensure migrations ran successfully
- Check database credentials in `.env`

## 📚 Full Guide

For detailed deployment, see `DEPLOYMENT.md`

---

**Need help?** Check the logs:
- Backend: `pm2 logs` or `npm start` output
- Server: Check Nginx/Apache error logs

