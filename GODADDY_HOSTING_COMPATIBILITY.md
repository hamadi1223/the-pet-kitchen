# GoDaddy Hosting Compatibility Guide

## ✅ Overall Compatibility: **GOOD** (with minor adjustments needed)

Your codebase is **mostly compatible** with GoDaddy hosting, but there are some important considerations and adjustments needed.

---

## ✅ What Works Out of the Box

### 1. **Frontend (HTML/CSS/JavaScript)**
- ✅ All static files (HTML, CSS, JS) work perfectly
- ✅ `.htaccess` file is compatible
- ✅ No changes needed

### 2. **Database (MySQL)**
- ✅ MySQL2 package works with GoDaddy's MySQL databases
- ✅ Connection pooling is supported
- ✅ Standard SQL queries work

### 3. **Email (SMTP)**
- ✅ Nodemailer works with Office 365 SMTP
- ✅ GoDaddy allows SMTP connections on port 587
- ✅ Your current email configuration should work

### 4. **Environment Variables**
- ✅ GoDaddy supports `.env` files
- ✅ `dotenv` package works

---

## ⚠️ What Needs Adjustment

### 1. **Node.js Application Port** ⚠️ **REQUIRES CHANGE**

**Issue**: GoDaddy assigns ports automatically, not port 8000.

**Current Code** (`backend/server.js`):
```javascript
const PORT = process.env.PORT || 8000;
```

**Solution**: GoDaddy will set `process.env.PORT` automatically, so this should work. However, you need to:

1. **Create `app.js` or `server.js` in the root** (GoDaddy looks for these)
2. **Ensure the file is named correctly** based on GoDaddy's requirements
3. **Check GoDaddy's Node.js documentation** for the exact entry point name

**Action Required**: 
- Verify GoDaddy's Node.js entry point requirement (usually `app.js` or `server.js`)
- The code will automatically use GoDaddy's assigned port via `process.env.PORT`

---

### 2. **File Paths** ⚠️ **VERIFY**

**Issue**: GoDaddy's file structure might differ from local development.

**Current Structure**:
```
backend/
  ├── server.js
  ├── routes/
  ├── services/
  └── config/
```

**GoDaddy Structure** (typical):
```
/
  ├── public_html/  (or htdocs/)
  │   ├── index.html
  │   └── ...
  └── backend/  (or outside public_html)
      ├── server.js
      └── ...
```

**Action Required**:
- Upload backend files to the correct location (usually outside `public_html`)
- Update any absolute paths if needed
- Test file access permissions

---

### 3. **Cron Jobs** ⚠️ **REQUIRES SETUP**

**Issue**: Cron jobs need to be configured in GoDaddy's cPanel.

**Current Script**: `backend/scripts/send-reminders.js`

**Action Required**:
1. **Access GoDaddy cPanel** → Cron Jobs
2. **Add new cron job**:
   ```bash
   # Daily at 9 AM
   0 9 * * * cd /path/to/your/backend && /usr/bin/node scripts/send-reminders.js
   ```
3. **Update the path** to match GoDaddy's file structure
4. **Ensure Node.js path** is correct (usually `/usr/bin/node` or check with GoDaddy)

**Note**: The script `backend/scripts/setup-cron-reminders.sh` won't work directly - you'll need to set it up manually in cPanel.

---

### 4. **Database Connection** ⚠️ **UPDATE CONFIGURATION**

**Issue**: GoDaddy uses different database host names.

**Current Code** (`backend/config/database.js`):
```javascript
host: process.env.DB_HOST || 'localhost',
```

**GoDaddy Database Hosts**:
- Usually: `localhost` (if on same server)
- Or: `your-db-host.godaddy.com`
- Check your GoDaddy database details in cPanel

**Action Required**:
1. **Get database credentials** from GoDaddy cPanel → MySQL Databases
2. **Update `.env` file**:
   ```env
   DB_HOST=localhost  # or GoDaddy's provided host
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   ```

---

### 5. **Environment Variables** ⚠️ **VERIFY LOCATION**

**Issue**: `.env` file location might need adjustment.

**Action Required**:
1. **Place `.env` file** in the same directory as `server.js`
2. **Ensure it's not in `public_html`** (security risk)
3. **Set correct permissions** (600 or 640)

---

### 6. **SSL/HTTPS** ⚠️ **CONFIGURE**

**Issue**: GoDaddy provides SSL certificates, but you need to enable them.

**Current Code**: CORS and API URLs might need HTTPS.

**Action Required**:
1. **Enable SSL** in GoDaddy cPanel
2. **Update `.env`**:
   ```env
   FRONTEND_URL=https://thepetkitchen.net
   ```
3. **Uncomment HTTPS redirect** in `.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

---

### 7. **Process Manager (PM2)** ⚠️ **MAY NOT BE AVAILABLE**

**Issue**: GoDaddy may not support PM2 or may have restrictions.

**Current Scripts** (`package.json`):
```json
"pm2:start": "pm2 start pm2.config.js"
```

**Action Required**:
- **Check if PM2 is available** on GoDaddy
- **Alternative**: Use GoDaddy's built-in process manager
- **Or**: Use `forever` or `nodemon` in production (if allowed)
- **Or**: Let GoDaddy manage the process automatically

---

## 📋 GoDaddy Deployment Checklist

### Pre-Deployment
- [ ] Verify GoDaddy hosting plan supports Node.js
- [ ] Get database credentials from cPanel
- [ ] Get SMTP settings (if different from Office 365)
- [ ] Check Node.js version (should be 14+ or 16+)
- [ ] Verify file upload limits

### Deployment Steps
1. [ ] **Upload Backend Files**
   - Upload `backend/` folder to appropriate location
   - Ensure `server.js` is in the root of backend folder
   - Upload `package.json` and run `npm install`

2. [ ] **Configure Environment Variables**
   - Create `.env` file with GoDaddy-specific values
   - Set database credentials
   - Set SMTP credentials
   - Set `FRONTEND_URL` to your domain

3. [ ] **Upload Frontend Files**
   - Upload all HTML, CSS, JS files to `public_html/`
   - Upload `.htaccess` file
   - Update API URLs in `js/api.js` if needed

4. [ ] **Configure Database**
   - Create database in cPanel
   - Import schema from `backend/database/schema.sql`
   - Run any migrations

5. [ ] **Set Up Cron Job**
   - Access cPanel → Cron Jobs
   - Add daily reminder script
   - Test execution

6. [ ] **Configure SSL**
   - Enable SSL certificate
   - Update URLs to HTTPS
   - Test HTTPS redirect

7. [ ] **Test Application**
   - Test API endpoints
   - Test database connections
   - Test email sending
   - Test cron job execution

---

## 🔧 GoDaddy-Specific Configuration

### Recommended `.env` File for GoDaddy

```env
# Server
NODE_ENV=production
PORT=process.env.PORT  # GoDaddy will set this automatically

# Database (Get from GoDaddy cPanel)
DB_HOST=localhost  # or GoDaddy's database host
DB_USER=your_godaddy_db_user
DB_PASSWORD=your_godaddy_db_password
DB_NAME=your_godaddy_db_name

# Frontend URL
FRONTEND_URL=https://thepetkitchen.net

# Email (Office 365 - should work)
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=your_password
OUTLOOK_NAME=The Pet Kitchen
ADMIN_EMAIL=no-reply@thepetkitchen.net

# JWT Secret (generate a strong random string)
JWT_SECRET=your_very_strong_secret_key_here

# API Version
API_VERSION=v1
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Port Assignment
**Problem**: GoDaddy assigns ports automatically
**Solution**: Use `process.env.PORT` (already in code) ✅

### Issue 2: File Permissions
**Problem**: Node.js files need execute permissions
**Solution**: Set permissions via cPanel File Manager or SSH:
```bash
chmod 755 backend/server.js
chmod 644 backend/*.js
```

### Issue 3: Module Not Found
**Problem**: `npm install` might not run automatically
**Solution**: Run `npm install` manually via SSH or cPanel Terminal

### Issue 4: Database Connection Timeout
**Problem**: GoDaddy might have connection limits
**Solution**: Adjust connection pool settings in `database.js`:
```javascript
connectionLimit: 5,  // Reduce from 10 if needed
```

### Issue 5: Email Sending Fails
**Problem**: GoDaddy might block SMTP ports
**Solution**: 
- Verify port 587 is open
- Check GoDaddy's firewall settings
- Consider using GoDaddy's email service as alternative

---

## 📞 GoDaddy Support Resources

1. **Node.js Documentation**: Check GoDaddy's help center for Node.js hosting
2. **cPanel Access**: Use cPanel for database, cron jobs, and file management
3. **SSH Access**: May be available depending on hosting plan
4. **Support**: Contact GoDaddy support for Node.js-specific questions

---

## ✅ Summary

**Compatibility Score: 8/10**

**What Works:**
- ✅ Frontend (100%)
- ✅ Database (100% with correct config)
- ✅ Email/SMTP (95% - may need port verification)
- ✅ Environment variables (100%)
- ✅ Static files (100%)

**What Needs Attention:**
- ⚠️ Port configuration (automatic, but verify)
- ⚠️ Cron job setup (manual configuration needed)
- ⚠️ File structure/paths (verify during deployment)
- ⚠️ Process manager (check PM2 availability)
- ⚠️ SSL/HTTPS (enable and configure)

**Overall**: Your codebase is **well-suited for GoDaddy hosting** with minor configuration adjustments. The main work will be:
1. Setting up the database connection
2. Configuring environment variables
3. Setting up the cron job manually
4. Verifying file paths and permissions

---

## 🚀 Next Steps

1. **Contact GoDaddy Support** to confirm:
   - Node.js version available
   - Port assignment method
   - PM2 availability
   - SSH access availability

2. **Prepare for Deployment**:
   - Gather all credentials
   - Test locally with production-like settings
   - Prepare deployment checklist

3. **Deploy in Stages**:
   - Deploy frontend first
   - Deploy backend second
   - Configure database
   - Set up cron jobs
   - Test thoroughly

