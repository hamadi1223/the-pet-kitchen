# The Pet Kitchen Website - Project Structure

## 📁 Directory Organization

```
The Pet Kitchen Website/
│
├── 📄 HTML Files (Root - Public Access)
│   ├── index.html                    # Homepage
│   ├── meal-plans.html               # Meal plans page
│   ├── instructions.html             # Feeding instructions
│   ├── subscriptions.html            # Subscription plans
│   ├── events.html                   # Events page
│   ├── cart.html                     # Shopping cart
│   ├── login.html                    # Login page
│   ├── signup.html                   # Registration page
│   ├── account.html                   # User account dashboard
│   ├── admin.html                    # Admin dashboard
│   ├── order-confirmation.html       # Order confirmation
│   ├── payment-success.html          # Payment success
│   ├── payment-failed.html          # Payment failure
│   ├── checkout-success-test.html    # Test checkout
│   └── 404.html                      # Error page
│
├── 🎨 css/                           # Stylesheets
│   ├── styles.css                    # Main site styles
│   ├── questionnaire-wizard.css     # Questionnaire styles
│   ├── instructions.css             # Instructions page
│   ├── subscriptions.css            # Subscriptions page
│   ├── cart.css                     # Cart page
│   ├── account.css                  # Account page
│   ├── admin.css                    # Admin dashboard
│   └── auth.css                     # Login/signup pages
│
├── ⚙️ js/                            # JavaScript Modules
│   ├── security.js                  # Auth & security utilities
│   ├── api.js                       # API client
│   ├── navigation.js                # Navigation logic (centralized)
│   ├── app.js                       # Main application
│   ├── questionnaire-wizard.js      # Questionnaire wizard
│   ├── auth.js                      # Authentication handlers
│   ├── account.js                   # Account page logic
│   ├── admin.js                     # Admin dashboard logic
│   ├── cart.js                      # Cart functionality
│   ├── subscriptions.js             # Subscriptions logic
│   ├── meal-plans.js                # Meal plans page
│   ├── instructions.js              # Instructions page
│   ├── animations.js                # Animation utilities
│   ├── performance.js               # Performance monitoring
│   ├── inline-handlers.js           # Event delegation
│   ├── error-handler.js             # 404 & error handling
│   └── emailjs-config.js           # EmailJS configuration
│
├── 📦 assets/                        # Static Assets
│   └── images/
│       ├── hero/                    # Hero images
│       ├── meals/                   # Meal product images
│       ├── events/                  # Event photos
│       ├── icons/                   # Icon files
│       └── logo/                    # Brand logos
│
├── 🔧 backend/                      # Backend API Server
│   ├── server.js                    # Express server entry point
│   ├── package.json                 # Backend dependencies
│   ├── .env                         # Environment variables
│   │
│   ├── config/
│   │   └── database.js             # Database configuration
│   │
│   ├── routes/                      # API Routes
│   │   ├── auth.js                 # Authentication
│   │   ├── account.js              # User account
│   │   ├── admin.js                # Admin operations
│   │   ├── cart.js                 # Shopping cart
│   │   ├── checkout.js             # Checkout & payments
│   │   ├── orders.js               # Order management
│   │   ├── pets.js                 # Pet management
│   │   └── subscriptions.js       # Subscriptions
│   │
│   ├── services/                    # Business Logic
│   │   ├── email.js                # Email service
│   │   └── myfatoorah.js           # Payment gateway
│   │
│   ├── middleware/
│   │   └── auth.js                 # Authentication middleware
│   │
│   ├── database/                    # Database Files
│   │   ├── schema.sql              # Main schema
│   │   ├── migrations/              # Database migrations
│   │   └── *.sql                   # Additional SQL files
│   │
│   ├── scripts/                     # Utility Scripts
│   │   └── create-admin.js         # Admin user creation
│   │
│   └── logs/                        # Server logs
│
├── 📚 docs/                          # Documentation
│   ├── README.md                    # Documentation index
│   │
│   ├── architecture/                # Architecture Docs
│   │   ├── README.md
│   │   ├── FOLDER_STRUCTURE.md
│   │   └── IMPLEMENTATION_SUMMARY.md
│   │
│   ├── features/                    # Feature Documentation
│   │   ├── README.md
│   │   ├── QUESTIONNAIRE_WIZARD.md
│   │   ├── AUTO_POPUP_QUESTIONNAIRE.md
│   │   ├── SUBSCRIPTION_FEATURES.md
│   │   └── PERFORMANCE_OPTIMIZATIONS.md
│   │
│   ├── fixes/                       # Bug Fixes
│   │   ├── README.md
│   │   ├── ALLERGIES_INPUT_FIX.md
│   │   ├── BREED_SIZE_AUTOLOCK_FIX.md
│   │   ├── CONTENT_SCROLLING_FIX.md
│   │   ├── MOBILE_MENU_GREY_SCREEN_FIX.md
│   │   └── NAVIGATION_FIX.md
│   │
│   ├── ui-ux/                       # UI/UX Documentation
│   │   ├── README.md
│   │   ├── WIZARD_STYLING_UPDATE.md
│   │   ├── HOW_IT_WORKS_RESPONSIVE_FIX.md
│   │   ├── MEAL_PLANS_GRID_LAYOUT.md
│   │   ├── MEAL_PREVIEW_COLORS.md
│   │   ├── FEEDING_GUIDE_REMOVAL.md
│   │   └── MEAL_CATEGORIES_FIX.md
│   │
│   ├── security/                    # Security Docs
│   │   ├── README.md
│   │   └── SECURITY_AUDIT.md
│   │
│   ├── integrations/                # Integration Guides
│   │   ├── MYFATOORAH_SETUP_GUIDE.md
│   │   ├── MYFATOORAH_INTEGRATION_STATUS.md
│   │   └── DEBUG_PAYMENT.md
│   │
│   ├── deployment/                  # Deployment Docs
│   │   ├── DEPLOYMENT.md
│   │   ├── DEPLOYMENT_CHECKLIST.md
│   │   ├── DEPLOYMENT_QUICK_START.md
│   │   ├── README-DEPLOYMENT.md
│   │   └── FILE_STRUCTURE.txt
│   │
│   ├── testing/                     # Testing Documentation
│   │   ├── TESTING_GUIDE.md
│   │   ├── TEST_RESULTS.md
│   │   └── TEST_MODE_GUIDE.md
│   │
│   ├── changelog/                   # Change Logs
│   │   ├── WEEKLY_UPDATE_LOG.md
│   │   ├── AUTH_QUESTIONNAIRE_FIX_SUMMARY.md
│   │   └── SYSTEM_STATUS.md
│   │
│   └── project-documentation/       # Project Docs
│       ├── README.md
│       ├── QUICK_START.md
│       ├── EMAILJS_SETUP.md
│       └── SECURITY_FIXES_APPLIED.md
│
├── 🚀 deployment/                   # Deployment Configs
│   ├── README.md
│   ├── apache.conf                  # Apache configuration
│   ├── nginx.conf                   # Nginx configuration
│   ├── deploy.sh                    # Deployment script
│   ├── backup.sh                    # Backup script
│   └── FILES_TO_UPLOAD.md          # Upload checklist
│
├── 📋 Configuration Files (Root)
│   ├── README.md                    # Main project README
│   ├── robots.txt                   # SEO robots file
│   └── .env.example                 # Environment template (if exists)
│
└── 📝 Other Files (Root)
    └── [Temporary/legacy files to be organized]
```

## 🎯 Organization Principles

### 1. **Separation of Concerns**
- **Frontend**: HTML, CSS, JS in root/css/js
- **Backend**: All server code in `backend/`
- **Documentation**: All docs in `docs/` with categories
- **Assets**: All static files in `assets/`

### 2. **Public vs Private**
- **Public (Root)**: HTML files accessible via web server
- **Private**: Backend code, docs, configs in subdirectories

### 3. **Documentation Categories**
- **Architecture**: System design and structure
- **Features**: Feature documentation
- **Fixes**: Bug fixes and improvements
- **UI/UX**: Design decisions
- **Security**: Security audits
- **Integrations**: Third-party integrations
- **Deployment**: Deployment guides
- **Testing**: Testing documentation
- **Changelog**: Change history

### 4. **Code Organization**
- **Centralized Logic**: Navigation in `navigation.js`, Auth in `security.js`
- **Modular**: Each page has its own JS file
- **Reusable**: Shared utilities in separate modules

## 📝 File Naming Conventions

- **HTML**: kebab-case (e.g., `meal-plans.html`)
- **CSS**: kebab-case (e.g., `questionnaire-wizard.css`)
- **JavaScript**: kebab-case (e.g., `questionnaire-wizard.js`)
- **Documentation**: UPPER_SNAKE_CASE or kebab-case (e.g., `DEPLOYMENT.md`)

## 🔗 Key File References

### Frontend Entry Points
- **Homepage**: `index.html`
- **Main Styles**: `css/styles.css`
- **Main Script**: `js/app.js`
- **API Client**: `js/api.js`

### Backend Entry Points
- **Server**: `backend/server.js`
- **Database Config**: `backend/config/database.js`
- **Main Routes**: `backend/routes/*.js`

### Documentation Entry Points
- **Main README**: `README.md`
- **Docs Index**: `docs/README.md`
- **This File**: `PROJECT_STRUCTURE.md`

## 🚀 Quick Start

1. **Frontend**: Open `index.html` in browser or serve via HTTP server
2. **Backend**: Run `cd backend && npm start`
3. **Documentation**: Start with `README.md` and `docs/README.md`

## 📚 Documentation Navigation

- **New to project?** → `README.md` → `docs/README.md`
- **Setting up?** → `docs/deployment/DEPLOYMENT_QUICK_START.md`
- **Understanding features?** → `docs/features/README.md`
- **Troubleshooting?** → `docs/fixes/README.md`
- **Security concerns?** → `docs/security/README.md`

---

**Last Updated**: December 2, 2025  
**Maintained By**: Development Team

