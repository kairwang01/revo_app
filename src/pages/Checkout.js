import { API } from '../app/config.js';
import { api } from '../app/api.js';
import { cartStore, countersStore, cityStore } from '../app/storage.js';
import { ensureAllowedCity } from '../app/guards.js';
import { el, icon, money, progressSteps, qsa, toast } from '../app/ui.js';

let root;
let paymentMethod = 'Credit/Debit';
let totals;

function calcTotals(cart, city) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxRate = API.TAX_BY_CITY[city] || 0;
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const shipping = cart.items.length ? 15 : 0;
  const total = subtotal + tax + shipping;
  return { subtotal, taxRate, tax, shipping, total };
}

function renderTotals(container, cart, city) {
  totals = calcTotals(cart, city);
  container.innerHTML = '';
  container.append(
    el('div', { class: 'summary-row' }, ['Subtotal', money(totals.subtotal)]),
    el('div', { class: 'summary-row' }, [`Tax (${Math.round(totals.taxRate * 100)}%)`, money(totals.tax)]),
    el('div', { class: 'summary-row' }, ['Shipping', money(totals.shipping)]),
    el('div', { class: 'summary-row total' }, ['Total', money(totals.total)])
  );
}

function toggleCardRequired(cardFields, method) {
  const required = method === 'Credit/Debit';
  qsa('input', cardFields).forEach((input) => {
    if (required) input.setAttribute('required', 'true');
    else input.removeAttribute('required');
  });
  cardFields.hidden = !required;
}

function createPaymentSelector(container, cardFields) {
  const methods = ['Credit/Debit', 'PayPal', 'Cash on Delivery'];
  const fieldset = el('fieldset', { class: 'card section' });
  fieldset.appendChild(el('legend', { class: 'muted', style: 'font-size:0.85rem;' }, 'Payment method'));
  methods.forEach((method) => {
    const radio = el('input', { type: 'radio', name: 'payment', value: method, checked: method === paymentMethod ? '' : null });
    const label = el('label', { class: 'payment-row', style: 'display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;' }, [radio, method]);
    radio.addEventListener('change', () => {
      paymentMethod = method;
      toggleCardRequired(cardFields, paymentMethod);
    });
    fieldset.appendChild(label);
  });
  container.appendChild(fieldset);
}

function createCardFields() {
  const wrap = el('div', { class: 'card section checkout-card-fields' });
  wrap.append(
    el('label', {}, [
      el('span', { class: 'muted' }, 'Card number'),
      el('input', { type: 'text', inputmode: 'numeric', placeholder: '4111 1111 1111 1111', required: paymentMethod === 'Credit/Debit' ? '' : null })
    ]),
    el('div', { class: 'form-row', style: 'margin-top:0.65rem;' }, [
      el('label', { class: 'form-col' }, [
        el('span', { class: 'muted' }, 'Expiry'),
        el('input', { type: 'text', placeholder: 'MM/YY', required: paymentMethod === 'Credit/Debit' ? '' : null })
      ]),
      el('label', { class: 'form-col' }, [
        el('span', { class: 'muted' }, 'CVC'),
        el('input', { type: 'text', placeholder: '123', required: paymentMethod === 'Credit/Debit' ? '' : null })
      ])
    ])
  );
  return wrap;
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const cart = cartStore.get();
  if (!cart.items.length) {
    container.appendChild(el('div', { class: 'container empty-state' }, [
      icon('cart', { size: 36, className: 'lg' }),
      el('strong', {}, 'Nothing to checkout'),
      el('button', { class: 'btn primary', type: 'button', onclick: () => { location.hash = '#/products'; } }, 'Browse products')
    ]));
    return;
  }

  const city = ensureAllowedCity(cityStore.get());
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Checkout'));
  page.appendChild(progressSteps(['Cart', 'Checkout', 'Complete'], 1));
  page.appendChild(el('p', { class: 'muted', style: 'margin:0 0 1rem;' }, `Completing purchase in ${city}.`));

  const shipping = el('form', { class: 'checkout-form' });
  const name = el('div', {}, [el('label', {}, 'Recipient name'), el('input', { name: 'name', required: 'true', autocomplete: 'name' })]);
  const phone = el('div', {}, [el('label', {}, 'Phone number'), el('input', { name: 'phone', required: 'true', inputmode: 'tel', autocomplete: 'tel' })]);
  const address = el('div', {}, [el('label', {}, 'Address'), el('input', { name: 'address', required: 'true', autocomplete: 'street-address' })]);
  const cityField = el('div', {}, [el('label', {}, 'City'), el('input', { name: 'city', value: city, readonly: 'true' })]);
  const postal = el('div', {}, [el('label', {}, 'Postal code'), el('input', { name: 'postal', required: 'true', autocomplete: 'postal-code' })]);
  shipping.append(name, phone, address, cityField, postal);

  page.appendChild(el('div', { class: 'card section' }, shipping));

  const paymentWrapper = el('div', {});
  const cardFields = createCardFields();
  createPaymentSelector(paymentWrapper, cardFields);
  paymentWrapper.appendChild(cardFields);
  toggleCardRequired(cardFields, paymentMethod);
  page.appendChild(paymentWrapper);

  page.appendChild(el('div', { class: 'checkout-notice' }, [icon('planet', { size: 18, className: 'sm' }), 'Secure checkout - TLS encrypted']));

  const summary = el('div', { class: 'card section' });
  renderTotals(summary, cart, city);
  page.appendChild(summary);

  const placeOrder = el('button', { class: 'btn primary', type: 'button', style: 'width:100%;margin:1.2rem 0;' }, ['Place order', icon('chevron-right', { size: 16, className: 'sm' })]);
  placeOrder.addEventListener('click', async () => {
    const formData = new FormData(shipping);
    if (!formData.get('name') || !formData.get('phone') || !formData.get('address') || !formData.get('postal')) {
      toast('Complete shipping details');
      return;
    }
    placeOrder.disabled = true;
    try {
      const order = await api.createOrder({
        items: cart.items,
        payment: paymentMethod,
        totals,
        shipping: Object.fromEntries(formData.entries()),
        city
      });
      toast('Order placed successfully');
      cartStore.clear();
      countersStore.set({ cartCount: 0 });
      window.dispatchEvent(new CustomEvent('revo:cart-updated'));
      location.hash = `#/orders/${order.id}`;
    } catch (err) {
      console.error('[checkout] order failed', err);
      toast('Could not place order. Try again.');
      placeOrder.disabled = false;
    }
  });
  page.appendChild(placeOrder);

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
