# The Pet Kitchen - Premium Pet Food Delivery Platform

**Website for The Pet Kitchen Kuwait**  
Fresh, premium pet food delivered to your door. Real ingredients, real nutrition for your pets.

---

## 🚀 Quick Start

### For Development

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev

# Frontend
# Open index.html in browser or use a local server
```

### For Production

See `docs/deployment/DEPLOYMENT_QUICK_START.md` for a 5-minute setup guide, or `docs/deployment/DEPLOYMENT.md` for complete instructions.

---

## 📁 Project Structure

For complete structure documentation, see **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**

### Quick Overview

```
The Pet Kitchen Website/
├── 📄 HTML Files (Root)     # Public web pages
├── 🎨 css/                   # Stylesheets
├── ⚙️ js/                    # JavaScript modules
├── 📦 assets/                # Images and static files
├── 🔧 backend/               # Node.js/Express API
├── 📚 docs/                  # Documentation (organized by category)
│   ├── architecture/        # System architecture
│   ├── features/            # Feature documentation
│   ├── fixes/               # Bug fixes
│   ├── ui-ux/               # Design documentation
│   ├── security/             # Security docs
│   ├── integrations/        # Integration guides
│   ├── deployment/          # Deployment guides
│   ├── testing/             # Testing documentation
│   └── changelog/           # Change logs
└── 🚀 deployment/           # Deployment configs
    ├── nginx.conf           # Nginx configuration
    ├── apache.conf          # Apache configuration
│   ├── backup.sh           # Backup script
│   └── deploy.sh            # Deployment script
│
├── docs/                   # Documentation
│
├── *.html                  # Frontend pages
├── robots.txt              # SEO configuration
│
├── DEPLOYMENT.md           # Complete deployment guide
├── DEPLOYMENT_QUICK_START.md  # Quick deployment guide
├── DEPLOYMENT_CHECKLIST.md    # Deployment checklist
└── README.md               # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with modern features
- **Vanilla JavaScript** - No framework dependencies
- **EmailJS** - Email notifications

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **MyFatoorah** - Payment gateway

---

## 📋 Features

- ✅ User authentication (signup/login)
- ✅ Pet questionnaire and recommendations
- ✅ Shopping cart
- ✅ Checkout and payment integration
- ✅ Order management
- ✅ Subscription management
- ✅ Admin dashboard
- ✅ Product/meal plan management
- ✅ Responsive design (mobile-first)
- ✅ SEO optimized

---

## 🔧 Configuration

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

- **Server**: `PORT`, `NODE_ENV`, `FRONTEND_URL`
- **Database**: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Security**: `JWT_SECRET`
- **Payment**: `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`
- **Testing**: `TEST_DISABLE_MYFATOORAH`

See `backend/.env.example` for all options.

---

## 📚 Documentation

- **`DEPLOYMENT.md`** - Complete deployment guide
- **`DEPLOYMENT_QUICK_START.md`** - Quick 5-minute setup
- **`DEPLOYMENT_CHECKLIST.md`** - Pre-deployment checklist
- **`backend/README.md`** - Backend API documentation
- **`docs/`** - Additional documentation

---

## 🚀 Deployment

### Quick Deploy (5 minutes)

1. Set up backend (see `DEPLOYMENT_QUICK_START.md`)
2. Upload frontend files to web server
3. Configure reverse proxy
4. Done!

### Full Deploy

See `DEPLOYMENT.md` for detailed instructions including:
- Database setup
- Server configuration (Nginx/Apache)
- SSL setup
- PM2 configuration
- Monitoring and backups

---

## 🧪 Testing

### Test Mode

Set `TEST_DISABLE_MYFATOORAH=true` in `backend/.env` to test checkout without real payments.

See `backend/TEST_MODE_README.md` for details.

---

## 🔒 Security

- JWT-based authentication
- Password hashing (bcrypt)
- Input validation
- CORS configuration
- SQL injection protection
- XSS protection
- HTTPS enforcement

---

## 📞 Support

For deployment help:
1. Check `DEPLOYMENT_QUICK_START.md` for quick setup
2. See `DEPLOYMENT.md` for detailed guide
3. Review `DEPLOYMENT_CHECKLIST.md` for checklist

For development:
- See `backend/README.md` for API documentation
- Check `docs/` folder for feature documentation

---

## 📝 License

Proprietary - The Pet Kitchen Kuwait

---

## 🔗 Links

- **Website**: [Coming Soon]
- **Instagram**: [@thepetkitchen.kw](https://www.instagram.com/thepetkitchen.kw/)

---

**Built with ❤️ for Kuwait's finest pets**  
**The Pet Kitchen - Nourishing Pets, Nurturing Bonds**

---

**Version**: 1.0 Production Ready  
**Last Updated**: 2025
