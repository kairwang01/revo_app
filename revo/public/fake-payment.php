<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment - Revo</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      background: #f6f6f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #1f2933;
    }

    .page {
      width: 100%;
      max-width: 920px;
      background: #fff;
      border: 1px solid #d9e0e6;
      border-radius: 8px;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .header {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5eaee;
    }

    .header h1 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .header p {
      color: #52606d;
      font-size: 0.95rem;
    }

    .section {
      border: 1px solid #e5eaee;
      border-radius: 6px;
      padding: 16px;
      background: #fbfbfb;
    }

    .section h2 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1f2933;
    }

    .amount {
      font-size: 2rem;
      font-weight: 700;
      margin-top: 6px;
    }

    .label {
      color: #52606d;
      font-size: 0.9rem;
    }

    .value {
      font-weight: 600;
      color: #1f2933;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
    }

    .field label {
      font-size: 0.9rem;
      color: #52606d;
    }

    .field input {
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #cbd2d9;
      background: #fff;
      font-size: 1rem;
      color: #1f2933;
    }

    .field input[readonly] {
      background: #f2f4f7;
      color: #52606d;
    }

    .info-block {
      background: #f2f4f7;
      border-radius: 6px;
      padding: 12px;
      font-size: 0.95rem;
      color: #3e4c59;
    }

    .simple-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5eaee;
      font-size: 0.95rem;
    }

    .simple-row:last-child {
      border-bottom: none;
    }

    .shipping-recipient {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .shipping-address {
      color: #52606d;
      line-height: 1.5;
    }

    .shipping-meta {
      margin-top: 8px;
      font-size: 0.9rem;
      color: #1f7a1f;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e5eaee;
      border-top-color: #0f609b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 12px auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .status {
      text-align: center;
      color: #52606d;
      font-size: 0.95rem;
      margin-top: 8px;
    }

    .btn {
      background: #0f609b;
      color: white;
      border: 1px solid #0f609b;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 12px;
      display: none;
    }

    .btn.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <h1>Revo payment</h1>
        <p id="subtitle">Confirm your order and we will mark it paid.</p>
      </div>
      <div class="label">Demo page · no real charge</div>
    </div>

    <div class="section">
      <div class="label">Total to pay</div>
      <div class="amount" id="amount">$0.00</div>
      <div class="info-block" style="margin-top: 12px;">This checkout is for testing. Keep this tab open while we finish.</div>
    </div>

    <div class="section">
      <h2>Payment method</h2>
      <div class="field">
        <label for="locked-card-number">Card number</label>
        // fake card number
        <input id="locked-card-number" type="text" placeholder="5236 9999 9999 9999" readonly>
      </div>
      <div style="display: flex; gap: 10px;">
        <div class="field" style="flex: 1;">
          <label for="locked-expiry">Expiry</label>
          <input id="locked-expiry" type="text" placeholder="MM / YY" readonly>
        </div>
        <div class="field" style="width: 140px;">
          <label for="locked-cvv">CVV</label>
          <input id="locked-cvv" type="text" placeholder="123" readonly>
        </div>
      </div>
      <p class="label" style="margin-top: 6px;">This is only a DEMO, only shows the payment flow</p>
    </div>

    <div class="section">
      <h2>Order summary</h2>
      <div class="simple-row">
        <span class="label">Order ID</span>
        <span class="value" id="order-id">-</span>
      </div>
      <div class="simple-row">
        <span class="label">Payment method</span>
        <span class="value" id="payment-method">Credit Card</span>
      </div>
      <div class="simple-row">
        <span class="label">Date</span>
        <span class="value" id="payment-date">-</span>
      </div>
    </div>

    <div class="section">
      <h2>Delivery</h2>
      <div id="shipping-info">
        <div class="shipping-recipient" id="shipping-recipient">Awaiting details</div>
        <div class="shipping-address" id="shipping-address">Shipping address will appear once provided.</div>
        <div class="shipping-meta" id="shipping-meta"></div>
      </div>
    </div>

    <div class="section" style="grid-column: 1 / -1;">
      <div class="spinner" id="spinner"></div>
      <p class="status" id="processing-text">Processing payment...</p>
      <button class="btn" id="return-btn">Return to Revo</button>
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
