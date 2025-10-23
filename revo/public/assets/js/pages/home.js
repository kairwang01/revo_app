// Home page functionality

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadDeals();
  await loadCuratedProducts();
  
  // Listen for city changes
  window.addEventListener('revo:city-changed', async (e) => {
    await loadDeals();
    await loadCuratedProducts();
  });
});

// Load categories
async function loadCategories() {
  const container = document.getElementById('categories');
  if (!container) return;
  
  const categories = await api.getCategories();
  
  container.innerHTML = categories.map(cat => `
    <div class="category-item" data-category="${cat.id}">
      <div class="category-icon">
        <span style="font-size: 1.5rem;">${cat.icon}</span>
      </div>
      <span style="font-size: 0.875rem;">${cat.name}</span>
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      sessionStorage.setItem('selectedCategory', category);
      window.location.href = './products.html';
    });
  });
}

// Load deals
async function loadDeals() {
  const dealsBody = document.getElementById('deals-content');
  if (!dealsBody) return;
  
  dealsBody.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
  
  const city = cityStore.get();
  const products = await api.getProducts({ city });
  
  // Get top deals
  const deals = products
    .filter(p => p.originalPrice && p.originalPrice > p.price)
    .sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price))
    .slice(0, 3);
  
  if (deals.length === 0) {
    dealsBody.innerHTML = '<p class="text-muted">No deals available in this city yet.</p>';
    return;
  }
  
  dealsBody.innerHTML = deals.map(product => {
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    return `
      <div class="deal-card">
        <span class="deal-offer">+${discount}% Voucher</span>
        <h3 style="margin:0.5rem 0;font-size:0.95rem;">${product.name}</h3>
        <div class="text-muted" style="font-size:0.875rem;">${product.brand} - ${product.location}</div>
        <div class="price-line" style="margin-top:0.5rem;">
          <strong>${formatMoney(product.price)}</strong>
          <span class="text-muted" style="text-decoration:line-through;font-size:0.8rem;">${formatMoney(product.originalPrice)}</span>
        </div>
        <a href="./product-detail.html?id=${product.id}" class="btn btn-outline btn-sm" style="margin-top:0.75rem;">
          Preview →
        </a>
      </div>
    `;
  }).join('');
}

// Load curated products
async function loadCuratedProducts() {
  const grid = document.getElementById('curated-grid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
  
  const city = cityStore.get();
  const products = await api.getProducts({ city });
  const curated = products.slice(0, 4);
  
  grid.innerHTML = '';
  curated.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}
