// Main application initialization
// hi, this file ties loose ends together, like duct tape but nicer

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', () => {
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
