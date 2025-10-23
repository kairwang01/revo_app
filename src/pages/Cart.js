import { API } from '../app/config.js';
import { cartStore, countersStore, cityStore } from '../app/storage.js';
import { enforceAllowedBrands } from '../app/guards.js';
import { el, icon, money, toast } from '../app/ui.js';

let root;
let totalsBox;
let itemsContainer;
let cityListener;

function calcTotals(cart, city) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxRate = API.TAX_BY_CITY[city] || 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const shipping = cart.items.length ? 15 : 0;
  const total = subtotal + tax + shipping;
  return { subtotal, tax, shipping, total, taxRate };
}

function updateCounters(cart) {
  const count = cart.items.reduce((sum, item) => sum + item.qty, 0);
  countersStore.set({ cartCount: count });
  window.dispatchEvent(new CustomEvent('revo:cart-updated'));
}

function renderEmpty(container) {
  container.innerHTML = '';
  container.appendChild(el('div', { class: 'empty-state cart-empty' }, [
    icon('bag', { size: 36, className: 'lg' }),
    el('strong', {}, 'Cart is empty'),
    el('p', { class: 'muted', text: 'Start exploring Apple and Samsung devices verified by Revo.' }),
    el('button', { class: 'btn primary', type: 'button', onclick: () => { location.hash = '#/products'; } }, 'Browse products')
  ]));
}

function renderTotals(cart, city) {
  const totals = calcTotals(cart, city);
  totalsBox.innerHTML = '';
  totalsBox.append(
    el('div', { class: 'summary-row' }, ['Subtotal', money(totals.subtotal)]),
    el('div', { class: 'summary-row' }, [`City tax (${Math.round(totals.taxRate * 100)}%)`, money(totals.tax)]),
    el('div', { class: 'summary-row' }, ['Shipping', money(totals.shipping)]),
    el('div', { class: 'summary-row total' }, ['Total', money(totals.total)])
  );
}

function updateCartView() {
  const city = cityStore.get();
  const cart = cartStore.get();
  const allowed = enforceAllowedBrands(cart.items);
  if (allowed.length !== cart.items.length) {
    cart.items = allowed;
    cartStore.set(cart);
  } else {
    cart.items = allowed;
  }
  if (!cart.items.length) {
    renderEmpty(itemsContainer);
    totalsBox.innerHTML = '';
    updateCounters(cart);
    return;
  }
  itemsContainer.innerHTML = '';
  cart.items.forEach((item) => {
    const card = el('div', { class: 'cart-item' });
    const img = el('img', { alt: item.name, width: 96, height: 96, src: item.image });
    card.appendChild(img);
    const meta = el('div', { class: 'meta' });
    meta.append(
      el('h3', {}, item.name),
      el('span', { class: 'muted', text: `${item.brand}` }),
      el('span', { class: 'price-line' }, [money(item.price), el('span', { class: 'muted', style: 'font-size:0.85rem;' }, ` x ${item.qty}`)])
    );

    const qtyControls = el('div', { class: 'qty' }, [
      el('button', { class: 'btn icon', type: 'button', 'aria-label': 'Decrease quantity' }, '-'),
      el('span', {}, String(item.qty)),
      el('button', { class: 'btn icon', type: 'button', 'aria-label': 'Increase quantity' }, '+')
    ]);

    qtyControls.children[0].addEventListener('click', () => {
      item.qty = Math.max(0, item.qty - 1);
      if (item.qty === 0) {
        cart.items = cart.items.filter((entry) => entry.id !== item.id);
      }
      cartStore.set(cart);
      updateCartView();
    });
    qtyControls.children[2].addEventListener('click', () => {
      item.qty += 1;
      cartStore.set(cart);
      updateCartView();
    });

    meta.appendChild(qtyControls);
    card.appendChild(meta);
    itemsContainer.appendChild(card);
  });
  renderTotals(cart, city);
  updateCounters(cart);
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Your cart'));
  page.appendChild(el('p', { class: 'muted', style: 'margin:0 0 1rem;' }, 'Review your devices before heading to checkout.'));

  itemsContainer = el('div', { class: 'cart-items' });
  page.appendChild(itemsContainer);

  totalsBox = el('div', { class: 'card section', style: 'margin-top:1rem;' });
  page.appendChild(totalsBox);

  const checkoutBtn = el('button', { class: 'btn primary', type: 'button', style: 'width:100%;margin:1.2rem 0;' }, ['Proceed to checkout', icon('chevron-right', { size: 16, className: 'sm' })]);
  checkoutBtn.addEventListener('click', () => {
    const cart = cartStore.get();
    if (!cart.items.length) {
      toast('Add a device first');
      return;
    }
    location.hash = '#/checkout';
  });
  page.appendChild(checkoutBtn);

  container.appendChild(page);
  updateCartView();

  cityListener = () => updateCartView();
  window.addEventListener('revo:city-changed', cityListener);
}

export function unmount() {
  if (root) root.innerHTML = '';
  if (cityListener) window.removeEventListener('revo:city-changed', cityListener);
}

export default { mount, unmount };
