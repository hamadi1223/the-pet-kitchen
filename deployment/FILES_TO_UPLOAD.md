# Files to Upload for Production

This document lists exactly which files should be uploaded to your production server.

## ✅ Upload These Files

### Frontend Files (Upload to web root, e.g., `/var/www/thepetkitchen/`)

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
│
├── css/
│   ├── account.css
│   ├── admin.css
│   ├── auth.css
│   ├── cart.css
│   ├── instructions.css
│   ├── questionnaire-wizard.css
│   ├── styles.css
│   └── subscriptions.css
│
├── js/
│   ├── account.js
│   ├── admin.js
│   ├── api.js
│   ├── app.js
│   ├── auth.js
│   ├── cart.js
│   ├── emailjs-config.js
│   ├── instructions.js
│   ├── meal-plans.js
│   ├── navigation.js
│   ├── questionnaire-wizard.js
│   ├── security.js
│   └── subscriptions.js
│
└── assets/
    └── images/
        ├── events/
        ├── hero/
        ├── icons/
        ├── logo/
        └── meals/
```

### Backend Files (Upload to server, e.g., `/opt/pet-kitchen-backend/`)

```
backend/
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── account.js
│   ├── admin.js
│   ├── auth.js
│   ├── cart.js
│   ├── checkout.js
│   ├── orders.js
│   ├── pets.js
│   └── subscriptions.js
├── services/
│   ├── email.js
│   └── myfatoorah.js
├── server.js
├── package.json
└── .env (create from .env.example)
```

**Note**: Do NOT upload `node_modules/`. Run `npm install --production` on the server.

## ❌ Do NOT Upload These

### Development Files
- `docs/` folder (documentation only)
- `deployment/` folder (deployment scripts - keep local)
- `.git/` folder (if using git)
- `*.md` files (except this one if needed)
- `FILE_STRUCTURE.txt`
- `PROJECT_STRUCTURE.md`

### Configuration Files (Keep Local)
- `.env` files (create on server)
- `.gitignore`
- `package-lock.json` (optional, can regenerate)

### Temporary/Test Files
- `checkout-success-test.html` (optional, for testing only)
- `TEST_MODE_GUIDE.md`
- `WEEKLY_UPDATE_LOG.md`
- `SUBSCRIPTION_FEATURES.md`

### Database Files (Run on server, don't upload)
- `backend/database/*.sql` (run migrations on server)
- `backend/scripts/` (run on server if needed)

## 📋 Upload Checklist

### Frontend Upload
- [ ] All HTML files
- [ ] All CSS files
- [ ] All JS files
- [ ] All image assets
- [ ] robots.txt

### Backend Upload
- [ ] Backend source files (routes, services, etc.)
- [ ] package.json
- [ ] Create .env from .env.example
- [ ] Run `npm install --production`
- [ ] Run database migrations
- [ ] Configure PM2 or systemd

### Server Configuration
- [ ] Nginx/Apache config
- [ ] SSL certificates
- [ ] Firewall rules
- [ ] PM2/systemd service

## 🚀 Quick Upload Commands

### Using rsync (Recommended)

```bash
# Frontend
rsync -av --exclude='node_modules' --exclude='.git' \
  --exclude='docs' --exclude='backend' --exclude='deployment' \
  --exclude='*.md' --exclude='.env' \
  /path/to/local/ /var/www/thepetkitchen/

# Backend
rsync -av --exclude='node_modules' --exclude='.git' \
  --exclude='logs' --exclude='*.log' \
  /path/to/local/backend/ /opt/pet-kitchen-backend/
```

### Using SCP

```bash
# Frontend
scp -r css js assets *.html robots.txt user@server:/var/www/thepetkitchen/

# Backend
scp -r backend/* user@server:/opt/pet-kitchen-backend/
```

### Using FTP/SFTP

Upload files manually using FileZilla or similar, following the file list above.

## ⚠️ Important Notes

1. **Never upload `.env` files** - Create them on the server
2. **Never upload `node_modules/`** - Install on server
3. **Set correct permissions** - `chmod -R 755` for frontend, `chmod 600` for .env
4. **Test after upload** - Verify all files are accessible
5. **Backup before upload** - Keep a backup of current production

---

**Last Updated**: 2025

