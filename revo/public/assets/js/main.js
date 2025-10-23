// Main application initialization

// Initialize common UI elements
document.addEventListener('DOMContentLoaded', () => {
  // Setup city dropdown if it exists
  setupCityDropdown();
  
  // Update active tab in bottom navigation
  updateActiveTab();
  
  // Setup cart icon if it exists
  updateCartBadge();
  
  // Listen for cart changes
  window.addEventListener('revo:cart-changed', updateCartBadge);
});

// Update active tab in bottom navigation
function updateActiveTab() {
  const currentPath = window.location.pathname;
  const tabs = document.querySelectorAll('.tab-item');
  
  tabs.forEach(tab => {
    const href = tab.getAttribute('href');
    if (href && currentPath.includes(href.replace('./', ''))) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
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
