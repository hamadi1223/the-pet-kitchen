# The Pet Kitchen - Backend API

Node.js/Express backend API for The Pet Kitchen e-commerce platform.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Production

```bash
# Install production dependencies
npm install --production

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Start with PM2
npm run pm2:start

# Or start manually
npm start
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── database/
│   ├── schema.sql           # Main database schema
│   ├── subscriptions_migration.sql
│   ├── meal_plans_migration.sql
│   └── migrations/          # Additional migrations
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── pets.js              # Pet management routes
│   ├── cart.js              # Shopping cart routes
│   ├── orders.js            # Order management routes
│   ├── checkout.js          # Checkout and payment routes
│   ├── admin.js             # Admin dashboard routes
│   ├── account.js           # User account routes
│   └── subscriptions.js     # Subscription management routes
├── services/
│   ├── email.js             # Email service (EmailJS)
│   └── myfatoorah.js        # Payment gateway integration
├── scripts/
│   └── create-admin.js      # Admin user creation script
├── server.js                # Main server file
├── package.json
└── .env                     # Environment variables (not in repo)
```

## 🔧 Configuration

### Environment Variables

See `.env.example` for all required variables:

- **Server**: `PORT`, `NODE_ENV`, `FRONTEND_URL`
- **Database**: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
- **Security**: `JWT_SECRET`
- **Payment**: `MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`
- **Testing**: `TEST_DISABLE_MYFATOORAH`

### Database Setup

1. Create database:
```sql
CREATE DATABASE pet_kitchen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run migrations:
```bash
mysql -u user -p database < database/schema.sql
mysql -u user -p database < database/subscriptions_migration.sql
mysql -u user -p database < database/meal_plans_migration.sql
```

3. Create admin user:
```bash
node scripts/create-admin.js
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Pets
- `GET /api/pets` - Get user's pets
- `POST /api/pets` - Create pet
- `PATCH /api/pets/:id` - Update pet
- `DELETE /api/pets/:id` - Delete pet

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove cart item
- `DELETE /api/cart` - Clear cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/cancel` - Cancel order

### Checkout
- `POST /api/checkout` - Initiate checkout
- `GET /api/checkout/callback` - Payment callback

### Subscriptions
- `GET /api/subscriptions/my-subscriptions` - Get user's subscriptions
- `GET /api/subscriptions/:id` - Get subscription details
- `PATCH /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/renew` - Renew subscription

### Admin
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/users` - Get all users
- `GET /api/admin/products` - Get all products
- `GET /api/admin/subscriptions` - Get all subscriptions
- `GET /api/admin/meal-plans` - Get all meal plans
- `PATCH /api/admin/orders/:id` - Update order status
- `PATCH /api/admin/products/:id` - Update product
- `PATCH /api/admin/pets/:id` - Update pet
- `DELETE /api/admin/pets/:id` - Delete pet

## 🧪 Testing

### Test Mode

Set `TEST_DISABLE_MYFATOORAH=true` in `.env` to disable real payment API calls during testing.

See `TEST_MODE_README.md` for details.

## 📦 Dependencies

- **express** - Web framework
- **mysql2** - MySQL database driver
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **express-validator** - Input validation
- **axios** - HTTP client

## 🚀 Deployment

See main `DEPLOYMENT.md` file for complete deployment guide.

### PM2 Deployment

```bash
npm run pm2:start
pm2 save
pm2 startup
```

## 📝 Logs

- Development: Console output
- Production: PM2 logs (`pm2 logs`)
- File logs: `logs/` directory (if configured)

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with express-validator
- CORS configuration
- SQL injection protection (parameterized queries)
- XSS protection

## 📞 Support

For issues or questions:
1. Check logs
2. Review `DEPLOYMENT.md`
3. Check API documentation

---

**Version**: 1.0  
**Last Updated**: 2025
