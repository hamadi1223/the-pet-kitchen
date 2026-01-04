/**
 * API Retry Logic
 * Handles retries for failed API requests with exponential backoff
 */

/**
 * Retry a failed API request
 * @param {Function} apiCall - Function that returns a Promise
 * @param {Object} options - Retry options
 * @param {Number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {Number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {Number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} - Promise that resolves with the API response
 */
async function retryApiCall(apiCall, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = (error) => {
      // Retry on network errors or 5xx server errors
      if (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')
      )) {
        return true;
      }
      // Retry on 5xx errors
      if (error.status >= 500 && error.status < 600) {
        return true;
      }
      // Don't retry on 4xx errors (client errors)
      return false;
    }
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      // Success - reset delay for next call
      delay = initialDelay;
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error)) {
        console.warn(`⚠️ API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next retry (exponential backoff with jitter)
        delay = Math.min(delay * 2, maxDelay);
        // Add jitter to prevent thundering herd
        delay = delay + Math.random() * 1000;
      } else {
        // Don't retry - either max retries reached or error shouldn't be retried
        break;
      }
    }
  }

  // All retries exhausted
  console.error('❌ API call failed after all retries:', lastError);
  throw lastError;
}

/**
 * Wrap an API function with retry logic
 * @param {Function} apiFunction - Original API function
 * @param {Object} retryOptions - Retry options
 * @returns {Function} - Wrapped function with retry logic
 */
function withRetry(apiFunction, retryOptions = {}) {
  return async (...args) => {
    return retryApiCall(() => apiFunction(...args), retryOptions);
  };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.retryApiCall = retryApiCall;
  window.withRetry = withRetry;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { retryApiCall, withRetry };
}

