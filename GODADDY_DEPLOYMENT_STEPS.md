# GoDaddy Deployment Steps - Action Plan

Based on your cPanel, here's exactly what to do:

## 🎯 Your Current Setup
- **Primary Domain**: thepetkitchen.net
- **Home Directory**: `/home/mp5dwi7ywpch`
- **cPanel Access**: ✅ Available

---

## 📋 Step-by-Step Deployment

### **STEP 1: Set Up Database** (Do This First)

1. **Click "MySQL® Databases"** in the Databases section
2. **Create a new database**:
   - Database name: `petkitchen` (or similar)
   - Click "Create Database"
   - Note the full database name (usually `mp5dwi7ywpch_petkitchen`)
3. **Create a database user**:
   - Username: `petkitchen_user` (or similar)
   - Password: Generate a strong password
   - Click "Create User"
4. **Add user to database**:
   - Select the user and database
   - Click "Add"
   - Grant **ALL PRIVILEGES**
   - Click "Make Changes"
5. **Import database schema**:
   - Click "phpMyAdmin" in Databases section
   - Select your database
   - Click "Import" tab
   - Upload `backend/database/schema.sql`
   - Click "Go"

**✅ Note down these credentials:**
- Database Host: `localhost` (usually)
- Database Name: `mp5dwi7ywpch_petkitchen` (or similar)
- Database User: `mp5dwi7ywpch_petkitchen_user` (or similar)
- Database Password: (the one you created)

---

### **STEP 2: Upload Files**

1. **Click "File Manager"** in the Files section
2. **Navigate to your home directory** (`/home/mp5dwi7ywpch`)
3. **Create folder structure**:
   ```
   /home/mp5dwi7ywpch/
   ├── public_html/          (for frontend files)
   └── backend/              (for Node.js backend)
   ```

4. **Upload Frontend Files**:
   - Go into `public_html/` folder
   - Upload ALL files from your project root:
     - All `.html` files (index.html, meal-plans.html, etc.)
     - `css/` folder
     - `js/` folder
     - `assets/` folder
     - `.htaccess` file
     - `robots.txt`

5. **Upload Backend Files**:
   - Go back to home directory
   - Create `backend/` folder (if it doesn't exist)
   - Upload entire `backend/` folder from your project:
     - `server.js`
     - `package.json`
     - `routes/` folder
     - `services/` folder
     - `config/` folder
     - `middleware/` folder
     - `database/` folder
     - `scripts/` folder

---

### **STEP 3: Configure Environment Variables**

1. **In File Manager**, navigate to `backend/` folder
2. **Create `.env` file** (click "New File" → name it `.env`)
3. **Add this content** (your database credentials are already included):

```env
# Server
NODE_ENV=production
PORT=process.env.PORT
API_VERSION=v1

# Database (Your GoDaddy MySQL credentials)
DB_HOST=localhost
DB_USER=petkitchen_user
DB_PASSWORD=BGsF}t%QfPaP
DB_NAME=petkitchen
# ⚠️ IMPORTANT: GoDaddy prefixes database names with your cPanel username
# If your full database name is "mp5dwi7ywpch_petkitchen", update DB_NAME above
# Check this in cPanel → MySQL Databases

# Frontend URL
FRONTEND_URL=https://thepetkitchen.net

# Email (Office 365)
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=m0443Bl7tpC5
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=no-reply@thepetkitchen.net

# JWT Secret (generate a strong random string - minimum 32 characters)
# You can generate one using: openssl rand -base64 32
JWT_SECRET=CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_KEY_MINIMUM_32_CHARACTERS

# MyFatoorah Payment Gateway (if using)
MYFATOORAH_API_KEY=your_myfatoorah_api_key_here
MYFATOORAH_API_URL=https://api.myfatoorah.com
```

**📝 Quick Setup Option:**
- I've created a file `backend/.env.GODADDY` in your project
- You can upload this file to GoDaddy and rename it to `.env`
- Just remember to update `DB_NAME` with the full database name from cPanel

4. **Set file permissions**:
   - Right-click `.env` file
   - Click "Change Permissions"
   - Set to `600` (read/write for owner only)
   - This prevents others from reading your credentials

---

### **STEP 4: Install Node.js Dependencies**

**Option A: Using cPanel Terminal (if available)**
1. Look for "Terminal" or "SSH Access" in cPanel
2. Navigate to backend folder:
   ```bash
   cd ~/backend
   npm install
   ```

**Option B: Using File Manager + Node.js Selector**
1. Look for "Node.js Selector" or "Node.js" in cPanel
2. Create a new Node.js application:
   - Application root: `backend`
   - Application URL: `thepetkitchen.net/api` (or similar)
   - Node.js version: 16.x or 18.x (latest stable)
   - Application mode: Production
3. After creating, it should run `npm install` automatically

**Option C: Manual Upload**
- If npm install doesn't work automatically:
  - Install dependencies locally
  - Upload `node_modules/` folder (this is large, may take time)

---

### **STEP 5: Configure Node.js Application**

1. **Find "Node.js Selector"** or "Node.js" in cPanel
2. **Create/Configure Application**:
   - Application root: `backend`
   - Application startup file: `server.js`
   - Application URL: `thepetkitchen.net` (or subdomain)
   - Node.js version: 16.x or 18.x
   - Application mode: Production
3. **Start the application**

**Important**: GoDaddy will automatically:
- Set `process.env.PORT` (your code already handles this ✅)
- Manage the Node.js process
- Provide the application URL

---

### **STEP 6: Set Up Cron Job for Reminders**

1. **Click "Cron Jobs"** in the Tools section (or search for it)
2. **Add New Cron Job**:
   - **Common Settings**: Select "Once Per Day" or "Custom"
   - **Minute**: `0`
   - **Hour**: `9` (9 AM)
   - **Day**: `*` (every day)
   - **Month**: `*` (every month)
   - **Weekday**: `*` (every weekday)
   - **Command**:
     ```bash
     cd /home/mp5dwi7ywpch/backend && /usr/bin/node scripts/send-reminders.js
     ```
     (Adjust the Node.js path if needed - check with GoDaddy support)

3. **Click "Add New Cron Job"**

---

### **STEP 7: Update Frontend API URLs**

1. **In File Manager**, go to `public_html/js/`
2. **Edit `api.js`** file
3. **Update API_BASE_URL** to point to your backend:
   ```javascript
   // Change from localhost to your domain
   const API_BASE_URL = 'https://thepetkitchen.net/api/v1';
   ```
   Or keep it dynamic (it should auto-detect, but verify)

---

### **STEP 8: Enable SSL/HTTPS**

1. **Look for "SSL/TLS Status"** or "SSL" in cPanel
2. **Enable SSL** for `thepetkitchen.net`
3. **Update `.htaccess`** in `public_html/`:
   - Uncomment the HTTPS redirect section:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

---

### **STEP 9: Test Everything**

1. **Test Frontend**:
   - Visit `https://thepetkitchen.net`
   - Check all pages load
   - Test navigation

2. **Test Backend API**:
   - Visit `https://thepetkitchen.net/api/v1/health` (if you have a health endpoint)
   - Or test login/signup

3. **Test Database**:
   - Try creating an account
   - Check if data saves to database

4. **Test Email**:
   - Try password reset or signup
   - Check if emails send

5. **Test Cron Job**:
   - Manually run the cron job command to test
   - Check logs

---

## 🔍 What to Look For in cPanel

Based on your screenshot, you have access to:

✅ **File Manager** - Upload files
✅ **MySQL Databases** - Set up database
✅ **phpMyAdmin** - Import schema
✅ **Cron Jobs** - Set up reminders (may be in "Advanced" section)
✅ **Node.js Selector** - Configure Node.js app (may be in "Software" section)

**If you don't see Node.js Selector:**
- Contact GoDaddy support to enable Node.js hosting
- Or check if it's in a different section (Software, Advanced, etc.)

---

## ⚠️ Common Issues & Solutions

### Issue: Can't find Node.js Selector
**Solution**: 
- Contact GoDaddy support
- Ask them to enable Node.js hosting for your account
- They may need to upgrade your hosting plan

### Issue: npm install fails
**Solution**:
- Use SSH/Terminal if available
- Or install locally and upload `node_modules/`

### Issue: Database connection fails
**Solution**:
- Verify database host is `localhost`
- Check username format (usually includes cPanel username prefix)
- Verify password is correct
- Check database name format

### Issue: Port errors
**Solution**:
- Your code already uses `process.env.PORT` ✅
- GoDaddy will set this automatically
- No changes needed

---

## 📞 Next Steps

1. **Start with Step 1** (Database setup) - This is the foundation
2. **Then Step 2** (Upload files) - Get your code on the server
3. **Then Step 3** (Environment variables) - Configure the app
4. **Then Step 4-5** (Node.js setup) - Get the backend running
5. **Then Step 6** (Cron job) - Set up automated reminders
6. **Then Step 7-8** (Frontend & SSL) - Complete the setup
7. **Finally Step 9** (Testing) - Verify everything works

---

## 🆘 Need Help?

If you get stuck at any step:
1. Check GoDaddy's documentation for Node.js hosting
2. Contact GoDaddy support (they're usually helpful)
3. Check the error logs in cPanel → "Errors" or "Logs"

---

## ✅ Quick Checklist

- [ ] Database created and schema imported
- [ ] Files uploaded to correct locations
- [ ] `.env` file created with correct credentials
- [ ] Node.js application configured and running
- [ ] Cron job set up for reminders
- [ ] Frontend API URLs updated
- [ ] SSL/HTTPS enabled
- [ ] Everything tested and working

Good luck! 🚀

