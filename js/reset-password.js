/**
 * Reset Password Page Handler
 * Handles password reset form submission and token validation
 */

(function() {
  'use strict';

  let formSubmitting = false;

  /**
   * Initialize reset password page
   */
  function initializeResetPassword() {
    // Wait for API to be ready
    waitForAPI(() => {
      setupResetPasswordForm();
      checkResetToken();
    });
  }

  /**
   * Wait for API to be available
   */
  function waitForAPI(callback, attempts = 0) {
    const MAX_ATTEMPTS = 100;
    const DELAY_MS = 50;

    if (attempts > MAX_ATTEMPTS) {
      console.error('❌ Reset Password API failed to load after', MAX_ATTEMPTS * DELAY_MS, 'ms');
      showTokenError('Failed to initialize. Please refresh the page.');
      return;
    }

    // Check if API and handler functions are available
    if (typeof window.authAPI !== 'undefined' &&
        typeof window.authAPI.resetPassword === 'function') {
      console.log('✅ Reset Password API is ready');
      callback();
      return;
    }

    // Wait and retry
    setTimeout(() => waitForAPI(callback, attempts + 1), DELAY_MS);
  }

  /**
   * Check if reset token is present in URL
   */
  function checkResetToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    console.log('🔍 Checking for token in URL...');
    console.log('📋 URL:', window.location.href);
    console.log('📋 Token from URL:', token ? token.substring(0, 20) + '...' : 'NOT FOUND');

    if (!token || token.trim() === '') {
      // No token - show error message
      console.warn('⚠️ No token found in URL');
      showTokenError();
      return;
    }

    // Token exists - show form
    const form = document.getElementById('resetPasswordForm');
    const tokenError = document.getElementById('tokenErrorMessage');
    
    console.log('📋 Form element:', form ? 'Found' : 'NOT FOUND');
    console.log('📋 Token error element:', tokenError ? 'Found' : 'NOT FOUND');
    
    if (form) {
      form.style.display = 'block';
      console.log('✅ Form displayed');
    } else {
      console.error('❌ Reset password form not found in DOM');
    }
    if (tokenError) {
      tokenError.style.display = 'none';
      console.log('✅ Token error hidden');
    }
  }

  /**
   * Show token error message
   */
  function showTokenError(customMessage = null) {
    const tokenError = document.getElementById('tokenErrorMessage');
    const form = document.getElementById('resetPasswordForm');
    const successMsg = document.getElementById('resetSuccessMessage');

    if (tokenError) {
      if (customMessage) {
        tokenError.innerHTML = `<p>${escapeHtml(customMessage)}</p>`;
      }
      tokenError.style.display = 'block';
    }

    if (form) {
      form.style.display = 'none';
    }

    if (successMsg) {
      successMsg.style.display = 'none';
    }

    // Setup "request new link" handler
    const requestNewLink = document.getElementById('requestNewLink');
    if (requestNewLink) {
      requestNewLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
      });
    }
  }

  /**
   * Setup reset password form handler
   */
  function setupResetPasswordForm() {
    const form = document.getElementById('resetPasswordForm');
    if (!form) {
      console.log('ℹ️ Reset password form not found');
      return;
    }

    console.log('✅ Setting up reset password form...');

    // Remove any existing listeners by cloning the form
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // Attach submit handler
    newForm.addEventListener('submit', handleResetPasswordSubmit);

    // Real-time password confirmation validation
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (newPasswordInput && confirmPasswordInput) {
      confirmPasswordInput.addEventListener('input', () => {
        validatePasswordMatch();
      });
    }
  }

  /**
   * Validate that passwords match
   */
  function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const confirmInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('errorMessage');

    if (!newPassword || !confirmPassword) {
      return true;
    }

    if (newPassword !== confirmPassword) {
      if (confirmInput) {
        confirmInput.setCustomValidity('Passwords do not match');
      }
      return false;
    } else {
      if (confirmInput) {
        confirmInput.setCustomValidity('');
      }
      if (errorMessage && errorMessage.textContent.includes('match')) {
        hideError(errorMessage);
      }
      return true;
    }
  }

  /**
   * Handle reset password form submission
   */
  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
    if (formSubmitting) {
      console.log('⚠️ Reset password already in progress, ignoring duplicate submit');
      return;
    }

    const form = e.target;
    const submitBtn = form.querySelector('#submitBtn');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('resetSuccessMessage');
    const tokenError = document.getElementById('tokenErrorMessage');

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token || token.trim() === '') {
      showTokenError();
      return;
    }

    // Get form values
    const newPassword = newPasswordInput ? newPasswordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    // Validate inputs
    if (!newPassword || !confirmPassword) {
      showError('Please enter both password fields.', errorMessage);
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters long.', errorMessage);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match. Please try again.', errorMessage);
      return;
    }

    // Set submitting state
    formSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Resetting Password...';
    }
    hideError(errorMessage);
    if (tokenError) tokenError.style.display = 'none';

    try {
      console.log('🔐 Attempting password reset...');
      console.log('📋 Token:', token.substring(0, 20) + '...');
      console.log('📋 Password length:', newPassword.length);

      if (!window.authAPI || !window.authAPI.resetPassword) {
        throw new Error('Auth API not available. Please refresh the page.');
      }

      const response = await window.authAPI.resetPassword(token, newPassword);
      console.log('📥 API Response:', response);

      // Check if response indicates success
      // The API returns { message: "..." } on success or { error: "..." } on failure
      const result = {
        ok: response && (response.message || (!response.error && response.status !== 'error')),
        error: response?.error || null,
        message: response?.message || null
      };

      console.log('✅ Result check:', result);

      if (result.ok) {
        console.log('✅ Password reset successful');

        // Show success message
        if (successMessage) {
          successMessage.style.display = 'block';
        }

        // Hide form
        if (form) {
          form.style.display = 'none';
        }

        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = 'login.html?passwordReset=success';
        }, 2000);
      } else {
        console.error('❌ Password reset failed:', result.error);
        showError(result.error || 'Failed to reset password. Please try again.', errorMessage);

        // Re-enable form
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reset Password';
        }
        formSubmitting = false;
      }
    } catch (error) {
      console.error('❌ Reset password error:', error);

      let errorMsg = 'Failed to reset password. Please try again.';
      if (error.message) {
        if (error.message.includes('token') && (error.message.includes('invalid') || error.message.includes('expired'))) {
          errorMsg = 'This reset link is invalid or has expired. Please request a new one.';
          showTokenError(errorMsg);
          return;
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMsg = 'Cannot connect to server. Please check your connection.';
        } else {
          errorMsg = error.message;
        }
      }

      showError(errorMsg, errorMessage);

      // Re-enable form
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
      }
      formSubmitting = false;
    }
  }

  /**
   * Show error message
   */
  function showError(message, errorElement) {
    if (!errorElement) {
      errorElement = document.getElementById('errorMessage');
    }

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.style.color = '#C53030';
      // Scroll to error
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      console.error('Error message element not found. Message:', message);
      alert(message);
    }
  }

  /**
   * Hide error message
   */
  function hideError(errorElement) {
    if (!errorElement) {
      errorElement = document.getElementById('errorMessage');
    }

    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }

  /**
   * HTML Escape Function (from security.js)
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

  // ==================== INITIALIZATION ====================

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResetPassword);
  } else {
    // DOM already loaded
    initializeResetPassword();
  }

  // Also listen for API ready event
  document.addEventListener('apiReady', () => {
    console.log('📢 Received apiReady event, initializing reset password...');
    initializeResetPassword();
  });

})();

