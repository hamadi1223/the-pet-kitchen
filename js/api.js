// API Configuration
// Update this to your backend URL (e.g., 'https://api.thepetkitchen.net' or 'http://localhost:8000')
// Supports API versioning (defaults to v1, falls back to legacy /api if v1 not available)
const API_VERSION = 'v1'; // Set to null or '' to use legacy routes
const API_BASE_URL = (() => {
  const base = (() => {
    // Check for environment variable first (set by Vercel or build process)
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
    
    // Check for window-level API URL override (for testing)
    if (window.BACKEND_API_URL) {
      return window.BACKEND_API_URL;
    }
    
    // If accessing via file:// protocol or localhost (any port or domain), use local API
    if (window.location.protocol === 'file:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === 'localhost.com' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '' ||
        window.location.hostname.includes('localhost')) {
      return 'http://localhost:8000';
    }
    
    // If on Vercel, check for vercel.app domain
    if (window.location.hostname.includes('vercel.app')) {
      // Default to localhost for now - UPDATE THIS with your Railway backend URL
      // You can set this via Vercel environment variable: NEXT_PUBLIC_API_URL
      return 'http://localhost:8000'; // TODO: Replace with your Railway backend URL
    }
    
    // Otherwise use production API
    return 'https://thepetkitchen.net';
  })();
  
  // Add version if specified
  if (API_VERSION) {
    return `${base}/api/${API_VERSION}`;
  }
  return `${base}/api`;
})();

// Log API base URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL);
window.API_BASE_URL = API_BASE_URL; // Make it globally accessible for debugging

// Get stored token
function getToken() {
  return localStorage.getItem('auth_token');
}

// Set token
function setToken(token) {
  localStorage.setItem('auth_token', token);
}

// Remove token (logout)
function removeToken() {
  localStorage.removeItem('auth_token');
}

// Get current user
function getCurrentUser() {
  const userStr = localStorage.getItem('current_user');
  return userStr ? JSON.parse(userStr) : null;
}

// Set current user
function setCurrentUser(user) {
  localStorage.setItem('current_user', JSON.stringify(user));
}

// Remove current user
function removeCurrentUser() {
  localStorage.removeItem('current_user');
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  console.log('API Request:', url, options.method || 'GET');

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle non-JSON responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON: ${text}`);
    }

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        data: data
      });
      
      // Provide more specific error messages
      let errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      
      if (response.status === 404) {
        errorMsg = `Route not found: ${endpoint}. Check that the backend route exists.`;
      } else if (response.status === 401) {
        errorMsg = 'Authentication required. Please log in again.';
      } else if (response.status === 403) {
        errorMsg = 'Access forbidden. Admin privileges required.';
      } else if (response.status === 429) {
        // Rate limit error - provide helpful message
        const retryAfter = data.retryAfter || 60;
        errorMsg = `Too many requests. Please wait ${Math.ceil(retryAfter / 1000)} seconds and try again.`;
        console.warn('⚠️ Rate limit exceeded, will retry automatically');
      }
      
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error('API request error:', {
      url,
      error: error.message,
      stack: error.stack
    });
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      const errorMsg = API_BASE_URL.includes('localhost') 
        ? 'Cannot connect to server. Make sure the backend is running on http://localhost:8000'
        : 'Cannot connect to server. Please check your internet connection or try again later.';
      throw new Error(errorMsg);
    }
    
    throw error;
  }
}

// Auth API
const authAPI = {
  signup: async (email, password, name, phone) => {
    const body = { email, password, name };
    if (phone) {
      body.phone = phone;
    }
    const data = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    console.log('💾 Storing token and user data...');
    setToken(data.token);
    setCurrentUser(data.user);
    console.log('✅ Token stored:', !!getToken());
    console.log('✅ User stored:', !!getCurrentUser());
    return data;
  },

  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    console.log('💾 Storing token and user data...');
    setToken(data.token);
    setCurrentUser(data.user);
    console.log('✅ Token stored:', !!getToken());
    console.log('✅ User stored:', !!getCurrentUser());
    return data;
  },

  logout: () => {
    removeToken();
    removeCurrentUser();
    window.location.href = 'index.html';
  },

  getMe: async () => {
    return await apiRequest('/auth/me');
  },

  // Forgot Password - Request password reset link
  requestPasswordReset: async (email) => {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Verify Email - Verify email address with token
  verifyEmail: async (token) => {
    return await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  },

  // Resend Verification Email
  resendVerification: async (email) => {
    return await apiRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Reset Password - Submit new password with token
  resetPassword: async (token, password) => {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }
};

// Pets API
const petsAPI = {
  getAll: async () => {
    return await apiRequest('/pets');
  },

  getOne: async (id) => {
    return await apiRequest(`/pets/${id}`);
  },

  create: async (petData) => {
    return await apiRequest('/pets', {
      method: 'POST',
      body: JSON.stringify(petData)
    });
  },

  update: async (id, petData) => {
    return await apiRequest(`/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(petData)
    });
  },

  delete: async (id) => {
    return await apiRequest(`/pets/${id}`, {
      method: 'DELETE'
    });
  }
};

// Cart API
const cartAPI = {
  get: async () => {
    return await apiRequest('/cart');
  },

  addItem: async (productIdOrSku, quantity, meta = null) => {
    // Support both product_id (number) and sku (string)
    const body = { quantity, meta };
    if (typeof productIdOrSku === 'number') {
      body.product_id = productIdOrSku;
    } else {
      body.sku = productIdOrSku;
    }
    return await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  updateItem: async (itemId, quantity, meta = null) => {
    return await apiRequest(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity, meta })
    });
  },

  removeItem: async (itemId) => {
    return await apiRequest(`/cart/items/${itemId}`, {
      method: 'DELETE'
    });
  }
};

// Orders API
const ordersAPI = {
  getAll: async () => {
    return await apiRequest('/orders');
  },

  getOne: async (id) => {
    return await apiRequest(`/orders/${id}`);
  },

  cancel: async (id) => {
    return await apiRequest(`/orders/${id}/cancel`, {
      method: 'PATCH'
    });
  }
};

// Checkout API
const checkoutAPI = {
  initiate: async (petId = null, phone = null) => {
    const body = { pet_id: petId };
    if (phone) {
      body.phone = phone;
    }
    return await apiRequest('/checkout/myfatoorah', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  
  getPaymentUrl: async (orderId) => {
    return await apiRequest(`/checkout/myfatoorah/retry/${orderId}`);
  }
};

// Account API
const accountAPI = {
  getOverview: async () => {
    return await apiRequest('/account/overview');
  },

  // Questionnaire methods
  getQuestionnaire: async () => {
    return await apiRequest('/account/questionnaire');
  },

  saveQuestionnaire: async (questionnaireData) => {
    return await apiRequest('/account/questionnaire', {
      method: 'PUT',
      body: JSON.stringify(questionnaireData)
    });
  },

  createQuestionnaire: async (questionnaireData) => {
    return await apiRequest('/account/questionnaire', {
      method: 'POST',
      body: JSON.stringify(questionnaireData)
    });
  }
};

// Subscriptions API
const subscriptionsAPI = {
  getMySubscriptions: async () => {
    return await apiRequest('/subscriptions/my-subscriptions');
  },

  getSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}`);
  },

  updateSubscription: async (id, data) => {
    return await apiRequest(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  confirmSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}/confirm`, {
      method: 'POST'
    });
  },

  cancelSubscription: async (id, reason = null) => {
    return await apiRequest(`/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  renewSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}/renew`, {
      method: 'POST'
    });
  }
};

// Admin API
const adminAPI = {
  getOrders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/orders${queryString ? '?' + queryString : ''}`);
  },

  getOrder: async (id) => {
    return await apiRequest(`/admin/orders/${id}`);
  },

  updateOrderStatus: async (id, status) => {
    return await apiRequest(`/admin/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getUsers: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/users${queryString ? '?' + queryString : ''}`);
  },

  getUser: async (id) => {
    return await apiRequest(`/admin/users/${id}`);
  },

  getProducts: async () => {
    return await apiRequest('/admin/products');
  },

  createProduct: async (productData) => {
    return await apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  updateProduct: async (id, productData) => {
    return await apiRequest(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  },

  updatePet: async (id, petData) => {
    return await apiRequest(`/admin/pets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(petData)
    });
  },

  deletePet: async (id) => {
    return await apiRequest(`/admin/pets/${id}`, {
      method: 'DELETE'
    });
  },

  getSubscriptions: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/subscriptions${queryString ? '?' + queryString : ''}`);
  },

  getSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}`);
  },

  // Meal Plans Management (Admin - requires auth)
  getMealPlans: async () => {
    return await apiRequest('/admin/meal-plans');
  },

  getMealPlan: async (id) => {
    return await apiRequest(`/admin/meal-plans/${id}`);
  },

  createMealPlan: async (mealPlanData) => {
    return await apiRequest('/admin/meal-plans', {
      method: 'POST',
      body: JSON.stringify(mealPlanData)
    });
  },

  updateMealPlan: async (id, mealPlanData) => {
    return await apiRequest(`/admin/meal-plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(mealPlanData)
    });
  },

  deleteMealPlan: async (id) => {
    return await apiRequest(`/admin/meal-plans/${id}`, {
      method: 'DELETE'
    });
  },

  updateSubscription: async (id, subscriptionData) => {
    return await apiRequest(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(subscriptionData)
    });
  },

  confirmSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}/confirm`, {
      method: 'POST'
    });
  },

  renewSubscription: async (id) => {
    return await apiRequest(`/subscriptions/${id}/renew`, {
      method: 'POST'
    });
  },

  cancelSubscription: async (id, reason = null) => {
    return await apiRequest(`/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Analytics
  getAnalyticsMetrics: async (startDate = null, endDate = null) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/analytics/metrics${queryString ? '?' + queryString : ''}`);
  },

  getAnalyticsEvents: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/analytics/events${queryString ? '?' + queryString : ''}`);
  },

  // Reminders API
  getReminders: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiRequest(`/admin/reminders${queryString ? '?' + queryString : ''}`);
  },

  sendReminderEmails: async (params = {}) => {
    return await apiRequest('/admin/reminders/send-expiring', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  getWhatsAppReminder: async (subscriptionId) => {
    return await apiRequest(`/admin/reminders/whatsapp/${subscriptionId}`);
  }
};

// Public Meal Plans API (accessible without authentication)
const publicMealPlansAPI = {
  getMealPlans: async () => {
    return await apiRequest('/meal-plans');
  }
};

// Export for use in other scripts
// Set these immediately to ensure they're available
try {
  window.authAPI = authAPI;
  window.petsAPI = petsAPI;
  window.cartAPI = cartAPI;
  window.ordersAPI = ordersAPI;
  window.checkoutAPI = checkoutAPI;
  window.accountAPI = accountAPI;
  window.subscriptionsAPI = subscriptionsAPI;
  window.adminAPI = adminAPI;
  window.publicMealPlansAPI = publicMealPlansAPI;
  window.getToken = getToken;
  window.getCurrentUser = getCurrentUser;
  window.setToken = setToken;
  window.setCurrentUser = setCurrentUser;
  window.removeToken = removeToken;
  window.removeCurrentUser = removeCurrentUser;

  // Confirm API is loaded
  console.log('✅ API.js loaded successfully!');
  console.log('📦 Available APIs:', {
    authAPI: typeof window.authAPI,
    petsAPI: typeof window.petsAPI,
    cartAPI: typeof window.cartAPI,
    ordersAPI: typeof window.ordersAPI,
    accountAPI: typeof window.accountAPI,
    subscriptionsAPI: typeof window.subscriptionsAPI,
    adminAPI: typeof window.adminAPI,
    getToken: typeof window.getToken,
    getCurrentUser: typeof window.getCurrentUser
  });
  
  // Dispatch custom event to signal API is ready
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('apiReady'));
  }
} catch (error) {
  console.error('❌ Error exporting APIs:', error);
}

