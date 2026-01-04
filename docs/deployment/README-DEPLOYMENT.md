# The Pet Kitchen - Quick Deployment Guide

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your production values
npm install --production
npm start
```

### 2. Database Setup
```sql
-- Run migrations in order:
source database/schema.sql
source database/subscriptions_migration.sql
source database/meal_plans_migration.sql
```

### 3. Create Admin User
```bash
cd backend
node scripts/create-admin.js
```

### 4. Production with PM2
```bash
cd backend
npm install -g pm2
pm2 start pm2.config.js
pm2 save
pm2 startup
```

## 📁 Project Structure

```
The Pet Kitchen Website/
├── backend/                 # Node.js backend API
│   ├── config/              # Configuration files
│   ├── database/            # Database migrations
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── services/            # External services
│   ├── scripts/             # Utility scripts
│   ├── server.js            # Main server file
│   ├── package.json         # Dependencies
│   ├── .env.example         # Environment template
│   └── pm2.config.js        # PM2 configuration
├── css/                     # Stylesheets
├── js/                      # Frontend JavaScript
├── assets/                  # Images and static assets
├── *.html                   # Frontend pages
├── .gitignore               # Git ignore rules
└── DEPLOYMENT.md            # Full deployment guide
```

## 🔐 Environment Variables

Required variables (see `backend/.env.example`):
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment (production/development)
- `FRONTEND_URL` - Frontend domain
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database config
- `JWT_SECRET` - JWT signing secret
- `MYFATOORAH_API_KEY` - Payment gateway key
- `TEST_DISABLE_MYFATOORAH` - Test mode (false for production)

## 📝 Important Notes

1. **Never commit `.env` files** - They contain sensitive data
2. **Use HTTPS in production** - Required for secure payments
3. **Change default admin credentials** - Security best practice
4. **Backup database regularly** - Protect customer data
5. **Monitor server logs** - Use PM2 or similar

## 🔗 Documentation

- Full deployment guide: `DEPLOYMENT.md`
- API documentation: `docs/`
- Database schema: `backend/database/schema.sql`

