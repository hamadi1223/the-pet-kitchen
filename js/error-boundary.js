/**
 * Error Boundary for Frontend
 * Catches and handles JavaScript errors gracefully
 */

/**
 * Global error handler
 */
function setupErrorBoundary() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorToUser('Something went wrong. Please try again.');
    event.preventDefault(); // Prevent default browser error handling
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
    // Only show user-friendly message for critical errors
    if (event.error && event.error.message) {
      // Don't show technical errors to users
      if (!event.error.message.includes('Script error')) {
        showErrorToUser('An error occurred. Please refresh the page.');
      }
    }
  });

  // Override console.error to track errors (optional, for debugging)
  const originalConsoleError = console.error;
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    // Could send to error tracking service here (e.g., Sentry)
  };
}

/**
 * Show user-friendly error message
 * @param {String} message - Error message to display
 */
function showErrorToUser(message) {
  // Try to find error message container
  const errorContainer = document.getElementById('errorMessage') || 
                        document.getElementById('globalError') ||
                        document.querySelector('.error-message');

  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    // Fallback: show alert
    alert(message);
  }
}

/**
 * Safe API call wrapper
 * @param {Function} apiCall - API function to call
 * @param {Object} options - Options
 * @returns {Promise} - Promise that resolves or shows error
 */
async function safeApiCall(apiCall, options = {}) {
  const {
    errorMessage = 'An error occurred. Please try again.',
    showError = true
  } = options;

  try {
    return await apiCall();
  } catch (error) {
    console.error('API call error:', error);
    
    if (showError) {
      let userMessage = errorMessage;
      
      // Provide more specific error messages
      if (error.message) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
          userMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          userMessage = 'Please log in to continue.';
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          userMessage = 'You do not have permission to perform this action.';
        } else if (error.message.includes('404')) {
          userMessage = 'The requested resource was not found.';
        } else if (error.message.includes('429')) {
          userMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('500')) {
          userMessage = 'Server error. Please try again later.';
        }
      }
      
      showErrorToUser(userMessage);
    }
    
    throw error; // Re-throw so caller can handle if needed
  }
}

// Initialize error boundary when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupErrorBoundary);
} else {
  setupErrorBoundary();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.setupErrorBoundary = setupErrorBoundary;
  window.showErrorToUser = showErrorToUser;
  window.safeApiCall = safeApiCall;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupErrorBoundary, showErrorToUser, safeApiCall };
}

