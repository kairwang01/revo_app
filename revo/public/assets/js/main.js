// Main application initialization
// hi, this file ties loose ends together, like duct tape but nicer

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', () => {
  enforceSecureContext();
  initBackend();
  // Setup city dropdown if it exists
  setupCityDropdown();
  
  // Update active tab in bottom navigation
  updateActiveTab();
  
  // Setup cart icon if it exists
  updateCartBadge();
  
  // Listen for cart changes
  window.addEventListener('revo:cart-changed', updateCartBadge);
});

async function initBackend() {
  if (typeof api === 'undefined') {
    console.warn('API module not available');
    return;
  }

  const shouldInit = (typeof CONFIG !== 'undefined' && CONFIG.FEATURES?.AUTO_INIT !== undefined)
    ? CONFIG.FEATURES.AUTO_INIT
    : true;

  if (!shouldInit) {
    return;
  }

  try {
    await api.init();
  } catch (error) {
    console.error('Failed to initialize backend connection:', error);
  }
}

// Encourage secure transport for auth and payments
function enforceSecureContext() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (window.location.protocol === 'http:' && !isLocal) {
    console.warn('Insecure HTTP detected. Switch to HTTPS to protect authentication and payment flows.');
  }
}

// Update active tab in bottom navigation
function updateActiveTab() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const tabs = document.querySelectorAll('.tab-item');

  tabs.forEach(tab => {
    const href = tab.getAttribute('href');
    if (!href) {
      return;
    }

    const tabPath = new URL(href, window.location.origin).pathname.replace(/\/$/, '');
    tab.classList.toggle('active', tabPath === currentPath);
  });
}

// Update cart badge
function updateCartBadge() {
  const cartCount = cartStore.getCount();
  const cartBadges = document.querySelectorAll('[data-cart-count]');
  
  cartBadges.forEach(badge => {
    badge.textContent = cartCount;
    badge.style.display = cartCount > 0 ? 'block' : 'none';
  });
}
