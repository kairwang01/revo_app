import Banner from '../components/Banner.js';
import { api } from '../app/api.js';
import { cartStore, countersStore } from '../app/storage.js';
import { enforceAllowedBrands } from '../app/guards.js';
import { el, icon, lazy, money, toast } from '../app/ui.js';

let root;
let product;

function badges(product) {
  const wrap = el('div', { class: 'pdp-badges' });
  wrap.appendChild(el('span', { class: 'chip' }, [icon('leaf', { size: 16, className: 'sm' }), `${product.condition} condition`]));
  wrap.appendChild(el('span', { class: 'chip' }, [icon('planet', { size: 16, className: 'sm' }), `${product.rating}/5 (${product.reviews} reviews)`]));
  wrap.appendChild(el('span', { class: 'chip' }, [icon('location', { size: 16, className: 'sm' }), product.location]));
  return wrap;
}

function addToCart(item, navigateAfter = false) {
  const cart = cartStore.get();
  const existing = cart.items.find((entry) => entry.id === item.id);
  if (existing) existing.qty += 1;
  else cart.items.push({
    id: item.id,
    name: item.name,
    brand: item.brand,
    price: item.price,
    image: item.image,
    qty: 1
  });
  cartStore.set(cart);
  const count = cart.items.reduce((acc, curr) => acc + curr.qty, 0);
  countersStore.set({ cartCount: count });
  window.dispatchEvent(new CustomEvent('revo:cart-updated'));
  toast('Added to cart');
  if (navigateAfter) {
    location.hash = '#/checkout';
  }
}

function buildTabs(product) {
  const tabs = el('div', { class: 'pdp-details-tabs' });
  const panels = el('div', { class: 'pdp-tabpanel' });

  const sections = [
    { key: 'overview', label: 'Overview', content: product.highlights?.join('. ') || 'Certified by our technicians with 72-point inspection.' },
    { key: 'specs', label: 'Specs', content: `${product.model} - ${product.condition} - ${product.rating}/5 (${product.reviews} reviews)` },
    { key: 'warranty', label: 'Warranty', content: 'Includes Revo 12-month store warranty and 7-day trial period.' }
  ];

  sections.forEach((section, index) => {
    const button = el('button', { class: 'pdp-tab', role: 'tab', 'aria-pressed': String(index === 0) }, section.label);
    button.addEventListener('click', () => {
      tabs.querySelectorAll('.pdp-tab').forEach((node) => node.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      panels.innerHTML = '';
      panels.appendChild(el('p', {}, section.content));
    });
    tabs.appendChild(button);
    if (index === 0) panels.appendChild(el('p', {}, section.content));
  });

  return el('div', {}, [tabs, panels]);
}

export async function mount(container, params) {
  root = container;
  container.innerHTML = '';

  product = await api.getProduct(params.id);
  if (!product || !enforceAllowedBrands([product]).length) {
    container.appendChild(el('div', { class: 'container', text: 'Product unavailable.' }));
    return;
  }

  const page = el('div', { class: 'container' });

  const media = el('div', { class: 'pdp-media' });
  const image = el('img', { alt: product.name, width: 480, height: 360 });
  lazy(image, product.image);
  media.appendChild(image);
  page.appendChild(media);

  const header = el('div', { class: 'pdp-header' });
  header.appendChild(el('span', { class: 'muted', text: `${product.brand} - ${product.model}` }));
  header.appendChild(el('h1', { style: 'margin:0;font-size:1.35rem;' }, product.name));
  const priceWrap = el('div', { class: 'pdp-price' }, [
    el('span', { class: 'current', text: money(product.price) }),
    el('span', { class: 'original', text: money(product.originalPrice) }),
    el('span', { class: 'badge-inline', text: `${Math.round((1 - product.price / product.originalPrice) * 100)}% off` })
  ]);
  header.appendChild(priceWrap);
  header.appendChild(badges(product));
  page.appendChild(header);

  const availability = el('div', { class: 'card section' }, [
    el('div', { class: 'card-title' }, ['Availability', icon('chevron-right', { size: 16, className: 'sm' })]),
    el('p', { class: 'muted', style: 'margin:0;' }, `Pickup in ${product.location}. Delivery available in ${product.cityAvailability?.join(', ') ?? 'select cities'}.`)
  ]);
  page.appendChild(availability);

  page.appendChild(buildTabs(product));

  const actions = el('div', { class: 'pdp-actions' });
  const addBtn = el('button', { class: 'btn primary', type: 'button' }, ['Add to cart', icon('cart', { size: 18, className: 'sm' })]);
  addBtn.addEventListener('click', () => addToCart(product));
  const buyBtn = el('button', { class: 'btn', type: 'button' }, ['Buy now', icon('chevron-right', { size: 16, className: 'sm' })]);
  buyBtn.addEventListener('click', () => addToCart(product, true));
  actions.append(addBtn, buyBtn);
  page.appendChild(actions);

  const tradeBanner = el('div', { class: 'card section' }, [
    el('div', { class: 'card-title' }, ['Trade-In Boost', icon('ticket', { size: 16, className: 'sm' })]),
    el('p', { class: 'muted', style: 'margin:0 0 .5rem;' }, 'Stack your voucher for an extra 20% when you trade in another device.'),
    Banner({ onClick: () => { location.hash = '#/curated'; } })
  ]);
  page.appendChild(tradeBanner);

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
  product = null;
}

export default { mount, unmount };
