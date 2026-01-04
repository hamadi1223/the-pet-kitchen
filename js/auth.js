// Auth form handling - Unified, reliable authentication flow
// Uses AuthModule from security.js for consistent auth state management

(function() {
  'use strict';
  
  let isInitialized = false;
  let formSubmitting = false; // Prevent double submissions
  
  /**
   * Initialize auth forms once API is ready
   */
  function initializeAuth() {
    // Prevent double initialization
    if (isInitialized) {
      console.log('⚠️ Auth already initialized, skipping...');
      return;
    }
    
    console.log('🔐 Initializing auth forms...');
    
    // Wait for API to be ready
    waitForAPI(() => {
      setupLoginForm();
      setupSignupForm();
      isInitialized = true;
      console.log('✅ Auth forms initialized successfully');
    });
  }
  
  /**
   * Wait for API to be available before proceeding
   */
  function waitForAPI(callback, attempts = 0) {
    const MAX_ATTEMPTS = 100;
    const DELAY_MS = 50;
    
    if (attempts > MAX_ATTEMPTS) {
      console.error('❌ Auth API failed to load after', MAX_ATTEMPTS * DELAY_MS, 'ms');
      showGlobalError('Failed to initialize. Please refresh the page.');
      return;
    }
    
    // Check if API is available
    if (typeof window.authAPI !== 'undefined' && 
        typeof window.authAPI.login === 'function' &&
        typeof window.authAPI.signup === 'function') {
      console.log('✅ Auth API is ready');
      callback();
      return;
    }
    
    // Wait and retry
    setTimeout(() => waitForAPI(callback, attempts + 1), DELAY_MS);
  }
  
  /**
   * Setup login form handler
   */
  function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
      console.log('ℹ️ Login form not found on this page');
      return;
    }
    
    console.log('✅ Setting up login form...');
    
    // Remove any existing listeners by cloning the form
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);
    
    // Attach single submit handler
    newForm.addEventListener('submit', handleLoginSubmit);
  }
  
  /**
   * Handle login form submission
   */
  async function handleLoginSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (formSubmitting) {
      console.log('⚠️ Login already in progress, ignoring duplicate submit');
      return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('#submitBtn') || form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get form values
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    
    // Validate inputs
    if (!email || !password) {
      showError('Please enter both email and password.', errorMessage);
      return;
    }
    
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.', errorMessage);
      return;
    }
    
    // Set submitting state
    formSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
    }
    hideError(errorMessage);
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Use AuthModule for consistent auth state
      let response;
      if (window.AuthModule && typeof window.AuthModule.login === 'function') {
        response = await window.AuthModule.login(email, password);
      } else {
        // Fallback to direct API call
        response = await window.authAPI.login(email, password);
        // Manually set auth state
        if (window.setToken && window.setCurrentUser) {
          window.setToken(response.token);
          window.setCurrentUser(response.user);
        }
      }
      
      console.log('✅ Login successful');
      console.log('💾 Token received:', response.token ? response.token.substring(0, 30) + '...' : 'NO TOKEN');
      console.log('💾 User received:', response.user);
      
      // Wait longer to ensure token is stored in localStorage
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verify token was stored
      const storedToken = window.getToken ? window.getToken() : localStorage.getItem('auth_token');
      if (!storedToken) {
        console.error('❌ Token was not stored! Attempting to store manually...');
        if (response.token && window.setToken) {
          window.setToken(response.token);
        } else if (response.token) {
          localStorage.setItem('auth_token', response.token);
        }
      } else {
        console.log('✅ Token verified in storage:', storedToken.substring(0, 30) + '...');
      }
      
      // Get user for redirect logic
      const user = response.user || (window.AuthModule ? window.AuthModule.getCurrentUser() : window.getCurrentUser());
      
      // Determine redirect URL
      const redirectUrl = getRedirectUrl(user);
      
      console.log('🔄 Redirecting to:', redirectUrl);
      
      // Redirect
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Show user-friendly error message
      let errorMsg = 'Login failed. Please check your credentials.';
      
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('Invalid')) {
          errorMsg = 'Invalid email or password. Please try again.';
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
        submitBtn.textContent = 'Log In';
      }
      formSubmitting = false;
    }
  }
  
  /**
   * Setup signup form handler
   */
  function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) {
      console.log('ℹ️ Signup form not found on this page');
      return;
    }
    
    console.log('✅ Setting up signup form...');
    
    // Remove any existing listeners by cloning the form
    const newForm = signupForm.cloneNode(true);
    signupForm.parentNode.replaceChild(newForm, signupForm);
    
    // Attach single submit handler
    newForm.addEventListener('submit', handleSignupSubmit);
  }
  
  /**
   * Handle signup form submission
   */
  async function handleSignupSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double submission
    if (formSubmitting) {
      console.log('⚠️ Signup already in progress, ignoring duplicate submit');
      return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('#submitBtn') || form.querySelector('button[type="submit"]');
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const passwordInput = form.querySelector('#password');
    const phoneInput = form.querySelector('#phone');
    const errorMessage = document.getElementById('errorMessage');
    
    // Get form values
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    
    // Validate inputs
    if (!email || !password) {
      showError('Please enter both email and password.', errorMessage);
      return;
    }
    
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address.', errorMessage);
      return;
    }
    
    if (password.length < 6) {
      showError('Password must be at least 6 characters long.', errorMessage);
      return;
    }
    
    // Phone is required
    if (!phone || phone.trim() === '') {
      showError('Phone number is required. Please enter your 8-digit Kuwait phone number.', errorMessage);
      const phoneError = document.getElementById('phoneError');
      if (phoneError) {
        phoneError.textContent = 'Phone number is required';
        phoneError.style.display = 'block';
      }
      if (phoneInput) phoneInput.focus();
      return;
    }
    
    // Validate phone format (8 digits for Kuwait)
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showError('Please enter a valid 8-digit Kuwait phone number (e.g., 12345678).', errorMessage);
      const phoneError = document.getElementById('phoneError');
      if (phoneError) {
        phoneError.textContent = 'Must be exactly 8 digits';
        phoneError.style.display = 'block';
      }
      if (phoneInput) phoneInput.focus();
      return;
    }
    
    // Format phone - add +965 prefix for Kuwait
    let formattedPhone = cleanPhone;
    if (formattedPhone && formattedPhone.length === 8 && !formattedPhone.startsWith('+')) {
      formattedPhone = '+965' + formattedPhone;
    }
    
    // Clear phone error if validation passes
    const phoneError = document.getElementById('phoneError');
    if (phoneError) {
      phoneError.style.display = 'none';
      phoneError.textContent = '';
    }
    
    // Set submitting state
    formSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';
    }
    hideError(errorMessage);
    
    try {
      console.log('📝 Attempting signup for:', email);
      
      // Use AuthModule for consistent auth state
      let response;
      if (window.AuthModule && typeof window.AuthModule.register === 'function') {
        response = await window.AuthModule.register({
          email,
          password,
          name: name || null,
          phone: formattedPhone || null
        });
      } else {
        // Fallback to direct API call
        response = await window.authAPI.signup(email, password, name || null, formattedPhone || null);
        // Manually set auth state
        if (window.setToken && window.setCurrentUser) {
          window.setToken(response.token);
          window.setCurrentUser(response.user);
        }
      }
      
      console.log('✅ Signup successful');
      
      // Wait briefly to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user for redirect logic
      const user = response.user || (window.AuthModule ? window.AuthModule.getCurrentUser() : window.getCurrentUser());
      
      // Send account confirmation email (non-blocking, optional)
      // Note: Backend handles critical emails via Nodemailer, this is just a welcome email
      if (window.sendAccountConfirmationEmail && user) {
        // Don't await - send in background, don't block signup
        window.sendAccountConfirmationEmail({
          name: user.name || 'Valued Customer',
          email: user.email
        }).then(emailResult => {
          if (emailResult.success) {
            console.log('✅ Account confirmation email sent');
          } else {
            console.warn('⚠️ Failed to send account confirmation email (non-critical):', emailResult.error);
          }
        }).catch(emailError => {
          console.warn('⚠️ Error sending account confirmation email (non-critical):', emailError);
          // Don't block signup if email fails
        });
      }
      
      // Determine redirect URL
      const redirectUrl = getRedirectUrl(user);
      
      console.log('🔄 Redirecting to:', redirectUrl);
      
      // Redirect
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('❌ Signup error:', error);
      
      // Show user-friendly error message
      let errorMsg = 'Signup failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('already registered') || error.message.includes('Email already')) {
          errorMsg = 'This email is already registered. Please log in instead.';
        } else if (error.message.includes('Network') || error.message.includes('fetch')) {
          errorMsg = 'Cannot connect to server. Please check your connection.';
        } else if (error.message.includes('validation')) {
          errorMsg = 'Please check your input and try again.';
        } else {
          errorMsg = error.message;
        }
      }
      
      showError(errorMsg, errorMessage);
      
      // Re-enable form
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
      }
      formSubmitting = false;
    }
  }
  
  /**
   * Get redirect URL based on user and query params
   */
  function getRedirectUrl(user) {
    // Check URL parameters for redirect
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    // Handle specific redirect requests
    if (redirectParam) {
      // Decode and validate redirect URL
      try {
        const decoded = decodeURIComponent(redirectParam);
        // Security: Only allow relative URLs or same-origin
        if (decoded.startsWith('/') || decoded.startsWith('http://localhost') || decoded.startsWith(window.location.origin)) {
          return decoded;
        }
      } catch (e) {
        console.warn('Invalid redirect URL:', redirectParam);
      }
    }
    
    // Default redirects based on user role
    if (user && user.role === 'admin') {
      return 'admin.html';
    }
    
    // Default for regular users
    return 'account.html';
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
      errorElement.style.color = '#DC2626';
      // Scroll to error
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      console.error('Error message element not found. Message:', message);
      // Fallback: use alert
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
   * Show global error (when API fails to load)
   */
  function showGlobalError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.innerHTML = `
        <div style="padding: 1rem; background: #FEE2E2; border: 2px solid #DC2626; border-radius: 8px; color: #DC2626;">
          <strong>Error:</strong> ${message}
          <br><br>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 0.5rem;">Refresh Page</button>
        </div>
      `;
      errorElement.style.display = 'block';
    } else {
      alert(message);
    }
  }
  
  /**
   * Validate email format
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // ==================== INITIALIZATION ====================
  
  /**
   * Setup forgot password modal handlers
   */
  function setupForgotPasswordModal() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    if (!forgotPasswordLink || !forgotPasswordModal) {
      // Forgot password modal not on this page
      return;
    }

    // Open modal when link is clicked
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        openForgotPasswordModal();
      });
    }

    // Close modal handlers
    if (closeForgotPasswordModal) {
      closeForgotPasswordModal.addEventListener('click', () => {
        closeForgotPasswordModalFunc();
      });
    }

    // Close on backdrop click
    if (forgotPasswordModal) {
      forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
          closeForgotPasswordModalFunc();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && forgotPasswordModal && forgotPasswordModal.classList.contains('show')) {
        closeForgotPasswordModalFunc();
      }
    });

    // Handle form submission
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener('submit', handleForgotPasswordFormSubmit);
    }
  }

  /**
   * Open forgot password modal
   */
  function openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;

    // Reset form
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
      form.reset();
    }

    // Hide messages
    const errorMsg = document.getElementById('forgotPasswordErrorMessage');
    const successMsg = document.getElementById('forgotPasswordSuccessMessage');
    if (errorMsg) errorMsg.style.display = 'none';
    if (successMsg) successMsg.style.display = 'none';

    // Show modal
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    // Focus on email input
    const emailInput = document.getElementById('forgotPasswordEmail');
    if (emailInput) {
      setTimeout(() => emailInput.focus(), 100);
    }
  }

  /**
   * Close forgot password modal
   */
  function closeForgotPasswordModalFunc() {
    const modal = document.getElementById('forgotPasswordModal');
    if (!modal) return;

    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }

  /**
   * Handle forgot password form submission
   */
  async function handleForgotPasswordFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    const submitBtn = form.querySelector('#forgotPasswordSubmitBtn');
    const emailInput = document.getElementById('forgotPasswordEmail');
    const errorMessage = document.getElementById('forgotPasswordErrorMessage');
    const successMessage = document.getElementById('forgotPasswordSuccessMessage');

    if (!emailInput) return;

    const email = emailInput.value.trim();

    // Validate email
    if (!email) {
      showError('Please enter your email address.', errorMessage);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.', errorMessage);
      return;
    }

    // Set submitting state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    hideError(errorMessage);
    hideSuccess(successMessage);

    try {
      // Wait for handler function to be available
      if (typeof window.handleForgotPasswordSubmit !== 'function') {
        // Wait a bit for security.js to load
        await new Promise(resolve => setTimeout(resolve, 200));
        if (typeof window.handleForgotPasswordSubmit !== 'function') {
          throw new Error('Password reset functionality not available. Please refresh the page.');
        }
      }

      const result = await window.handleForgotPasswordSubmit(email);

      if (result.ok) {
        // Show success message
        if (successMessage) {
          successMessage.textContent = 'If an account with that email exists, we\'ve sent a reset link.';
          successMessage.style.display = 'block';
        }

        // Disable form
        if (submitBtn) {
          submitBtn.disabled = true;
        }
        if (emailInput) {
          emailInput.disabled = true;
        }

        // Close modal after a delay
        setTimeout(() => {
          closeForgotPasswordModalFunc();
        }, 3000);
      } else {
        showError(result.error || 'Failed to send reset link. Please try again.', errorMessage);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Reset Link';
        }
      }
    } catch (error) {
      console.error('Forgot password form error:', error);
      showError(error.message || 'Failed to send reset link. Please try again.', errorMessage);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
      }
    }
  }

  /**
   * Hide success message
   */
  function hideSuccess(successElement) {
    if (successElement) {
      successElement.style.display = 'none';
      successElement.textContent = '';
    }
  }

  /**
   * Initialize forgot password modal
   */
  function initializeForgotPassword() {
    setupForgotPasswordModal();
    checkPasswordResetSuccess();
  }

  /**
   * Check if user was redirected after successful password reset
   */
  function checkPasswordResetSuccess() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('passwordReset') === 'success') {
      const successMessage = document.getElementById('successMessage');
      if (successMessage) {
        successMessage.textContent = 'Your password has been reset successfully. Please log in with your new password.';
        successMessage.style.display = 'block';
        
        // Remove query parameter from URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAuth();
      initializeForgotPassword();
    });
  } else {
    // DOM already loaded
    initializeAuth();
    initializeForgotPassword();
  }
  
  // Also listen for API ready event
  document.addEventListener('apiReady', () => {
    console.log('📢 Received apiReady event, initializing auth...');
    initializeAuth();
    initializeForgotPassword();
  });
  
})();
