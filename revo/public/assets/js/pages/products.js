// Products page functionality

let allProducts = [];
let filteredProducts = [];
let currentCity = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  setupFilters();
  setupSearch(handleSearch);

  window.addEventListener('revo:city-changed', loadProducts);
});

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');

  if (!grid) {
    return;
  }

  const loader = '<div class="loader-container"><div class="spinner"></div></div>';
  grid.innerHTML = loader;

  const city = cityStore.get();
  if (currentCity === city && allProducts.length) {
    filteredProducts = allProducts;
    renderProducts();
    return;
  }

  currentCity = city;
  allProducts = await api.getProducts({ city });
  filteredProducts = allProducts;

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');

  if (!grid) {
    return;
  }

  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    if (emptyState) toggleElement(emptyState, true);
    return;
  }

  if (emptyState) toggleElement(emptyState, false);
  grid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  filteredProducts.forEach(product => {
    fragment.appendChild(createProductCard(product));
  });
  grid.appendChild(fragment);
}

function setupFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;

      if (filter === 'all') {
        filteredProducts = allProducts;
      } else {
        const normalized = filter.toLowerCase();
        filteredProducts = allProducts.filter(p =>
          p.brand === filter || p.model.toLowerCase().includes(normalized)
        );
      }

      renderProducts();
    });
  });
}

function handleSearch(query) {
  if (!query) {
    filteredProducts = allProducts;
  } else {
    const search = query.toLowerCase();
    filteredProducts = allProducts.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search) ||
      p.model.toLowerCase().includes(search)
    );
  }
  renderProducts();
}
