import { api } from '../app/api.js';
import { cityStore } from '../app/storage.js';
import { enforceAllowedBrands } from '../app/guards.js';
import { actionSheet, el, icon, lazy, money, toast } from '../app/ui.js';

let root;
let cityHandler;
let state = { sort: 'relevance', price: 'all', model: 'all' };

const benefits = ['Official inspection', '7-day trial', 'Store warranty'];
const highlightCards = [
  { icon: 'bag', title: 'In-store Stock', copy: 'Reserve today and pick up within 2 hours.' },
  { icon: 'gear', title: 'Inspection Lab', copy: 'Every device passes our 72-point diagnostics.' }
];

function buildProductRow(products, heading) {
  const section = el('section', { class: 'home-section' });
  section.appendChild(el('header', {}, [el('h2', {}, heading)]));
  const list = el('div', { class: 'product-grid' });
  products.forEach((product) => {
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
      ])
    );
    card.appendChild(meta);
    list.appendChild(card);
  });
  section.appendChild(list);
  return section;
}

async function fetchProducts(city) {
  const products = enforceAllowedBrands(await api.searchProducts({ city, sort: state.sort }));
  return {
    apple: products.filter((item) => item.brand === 'Apple').slice(0, 4),
    samsung: products.filter((item) => item.brand === 'Samsung').slice(0, 4)
  };
}

function renderHighlights(container) {
  const grid = el('div', { class: 'curated-highlights' });
  highlightCards.forEach((item) => {
    const card = el('article', { class: 'highlight-card' }, [
      icon(item.icon, { size: 26, className: 'lg' }),
      el('div', {}, [
        el('strong', {}, item.title),
        el('p', { class: 'muted', style: 'margin:0;font-size:0.85rem;' }, item.copy)
      ])
    ]);
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

function filterButton(name, label, current) {
  const button = el('button', { class: 'filter-btn', 'aria-pressed': String(false) }, [label, icon('chevron-right', { size: 14, className: 'sm' })]);
  button.addEventListener('click', async () => {
    if (name === 'sort') {
      const choice = await actionSheet({
        title: 'Sort by',
        selectedValue: state.sort,
        options: [
          { value: 'relevance', label: 'Relevance' },
          { value: 'price-asc', label: 'Price: Low to High' },
          { value: 'price-desc', label: 'Price: High to Low' },
          { value: 'newest', label: 'Newest arrivals' }
        ]
      });
      if (choice && choice !== state.sort) {
        state.sort = choice;
        toast(`Sorted by ${choice.replace('-', ' ')}`);
        mountProducts();
      }
    } else {
      toast('Filter coming soon');
    }
  });
  return button;
}

async function mountProducts() {
  const city = cityStore.get();
  const rowsHost = root.querySelector('[data-curated-products]');
  rowsHost.innerHTML = '';
  const { apple, samsung } = await fetchProducts(city);
  rowsHost.appendChild(buildProductRow(apple, 'Apple picks'));
  rowsHost.appendChild(buildProductRow(samsung, 'Samsung picks'));
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.25rem;font-size:1.3rem;' }, 'Curated Collections'));

  const benefitStrip = el('div', { class: 'curated-benefits' });
  benefits.forEach((text) => benefitStrip.appendChild(el('span', { class: 'benefit', text }))); 
  page.appendChild(benefitStrip);

  const search = el('div', { class: 'curated-search' }, [
    el('form', { class: 'field', onsubmit: (event) => {
      event.preventDefault();
      const value = event.target.query.value.trim();
      if (!value) return;
      sessionStorage.setItem('REVO_LAST_SEARCH', JSON.stringify({ q: value, city: cityStore.get() }));
      location.hash = '#/products';
    } }, [
      icon('search', { size: 18, className: 'sm' }),
      el('input', { name: 'query', type: 'search', placeholder: 'Search certified Apple or Samsung devices' })
    ])
  ]);
  page.appendChild(search);

  const brandGrid = el('div', { class: 'curated-brands' });
  ['Apple', 'Samsung'].forEach((brand) => {
    const card = el('a', { class: 'brand-card', href: '#/products' }, [
      icon(brand === 'Apple' ? 'planet' : 'leaf', { size: 24, className: 'lg' }),
      el('span', {}, `${brand} Lab`)
    ]);
    card.addEventListener('click', () => {
      sessionStorage.setItem('REVO_LAST_BRAND', brand);
    });
    brandGrid.appendChild(card);
  });
  page.appendChild(brandGrid);

  renderHighlights(page);

  const filterRow = el('div', { class: 'products-toolbar' });
  filterRow.appendChild(filterButton('sort', 'Sort', state.sort));
  filterRow.appendChild(filterButton('price', 'Price', state.price));
  filterRow.appendChild(filterButton('model', 'Model', state.model));
  filterRow.appendChild(filterButton('filter', 'Filter', 'all'));
  page.appendChild(filterRow);

  page.appendChild(el('div', { dataset: { curatedProducts: 'true' } }));

  container.appendChild(page);
  await mountProducts();

  cityHandler = async () => {
    await mountProducts();
  };
  window.addEventListener('revo:city-changed', cityHandler);
}

export function unmount() {
  if (root) root.innerHTML = '';
  if (cityHandler) window.removeEventListener('revo:city-changed', cityHandler);
}

export default { mount, unmount };
