/**
 * Security Utilities for The Pet Kitchen Website
 * @author Hamadi Alhassani
 * @date October 21, 2025
 */

/**
 * HTML Escape Function
 * Prevents XSS attacks by escaping HTML special characters
 * 
 * @param {string} unsafe - Untrusted user input
 * @returns {string} - Safe HTML-escaped string
 * 
 * @example
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHtml(userInput);
 * // Result: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize phone number
 * Removes all non-digit characters except + at the start
 * 
 * @param {string} phone - Phone number input
 * @returns {string} - Sanitized phone number
 * 
 * @example
 * sanitizePhone('+1 (555) 123-4567'); // '+15551234567'
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }
  
  // Keep only + at start and digits
  return phone.replace(/[^\d+]/g, '').replace(/\+/g, (match, offset) => {
    return offset === 0 ? match : '';
  });
}

/**
 * Sanitize name input
 * Allows only letters, numbers, spaces, hyphens, and apostrophes
 * 
 * @param {string} name - Name input
 * @returns {string} - Sanitized name
 * 
 * @example
 * sanitizeName("O'Connor-Smith <script>"); // "O'Connor-Smith "
 */
function sanitizeName(name) {
  if (typeof name !== 'string') {
    return '';
  }
  
  // Allow only safe characters for names
  return name.replace(/[^a-zA-Z0-9\s'\-]/g, '').trim();
}

/**
 * Sanitize allergy input
 * Allows only letters, numbers, spaces, hyphens, and parentheses
 * 
 * @param {string} allergy - Allergy input
 * @returns {string} - Sanitized allergy
 */
function sanitizeAllergy(allergy) {
  if (typeof allergy !== 'string') {
    return '';
  }
  
  // Allow safe characters for food allergies
  return allergy.replace(/[^a-zA-Z0-9\s\-()]/g, '').trim();
}

/**
 * Validate E.164 phone number format
 * 
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
function isValidPhone(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate name input
 * 
 * @param {string} name - Name to validate
 * @returns {boolean} - True if valid name
 */
function isValidName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  // Between 1 and 50 characters, only safe characters
  const nameRegex = /^[a-zA-Z0-9\s'\-]{1,50}$/;
  return nameRegex.test(name);
}

// ==================== AUTHENTICATION MODULE ====================
// Unified auth module - single source of truth for authentication state

/**
 * Authentication Module
 * Provides consistent login, logout, and user state management
 */
const AuthModule = {
  // Storage keys - single source of truth
  TOKEN_KEY: 'auth_token',
  USER_KEY: 'current_user',
  
  /**
   * Check if user is logged in
   * @returns {boolean} - True if user has valid token
   */
  isLoggedIn() {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && token.length > 0;
  },
  
  /**
   * Get current user object
   * @returns {Object|null} - User object or null if not logged in
   */
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing current_user from localStorage:', e);
      return null;
    }
  },
  
  /**
   * Get current user ID
   * @returns {number|null} - User ID or null if not logged in
   */
  getCurrentUserId() {
    const user = this.getCurrentUser();
    return user ? (user.id || null) : null;
  },
  
  /**
   * Get auth token
   * @returns {string|null} - Token or null if not logged in
   */
  getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  },
  
  /**
   * Set auth token and user
   * @param {string} token - JWT token
   * @param {Object} user - User object
   */
  setAuth(token, user) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    // Dispatch event for other modules
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { loggedIn: true, user } 
      }));
    }
  },
  
  /**
   * Clear auth state (logout)
   */
  clearAuth() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    // Dispatch event for other modules
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { loggedIn: false, user: null } 
      }));
    }
  },
  
  /**
   * Login function - calls API and stores auth state
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Response with token and user
   */
  async login(email, password) {
    if (!window.authAPI || !window.authAPI.login) {
      throw new Error('Auth API not available. Make sure api.js is loaded.');
    }
    
    const response = await window.authAPI.login(email, password);
    this.setAuth(response.token, response.user);
    return response;
  },
  
  /**
   * Register function - calls API and stores auth state
   * @param {Object} userData - User data {email, password, name, phone}
   * @returns {Promise<Object>} - Response with token and user
   */
  async register(userData) {
    if (!window.authAPI || !window.authAPI.signup) {
      throw new Error('Auth API not available. Make sure api.js is loaded.');
    }
    
    const { email, password, name, phone } = userData;
    const response = await window.authAPI.signup(email, password, name, phone);
    this.setAuth(response.token, response.user);
    return response;
  },
  
  /**
   * Logout function - clears auth and redirects
   * @param {string} redirectTo - Optional redirect URL (default: index.html)
   */
  logout(redirectTo = 'index.html') {
    this.clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = redirectTo;
    }
  },
  
  /**
   * Redirect to login if not logged in
   * @param {string} returnUrl - URL to return to after login
   */
  redirectToLoginIfNeeded(returnUrl = null) {
    if (typeof window === 'undefined') return;
    
    if (!this.isLoggedIn()) {
      const currentUrl = window.location.href;
      const redirectUrl = returnUrl || currentUrl;
      window.location.href = `login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  }
};

// ==================== PASSWORD RESET MODULE ====================

/**
 * Handle forgot password form submission
 * @param {string} email - User email address
 * @returns {Promise<Object>} - Result object with ok status and optional error message
 */
async function handleForgotPasswordSubmit(email) {
  if (!email || typeof email !== 'string') {
    return { ok: false, error: 'Email is required' };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { ok: false, error: 'Please enter a valid email address' };
  }

  try {
    if (!window.authAPI || !window.authAPI.requestPasswordReset) {
      throw new Error('Auth API not available. Make sure api.js is loaded.');
    }

    await window.authAPI.requestPasswordReset(email.trim());
    return { ok: true };
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // Return user-friendly error message
    let errorMsg = 'Failed to send reset link. Please try again.';
    if (error.message) {
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMsg = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMsg = error.message;
      }
    }
    
    return { ok: false, error: errorMsg };
  }
}

/**
 * Handle reset password form submission
 * @param {string} token - Password reset token from URL
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Result object with ok status and optional error message
 */
async function handleResetPasswordSubmit(token, newPassword) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'Reset token is missing or invalid' };
  }

  if (!newPassword || typeof newPassword !== 'string') {
    return { ok: false, error: 'Password is required' };
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters long' };
  }

  try {
    if (!window.authAPI || !window.authAPI.resetPassword) {
      throw new Error('Auth API not available. Make sure api.js is loaded.');
    }

    await window.authAPI.resetPassword(token, newPassword);
    return { ok: true };
  } catch (error) {
    console.error('Reset password error:', error);
    
    // Return user-friendly error message
    let errorMsg = 'Failed to reset password. Please try again.';
    if (error.message) {
      if (error.message.includes('token') && (error.message.includes('invalid') || error.message.includes('expired'))) {
        errorMsg = 'This reset link is invalid or has expired. Please request a new one.';
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        errorMsg = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMsg = error.message;
      }
    }
    
    return { ok: false, error: errorMsg };
  }
}

// Make password reset functions available globally
if (typeof window !== 'undefined') {
  window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
  window.handleResetPasswordSubmit = handleResetPasswordSubmit;
}

// ==================== BACKWARD COMPATIBILITY HELPERS ====================

/**
 * Check if user is logged in (backward compatibility)
 * @returns {boolean} - True if user has valid token
 */
function isLoggedIn() {
  return AuthModule.isLoggedIn();
}

/**
 * Get current logged-in user ID (backward compatibility)
 * @returns {number|null} - User ID or null if not logged in
 */
function getCurrentUserId() {
  return AuthModule.getCurrentUserId();
}

/**
 * Get current user (backward compatibility)
 * @returns {Object|null} - User object or null if not logged in
 */
function getCurrentUser() {
  return AuthModule.getCurrentUser();
}

/**
 * Redirect to login page with return URL (backward compatibility)
 * @param {string} returnUrl - URL to return to after login
 */
function redirectToLoginIfNeeded(returnUrl = null) {
  AuthModule.redirectToLoginIfNeeded(returnUrl);
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.escapeHtml = escapeHtml;
  window.sanitizePhone = sanitizePhone;
  window.sanitizeName = sanitizeName;
  window.sanitizeAllergy = sanitizeAllergy;
  window.isValidPhone = isValidPhone;
  window.isValidName = isValidName;
  
  // Auth module - primary interface
  window.AuthModule = AuthModule;
  
  // Backward compatibility helpers
  window.isLoggedIn = isLoggedIn;
  window.getCurrentUserId = getCurrentUserId;
  window.getCurrentUser = getCurrentUser;
  window.redirectToLoginIfNeeded = redirectToLoginIfNeeded;
  
  // Also expose getToken for api.js compatibility
  if (typeof window.getToken !== 'function') {
    window.getToken = () => AuthModule.getToken();
  }
  
  // Override api.js functions if they exist to use AuthModule
  if (typeof window.setToken === 'function' && typeof window.setCurrentUser === 'function') {
    // Keep api.js functions but ensure they sync with AuthModule
    const originalSetToken = window.setToken;
    const originalSetCurrentUser = window.setCurrentUser;
    
    window.setToken = function(token) {
      originalSetToken(token);
      // Sync with AuthModule
      if (token) {
        localStorage.setItem(AuthModule.TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AuthModule.TOKEN_KEY);
      }
    };
    
    window.setCurrentUser = function(user) {
      originalSetCurrentUser(user);
      // Sync with AuthModule
      if (user) {
        localStorage.setItem(AuthModule.USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AuthModule.USER_KEY);
      }
    };
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    sanitizePhone,
    sanitizeName,
    sanitizeAllergy,
    isValidPhone,
    isValidName
  };
}

