/**
 * Admin Products Management
 * Handles product listing, price updates, and stock management
 */

// Load products with inventory data
async function loadProducts() {
  try {
    const products = await adminAPI.getProducts();
    renderProducts(products);
    
    // Setup refresh button
    const refreshBtn = document.getElementById('refreshProductsBtn');
    if (refreshBtn && !refreshBtn.dataset.listenerAdded) {
      refreshBtn.dataset.listenerAdded = 'true';
      refreshBtn.addEventListener('click', () => {
        loadProducts();
        loadLowStockAlerts();
      });
    }
  } catch (error) {
    console.error('Error loading products:', error);
    const container = document.getElementById('productsContainer');
    if (container) {
      container.innerHTML = `<div class="error-message">Error loading products: ${error.message}</div>`;
    }
  }
}

// Render products list
function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = '<p>No products found.</p>';
    return;
  }
  
  const html = products.map(product => {
    const availableStock = (product.available_stock || product.stock_quantity || 0) - (product.reserved_quantity || 0);
    const isLowStock = availableStock <= (product.low_stock_threshold || 10);
    const stockClass = isLowStock ? 'low-stock' : availableStock === 0 ? 'out-of-stock' : '';
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-header">
          <h3>${product.name || 'Unnamed Product'}</h3>
          <span class="product-sku">SKU: ${product.sku || 'N/A'}</span>
        </div>
        
        <div class="product-details">
          <div class="detail-row">
            <span class="detail-label">Price:</span>
            <span class="detail-value">
              <input type="number" 
                     step="0.001" 
                     min="0" 
                     value="${parseFloat(product.price_per_pouch || 0).toFixed(3)}" 
                     class="price-input"
                     data-product-id="${product.id}"
                     data-old-price="${product.price_per_pouch}">
              <span>KD</span>
              <button class="btn btn-sm btn-primary save-price-btn" 
                      data-product-id="${product.id}"
                      style="margin-left: 0.5rem; padding: 0.25rem 0.75rem;">
                Save
              </button>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Stock:</span>
            <span class="detail-value stock-display ${stockClass}">
              <strong>${availableStock}</strong> available
              ${product.reserved_quantity > 0 ? `(${product.reserved_quantity} reserved)` : ''}
              ${isLowStock ? '<span class="low-stock-badge">⚠️ Low Stock</span>' : ''}
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Stock Actions:</span>
            <span class="detail-value">
              <div class="stock-actions">
                <input type="number" 
                       min="0" 
                       step="1" 
                       placeholder="Quantity" 
                       class="stock-quantity-input"
                       data-product-id="${product.id}">
                <button class="btn btn-sm btn-success stock-action-btn" 
                        data-action="add"
                        data-product-id="${product.id}">
                  + Add
                </button>
                <button class="btn btn-sm btn-warning stock-action-btn" 
                        data-action="reduce"
                        data-product-id="${product.id}">
                  - Reduce
                </button>
                <button class="btn btn-sm btn-secondary stock-action-btn" 
                        data-action="set"
                        data-product-id="${product.id}">
                  = Set
                </button>
              </div>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Low Stock Threshold:</span>
            <span class="detail-value">
              <input type="number" 
                     min="0" 
                     step="1" 
                     value="${product.low_stock_threshold || 10}" 
                     class="threshold-input"
                     data-product-id="${product.id}">
              <button class="btn btn-sm btn-outline update-threshold-btn" 
                      data-product-id="${product.id}"
                      style="margin-left: 0.5rem; padding: 0.25rem 0.75rem;">
                Update
              </button>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              ${product.is_active ? '<span class="status-badge active">Active</span>' : '<span class="status-badge inactive">Inactive</span>'}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  container.innerHTML = html;
  
  // Attach event listeners
  attachProductEventListeners();
}

// Attach event listeners for product actions
function attachProductEventListeners() {
  // Price update
  document.querySelectorAll('.save-price-btn').forEach(btn => {
    if (btn.dataset.listenerAdded) return;
    btn.dataset.listenerAdded = 'true';
    btn.addEventListener('click', async (e) => {
      const productId = e.target.dataset.productId;
      const priceInput = document.querySelector(`.price-input[data-product-id="${productId}"]`);
      const oldPrice = parseFloat(priceInput.dataset.oldPrice);
      const newPrice = parseFloat(priceInput.value);
      
      if (isNaN(newPrice) || newPrice < 0) {
        alert('Please enter a valid price (positive number)');
        return;
      }
      
      if (newPrice === oldPrice) {
        alert('Price unchanged');
        return;
      }
      
      try {
        btn.disabled = true;
        btn.textContent = 'Saving...';
        
        const result = await adminAPI.updateProductPrice(productId, newPrice);
        
        if (result.success) {
          priceInput.dataset.oldPrice = newPrice.toFixed(3);
          alert(`Price updated: ${oldPrice.toFixed(3)} KD → ${newPrice.toFixed(3)} KD`);
          loadProducts(); // Refresh to show updated data
        } else {
          alert(`Failed to update price: ${result.error || 'Unknown error'}`);
          priceInput.value = oldPrice.toFixed(3); // Revert
        }
      } catch (error) {
        console.error('Error updating price:', error);
        alert(`Error updating price: ${error.message}`);
        priceInput.value = oldPrice.toFixed(3); // Revert
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save';
      }
    });
  });
  
  // Stock actions
  document.querySelectorAll('.stock-action-btn').forEach(btn => {
    if (btn.dataset.listenerAdded) return;
    btn.dataset.listenerAdded = 'true';
    btn.addEventListener('click', async (e) => {
      const productId = e.target.dataset.productId;
      const action = e.target.dataset.action;
      const quantityInput = document.querySelector(`.stock-quantity-input[data-product-id="${productId}"]`);
      const quantity = parseInt(quantityInput.value);
      
      if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity (positive number)');
        return;
      }
      
      const reason = prompt(`Reason for ${action === 'set' ? 'setting' : action === 'add' ? 'adding' : 'reducing'} stock:`);
      if (reason === null) return; // User cancelled
      
      try {
        btn.disabled = true;
        btn.textContent = 'Updating...';
        
        const result = await adminAPI.updateProductStock(productId, action, quantity, reason);
        
        if (result.success) {
          alert(`Stock updated: ${result.previousStock} → ${result.newStock} (${action === 'set' ? 'set to' : action === 'add' ? '+' : '-'}${quantity})`);
          quantityInput.value = '';
          loadProducts(); // Refresh
          loadLowStockAlerts(); // Refresh alerts
        } else {
          alert(`Failed to update stock: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating stock:', error);
        alert(`Error updating stock: ${error.message}`);
      } finally {
        btn.disabled = false;
        btn.textContent = action === 'set' ? '= Set' : action === 'add' ? '+ Add' : '- Reduce';
      }
    });
  });
}

// Load low stock alerts
async function loadLowStockAlerts() {
  try {
    const products = await adminAPI.getLowStockProducts();
    renderLowStockAlerts(products);
  } catch (error) {
    console.error('Error loading low stock alerts:', error);
  }
}

// Render low stock alerts
function renderLowStockAlerts(products) {
  const container = document.getElementById('lowStockAlerts');
  if (!container) return;
  
  if (products.length === 0) {
    container.innerHTML = '<p style="color: #059669;">✅ All products have sufficient stock.</p>';
    return;
  }
  
  const html = products.map(product => `
    <div class="status-card" style="border-left-color: #DC2626;">
      <div class="icon" style="background-color: rgba(220, 38, 38, 0.2); color: #DC2626;">⚠️</div>
      <div class="details">
        <div class="label">${product.name} (${product.sku})</div>
        <div class="sub-label">
          Stock: ${product.quantity} | 
          Reserved: ${product.reserved_quantity} | 
          Available: ${product.available} | 
          Threshold: ${product.low_stock_threshold}
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

// Add to adminAPI if not exists
if (window.adminAPI) {
  window.adminAPI.getProducts = async () => {
    return await apiRequest('/admin/products');
  };
  
  window.adminAPI.updateProductPrice = async (productId, price) => {
    return await apiRequest(`/admin/products/${productId}/price`, {
      method: 'PATCH',
      body: JSON.stringify({ price })
    });
  };
  
  window.adminAPI.updateProductStock = async (productId, action, quantity, reason) => {
    return await apiRequest(`/admin/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ action, quantity, reason })
    });
  };
  
  window.adminAPI.getLowStockProducts = async (threshold = null) => {
    const url = threshold ? `/admin/products/low-stock?threshold=${threshold}` : '/admin/products/low-stock';
    return await apiRequest(url);
  };
}

// Show Add Product Modal
function showProductAddModal() {
  const modal = document.getElementById('productAddModal');
  if (!modal) {
    console.error('Product add modal not found');
    return;
  }
  
  // Reset form
  const form = document.getElementById('productAddForm');
  if (form) {
    form.reset();
    // Set default values
    document.getElementById('addProductSpecies').value = 'both';
    document.getElementById('addPouchGrams').value = '150';
    document.getElementById('addStockQuantity').value = '0';
    document.getElementById('addIsActive').checked = true;
    document.getElementById('addIsSubscription').checked = false;
    document.getElementById('addSubscriptionTypeGroup').style.display = 'none';
  }
  
  // Show modal
  modal.style.display = 'block';
  
  // Setup subscription type toggle
  const isSubscriptionCheckbox = document.getElementById('addIsSubscription');
  const subscriptionTypeGroup = document.getElementById('addSubscriptionTypeGroup');
  if (isSubscriptionCheckbox && subscriptionTypeGroup) {
    // Remove existing listeners to avoid duplicates
    const newCheckbox = isSubscriptionCheckbox.cloneNode(true);
    isSubscriptionCheckbox.parentNode.replaceChild(newCheckbox, isSubscriptionCheckbox);
    newCheckbox.addEventListener('change', function() {
      subscriptionTypeGroup.style.display = this.checked ? 'block' : 'none';
    });
  }
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeProductAddModal();
    }
  });
}

// Close Add Product Modal
function closeProductAddModal() {
  const modal = document.getElementById('productAddModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Initialize Add Product functionality
function initializeAddProduct() {
  // Add button click handler
  const addBtn = document.getElementById('addNewProductBtn');
  if (addBtn && !addBtn.dataset.listenerAdded) {
    addBtn.dataset.listenerAdded = 'true';
    addBtn.addEventListener('click', showProductAddModal);
  }
  
  // Close button handlers
  const closeBtn = document.getElementById('closeProductAddModal');
  if (closeBtn && !closeBtn.dataset.listenerAdded) {
    closeBtn.dataset.listenerAdded = 'true';
    closeBtn.addEventListener('click', closeProductAddModal);
  }
  
  const cancelBtn = document.getElementById('cancelProductAddBtn');
  if (cancelBtn && !cancelBtn.dataset.listenerAdded) {
    cancelBtn.dataset.listenerAdded = 'true';
    cancelBtn.addEventListener('click', closeProductAddModal);
  }
  
  // Form submission handler
  const form = document.getElementById('productAddForm');
  if (form && !form.dataset.listenerAdded) {
    form.dataset.listenerAdded = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        // Collect form data
        const formData = {
          sku: document.getElementById('addProductSKU').value.trim(),
          name: document.getElementById('addProductName').value.trim(),
          description: document.getElementById('addProductDescription').value.trim() || null,
          species: document.getElementById('addProductSpecies').value,
          price_per_pouch: parseFloat(document.getElementById('addPricePerPouch').value),
          pouch_grams: parseInt(document.getElementById('addPouchGrams').value),
          stock_quantity: parseInt(document.getElementById('addStockQuantity').value) || 0,
          is_active: document.getElementById('addIsActive').checked,
          is_subscription: document.getElementById('addIsSubscription').checked,
          subscription_type: document.getElementById('addIsSubscription').checked 
            ? document.getElementById('addSubscriptionType').value 
            : null
        };
        
        // Validate required fields
        if (!formData.sku || !formData.name || !formData.price_per_pouch || !formData.pouch_grams) {
          alert('Please fill in all required fields');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }
        
        // Call API
        if (!window.adminAPI || !window.adminAPI.createProduct) {
          throw new Error('Admin API not available. Please refresh the page.');
        }
        
        const result = await window.adminAPI.createProduct(formData);
        
        if (result.product) {
          alert(`Product "${result.product.name}" created successfully!`);
          closeProductAddModal();
          loadProducts(); // Refresh product list
        } else {
          throw new Error(result.error || 'Failed to create product');
        }
      } catch (error) {
        console.error('Error creating product:', error);
        let errorMessage = error.message || 'Unknown error';
        if (errorMessage.includes('SKU already exists')) {
          errorMessage = 'This SKU already exists. Please use a unique SKU.';
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          errorMessage = 'Cannot connect to backend server. Make sure the backend is running.';
        }
        alert(`Error creating product: ${errorMessage}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAddProduct);
} else {
  initializeAddProduct();
}

// Export functions
window.loadProducts = loadProducts;
window.loadLowStockAlerts = loadLowStockAlerts;
window.showProductAddModal = showProductAddModal;
window.closeProductAddModal = closeProductAddModal;

