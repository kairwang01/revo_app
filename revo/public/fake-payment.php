<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Processing Payment - Secure Gateway</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      color: #111827;
    }
    
    .payment-shell {
      width: 100%;
      max-width: 900px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(15,23,42,0.06);
      padding: 32px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 32px;
    }
    
    .payment-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .payment-section {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: #fff;
    }
    
    .brand {
      font-size: 1.125rem;
      font-weight: 600;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 0.95rem;
    }
    
    .amount {
      font-size: 2.5rem;
      font-weight: 700;
      color: #111827;
      margin-top: 0.5rem;
    }
    
    .card-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    
    .card-field label {
      font-size: 0.85rem;
      color: #4b5563;
    }
    
    .card-field input {
      padding: 0.85rem 1rem;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background: #f9fafb;
      font-size: 1rem;
      letter-spacing: 0.08em;
    }
    
    h2 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }
    
    .merchant,
    .order-info,
    .shipping-info {
      background: #f9fafb;
      border-radius: 10px;
      padding: 16px;
      font-size: 0.95rem;
    }
    
    .order-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }
    
    .order-info-row:last-child {
      margin-bottom: 0;
    }
    
    .order-info-label {
      color: #6b7280;
    }
    
    .order-info-value {
      font-weight: 600;
    }
    
    .shipping-recipient {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    
    .shipping-address {
      color: #4b5563;
      line-height: 1.5;
    }
    
    .shipping-meta {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #2563eb;
    }
    
    .spinner {
      width: 46px;
      height: 46px;
      border: 4px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 1.5rem auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .processing-text {
      color: #4b5563;
      text-align: center;
      font-size: 0.95rem;
    }
    
    .btn {
      background: #111827;
      color: white;
      border: none;
      padding: 0.9rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 1rem;
      display: none;
    }
    
    .btn.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="payment-shell">
    <div class="payment-column">
      <div class="payment-section">
        <div class="brand">Revo Checkout</div>
        <p class="subtitle" id="subtitle">Review and confirm your payment</p>
        <div class="amount" id="amount">$0.00</div>
      </div>

      <div class="payment-section">
        <h2>Payment method</h2>
        <div class="card-field">
          <label for="locked-card-number">Card Number</label>
          <input id="locked-card-number" type="text" placeholder="1234 5678 9012 3456">
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <div class="card-field" style="flex:1;">
            <label for="locked-expiry">Expiry</label>
            <input id="locked-expiry" type="text" placeholder="MM / YY">
          </div>
          <div class="card-field" style="width:140px;">
            <label for="locked-cvv">CVV</label>
            <input id="locked-cvv" type="text" placeholder="123">
          </div>
        </div>
      </div>

      <div class="payment-section">
        <div class="spinner" id="spinner"></div>
        <p class="processing-text" id="processing-text">Processing payment...</p>
        <button class="btn" id="return-btn">Return to Revo</button>
      </div>
    </div>

    <div class="payment-column">
      <div class="payment-section">
        <h2>Order summary</h2>
        <div class="merchant">
          <div style="font-size:0.8rem; letter-spacing:0.05em; text-transform:uppercase; color:#6b7280;">Merchant</div>
          <div style="font-weight:600; margin-top:0.35rem;">Revo Marketplace</div>
        </div>

        <div class="order-info">
          <div class="order-info-row">
            <span class="order-info-label">Order ID</span>
            <span class="order-info-value" id="order-id">-</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Payment Method</span>
            <span class="order-info-value" id="payment-method">Credit Card</span>
          </div>
          <div class="order-info-row">
            <span class="order-info-label">Date</span>
            <span class="order-info-value" id="payment-date">-</span>
          </div>
        </div>
      </div>

      <div class="payment-section">
        <h2>Delivery</h2>
        <div class="shipping-info" id="shipping-info">
          <div class="shipping-recipient" id="shipping-recipient">Awaiting details</div>
          <div class="shipping-address" id="shipping-address">Shipping address will appear once provided.</div>
          <div class="shipping-meta" id="shipping-meta"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const amount = params.get('amount') || '0.00';
    const orderId = params.get('orderId') || 'ORD' + Date.now();
    const paymentMethod = params.get('method') || 'Credit Card';
    
    // Display order information
    document.getElementById('amount').textContent = '$' + amount;
    document.getElementById('order-id').textContent = orderId;
    document.getElementById('payment-method').textContent = paymentMethod;
    document.getElementById('payment-date').textContent = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    renderShippingAddress();

    // Simulate payment processing (2-3 seconds)
    setTimeout(() => {
      // Hide spinner and processing text
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('processing-text').style.display = 'none';
      
      // Show success state
      document.getElementById('subtitle').textContent = 'Payment successful — your order has been placed';
      document.getElementById('processing-text').textContent = 'Payment successful. You can return to the store.';
      document.getElementById('return-btn').classList.add('show');
      
      // Store order info in localStorage for success page
      localStorage.setItem('lastOrderId', orderId);
      localStorage.setItem('lastOrderAmount', amount);
      localStorage.setItem('lastOrderTime', new Date().toISOString());
      
    }, 2500);
    
    // Return to store button
    document.getElementById('return-btn').addEventListener('click', () => {
      window.location.href = './payment-success.html?orderId=' + orderId + '&amount=' + amount;
    });

    function renderShippingAddress() {
      const recipientNode = document.getElementById('shipping-recipient');
      const addressNode = document.getElementById('shipping-address');
      const metaNode = document.getElementById('shipping-meta');
      if (!recipientNode || !addressNode) {
        return;
      }
      try {
        const raw = localStorage.getItem('lastCheckoutAddress');
        if (!raw) {
          recipientNode.textContent = 'No address on file';
          addressNode.textContent = 'Please return to checkout to provide a delivery address.';
          if (metaNode) metaNode.textContent = '';
          return;
        }
        const data = JSON.parse(raw);
        recipientNode.textContent = data?.fullName || 'Customer';
        const lines = [];
        if (data.street || data.address) {
          lines.push(data.street || data.address);
        }
        const cityLine = [data.city, data.province || data.state, data.postalCode || data.zipCode].filter(Boolean).join(', ');
        if (cityLine) {
          lines.push(cityLine);
        }
        if (data.country) {
          lines.push(data.country);
        }
        if (data.phone) {
          lines.push(`Phone: ${data.phone}`);
        }
        addressNode.innerHTML = lines.length ? lines.join('<br>') : 'Address details pending.';
        if (metaNode && data.shipping) {
          const shippingParts = [];
          if (data.shipping.name || data.shipping.carrier) {
            shippingParts.push(data.shipping.name || data.shipping.carrier);
          }
          if (data.shipping.eta) {
            shippingParts.push(data.shipping.eta);
          }
          metaNode.textContent = shippingParts.join(' · ');
        } else if (metaNode) {
          metaNode.textContent = '';
        }
      } catch (error) {
        console.warn('Unable to load checkout address:', error);
      }
    }
  </script>
</body>
</html>
