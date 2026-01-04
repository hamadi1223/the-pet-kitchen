// Cart Page Functionality
let cartData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for API to load
  if (typeof window.getToken !== 'function') {
    // Wait a bit more
    setTimeout(() => {
      if (!window.getToken || !window.getToken()) {
        window.location.href = 'login.html?redirect=cart';
        return;
      }
      initializeCart();
    }, 200);
    return;
  }

  // Check authentication
  if (!window.getToken()) {
    window.location.href = 'login.html?redirect=cart';
    return;
  }

  initializeCart();
});

async function initializeCart() {

  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
  });
  document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
    if (window.authAPI && window.authAPI.logout) {
      window.authAPI.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'index.html';
    }
  });

  // Load cart
  await loadCart();

  // Setup checkout
  document.getElementById('checkoutBtn')?.addEventListener('click', handleCheckout);
}

async function loadCart() {
  const loadingState = document.getElementById('loadingState');
  const cartContent = document.getElementById('cartContent');

  try {
    // Ensure API is loaded
    if (!window.cartAPI) {
      console.error('Cart API not loaded');
      loadingState.innerHTML = '<p>Error: API not loaded. Please refresh the page.</p>';
      return;
    }

    cartData = await window.cartAPI.get();
    
    loadingState.style.display = 'none';
    cartContent.style.display = 'block';

    renderCart();
  } catch (error) {
    console.error('Error loading cart:', error);
    loadingState.style.display = 'none';
    cartContent.style.display = 'block';
    
    // Show error message if it's an auth error
    if (error.message && error.message.includes('401') || error.message.includes('Unauthorized')) {
      document.getElementById('emptyCartState').innerHTML = `
        <div class="empty-icon">🔒</div>
        <h3>Please log in</h3>
        <p>You need to be logged in to view your cart.</p>
        <a href="login.html" class="btn btn-primary">Log In</a>
      `;
    } else {
      document.getElementById('emptyCartState').innerHTML = `
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Start adding meals for your pets</p>
        <a href="meal-plans.html" class="btn btn-primary">Browse Meal Plans</a>
      `;
    }
    document.getElementById('emptyCartState').style.display = 'block';
    document.getElementById('cartItemsContainer').style.display = 'none';
  }
}

function renderCart() {
  // Handle both response formats: cartData.items or cartData directly
  const items = cartData?.items || (Array.isArray(cartData) ? cartData : []);
  
  if (!items || items.length === 0) {
    document.getElementById('cartItemsContainer').style.display = 'none';
    document.getElementById('emptyCartState').style.display = 'block';
    document.getElementById('checkoutBtn').disabled = true;
    updateTotals(0);
    return;
  }

  document.getElementById('cartItemsContainer').style.display = 'block';
  document.getElementById('emptyCartState').style.display = 'none';
  document.getElementById('checkoutBtn').disabled = false;

  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = items.map(item => {
    const unitPrice = parseFloat(item.unit_price);
    const totalPrice = unitPrice * item.quantity;

    return `
      <div class="cart-item" data-item-id="${item.id}">
        <div class="cart-item-info">
          <div class="cart-item-name">${escapeHtml(item.product_name)}</div>
          <div class="cart-item-sku">SKU: ${escapeHtml(item.sku)}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">−</button>
              <span class="quantity-value">${item.quantity}</span>
              <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <button class="remove-item-btn" onclick="removeItem(${item.id})" title="Remove">🗑️ Remove</button>
          </div>
        </div>
        <div class="cart-item-price">
          <div class="item-unit-price">${unitPrice.toFixed(3)} KD each</div>
          <div class="item-total-price">${totalPrice.toFixed(3)} KD</div>
        </div>
      </div>
    `;
  }).join('');

  // Calculate total from items if not provided
  const total = cartData?.total 
    ? parseFloat(cartData.total) 
    : items.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * (item.quantity || 0)), 0);
  updateTotals(total);
}

function updateTotals(total) {
  document.getElementById('subtotal').textContent = `${total.toFixed(3)} KD`;
  document.getElementById('total').textContent = `${total.toFixed(3)} KD`;
}

async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) {
    await removeItem(itemId);
    return;
  }

  try {
    await window.cartAPI.updateItem(itemId, newQuantity);
    await loadCart();
  } catch (error) {
    alert('Error updating quantity: ' + error.message);
  }
}

async function removeItem(itemId) {
  if (!confirm('Remove this item from your cart?')) return;

  try {
    await window.cartAPI.removeItem(itemId);
    await loadCart();
  } catch (error) {
    alert('Error removing item: ' + error.message);
  }
}

async function handleCheckout() {
  const btn = document.getElementById('checkoutBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    console.log('🛒 [CART] Initiating checkout...');
    // Get user phone number if available
    let userPhone = null;
    const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
    if (currentUser && currentUser.phone) {
      userPhone = currentUser.phone;
    }
    
    // Try to get phone from cart items metadata (questionnaire data)
    const items = cartData?.items || (Array.isArray(cartData) ? cartData : []);
    if (!userPhone && items && items.length > 0) {
      for (const item of items) {
        if (item.meta) {
          try {
            const meta = typeof item.meta === 'string' ? JSON.parse(item.meta) : item.meta;
            if (meta.phone || meta.customer_phone || meta.pet_phone) {
              userPhone = meta.phone || meta.customer_phone || meta.pet_phone;
              break;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    const result = await window.checkoutAPI.initiate(null, userPhone);
    console.log('🛒 [CART] Checkout result:', result);
    // Redirect to payment page (MyFatoorah or test success page)
    if (result.paymentUrl) {
      window.location.href = result.paymentUrl;
    } else {
      throw new Error('No payment URL returned');
    }
  } catch (error) {
    console.error('❌ [CART] Checkout error:', error);
    console.error('❌ [CART] Error details:', {
      message: error.message,
      response: error.response,
      status: error.status
    });
    
    // Show more detailed error message
    let errorMsg = error.message || 'Unknown error';
    if (error.response && error.response.error) {
      errorMsg = error.response.error;
    } else if (error.errors && Array.isArray(error.errors)) {
      errorMsg = error.errors.map(e => e.msg || e.message).join(', ');
    }
    
    alert('Checkout error: ' + errorMsg);
    btn.disabled = false;
    btn.textContent = 'Proceed to Checkout';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions global for onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;

