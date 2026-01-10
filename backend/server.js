const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import utilities
const { errorHandler } = require('./utils/errors');
const { createRequestLogger } = require('./utils/logger');

// Import middleware
const { apiRateLimiter, authRateLimiter, authCheckRateLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const petsRoutes = require('./routes/pets');
const cartRoutes = require('./routes/cart');
const ordersRoutes = require('./routes/orders');
const checkoutRoutes = require('./routes/checkout');
const adminRoutes = require('./routes/admin');
const accountRoutes = require('./routes/account');
const subscriptionsRoutes = require('./routes/subscriptions');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 8000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development (including localhost.com)
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('http://localhost.com:') ||
        origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow configured frontend URL
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://thepetkitchen.net',
      'https://the-pet-kitcheng.vercel.app', // Vercel deployment
      'https://the-pet-kitchen.vercel.app', // Alternative Vercel domain
      /^https:\/\/.*\.vercel\.app$/, // All Vercel preview deployments
      'http://localhost:3000',
      'http://localhost:5173', // Vite default
      'http://localhost:8080'  // Common dev port
    ].filter(Boolean);
    
    // Check if origin matches any allowed origin (including regex patterns)
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, reject unknown origins
      if (process.env.NODE_ENV === 'production') {
        console.warn('🚫 CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      } else {
        // In development, allow all but warn
        console.warn(`⚠️  CORS: Allowing unknown origin: ${origin}`);
        callback(null, true);
      }
    }
  },
  credentials: true
}));
// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Apply rate limiting to all API routes
app.use('/api', apiRateLimiter);

// Get project root path
const projectRoot = path.join(__dirname, '..');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Explicit routes for important pages (BEFORE static middleware to ensure they're hit)
// Add middleware to log ALL requests for debugging
app.use((req, res, next) => {
  if (req.path.includes('reset-password')) {
    console.log('🔍 [ALL REQUESTS] Path:', req.path);
    console.log('🔍 [ALL REQUESTS] Method:', req.method);
    console.log('🔍 [ALL REQUESTS] Original URL:', req.originalUrl);
  }
  next();
});

app.get('/reset-password.html', (req, res, next) => {
  console.log('📄 [ROUTE] GET /reset-password.html - Route handler called!');
  const filePath = path.join(projectRoot, 'reset-password.html');
  const fs = require('fs');
  
  console.log('📄 [ROUTE] File path:', filePath);
  console.log('📄 [ROUTE] File exists:', fs.existsSync(filePath));
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ [ROUTE] File does not exist!');
    return res.status(404).send('File not found');
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ [ROUTE] Error serving reset-password.html:', err.message);
      console.error('❌ [ROUTE] Error code:', err.code);
      return res.status(500).send('Error serving file');
    } else {
      console.log('✅ [ROUTE] Successfully served reset-password.html');
    }
  });
});

app.get('/reset-password', (req, res) => {
  console.log('📄 [ROUTE] /reset-password requested, redirecting to .html');
  const token = req.query.token ? '?token=' + req.query.token : '';
  res.redirect('/reset-password.html' + token);
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(projectRoot, 'login.html'));
});

app.get('/signup.html', (req, res) => {
  res.sendFile(path.join(projectRoot, 'signup.html'));
});

// Serve static files from the project root (frontend files)
// This allows the Express server to serve both API and static files
// IMPORTANT: Explicit routes above take precedence, but we need to be careful
// about 404.html - don't serve it unless explicitly requested
app.use(express.static(projectRoot, {
  // Custom index handler - don't auto-serve index.html for directories
  index: false,
  // Don't serve 404.html automatically
  setHeaders: (res, filePath, stat) => {
    // If this is 404.html and it's not explicitly requested, skip it
    if (filePath.endsWith('404.html') && !res.req.path.includes('404.html')) {
      // This shouldn't happen, but just in case
      return;
    }
  }
}));

// API Routes with versioning
const apiBase = `/api/${API_VERSION}`;

// Public meal plans endpoint (before admin routes so it doesn't require auth)
const pool = require('./config/database');
app.get(`${apiBase}/meal-plans`, async (req, res) => {
  try {
    // Only return active meal plans for public access
    const [mealPlans] = await pool.execute(
      'SELECT * FROM meal_plans WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    res.json({ meal_plans: mealPlans });
  } catch (error) {
    console.error('Get public meal plans error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API Routes with versioning
// Note: authRoutes will apply rate limiters per-route (login/signup get strict limit, /me gets lenient)
app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/pets`, petsRoutes);
app.use(`${apiBase}/cart`, cartRoutes);
app.use(`${apiBase}/orders`, ordersRoutes);
app.use(`${apiBase}/checkout`, checkoutRoutes);
app.use(`${apiBase}/admin`, adminRoutes);
app.use(`${apiBase}/account`, accountRoutes);
app.use(`${apiBase}/subscriptions`, subscriptionsRoutes);
app.use(`${apiBase}/analytics`, analyticsRoutes);
app.use(`${apiBase}/upload`, uploadRoutes);
app.use(`${apiBase}/email`, emailRoutes);

// Legacy routes (without version) for backward compatibility
// Public meal plans endpoint (legacy)
app.get('/api/meal-plans', async (req, res) => {
  try {
    const [mealPlans] = await pool.execute(
      'SELECT * FROM meal_plans WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );
    res.json({ meal_plans: mealPlans });
  } catch (error) {
    console.error('Get public meal plans error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler for API routes (must be before catch-all)
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// For non-API routes, serve index.html (SPA fallback)
// This handles client-side routing for the frontend
// Note: This only runs if static middleware didn't find a matching file
app.get('*', (req, res) => {
  // Skip if it's an API route (shouldn't happen due to order, but safety check)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  // Skip if it's a known HTML file that should be handled by explicit routes
  // (These should have been handled already, but this is a safety check)
  if (req.path === '/reset-password.html' || req.path === '/login.html' || req.path === '/signup.html') {
    console.log('⚠️ [CATCH-ALL] Known HTML file reached catch-all, this should not happen:', req.path);
    const filePath = path.join(projectRoot, req.path);
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // Check if the requested file exists (static middleware should have served it, but double-check)
  const fs = require('fs');
  const requestedFile = path.join(projectRoot, req.path);
  
  // If file exists and is not a directory, serve it directly
  if (fs.existsSync(requestedFile) && !fs.statSync(requestedFile).isDirectory()) {
    return res.sendFile(requestedFile);
  }
  
  // File doesn't exist, check if 404.html exists, otherwise serve index.html for SPA routing
  const notFoundFile = path.join(projectRoot, '404.html');
  if (fs.existsSync(notFoundFile)) {
    return res.status(404).sendFile(notFoundFile);
  }
  
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Start server
// Global error handler (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    requestId: req.id
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate critical environment variables
  const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
  }
});

module.exports = app;

