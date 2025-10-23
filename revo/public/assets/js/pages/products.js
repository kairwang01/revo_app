// Products page functionality

let allProducts = [];
let filteredProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  setupFilters();
  setupSearch(handleSearch);
  
  window.addEventListener('revo:city-changed', loadProducts);
});

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  
  grid.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
  
  const city = cityStore.get();
  allProducts = await api.getProducts({ city });
  filteredProducts = allProducts;
  
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredProducts.length === 0) {
    grid.innerHTML = '';
    toggleElement(emptyState, true);
    return;
  }
  
  toggleElement(emptyState, false);
  grid.innerHTML = '';
  filteredProducts.forEach(product => {
    grid.appendChild(createProductCard(product));
  });
}

function setupFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');
  
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      // Update active state
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const filter = chip.dataset.filter;
      
      if (filter === 'all') {
        filteredProducts = allProducts;
      } else {
        filteredProducts = allProducts.filter(p => 
          p.brand === filter || p.model.toLowerCase().includes(filter.toLowerCase())
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
