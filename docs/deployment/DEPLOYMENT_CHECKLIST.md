# The Pet Kitchen - Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## ✅ Pre-Deployment

### Environment Setup
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=8000` (or your preferred port)
- [ ] Set `FRONTEND_URL=https://thepetkitchen.net` (your actual domain)
- [ ] Set `TEST_DISABLE_MYFATOORAH=false`

### Database Configuration
- [ ] Set `DB_HOST` (production database host)
- [ ] Set `DB_USER` (production database user)
- [ ] Set `DB_PASSWORD` (strong password)
- [ ] Set `DB_NAME` (production database name)
- [ ] Set `DB_PORT=3306` (or your MySQL port)

### Security
- [ ] Generate strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- [ ] Set production `MYFATOORAH_API_KEY`
- [ ] Set `MYFATOORAH_BASE_URL=https://api.myfatoorah.com`
- [ ] Review CORS settings in `backend/server.js`
- [ ] Remove any test/debug code

### Database Setup
- [ ] Create production database
- [ ] Run `backend/database/schema.sql`
- [ ] Run `backend/database/subscriptions_migration.sql`
- [ ] Run `backend/database/meal_plans_migration.sql`
- [ ] Create admin user: `node backend/scripts/create-admin.js`
- [ ] Change default admin password

## 🚀 Deployment

### Backend
- [ ] Install dependencies: `cd backend && npm install --production`
- [ ] Test server starts: `npm start`
- [ ] Verify API health: `curl http://localhost:8000/api/health`
- [ ] Set up PM2: `npm run pm2:start`
- [ ] Configure PM2 to start on boot: `pm2 startup && pm2 save`

### Frontend
- [ ] Verify all HTML files are in root directory
- [ ] Check all image paths are correct
- [ ] Test all navigation links
- [ ] Verify API calls work (check browser console)
- [ ] Test on mobile devices

### Server Configuration
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up SSL certificate (HTTPS)
- [ ] Configure firewall rules
- [ ] Set up domain DNS
- [ ] Test domain accessibility

## 🧪 Testing

### Functional Tests
- [ ] User registration
- [ ] User login
- [ ] Pet questionnaire
- [ ] Add to cart
- [ ] Checkout process
- [ ] Payment flow (test mode first)
- [ ] Order confirmation
- [ ] Admin dashboard access
- [ ] Admin product management
- [ ] Admin order management
- [ ] Admin subscription management
- [ ] Admin meal plans management

### Security Tests
- [ ] Test authentication
- [ ] Test authorization (admin vs user)
- [ ] Test CORS restrictions
- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Verify HTTPS is enforced

## 📊 Post-Deployment

### Monitoring
- [ ] Set up error logging
- [ ] Configure uptime monitoring
- [ ] Set up database backups
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Set up alerts for critical errors

### Documentation
- [ ] Document production URLs
- [ ] Document admin credentials (securely)
- [ ] Document database credentials (securely)
- [ ] Document API endpoints
- [ ] Create runbook for common issues

### Backup Strategy
- [ ] Set up automated database backups
- [ ] Test backup restoration
- [ ] Document backup schedule
- [ ] Store backups securely

## 🔄 Maintenance

### Regular Tasks
- [ ] Monitor server logs weekly
- [ ] Review error logs
- [ ] Check database size
- [ ] Review security updates
- [ ] Update dependencies (test first)
- [ ] Review and rotate secrets

### Updates
- [ ] Test updates in staging first
- [ ] Backup before updates
- [ ] Document changes
- [ ] Monitor after updates

## 📝 Notes

- Keep `.env` file secure and never commit it
- Use strong passwords for all accounts
- Enable 2FA where possible
- Regular security audits
- Keep dependencies updated
- Monitor for vulnerabilities

