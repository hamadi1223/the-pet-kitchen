// Account Page Functionality
let accountData = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('📄 Account page DOM loaded');
  
  // Wait for API to load
  const waitForAPI = (attempts = 0) => {
    console.log(`🔄 Waiting for API (attempt ${attempts + 1}/100)...`);
    
    if (attempts > 100) {
      console.error('❌ API failed to load after 100 attempts (5 seconds)');
      const errorState = document.getElementById('errorState');
      if (errorState) {
        errorState.style.display = 'block';
        errorState.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <p style="color: #DC2626; font-weight: 600; margin-bottom: 0.5rem;">Failed to Initialize</p>
            <p style="color: var(--ink-700); margin-bottom: 1rem;">API failed to load. Please check console (F12) and refresh.</p>
            <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
          </div>
        `;
      }
      return;
    }
    
    if (typeof window.getToken !== 'function' || typeof window.accountAPI === 'undefined') {
      setTimeout(() => waitForAPI(attempts + 1), 50);
      return;
    }
    
    console.log('✅ API loaded, checking authentication...');
    
    // Check authentication
    if (!window.getToken()) {
      console.log('❌ No token found, redirecting to login...');
      window.location.href = 'login.html';
      return;
    }
    
    console.log('✅ Token found, initializing account...');
    initializeAccount();
  };
  
  waitForAPI();
});

async function initializeAccount() {
  console.log('🚀 Initializing account page...');
  
  // Check if coming from email verification
  const urlParams = new URLSearchParams(window.location.search);
  const verified = urlParams.get('verified');
  if (verified === 'true') {
    console.log('✅ Email verified - refreshing account data...');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Ensure loading state is visible initially
  const loadingState = document.getElementById('loadingState');
  const accountContent = document.getElementById('accountContent');
  const errorState = document.getElementById('errorState');
  
  if (loadingState) {
    loadingState.style.display = 'block';
    console.log('✅ Loading state shown');
  }
  if (accountContent) {
    accountContent.style.display = 'none';
  }
  if (errorState) {
    errorState.style.display = 'none';
  }

  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      window.location.href = 'index.html';
    }
  });
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      window.location.href = 'index.html';
    }
  });

  // Setup admin dashboard button (will be shown/hidden based on role)
  const adminDashboardBtn = document.getElementById('adminDashboardBtn');
  if (adminDashboardBtn) {
    adminDashboardBtn.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
    
    // Initially hide the button until we verify the role
    adminDashboardBtn.style.display = 'none';
  }

  // Edit Pet Info button has been moved to pet cards

  // Load account data
  await loadAccountData();

  // Setup pet modal
  setupPetModal();
}

async function loadAccountData() {
  const loadingState = document.getElementById('loadingState');
  const accountContent = document.getElementById('accountContent');
  const errorState = document.getElementById('errorState');

  try {
    console.log('📥 Loading account data...');
    console.log('🔍 accountAPI available:', typeof window.accountAPI);
    console.log('🔍 getOverview available:', typeof window.accountAPI?.getOverview);
    
    if (!window.accountAPI || !window.accountAPI.getOverview) {
      throw new Error('Account API not available. Please refresh the page.');
    }
    
    // Fetch account overview which includes user data with role
    accountData = await window.accountAPI.getOverview();
    console.log('✅ Account data loaded:', accountData);
    
    // Verify user role is included in the response
    if (accountData && accountData.user) {
      console.log('👤 User data:', accountData.user);
      console.log('👤 User role:', accountData.user.role);
      
      // If role is missing, fetch it from auth API as fallback
      if (!accountData.user.role && window.authAPI && window.authAPI.getMe) {
        console.log('⚠️ Role missing from account data, fetching from auth API...');
        try {
          const currentUser = await window.authAPI.getMe();
          if (currentUser && currentUser.role) {
            accountData.user.role = currentUser.role;
            console.log('✅ Role fetched from auth API:', currentUser.role);
          }
        } catch (authError) {
          console.warn('Could not fetch role from auth API:', authError);
        }
      }
    }
    
    console.log('✅ Account data received, rendering...');
    
    // Hide loading, show content
    if (loadingState) {
      loadingState.style.display = 'none';
      console.log('✅ Loading state hidden');
    }
    if (accountContent) {
      accountContent.style.display = 'block';
      console.log('✅ Account content shown');
    }
    if (errorState) {
      errorState.style.display = 'none';
    }

    console.log('🎨 Rendering account UI...');
    await renderAccount();
    
    // Show/hide email verification banner based on verification status
    handleEmailVerificationBanner();
    
    console.log('✅ Account page rendered successfully!');
  } catch (error) {
    console.error('❌ Error loading account:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response,
      accountAPI: typeof window.accountAPI,
      getToken: typeof window.getToken,
      token: window.getToken() ? 'exists' : 'missing'
    });
    
    if (loadingState) loadingState.style.display = 'none';
    if (accountContent) accountContent.style.display = 'none';
    if (errorState) {
      errorState.style.display = 'block';
      const errorMsg = error.message || 'Failed to load account data.';
      errorState.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #DC2626; font-weight: 600; margin-bottom: 0.5rem; font-size: 1.1rem;">Error Loading Account</p>
          <p style="color: var(--ink-700); margin-bottom: 0.5rem;">${escapeHtml(errorMsg)}</p>
          <p style="color: var(--ink-600); font-size: 0.9rem; margin-bottom: 1.5rem;">Please check the browser console (F12) for details.</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-right: 1rem;">Refresh Page</button>
          <button onclick="window.location.href='login.html'" class="btn btn-outline">Go to Login</button>
        </div>
      `;
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle email verification banner visibility
function handleEmailVerificationBanner() {
  const banner = document.getElementById('emailVerificationBanner');
  if (!banner) return;
  
  // Check if email is verified (handle both boolean true and numeric 1 from MySQL)
  const emailVerified = accountData?.user?.email_verified;
  const isVerified = emailVerified === true || emailVerified === 1 || emailVerified === '1';
  
  console.log('🔍 Email verification status:', {
    isVerified: isVerified,
    emailVerified: emailVerified,
    emailVerifiedType: typeof emailVerified,
    user: accountData?.user ? 'exists' : 'missing'
  });
  
  // Hide banner if email is verified
  if (isVerified) {
    console.log('✅ Email is verified - hiding banner');
    banner.style.display = 'none';
    return;
  }
  
  // Show banner if email is not verified
  console.log('⚠️ Email is NOT verified - showing banner');
  banner.style.display = 'block';
  
  // Setup dismiss button (only if not already set up)
  const dismissBtn = document.getElementById('dismissVerificationBanner');
  if (dismissBtn && !dismissBtn.dataset.listenerAdded) {
    dismissBtn.dataset.listenerAdded = 'true';
    dismissBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      // Store dismissal in sessionStorage (not localStorage, so it shows again on next session if still not verified)
      sessionStorage.setItem('email_verification_banner_dismissed', 'true');
    });
  }
  
  // Setup resend verification link (only if not already set up)
  const resendLink = document.getElementById('resendVerificationLink');
  if (resendLink && !resendLink.dataset.listenerAdded) {
    resendLink.dataset.listenerAdded = 'true';
    resendLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!window.authAPI || !window.authAPI.resendVerification) {
        alert('Please go to your email inbox to find the verification link.');
        return;
      }
      
      try {
        const userEmail = accountData?.user?.email;
        if (!userEmail) {
          alert('Unable to find your email address. Please contact support.');
          return;
        }
        
        const result = await window.authAPI.resendVerification(userEmail);
        alert('Verification email sent! Please check your inbox.');
      } catch (error) {
        console.error('Error resending verification:', error);
        alert('Failed to resend verification email. Please try again later or contact support.');
      }
    });
  }
}

// Make loadAccountData globally accessible
window.loadAccountData = loadAccountData;

async function renderAccount() {
  console.log('🎨 renderAccount called with data:', accountData ? 'Yes' : 'No');
  
  if (!accountData) {
    console.error('❌ No account data to render!');
    return;
  }

  const { user, pets, orders } = accountData;
  console.log('📊 Account data structure:', {
    hasUser: !!user,
    hasPets: !!pets,
    petsCount: pets ? pets.length : 0,
    hasOrders: !!orders,
    ordersCount: orders ? orders.length : 0
  });

  // Welcome message
  const welcomeMessage = document.getElementById('welcomeMessage');
  const accountEmail = document.getElementById('accountEmail');
  
  if (welcomeMessage) {
    if (user && user.name) {
      welcomeMessage.textContent = `Hi ${user.name} 👋`;
    } else {
      welcomeMessage.textContent = 'Welcome back!';
    }
  }
  
  if (accountEmail && user) {
    accountEmail.textContent = user.email || '';
  }

  // Show admin dashboard button if user is admin
  if (user) {
    console.log('👤 Checking admin button for user:', user.role);
    await checkAndShowAdminButton(user);
  } else {
    console.warn('⚠️ No user data available for admin button check');
  }

  // Render pets
  console.log('🐾 Rendering pets...');
  try {
    renderPets(pets || []);
    console.log('✅ Pets rendered');
  } catch (error) {
    console.error('❌ Error rendering pets:', error);
  }

  // Render subscriptions
  console.log('📋 Rendering subscriptions...');
  try {
    renderSubscriptions(orders || []);
    console.log('✅ Subscriptions rendered');
  } catch (error) {
    console.error('❌ Error rendering subscriptions:', error);
  }

  // Render orders
  console.log('📦 Rendering orders...');
  try {
    renderOrders(orders || []);
    console.log('✅ Orders rendered');
  } catch (error) {
    console.error('❌ Error rendering orders:', error);
  }
  
  console.log('✅ All account sections rendered!');
}

async function checkAndShowAdminButton(user) {
  const adminDashboardBtn = document.getElementById('adminDashboardBtn');
  
  if (!adminDashboardBtn) {
    console.error('⚠️ Admin dashboard button not found in DOM');
    return;
  }

  // Get role from account data
  let userRole = user?.role;
  
  // If role is missing, try to fetch from auth API
  if (!userRole && window.authAPI && window.authAPI.getMe) {
    try {
      console.log('⚠️ Role missing from account data, fetching from auth API...');
      const currentUser = await window.authAPI.getMe();
      if (currentUser && currentUser.role) {
        userRole = currentUser.role;
        // Update accountData with the role
        if (accountData && accountData.user) {
          accountData.user.role = userRole;
        }
        console.log('✅ Role fetched from auth API:', userRole);
      }
    } catch (error) {
      console.warn('Could not fetch role from auth API:', error);
    }
  }

  // Normalize role for comparison (trim and lowercase)
  const normalizedRole = userRole?.toString().trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  
  console.log('🔍 Admin button check:', {
    buttonExists: true,
    userRole: normalizedRole,
    rawRole: userRole,
    isAdmin: isAdmin,
    userObject: user
  });
  
  if (isAdmin) {
    console.log('✅ Showing admin dashboard button for admin user');
    adminDashboardBtn.style.display = 'inline-flex';
    adminDashboardBtn.style.visibility = 'visible';
    adminDashboardBtn.removeAttribute('hidden');
    adminDashboardBtn.classList.remove('hidden');
    adminDashboardBtn.style.opacity = '1';
  } else {
    console.log('❌ Hiding admin dashboard button - user role:', normalizedRole || 'undefined');
    adminDashboardBtn.style.display = 'none';
    adminDashboardBtn.style.visibility = 'hidden';
    adminDashboardBtn.setAttribute('hidden', 'true');
  }
}

function renderPets(pets) {
  const container = document.getElementById('petsContainer');
  const noPetsState = document.getElementById('noPetsState');

  console.log('🐾 Rendering pets:', pets);

  if (!pets || pets.length === 0) {
    console.log('ℹ️ No pets found, showing empty state');
    if (container) container.style.display = 'none';
    if (noPetsState) noPetsState.style.display = 'block';
    return;
  }

  console.log(`✅ Found ${pets.length} pet(s) to display`);
  if (container) container.style.display = 'grid';
  if (noPetsState) noPetsState.style.display = 'none';

  container.innerHTML = pets.map(pet => {
    const goalText = getGoalText(pet.goal);
    const recommendation = getPetRecommendation(pet);
    const ordersForPet = accountData.ordersByPet[pet.id] || [];

    return `
      <div class="pet-card">
        <div class="pet-header">
          <div class="pet-name-section">
            <h3>${escapeHtml(pet.name)}</h3>
            <span class="pet-type">${pet.type === 'dog' ? '🐕 Dog' : '🐈 Cat'}</span>
          </div>
          <div class="pet-actions">
            <button class="pet-action-btn" onclick="editPetQuestionnaire(${pet.id})" title="Edit Pet Information">
              ✏️
            </button>
            <button class="pet-action-btn" onclick="deletePet(${pet.id})" title="Delete">
              🗑️
            </button>
          </div>
        </div>
        <div class="pet-details">
          ${pet.breed ? `
            <div class="pet-detail-item">
              <span class="pet-detail-label">Breed:</span>
              <span>${escapeHtml(pet.breed)}</span>
            </div>
          ` : ''}
          ${pet.weight_kg ? `
            <div class="pet-detail-item">
              <span class="pet-detail-label">Weight:</span>
              <span>${pet.weight_kg} kg</span>
            </div>
          ` : ''}
          ${pet.age_group ? `
            <div class="pet-detail-item">
              <span class="pet-detail-label">Age:</span>
              <span>${formatAgeGroup(pet.age_group)}</span>
            </div>
          ` : ''}
          ${pet.activity_level ? `
            <div class="pet-detail-item">
              <span class="pet-detail-label">Activity:</span>
              <span>${formatActivity(pet.activity_level)}</span>
            </div>
          ` : ''}
        </div>
        ${goalText ? `<div class="pet-goal">${goalText}</div>` : ''}
        ${recommendation ? `
          <div class="pet-recommendation">
            <p>${recommendation}</p>
          </div>
        ` : ''}
        ${ordersForPet.length > 0 ? `
          <div class="pet-orders-summary" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(201, 163, 106, 0.15);">
            <p style="font-size: 0.9rem; color: var(--ink-700); margin: 0;">
              ${ordersForPet.length} order${ordersForPet.length > 1 ? 's' : ''} for ${pet.name}
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

async function renderSubscriptions(orders) {
  const container = document.getElementById('subscriptionsContainer');
  const noSubscriptionsState = document.getElementById('noSubscriptionsState');

  if (!container) {
    console.warn('⚠️ Subscriptions container not found');
    return;
  }

  try {
    console.log('📋 Fetching subscriptions from API...');
    
    // Check if API is available
    if (!window.subscriptionsAPI || !window.subscriptionsAPI.getMySubscriptions) {
      console.error('❌ subscriptionsAPI.getMySubscriptions is not available');
      container.style.display = 'none';
      if (noSubscriptionsState) noSubscriptionsState.style.display = 'block';
      return;
    }

    // Fetch subscriptions from new API
    console.log('🔍 Calling subscriptionsAPI.getMySubscriptions()...');
    console.log('🔍 API available:', !!window.subscriptionsAPI);
    console.log('🔍 Method available:', !!(window.subscriptionsAPI && window.subscriptionsAPI.getMySubscriptions));
    
    const response = await window.subscriptionsAPI.getMySubscriptions();
    console.log('📦 Subscriptions API response:', response);
    console.log('📦 Response type:', typeof response);
    console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
    
    // Handle different response formats
    let subscriptions = [];
    if (Array.isArray(response)) {
      subscriptions = response;
    } else if (response && response.subscriptions) {
      subscriptions = response.subscriptions;
    } else if (response && Array.isArray(response.data)) {
      subscriptions = response.data;
    }
    
    console.log(`✅ Found ${subscriptions.length} subscription(s) after parsing`);
    console.log('📋 Subscriptions:', subscriptions);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ No subscriptions found, showing empty state');
      console.log('📊 Container display before:', container.style.display);
      container.style.display = 'none';
      console.log('📊 Container display after:', container.style.display);
      if (noSubscriptionsState) {
        noSubscriptionsState.style.display = 'block';
        console.log('✅ Empty state shown');
      }
      return;
    }

    console.log('✅ Rendering subscriptions...');
    container.style.display = 'block';
    if (noSubscriptionsState) noSubscriptionsState.style.display = 'none';
    console.log('📊 Container display set to block');

    // Group subscriptions by pet
    const subscriptionsByPet = {};
    subscriptions.forEach(sub => {
      const petKey = sub.pet_name || 'Unknown Pet';
      if (!subscriptionsByPet[petKey]) {
        subscriptionsByPet[petKey] = [];
      }
      subscriptionsByPet[petKey].push(sub);
    });

    container.innerHTML = Object.entries(subscriptionsByPet).map(([petName, subs]) => {
      return `
        <div class="subscription-group" style="margin-bottom: 2rem; padding: 1.5rem; background: rgba(201, 163, 106, 0.05); border-radius: 12px; border: 1px solid rgba(201, 163, 106, 0.15);">
          <h3 style="margin: 0 0 1rem 0; color: var(--ink-900); font-size: 1.25rem;">
            ${escapeHtml(petName)}
          </h3>
          ${subs.map(sub => {
            const startDate = new Date(sub.start_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const endDate = new Date(sub.end_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            const planLabels = {
              weekly: 'Weekly Subscription',
              monthly: 'Monthly Subscription',
              quarterly: '3-Month Subscription'
            };

            // Status badge styling based on subscription status
            // Check order status - subscription should only be active if order is paid
            const isOrderPaid = sub.order_status === 'paid' || sub.order_status === 'Paid';
            
            // Debug logging
            console.log('🔍 Subscription status check:', {
              subscriptionId: sub.id,
              subscriptionStatus: sub.status,
              orderStatus: sub.order_status,
              isOrderPaid: isOrderPaid,
              paymentInvoiceId: sub.payment_invoice_id
            });
            
            let statusColor = '#1B8A5A'; // green for active
            let statusBg = 'rgba(27, 138, 90, 0.1)';
            let statusText = 'Active';
            
            // Map subscription status to display text
            if (sub.status === 'pending') {
              if (isOrderPaid) {
                // Pending subscription but order is paid - show as "Active" (payment successful)
                statusColor = '#1B8A5A'; // green
                statusBg = 'rgba(27, 138, 90, 0.1)';
                statusText = 'Active';
              } else {
                // Pending and not paid - show as "Pending Payment"
                statusColor = '#F59E0B'; // amber
                statusBg = 'rgba(245, 158, 11, 0.1)';
                statusText = 'Pending Payment';
              }
            } else if (sub.status === 'confirmed') {
              statusColor = '#1B8A5A'; // green
              statusBg = 'rgba(27, 138, 90, 0.1)';
              statusText = 'Confirmed';
            } else if (sub.status === 'expiring_soon') {
              statusColor = '#F59E0B'; // amber
              statusBg = 'rgba(245, 158, 11, 0.1)';
              statusText = 'Expiring Soon';
            } else if (sub.status === 'paused') {
              statusColor = '#6B7280'; // gray
              statusBg = 'rgba(107, 114, 128, 0.1)';
              statusText = 'Paused';
            } else if (sub.isExpired) {
              statusColor = '#DC2626'; // red
              statusBg = 'rgba(220, 38, 38, 0.1)';
              statusText = 'Expired';
            } else if (sub.isExpiringSoon) {
              statusColor = '#F59E0B'; // amber
              statusBg = 'rgba(245, 158, 11, 0.1)';
              statusText = 'Expiring Soon';
            } else if (sub.status === 'active') {
              // Active subscription - check if order is paid
              if (isOrderPaid) {
              statusColor = '#1B8A5A'; // green
              statusBg = 'rgba(27, 138, 90, 0.1)';
              statusText = 'Active';
              } else {
                // Active status but order not paid - show as pending
              statusColor = '#F59E0B'; // amber
              statusBg = 'rgba(245, 158, 11, 0.1)';
              statusText = 'Pending Payment';
              }
            }
            
            // Add "Complete Payment" button for pending subscriptions (only if order is NOT paid)
            let paymentButton = '';
            if ((sub.status === 'pending' || (sub.status === 'active' && !isOrderPaid)) && !isOrderPaid && sub.order_id) {
              paymentButton = `
                <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; padding: 0.75rem; margin-top: 1rem; border-radius: 4px;">
                  <div style="color: #F59E0B; font-weight: 600; margin-bottom: 0.25rem;">💳 Payment Required</div>
                  <div style="color: var(--ink-700); font-size: 0.9rem; margin-bottom: 0.75rem;">Complete your payment to activate this subscription.</div>
                  <button onclick="completeSubscriptionPayment(${sub.order_id})" style="background: #F59E0B; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Complete Payment</button>
                </div>
              `;
            }

            // Remaining days display
            const daysRemaining = sub.daysRemaining || 0;
            let daysDisplay = '';
            if (sub.isExpired) {
              daysDisplay = `<div style="color: #DC2626; font-weight: 600; margin-top: 0.5rem;">⚠️ Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago</div>`;
            } else if (sub.isExpiringSoon) {
              daysDisplay = `<div style="color: #F59E0B; font-weight: 600; margin-top: 0.5rem;">⏰ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining</div>`;
            } else {
              daysDisplay = `<div style="color: var(--ink-600); margin-top: 0.5rem;">✅ ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining</div>`;
            }

            // Renewal reminder
            let renewalReminder = '';
            if (sub.needsRenewal && !sub.isExpired) {
              renewalReminder = `
                <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #F59E0B; padding: 0.75rem; margin-top: 1rem; border-radius: 4px;">
                  <div style="color: #F59E0B; font-weight: 600; margin-bottom: 0.25rem;">🔔 Time to Renew!</div>
                  <div style="color: var(--ink-700); font-size: 0.9rem; margin-bottom: 0.75rem;">Your subscription expires soon. Renew now to continue receiving fresh meals.</div>
                  <button onclick="handleRenewSubscription(${sub.id})" style="background: #F59E0B; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Renew Subscription</button>
                </div>
              `;
            } else if (sub.isExpired) {
              renewalReminder = `
                <div style="background: rgba(220, 38, 38, 0.1); border-left: 3px solid #DC2626; padding: 0.75rem; margin-top: 1rem; border-radius: 4px;">
                  <div style="color: #DC2626; font-weight: 600; margin-bottom: 0.25rem;">⚠️ Subscription Expired</div>
                  <div style="color: var(--ink-700); font-size: 0.9rem; margin-bottom: 0.75rem;">Your subscription has expired. Renew now to continue receiving fresh meals.</div>
                  <button onclick="handleRenewSubscription(${sub.id})" style="background: #DC2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Renew Subscription</button>
                </div>
              `;
            }
            
            return `
              <div class="subscription-card" style="background: white; padding: 1.25rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(201, 163, 106, 0.1);">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                  <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                      <h4 style="margin: 0; color: var(--ink-900);">${planLabels[sub.plan_type] || sub.plan_type}</h4>
                      <div style="display: inline-block; padding: 0.25rem 0.75rem; background: ${statusBg}; color: ${statusColor}; border-radius: 6px; font-size: 0.85rem; font-weight: 600; text-transform: capitalize;">
                        ${statusText}
                      </div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--ink-700); margin-bottom: 0.75rem;">
                      <div>📅 Started: ${startDate}</div>
                      <div style="margin-top: 0.25rem;">📅 Ends: ${endDate}</div>
                      ${sub.next_delivery_date ? `
                        <div style="margin-top: 0.25rem; color: #C6A769; font-weight: 600;">
                          🚚 Next Delivery: ${new Date(sub.next_delivery_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      ` : ''}
                      ${daysDisplay}
                      <div style="margin-top: 0.5rem;">📦 ${sub.total_pouches || 'N/A'} pouches per period</div>
                      <div style="margin-top: 0.25rem;">⚖️ ${sub.daily_grams || 'N/A'}g/day (${sub.pouches_per_day ? (parseFloat(sub.pouches_per_day) || 0).toFixed(1) : 'N/A'} pouches/day)</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--ink-900); margin-bottom: 0.25rem;">
                      ${parseFloat(sub.price_per_period || 0).toFixed(3)} KD
                    </div>
                    <div style="font-size: 0.85rem; color: var(--ink-600);">
                      per ${sub.plan_type === 'weekly' ? 'week' : sub.plan_type === 'monthly' ? 'month' : '3 months'}
                    </div>
                  </div>
                </div>
                ${renewalReminder}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('❌ Error loading subscriptions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiAvailable: !!window.subscriptionsAPI,
      getMySubscriptionsAvailable: !!(window.subscriptionsAPI && window.subscriptionsAPI.getMySubscriptions)
    });
    
    // Show error message to user
    container.style.display = 'block';
    container.innerHTML = `
      <div style="padding: 2rem; text-align: center; background: rgba(220, 38, 38, 0.1); border-radius: 12px; border: 1px solid rgba(220, 38, 38, 0.2);">
        <p style="color: #DC2626; font-weight: 600; margin-bottom: 0.5rem;">Error Loading Subscriptions</p>
        <p style="color: var(--ink-700); font-size: 0.9rem; margin-bottom: 1rem;">${escapeHtml(error.message || 'Please try refreshing the page')}</p>
        <button onclick="location.reload()" class="btn btn-primary" style="font-size: 0.9rem; padding: 0.5rem 1rem;">Refresh Page</button>
      </div>
    `;
    
    if (noSubscriptionsState) noSubscriptionsState.style.display = 'none';
  }
}

// Handle subscription renewal
async function handleRenewSubscription(subscriptionId) {
  if (!confirm('Renew this subscription? You will be redirected to select a plan and complete checkout.')) {
    return;
  }

  try {
    // Get subscription details to redirect with pet info
    const subscription = await window.subscriptionsAPI.getSubscription(subscriptionId);
    
    // Redirect to subscriptions page with pet pre-selected
    if (subscription.pet_id) {
      window.location.href = `subscriptions.html?petId=${subscription.pet_id}&renew=true`;
    } else {
      window.location.href = 'subscriptions.html?renew=true';
    }
  } catch (error) {
    console.error('Error renewing subscription:', error);
    alert('Error loading subscription details. Please try again.');
  }
}

// Complete payment for pending subscription
async function completeSubscriptionPayment(orderId) {
  try {
    console.log('💳 [ACCOUNT] Completing payment for order:', orderId);
    
    // Get payment URL from backend
    const result = await window.checkoutAPI.getPaymentUrl(orderId);
    
    if (result.paymentUrl) {
      // Redirect to payment page
      window.location.href = result.paymentUrl;
    } else {
      throw new Error('No payment URL returned');
    }
  } catch (error) {
    console.error('❌ [ACCOUNT] Error getting payment URL:', error);
    alert('Error: ' + (error.message || 'Failed to get payment URL. Please contact support.'));
  }
}

// Make functions global for onclick handlers
window.handleRenewSubscription = handleRenewSubscription;
window.completeSubscriptionPayment = completeSubscriptionPayment;

function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');
  const noOrdersState = document.getElementById('noOrdersState');

  if (!orders || orders.length === 0) {
    container.style.display = 'none';
    noOrdersState.style.display = 'block';
    return;
  }

  container.style.display = 'block';
  noOrdersState.style.display = 'none';

  container.innerHTML = orders.map(order => {
    const date = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const itemsSummary = order.items.map(item => 
      `${item.product_name} × ${item.quantity}`
    ).join(', ');

    // Determine if order can be cancelled
    const canCancel = order.status === 'created' || order.status === 'paid';
    const isCancelled = order.status === 'cancelled';
    const isFulfilled = order.status === 'fulfilled';

    return `
      <div class="order-card">
        <div class="order-header">
          <div class="order-info">
            <h4>Order #${order.id}</h4>
            <div class="order-date">${date}</div>
            ${order.pet_name ? `<div style="font-size: 0.9rem; color: var(--ink-700); margin-top: 0.25rem;">For ${order.pet_name}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="order-status ${order.status}">${order.status}</div>
            <div class="order-total" style="margin-top: 0.5rem;">${parseFloat(order.total_amount).toFixed(3)} KD</div>
          </div>
        </div>
        <div class="order-items">
          <div class="order-item">
            <span>${itemsSummary}</span>
          </div>
        </div>
        ${canCancel ? `
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(201, 163, 106, 0.2);">
            <button onclick="handleCancelOrder(${order.id})" style="background: #DC2626; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">
              Cancel Order
            </button>
            ${order.status === 'paid' ? `
              <p style="font-size: 0.85rem; color: var(--ink-600); margin-top: 0.5rem;">
                ⚠️ Note: Cancelling a paid order may require a refund. Please contact support if you need assistance.
              </p>
            ` : ''}
          </div>
        ` : isCancelled ? `
          <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(220, 38, 38, 0.1); border-radius: 6px; border-left: 3px solid #DC2626;">
            <p style="color: #DC2626; font-weight: 600; margin: 0; font-size: 0.9rem;">Order Cancelled</p>
          </div>
        ` : isFulfilled ? `
          <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(27, 138, 90, 0.1); border-radius: 6px; border-left: 3px solid #1B8A5A;">
            <p style="color: #1B8A5A; font-weight: 600; margin: 0; font-size: 0.9rem;">✅ Order Fulfilled</p>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Handle order cancellation
async function handleCancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await window.ordersAPI.cancel(orderId);
    console.log('✅ Order cancelled:', response);
    
    // Show success message
    alert('Order cancelled successfully.');
    
    // Reload account data to refresh orders list
    await loadAccountData();
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    alert(error.message || 'Failed to cancel order. Please try again or contact support.');
  }
}

// Make function global for onclick handlers
window.handleCancelOrder = handleCancelOrder;

function getGoalText(goal) {
  const goals = {
    'maintain': 'Goal: Keep this healthy weight',
    'lose_weight': 'Goal: Gentle weight loss',
    'gain_weight': 'Goal: Healthy weight gain'
  };
  return goals[goal] || null;
}

function getPetRecommendation(pet) {
  if (!pet.weight_kg) return null;
  
  // Simple recommendation based on weight
  const dailyGrams = Math.round(pet.weight_kg * 0.0275 * 1000);
  const pouches = (dailyGrams / 150).toFixed(1);
  
  return `We recommend ~${dailyGrams}g/day (about ${pouches} pouches) for ${pet.name}.`;
}

function formatAgeGroup(age) {
  const ages = {
    'puppy': 'Puppy',
    'kitten': 'Kitten',
    'adult': 'Adult',
    'senior': 'Senior'
  };
  return ages[age] || age;
}

function formatActivity(activity) {
  const activities = {
    'low': 'Low',
    'normal': 'Normal',
    'high': 'High'
  };
  return activities[activity] || activity;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Pet Modal Functions
function setupPetModal() {
  const addBtn = document.getElementById('addPetBtn');
  
  // Add Pet button now opens questionnaire modal
  addBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openQuestionnaireForNewPet();
  });
}

/**
 * Open questionnaire modal for adding a new pet
 */
async function openQuestionnaireForNewPet() {
  // Check if questionnaire modal exists
  const questionnaireModal = document.getElementById('questionnaireModal');
  
  if (!questionnaireModal) {
    console.error('Questionnaire modal not found on account page');
    alert('Questionnaire form is not available. Please refresh the page.');
    return;
  }
  
  // Reset questionnaire wizard for new pet
  if (window.questionnaireWizard) {
    // Reset wizard state for new pet
    window.questionnaireWizard.resetForNewPet();
  }
  
  // Open the modal
  if (typeof window.openQuestionnaireModal === 'function') {
    window.openQuestionnaireModal();
  } else {
    questionnaireModal.classList.add('show');
    document.body.classList.add('modal-open');
  }
  
  // Re-render wizard with fresh state
  if (window.questionnaireWizard) {
    window.questionnaireWizard.renderWizard();
    window.questionnaireWizard.showSlide(1);
  }
}

async function editPet(id) {
  const pet = accountData.pets.find(p => p.id === id);
  if (!pet) return;

  document.getElementById('petModalTitle').textContent = 'Edit Pet';
  document.getElementById('petId').value = pet.id;
  document.getElementById('petName').value = pet.name;
  document.getElementById('petType').value = pet.type;
  document.getElementById('petBreed').value = pet.breed || '';
  document.getElementById('petWeight').value = pet.weight_kg || '';
  document.getElementById('petAge').value = pet.age_group || '';
  document.getElementById('petActivity').value = pet.activity_level || '';
  document.getElementById('petGoal').value = pet.goal || '';
  
  document.getElementById('petModal').style.display = 'block';
}

async function deletePet(id) {
  if (!confirm('Are you sure you want to delete this pet?')) return;

  try {
    await window.petsAPI.delete(id);
    await loadAccountData();
  } catch (error) {
    alert('Error deleting pet: ' + error.message);
  }
}

/**
 * Open questionnaire modal for editing existing pet
 */
async function openQuestionnaireForEdit() {
  // Check if questionnaire modal exists (might not be on account page)
  const questionnaireModal = document.getElementById('questionnaireModal');
  
  if (!questionnaireModal) {
    // Redirect to index page with questionnaire modal
    window.location.href = 'index.html?editPet=true';
    return;
  }
  
  // Open the modal
  if (typeof window.openQuestionnaireModal === 'function') {
    window.openQuestionnaireModal();
  } else {
    questionnaireModal.classList.add('show');
    document.body.classList.add('modal-open');
  }
  
  // The questionnaire wizard will automatically load existing pet data
  // when it initializes (check in loadExistingQuestionnaire method)
  // Force a reload if wizard is already initialized
  if (window.questionnaireWizard && typeof window.questionnaireWizard.loadExistingQuestionnaire === 'function') {
    await window.questionnaireWizard.loadExistingQuestionnaire();
    // Re-render the wizard with loaded data
    if (typeof window.questionnaireWizard.renderWizard === 'function') {
      window.questionnaireWizard.renderWizard();
      // Show first slide
      if (typeof window.questionnaireWizard.showSlide === 'function') {
        window.questionnaireWizard.showSlide(1);
      }
    }
  }
}

/**
 * Open questionnaire modal for editing a specific pet by ID
 */
async function editPetQuestionnaire(petId) {
  // Check if questionnaire modal exists
  const questionnaireModal = document.getElementById('questionnaireModal');
  
  if (!questionnaireModal) {
    // Redirect to index page with questionnaire modal and pet ID
    window.location.href = `index.html?editPet=true&petId=${petId}`;
    return;
  }
  
  // Load the pet data and set up the questionnaire wizard
  if (window.questionnaireWizard && typeof window.petsAPI !== 'undefined' && window.petsAPI.getOne) {
    try {
      // Load the pet data
      const pet = await window.petsAPI.getOne(petId);
      if (pet) {
        // Set the pet ID and edit mode
        window.questionnaireWizard.currentPetId = pet.id;
        window.questionnaireWizard.isEditMode = true;
        window.questionnaireWizard.hasExistingData = true;
        
        // Map pet data to questionnaire format
        if (typeof window.questionnaireWizard.mapPetToQuestionnaireData === 'function') {
          window.questionnaireWizard.formData = window.questionnaireWizard.mapPetToQuestionnaireData(pet);
        }
        
        // Load additional questionnaire fields (allergies, recommendations, etc.)
        if (typeof window.questionnaireWizard.loadQuestionnaireJSONForPet === 'function') {
          await window.questionnaireWizard.loadQuestionnaireJSONForPet(pet.id);
        }
      } else {
        console.error('Pet not found:', petId);
        alert('Pet not found. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
      alert('Error loading pet information. Please try again.');
      return;
    }
  } else {
    // Fallback: just set the pet ID
    if (window.questionnaireWizard) {
      window.questionnaireWizard.currentPetId = petId;
      window.questionnaireWizard.isEditMode = true;
      window.questionnaireWizard.hasExistingData = true;
    }
  }
  
  // Open the modal
  if (typeof window.openQuestionnaireModal === 'function') {
    window.openQuestionnaireModal();
  } else {
    questionnaireModal.classList.add('show');
    document.body.classList.add('modal-open');
  }
  
  // Re-render the wizard with loaded data
  if (window.questionnaireWizard) {
    // Log state before rendering for debugging
    console.log('🔍 Edit Pet State (before render):', {
      currentPetId: window.questionnaireWizard.currentPetId,
      isEditMode: window.questionnaireWizard.isEditMode,
      hasExistingData: window.questionnaireWizard.hasExistingData,
      petName: window.questionnaireWizard.formData?.name
    });
    
    if (typeof window.questionnaireWizard.renderWizard === 'function') {
      window.questionnaireWizard.renderWizard();
    }
    
    // Attach event listeners AFTER rendering to ensure form inputs are properly connected
    if (typeof window.questionnaireWizard.attachEventListeners === 'function') {
      window.questionnaireWizard.attachEventListeners();
    }
    
    // Show first slide
    if (typeof window.questionnaireWizard.showSlide === 'function') {
      window.questionnaireWizard.showSlide(1);
    }
    
    // Log state after rendering for debugging
    console.log('🔍 Edit Pet State (after render):', {
      currentPetId: window.questionnaireWizard.currentPetId,
      isEditMode: window.questionnaireWizard.isEditMode,
      hasExistingData: window.questionnaireWizard.hasExistingData,
      petName: window.questionnaireWizard.formData?.name
    });
  }
}

// Make functions global for onclick handlers
window.editPet = editPet;
window.deletePet = deletePet;
window.editPetQuestionnaire = editPetQuestionnaire;
window.openQuestionnaireForEdit = openQuestionnaireForEdit;
window.openQuestionnaireForNewPet = openQuestionnaireForNewPet;

