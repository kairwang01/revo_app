// Home page functionality

let cachedHomeProducts = [];
let cachedCity = null;
let loadMarker = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.allSettled([loadCategories(), refreshHomeProducts()]);

  window.addEventListener('revo:city-changed', ({ detail }) => {
    refreshHomeProducts(detail);
  });
});

async function loadCategories() {
  const container = document.getElementById('categories');
  if (!container) return;

  try {
    const categories = await api.getCategories();

    if (!Array.isArray(categories) || categories.length === 0) {
      container.innerHTML = '<p class="text-muted">No categories available.</p>';
      return;
    }

    container.innerHTML = categories.map(cat => `
      <div class="category-item" data-category="${cat.id}">
        <div class="category-icon">
          <span style="font-size: 1.5rem;">${cat.icon}</span>
        </div>
        <span style="font-size: 0.875rem;">${cat.name}</span>
      </div>
    `).join('');

    container.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        const category = item.dataset.category;
        sessionStorage.setItem('selectedCategory', category);
        window.location.href = './products.html';
      });
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = '<p class="text-muted">Unable to load categories right now.</p>';
  }
}

async function refreshHomeProducts(detail) {
  const dealsBody = document.getElementById('deals-content');
  const curatedGrid = document.getElementById('curated-grid');

  if (!dealsBody && !curatedGrid) {
    return;
  }

  const city = extractCityKey(detail);

  if (cachedCity === city && cachedHomeProducts.length) {
    if (dealsBody) renderDealsSection(cachedHomeProducts, dealsBody);
    if (curatedGrid) renderCuratedSection(cachedHomeProducts, curatedGrid);
    return;
  }

  const loader = '<div class="loader-container"><div class="spinner"></div></div>';
  if (dealsBody) {
    dealsBody.innerHTML = loader;
  }
  if (curatedGrid) {
    curatedGrid.innerHTML = loader;
  }

  const marker = ++loadMarker;

  try {
    const products = await api.getProducts({ city });

    if (marker !== loadMarker) {
      return;
    }

    cachedHomeProducts = products;
    cachedCity = city;

    if (dealsBody) renderDealsSection(products, dealsBody);
    if (curatedGrid) renderCuratedSection(products, curatedGrid);
  } catch (error) {
    console.error('Error loading home products:', error);

    if (marker !== loadMarker) {
      return;
    }

    const fallback = '<p class="text-muted">Unable to load data right now. Please try again shortly.</p>';

    if (dealsBody) dealsBody.innerHTML = fallback;
    if (curatedGrid) curatedGrid.innerHTML = fallback;
  }
}

function extractCityKey(detail) {
  if (typeof detail === 'string' && detail) {
    return detail;
  }

  if (detail && typeof detail === 'object') {
    return detail.key || detail.name || cityStore.get();
  }

  return cityStore.get();
}

function renderDealsSection(products, container) {
  const deals = products
    .filter(product => {
      const price = Number(product.price);
      const original = Number(product.originalPrice);
      return Number.isFinite(price) && Number.isFinite(original) && original > price;
    })
    .sort((a, b) => {
      const discountA = Number(a.originalPrice) - Number(a.price);
      const discountB = Number(b.originalPrice) - Number(b.price);
      return discountB - discountA;
    })
    .slice(0, 3);

  if (deals.length === 0) {
    container.innerHTML = '<p class="text-muted">No deals available in this city yet.</p>';
    return;
  }

  container.innerHTML = deals.map(product => {
    const price = Number(product.price);
    const original = Number(product.originalPrice);
    const discount = original > price ? Math.round((1 - price / original) * 100) : 0;

    return `
      <div class="deal-card">
        <span class="deal-offer">+${discount}% Voucher</span>
        <h3 style="margin:0.5rem 0;font-size:0.95rem;">${product.name}</h3>
        <div class="text-muted" style="font-size:0.875rem;">${product.brand} - ${product.location}</div>
        <div class="price-line" style="margin-top:0.5rem;">
          <strong>${formatMoney(price)}</strong>
          <span class="text-muted" style="text-decoration:line-through;font-size:0.8rem;">${formatMoney(original)}</span>
        </div>
        <a href="./product-detail.html?id=${product.id}" class="btn btn-outline btn-sm" style="margin-top:0.75rem;">
          Preview &rarr;
        </a>
      </div>
    `;
  }).join('');
}

function renderCuratedSection(products, container) {
  const curated = products.slice(0, 4);

  if (curated.length === 0) {
    container.innerHTML = '<p class="text-muted">No products available for this city.</p>';
    return;
  }

  container.innerHTML = '';
  curated.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}
