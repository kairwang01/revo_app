// UI utility functions
// lil bag of tricks, handle with mild optimism

// Format money
function formatMoney(amount, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Toggle element visibility
function toggleElement(element, show) {
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

let apiErrorNoticeShown = false;

window.addEventListener('revo:api-error', (event) => {
  if (apiErrorNoticeShown) {
    return;
  }
  apiErrorNoticeShown = true;

  const endpoint = event?.detail?.endpoint;
  const warning = endpoint
    ? `Live data is temporarily unavailable (failed to reach ${endpoint}).`
    : 'Live data is temporarily unavailable.';

  if (typeof showToast === 'function') {
    showToast(warning, 'error');
  } else {
    console.warn(warning);
  }
});

// Create product card element
function createProductCard(product) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  
  const card = document.createElement('a');
  card.href = `./product-detail.html?id=${product.id}`;
  card.className = 'product-card';
  
  card.innerHTML = `
    <img src="${product.image}" alt="${product.name}" loading="lazy">
    <div class="meta">
      <div class="text-muted">${product.brand} - ${product.model}</div>
      <h3>${product.name}</h3>
      <div class="price-line">
        <strong class="price">${formatMoney(product.price)}</strong>
        <span class="text-muted" style="text-decoration:line-through;font-size:0.8rem;">${formatMoney(product.originalPrice)}</span>
        <span class="badge">${discount}% off</span>
      </div>
    </div>
  `;
  
  return card;
}

// Setup city dropdown
function setupCityDropdown() {
  const toggle = document.getElementById('city-toggle');
  const menu = document.getElementById('city-menu');
  const selectedCity = document.getElementById('selected-city');
  
  if (!toggle || !menu) return;
  
  // Set initial city
  const currentCity = cityStore.get();
  if (selectedCity) {
    selectedCity.textContent = currentCity;
  }
  
  // Toggle dropdown
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    menu.classList.add('hidden');
  });
  
  // Handle city selection
  const cityItems = menu.querySelectorAll('.dropdown-item');
  cityItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const city = item.dataset.city;
      cityStore.set(city);
      if (selectedCity) {
        selectedCity.textContent = city;
      }
      menu.classList.add('hidden');
      showToast(`City changed to ${city}`);
    });
  });
}

// Setup search functionality
function setupSearch(onSearch) {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  
  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (onSearch) {
        onSearch(e.target.value);
      }
    }, 300);
  });
}

// Get URL parameters
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Scroll to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Check if user is authenticated and redirect if needed
function requireAuth() {
  if (!authStore.isAuthenticated()) {
    window.location.href = './login.html';
    return false;
  }
  return true;
}
