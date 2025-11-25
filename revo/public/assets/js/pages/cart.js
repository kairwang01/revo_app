// Cart page functionality
// shopping gremlins count stuff here

const cartDom = {
  items: null,
  summary: null,
  empty: null,
  count: null,
  subtotal: null,
  taxRate: null,
  taxAmount: null,
  total: null,
  checkoutBtn: null
};

document.addEventListener('DOMContentLoaded', () => {
  assignCartDomRefs();
  bindCartEvents();
  loadCart();

  window.addEventListener('revo:cart-changed', loadCart);
});

function assignCartDomRefs() {
  cartDom.items = document.getElementById('cart-items');
  cartDom.summary = document.getElementById('cart-summary');
  cartDom.empty = document.getElementById('empty-cart');
  cartDom.count = document.getElementById('cart-count');
  cartDom.subtotal = document.getElementById('subtotal');
  cartDom.taxRate = document.getElementById('tax-rate');
  cartDom.taxAmount = document.getElementById('tax-amount');
  cartDom.total = document.getElementById('total');
  cartDom.checkoutBtn = document.getElementById('checkout-btn');
}

function bindCartEvents() {
  if (cartDom.items) {
    cartDom.items.addEventListener('click', handleCartInteraction);
  }

  if (cartDom.checkoutBtn) {
    cartDom.checkoutBtn.addEventListener('click', handleCheckout);
  }
}

function handleCheckout() {
  if (cartStore.getCount() === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  window.location.href = './checkout.html';
}

function handleCartInteraction(event) {
  const actionElement = event.target.closest('[data-cart-action]');
  if (!actionElement) {
    return;
  }

  const productId = parseInt(actionElement.dataset.productId, 10);
  if (!productId) {
    return;
  }

  const action = actionElement.dataset.cartAction;

  if (action === 'update') {
    const delta = parseInt(actionElement.dataset.delta, 10);
    if (!Number.isFinite(delta)) {
      return;
    }

    const row = actionElement.closest('[data-cart-item]');
    const quantityNode = row ? row.querySelector('[data-quantity]') : null;
    const currentQty = quantityNode ? Number(quantityNode.dataset.quantity) : 0;
    const nextQty = currentQty + delta;

    cartStore.updateQuantity(productId, nextQty);
    return;
  }

  if (action === 'remove') {
    if (window.confirm('Remove this item from cart?')) {
      cartStore.remove(productId);
      showToast('Item removed from cart', 'success');
    }
  }
}

function loadCart() {
  const cart = cartStore.get();

  if (!cartDom.items) {
    return;
  }

  if (cart.length === 0) {
    if (cartDom.empty) toggleElement(cartDom.empty, true);
    if (cartDom.summary) toggleElement(cartDom.summary, false);
    cartDom.items.innerHTML = '';
    updateTotals({ subtotal: 0, taxRate: getTaxRate(cityStore.get()), tax: 0, total: 0, quantity: 0 });
    return;
  }

  if (cartDom.empty) toggleElement(cartDom.empty, false);
  if (cartDom.summary) toggleElement(cartDom.summary, true);

  renderCartItems(cart);

  const city = cityStore.get();
  const taxRate = getTaxRate(city);
  const totals = calculateTotals(cart, taxRate);
  updateTotals({ ...totals, taxRate });
}

function renderCartItems(cart) {
  cartDom.items.innerHTML = cart.map(item => {
    const unitPrice = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    return `
      <div class="cart-item" data-cart-item data-product-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="text-muted" style="font-size:0.875rem;">${item.brand}</div>
          <div class="cart-item-price">${formatMoney(unitPrice)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-cart-action="update" data-product-id="${item.id}" data-delta="-1">-</button>
            <span class="cart-item-qty-value" data-quantity="${quantity}" style="min-width:2rem;text-align:center;">${quantity}</span>
            <button class="qty-btn" data-cart-action="update" data-product-id="${item.id}" data-delta="1">+</button>
            <button class="btn btn-ghost btn-sm" data-cart-action="remove" data-product-id="${item.id}" style="margin-left:1rem;">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function calculateTotals(cart, taxRate) {
  let subtotal = 0;
  let quantity = 0;

  cart.forEach(item => {
    const unitPrice = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    subtotal += unitPrice * qty;
    quantity += qty;
  });

  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return { subtotal, tax, total, quantity };
}

function updateTotals({ subtotal, taxRate, tax, total, quantity }) {
  if (cartDom.count) {
    cartDom.count.textContent = `${quantity} item${quantity === 1 ? '' : 's'}`;
  }

  if (cartDom.subtotal) {
    cartDom.subtotal.textContent = formatMoney(subtotal);
  }

  if (cartDom.taxRate) {
    const percent = (taxRate * 100).toFixed(2);
    cartDom.taxRate.textContent = percent.endsWith('.00') ? percent.slice(0, -3) : percent;
  }

  if (cartDom.taxAmount) {
    cartDom.taxAmount.textContent = formatMoney(tax);
  }

  if (cartDom.total) {
    cartDom.total.textContent = formatMoney(total);
  }
}
