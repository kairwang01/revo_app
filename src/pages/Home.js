import Banner from '../components/Banner.js';
import CategoryStrip from '../components/CategoryStrip.js';
import Loader from '../components/Loader.js';
import { api } from '../app/api.js';
import { cityStore, authStore } from '../app/storage.js';
import { enforceAllowedBrands, ensureCityOrDefault } from '../app/guards.js';
import { el, icon, lazy, money, qs } from '../app/ui.js';

let root;
let cityListener;

function productCard(product) {
  const card = el('a', { class: 'product-card', href: `#/product/${product.id}` });
  const img = el('img', { alt: `${product.brand} ${product.model}`, width: 320, height: 240 });
  lazy(img, product.image);
  card.appendChild(img);
  const meta = el('div', { class: 'meta' });
  meta.append(
    el('div', { class: 'muted', text: `${product.brand} - ${product.model}` }),
    el('h3', {}, product.name),
    el('div', { class: 'price-line' }, [
      el('strong', { class: 'price', text: money(product.price) }),
      el('span', { class: 'muted', style: 'text-decoration:line-through;font-size:0.8rem;' }, money(product.originalPrice)),
      el('span', { class: 'badge-inline' }, `${Math.round((1 - product.price / product.originalPrice) * 100)}% off`)
    ])
  );
  card.appendChild(meta);
  return card;
}

function dealCard(product) {
  const discount = Math.round((1 - product.price / product.originalPrice) * 100);
  return el('article', { class: 'deal-card' }, [
    el('header', { class: 'deal-offer' }, `+${discount}% Voucher`),
    el('h3', { style: 'margin:0;font-size:0.95rem;' }, product.name),
    el('div', { class: 'muted', text: `${product.brand} - ${product.location}` }),
    el('div', { class: 'price-line' }, [
      el('strong', { text: money(product.price) }),
      el('span', { class: 'muted', style: 'text-decoration:line-through;font-size:0.8rem;' }, money(product.originalPrice))
    ]),
    el('button', { class: 'btn inline primary', type: 'button', onclick: () => { location.hash = `#/product/${product.id}`; } }, ['Preview', icon('chevron-right', { size: 16, className: 'sm' })])
  ]);
}

function myItemCard(item) {
  return el('div', { class: 'micro-card' }, [
    el('strong', {}, item.name),
    el('span', { class: 'muted', text: `Quantity ${item.qty}` })
  ]);
}

async function renderDeals(section, city) {
  section.innerHTML = '';
  section.appendChild(Loader({ label: 'Loading deals' }));
  const products = enforceAllowedBrands(await api.getProducts({ city }));
  section.innerHTML = '';
  const topDeals = [...products]
    .filter((product) => product.originalPrice && product.originalPrice > product.price)
    .sort((a, b) => (b.originalPrice - b.price) - (a.originalPrice - a.price))
    .slice(0, 3);
  if (!topDeals.length) {
    section.appendChild(el('div', { class: 'muted', text: 'No deals in this city yet.' }));
    return;
  }
  topDeals.forEach((product) => section.appendChild(dealCard(product)));
}

async function renderMyItems(container) {
  const session = authStore.get();
  container.innerHTML = '';
  if (!session) {
    container.append(
      el('p', { class: 'muted', text: 'Sign in to track the devices you trade and purchase.' }),
      el('button', { class: 'btn inline primary', type: 'button', onclick: () => { location.hash = '#/login'; } }, 'Sign in now')
    );
    return;
  }
  const orders = await api.getOrders();
  const latest = orders.flatMap((order) => order.items.map((item) => ({ ...item, orderId: order.id, status: order.status }))).slice(0, 3);
  if (!latest.length) {
    container.appendChild(el('p', { class: 'muted', text: 'No items yet. Trade in or shop to populate this list.' }));
    return;
  }
  const list = el('div', { class: 'micro-list' });
  latest.forEach((item) => {
    const card = myItemCard(item);
    card.addEventListener('click', () => { location.hash = `#/orders/${item.orderId}`; });
    list.appendChild(card);
  });
  container.appendChild(list);
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  ensureCityOrDefault();
  const hero = el('section', { class: 'home-hero' }, Banner({ onClick: () => { location.hash = '#/products'; } }));
  page.appendChild(hero);

  const categoryStrip = CategoryStrip({ onSelect: (category) => {
    sessionStorage.setItem('REVO_LAST_CATEGORY', category);
    location.hash = '#/products';
  } });
  page.appendChild(categoryStrip);

  const myItemsSection = el('section', { class: 'home-section' });
  myItemsSection.appendChild(el('header', {}, [
    el('h2', {}, 'My Items'),
    el('button', { class: 'btn inline', type: 'button', onclick: () => { location.hash = '#/account'; } }, 'Account')
  ]));
  const myItemsBody = el('div', {});
  myItemsSection.appendChild(myItemsBody);
  page.appendChild(myItemsSection);

  const dealsSection = el('section', { class: 'home-section' });
  dealsSection.append(
    el('header', {}, [
      el('h2', {}, 'Deals Center'),
      el('span', { class: 'chip' }, ['+20% Bonus', icon('ticket', { size: 16, className: 'sm' })])
    ])
  );
  const dealsBody = el('div', { class: 'stack' });
  dealsSection.appendChild(dealsBody);
  page.appendChild(dealsSection);

  const curatedSection = el('section', { class: 'home-section' }, [
    el('header', {}, [el('h2', {}, 'Trending Curations')]),
    el('div', { class: 'product-grid', id: 'home-curated-grid' })
  ]);
  page.appendChild(curatedSection);

  container.appendChild(page);

  await renderMyItems(myItemsBody);
  const city = cityStore.get();
  await renderDeals(dealsBody, city);

  const curatedGrid = qs('#home-curated-grid');
  curatedGrid.appendChild(Loader({ label: 'Loading curated devices' }));
  const products = enforceAllowedBrands(await api.getProducts({ city })).slice(0, 4);
  curatedGrid.innerHTML = '';
  products.forEach((product) => curatedGrid.appendChild(productCard(product)));

  cityListener = async (event) => {
    const nextCity = event.detail;
    await renderDeals(dealsBody, nextCity);
    const latestProducts = enforceAllowedBrands(await api.getProducts({ city: nextCity })).slice(0, 4);
    curatedGrid.innerHTML = '';
    latestProducts.forEach((product) => curatedGrid.appendChild(productCard(product)));
  };
  window.addEventListener('revo:city-changed', cityListener);
}

export function unmount() {
  if (root) root.innerHTML = '';
  if (cityListener) window.removeEventListener('revo:city-changed', cityListener);
}

export default { mount, unmount };
