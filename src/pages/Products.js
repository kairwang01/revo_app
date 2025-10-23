import { api } from '../app/api.js';
import { cityStore } from '../app/storage.js';
import { enforceAllowedBrands, ensureAllowedCity } from '../app/guards.js';
import { actionSheet, el, icon, lazy, money, toast } from '../app/ui.js';

let root;
let cityListener;

const priceFilters = [
  { value: 'all', label: 'Any price' },
  { value: 'under-900', label: 'Under $900' },
  { value: '900-1300', label: '$900 to $1,300' },
  { value: 'over-1300', label: 'Over $1,300' }
];

const state = {
  q: '',
  sort: 'relevance',
  brand: 'All',
  price: 'all'
};

function productCard(product) {
  const card = el('a', { class: 'product-card', href: `#/product/${product.id}` });
  const img = el('img', { alt: product.name, width: 320, height: 240 });
  lazy(img, product.image);
  card.appendChild(img);
  const meta = el('div', { class: 'meta' });
  meta.append(
    el('div', { class: 'muted', text: `${product.brand} - ${product.location}` }),
    el('h3', {}, product.name),
    el('div', { class: 'price-line' }, [
      el('strong', { text: money(product.price) }),
      el('span', { class: 'muted', style: 'text-decoration:line-through;font-size:0.8rem;' }, money(product.originalPrice))
    ]),
    el('div', { class: 'muted', style: 'font-size:0.8rem;' }, `${product.condition} - ${product.rating}/5 (${product.reviews} reviews)`)
  );
  card.appendChild(meta);
  return card;
}

function applyFilters(list) {
  let filtered = list;
  if (state.brand !== 'All') {
    filtered = filtered.filter((item) => item.brand === state.brand);
  }
  switch (state.price) {
    case 'under-900':
      filtered = filtered.filter((item) => item.price < 900);
      break;
    case '900-1300':
      filtered = filtered.filter((item) => item.price >= 900 && item.price <= 1300);
      break;
    case 'over-1300':
      filtered = filtered.filter((item) => item.price > 1300);
      break;
    default:
      break;
  }
  return filtered;
}

async function loadProducts() {
  const grid = root.querySelector('.product-grid');
  const empty = root.querySelector('[data-empty]');
  grid.innerHTML = '';
  empty.hidden = true;
  const city = ensureAllowedCity(cityStore.get());
  let products;
  if (state.q) {
    products = await api.searchProducts({ q: state.q, city, sort: state.sort });
  } else {
    products = await api.getProducts({ city });
    if (state.sort !== 'relevance') {
      products = await api.searchProducts({ sort: state.sort, city });
    }
  }
  let list = applyFilters(enforceAllowedBrands(products));
  if (!list.length) {
    empty.hidden = false;
    return;
  }
  list.forEach((product) => grid.appendChild(productCard(product)));
}

function buildFilters(container) {
  const toolbar = el('div', { class: 'products-toolbar' });

  const sortBtn = el('button', { class: 'filter-btn', type: 'button' }, ['Sort', icon('chevron-right', { size: 14, className: 'sm' })]);
  sortBtn.addEventListener('click', async () => {
    const choice = await actionSheet({
      title: 'Sort products',
      selectedValue: state.sort,
      options: [
        { value: 'relevance', label: 'Relevance' },
        { value: 'price-asc', label: 'Price: Low to High' },
        { value: 'price-desc', label: 'Price: High to Low' },
        { value: 'newest', label: 'Newest' }
      ]
    });
    if (choice && choice !== state.sort) {
      state.sort = choice;
      await loadProducts();
    }
  });

  const priceBtn = el('button', { class: 'filter-btn', type: 'button' }, ['Price', icon('chevron-right', { size: 14, className: 'sm' })]);
  priceBtn.addEventListener('click', async () => {
    const choice = await actionSheet({
      title: 'Price range',
      selectedValue: state.price,
      options: priceFilters
    });
    if (choice && choice !== state.price) {
      state.price = choice;
      await loadProducts();
    }
  });

  const modelBtn = el('button', { class: 'filter-btn', type: 'button' }, ['Brand', icon('chevron-right', { size: 14, className: 'sm' })]);
  modelBtn.addEventListener('click', async () => {
    const choice = await actionSheet({
      title: 'Brand',
      selectedValue: state.brand,
      options: [
        { value: 'All', label: 'Apple & Samsung' },
        { value: 'Apple', label: 'Apple only' },
        { value: 'Samsung', label: 'Samsung only' }
      ]
    });
    if (choice && choice !== state.brand) {
      state.brand = choice;
      await loadProducts();
    }
  });

  const filterBtn = el('button', { class: 'filter-btn', type: 'button' }, ['Filter', icon('chevron-right', { size: 14, className: 'sm' })]);
  filterBtn.addEventListener('click', () => toast('Additional filters coming soon'));

  toolbar.append(sortBtn, priceBtn, modelBtn, filterBtn);
  container.appendChild(toolbar);
}

function buildSearch(container) {
  const input = el('input', { type: 'search', placeholder: 'Search Apple or Samsung devices', value: state.q });
  const form = el('form', { class: 'field', role: 'search' }, [
    icon('search', { size: 18, className: 'sm' }),
    input
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value.trim();
    state.q = value;
    loadProducts();
  });
  container.appendChild(form);
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';

  const savedSearch = sessionStorage.getItem('REVO_LAST_SEARCH');
  if (savedSearch) {
    try {
      const { q, sort } = JSON.parse(savedSearch);
      state.q = q || '';
      if (sort) state.sort = sort;
    } catch (err) {
      console.warn('[products] invalid last search', err);
    }
  }
  const savedBrand = sessionStorage.getItem('REVO_LAST_BRAND');
  if (savedBrand) {
    state.brand = savedBrand;
    sessionStorage.removeItem('REVO_LAST_BRAND');
  }

  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Marketplace'));
  const cityNote = el('p', { class: 'muted', style: 'margin:0 0 0.6rem;font-size:0.85rem;' }, `Inventory near ${cityStore.get()}`);
  page.appendChild(cityNote);

  buildSearch(page);
  buildFilters(page);

  const grid = el('div', { class: 'product-grid' });
  page.appendChild(grid);
  const empty = el('div', { class: 'products-empty', dataset: { empty: 'true' } }, [
    icon('planet', { size: 32, className: 'lg' }),
    el('p', { class: 'muted', text: 'No matches right now. Try another filter or city.' })
  ]);
  page.appendChild(empty);

  container.appendChild(page);
  await loadProducts();

  cityListener = async (event) => {
    cityNote.textContent = `Inventory near ${event.detail}`;
    await loadProducts();
  };
  window.addEventListener('revo:city-changed', cityListener);
}

export function unmount() {
  if (root) root.innerHTML = '';
  if (cityListener) window.removeEventListener('revo:city-changed', cityListener);
}

export default { mount, unmount };
