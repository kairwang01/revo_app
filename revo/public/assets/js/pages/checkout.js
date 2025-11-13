// Checkout page functionality

document.addEventListener('DOMContentLoaded', async () => {
  if (!authStore.isAuthenticated()) {
    window.location.href = './login.html?return=' + encodeURIComponent(window.location.href);
    return;
  }

  loadCartItems();
  populateWalletBalance();
  setupPaymentMethods();
  setupPlaceOrder();
});

function loadCartItems() {
  const cart = cartStore.get();
  const itemsContainer = document.getElementById('order-items');
  
  if (!cart || cart.length === 0) {
    itemsContainer.innerHTML = '<p class="text-muted">Your cart is empty</p>';
    document.getElementById('place-order-btn').disabled = true;
    return;
  }
  
  // Render cart items
  itemsContainer.innerHTML = cart.map(item => `
    <div style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border-light);">
      <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.name}</div>
        <div style="font-size: 0.875rem; color: var(--muted);">Qty: ${item.quantity}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600;">${formatMoney(item.price * item.quantity)}</div>
        <div style="font-size: 0.875rem; color: var(--muted);">${formatMoney(item.price)} each</div>
      </div>
    </div>
  `).join('');
  
  // Calculate and display totals
  calculateTotals(cart);
}

function calculateTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = getTaxRate(cityStore.get()) || 0.12;
  const tax = subtotal * taxRate;
  const shipping = 0; // Free shipping
  const total = subtotal + tax + shipping;
  
  document.getElementById('checkout-subtotal').textContent = formatMoney(subtotal);
  document.getElementById('checkout-tax-rate').textContent = (taxRate * 100).toFixed(0);
  document.getElementById('checkout-tax').textContent = formatMoney(tax);
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'Free' : formatMoney(shipping);
  document.getElementById('checkout-total').textContent = formatMoney(total);
  
  // Store total for payment page
  window.checkoutTotal = total.toFixed(2);
}

function populateWalletBalance() {
  const balanceNode = document.getElementById('wallet-balance');
  if (!balanceNode) {
    return;
  }

  try {
    const wallet = walletStore.get();
    const balance = wallet?.balance || 0;
    balanceNode.textContent = balance.toFixed(2);
  } catch (error) {
    console.error('Error loading wallet balance:', error);
    balanceNode.textContent = '0.00';
  }
}

function setupPaymentMethods() {
  const paymentMethods = document.querySelectorAll('.payment-method');
  
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      // Remove selected class from all
      paymentMethods.forEach(m => m.classList.remove('selected'));
      // Add to clicked
      method.classList.add('selected');
      // Check the radio button
      const radio = method.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }
    });
  });
}

function setupPlaceOrder() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  
  placeOrderBtn.addEventListener('click', async () => {
    const cart = cartStore.get();
    
    if (!cart || cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    // Get selected payment method
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
      showToast('Please select a payment method', 'error');
      return;
    }
    
    const paymentMethod = selectedPayment.value;
    let paymentMethodName = 'Credit Card';
    
    if (paymentMethod === 'wallet') {
      paymentMethodName = 'Revo Wallet';
    } else if (paymentMethod === 'cod') {
      paymentMethodName = 'Cash on Delivery';
    }
    
    const checkoutTotal = Number(window.checkoutTotal) || 0;
    
    // Disable button and show loading
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';
    
    try {
      // Create order
      const orderData = {
        items: cart,
        total: checkoutTotal,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString()
      };
      
      const result = await api.checkout(orderData);
      
      if (result && result.success) {
        // Generate order ID
        const orderId = result.orderId || result.data?.orderId || result.data?.order_id || 'ORD' + Date.now();
        
        // Clear local cart after successful checkout
        cartStore.clear();
        
        // Redirect to fake payment gateway
        window.location.href = `./fake-payment.php?amount=${window.checkoutTotal}&orderId=${orderId}&method=${encodeURIComponent(paymentMethodName)}`;
      } else {
        showToast(result?.error || 'Order failed. Please try again.', 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('An error occurred. Please try again.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  });
}
