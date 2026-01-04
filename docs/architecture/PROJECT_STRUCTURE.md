# The Pet Kitchen - Project Structure

## 📁 Directory Layout

```
The Pet Kitchen Website/
│
├── 📄 Frontend Files (Root)
│   ├── index.html              # Homepage
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── account.html            # User account page
│   ├── admin.html              # Admin dashboard
│   ├── cart.html               # Shopping cart
│   ├── meal-plans.html         # Meal plans page
│   ├── subscriptions.html     # Subscriptions page
│   ├── events.html             # Events page
│   ├── instructions.html       # Instructions page
│   ├── order-confirmation.html # Order confirmation
│   ├── payment-success.html    # Payment success
│   ├── payment-failed.html     # Payment failed
│   └── checkout-success-test.html # Test mode success
│
├── 📁 css/                     # Stylesheets
│   ├── styles.css              # Main styles
│   ├── admin.css               # Admin dashboard styles
│   ├── auth.css                # Auth pages styles
│   ├── account.css             # Account page styles
│   ├── cart.css                # Cart page styles
│   ├── instructions.css        # Instructions styles
│   ├── questionnaire-wizard.css # Questionnaire styles
│   └── subscriptions.css       # Subscriptions styles
│
├── 📁 js/                      # JavaScript files
│   ├── api.js                  # API configuration & helpers
│   ├── navigation.js           # Navigation logic
│   ├── auth.js                 # Authentication logic
│   ├── account.js              # Account page logic
│   ├── admin.js                # Admin dashboard logic
│   ├── cart.js                 # Cart functionality
│   ├── meal-plans.js           # Meal plans page logic
│   ├── subscriptions.js        # Subscriptions logic
│   ├── questionnaire-wizard.js # Questionnaire wizard
│   ├── instructions.js         # Instructions page logic
│   ├── app.js                  # App initialization
│   ├── emailjs-config.js       # EmailJS configuration
│   └── security.js             # Security utilities
│
├── 📁 assets/                   # Static assets
│   └── images/                  # Image files
│       ├── hero/                # Hero images
│       ├── meals/               # Meal plan images
│       ├── events/              # Event images
│       ├── icons/               # Icon files
│       └── logo/                # Logo files
│
├── 📁 backend/                  # Backend API
│   ├── server.js                # Main server file
│   ├── package.json             # Node.js dependencies
│   ├── pm2.config.js            # PM2 configuration
│   ├── start.sh                 # Startup script
│   ├── .env.example             # Environment template
│   │
│   ├── 📁 config/               # Configuration
│   │   └── database.js          # Database configuration
│   │
│   ├── 📁 database/             # Database files
│   │   ├── schema.sql           # Main database schema
│   │   ├── subscriptions_migration.sql
│   │   ├── meal_plans_migration.sql
│   │   ├── create-admin.sql     # Admin user creation
│   │   └── migrations/         # Additional migrations
│   │
│   ├── 📁 middleware/           # Express middleware
│   │   └── auth.js              # Authentication middleware
│   │
│   ├── 📁 routes/               # API routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── pets.js              # Pet management routes
│   │   ├── cart.js              # Cart routes
│   │   ├── orders.js            # Order routes
│   │   ├── checkout.js          # Checkout routes
│   │   ├── account.js           # Account routes
│   │   ├── admin.js             # Admin routes
│   │   └── subscriptions.js    # Subscription routes
│   │
│   ├── 📁 services/             # External services
│   │   ├── email.js             # Email service (EmailJS)
│   │   └── myfatoorah.js        # Payment gateway
│   │
│   ├── 📁 scripts/              # Utility scripts
│   │   └── create-admin.js      # Admin user creation script
│   │
│   └── 📁 logs/                 # Log files (gitignored)
│       └── .gitkeep
│
├── 📁 docs/                     # Documentation
│   ├── architecture/           # Architecture docs
│   ├── features/               # Feature documentation
│   ├── fixes/                  # Bug fix documentation
│   ├── security/               # Security documentation
│   ├── ui-ux/                  # UI/UX documentation
│   └── ORDER_STATUS_FLOW.md    # Order status documentation
│
├── 📄 Configuration Files
│   ├── .gitignore              # Git ignore rules
│   ├── robots.txt              # SEO robots file
│   ├── README.md               # Main readme
│   ├── README-DEPLOYMENT.md    # Quick deployment guide
│   ├── DEPLOYMENT.md           # Full deployment guide
│   ├── DEPLOYMENT_CHECKLIST.md # Deployment checklist
│   └── PROJECT_STRUCTURE.md    # This file
│
└── 📄 Documentation Files
    ├── SUBSCRIPTION_FEATURES.md
    ├── TEST_MODE_GUIDE.md
    └── WEEKLY_UPDATE_LOG.md
```

## 🔑 Key Files

### Frontend Entry Points
- `index.html` - Main homepage
- `admin.html` - Admin dashboard
- `account.html` - User account page

### Backend Entry Point
- `backend/server.js` - Express server

### Configuration
- `backend/.env` - Environment variables (not in repo)
- `backend/.env.example` - Environment template
- `js/api.js` - API configuration

### Database
- `backend/database/schema.sql` - Main schema
- `backend/database/*_migration.sql` - Migration files

## 🚀 Deployment Files

### Production Scripts
- `backend/start.sh` - Production startup script
- `backend/pm2.config.js` - PM2 process manager config

### Documentation
- `DEPLOYMENT.md` - Complete deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `README-DEPLOYMENT.md` - Quick start guide

## 📝 Notes

- All sensitive files (`.env`) are gitignored
- Logs are stored in `backend/logs/` (gitignored)
- Static assets are in `assets/`
- Frontend and backend are in the same repo for simplicity
- API routes are prefixed with `/api`

