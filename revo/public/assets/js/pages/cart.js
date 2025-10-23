// Cart page functionality

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  
  // Listen for cart changes
  window.addEventListener('revo:cart-changed', loadCart);
  
  // Setup checkout button
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cartStore.getCount() === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      window.location.href = './checkout.html';
    });
  }
});

function loadCart() {
  const cart = cartStore.get();
  const cartItems = document.getElementById('cart-items');
  const cartSummary = document.getElementById('cart-summary');
  const emptyCart = document.getElementById('empty-cart');
  const cartCount = document.getElementById('cart-count');
  
  if (cart.length === 0) {
    toggleElement(emptyCart, true);
    toggleElement(cartSummary, false);
    if (cartCount) cartCount.textContent = '0 items';
    cartItems.innerHTML = '';
    return;
  }
  
  toggleElement(emptyCart, false);
  toggleElement(cartSummary, true);
  if (cartCount) cartCount.textContent = `${cart.length} item${cart.length > 1 ? 's' : ''}`;
  
  // Render cart items
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="text-muted" style="font-size:0.875rem;">${item.brand}</div>
        <div class="cart-item-price">${formatMoney(item.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity - 1})">-</button>
          <span style="min-width:2rem;text-align:center;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateQty(${item.id}, ${item.quantity + 1})">+</button>
          <button class="btn btn-ghost btn-sm" onclick="removeItem(${item.id})" style="margin-left:1rem;">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  
  // Calculate totals
  const city = cityStore.get();
  const taxRate = getTaxRate(city);
  const subtotal = cartStore.getTotal();
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  document.getElementById('subtotal').textContent = formatMoney(subtotal);
  document.getElementById('tax-rate').textContent = Math.round(taxRate * 100);
  document.getElementById('tax-amount').textContent = formatMoney(tax);
  document.getElementById('total').textContent = formatMoney(total);
}

function updateQty(productId, newQty) {
  cartStore.updateQuantity(productId, newQty);
}

function removeItem(productId) {
  if (confirm('Remove this item from cart?')) {
    cartStore.remove(productId);
    showToast('Item removed from cart', 'success');
  }
}
