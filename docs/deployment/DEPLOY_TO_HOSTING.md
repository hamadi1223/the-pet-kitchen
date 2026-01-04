# 🚀 Deploy to Hosting - Quick Guide

## What to Upload

### ✅ UPLOAD THESE FILES:
```
Root Directory (public_html/):
├── index.html
├── meal-plans.html
├── events.html
├── instructions.html
├── robots.txt
├── .htaccess
├── css/
│   ├── styles.css
│   ├── questionnaire-wizard.css
│   └── instructions.css
├── js/
│   ├── app.js
│   ├── security.js
│   ├── emailjs-config.js
│   ├── questionnaire-wizard.js
│   └── instructions.js
└── assets/
    └── images/
        ├── hero/
        ├── icons/
        └── meals/
```

### ❌ DO NOT UPLOAD:
```
✗ docs/ folder (documentation only)
✗ README.md (optional, doesn't affect site)
✗ DEPLOY_TO_HOSTING.md (this file)
```

---

## 📦 File Manager Upload (GoDaddy/cPanel)

1. **Log into your hosting control panel**
2. **Open File Manager**
3. **Navigate to `public_html/`** (or `www/` or `htdocs/`)
4. **Upload all files** (keep folder structure intact)
5. **Done!** Visit your domain

---

## 📂 FTP Upload

1. **Get FTP credentials** from your hosting provider
2. **Open FileZilla** (or any FTP client)
3. **Connect to your server**
4. **Navigate to root folder** (usually `public_html/`)
5. **Drag and drop all files**
6. **Keep folder structure intact**

---

## 🌐 Hosting Platforms

### GoDaddy
- Upload to: `public_html/`
- Enable SSL: cPanel → SSL/TLS Status
- Works perfectly ✅

### Bluehost / Hostinger
- Upload to: `public_html/`
- Free SSL included
- Works perfectly ✅

### Netlify (Free)
1. Create account at netlify.com
2. Drag & drop entire folder
3. Auto-deployed! ✅

### Vercel (Free)
1. Create account at vercel.com
2. Import from folder
3. Auto-deployed! ✅

---

## ⚙️ After Upload

### 1. Enable SSL Certificate (HTTPS)
- Most hosts offer free SSL (Let's Encrypt)
- Enable in your control panel
- Wait 5-10 minutes for activation

### 2. Uncomment HTTPS Redirect
Edit `.htaccess` and uncomment these lines:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### 3. Test Everything
- [ ] Visit your domain
- [ ] Test questionnaire form
- [ ] Verify email delivery
- [ ] Test on mobile
- [ ] Check all pages

---

## 🐛 Troubleshooting

### Site not loading?
- Check files are in correct folder (`public_html/`)
- Wait for DNS propagation (24-48 hours)
- Clear browser cache

### Images not showing?
- Verify `assets/` folder uploaded
- Check folder structure intact
- Check file paths (case-sensitive)

### Forms not working?
- Check EmailJS credentials in `js/emailjs-config.js`
- Verify EmailJS account is active
- Check browser console for errors

---

## ✅ Checklist

- [ ] All files uploaded to root directory
- [ ] Folder structure preserved
- [ ] SSL certificate enabled
- [ ] HTTPS redirect enabled (after SSL)
- [ ] Test on live domain
- [ ] Test forms and submissions
- [ ] Test on mobile devices
- [ ] Verify all images load

---

## 📞 Need Help?

Refer to detailed documentation:
- `docs/project-documentation/QUICK_START.md`
- `docs/project-documentation/DEPLOYMENT_CHECKLIST.md`

---

**Deployment Time**: ~10 minutes  
**Zero code changes needed**  
**Ready to launch!** 🎉

