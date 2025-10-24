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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .payment-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-weight: bold;
    }
    
    h1 {
      color: #1a202c;
      font-size: 24px;
      margin-bottom: 12px;
    }
    
    .subtitle {
      color: #718096;
      font-size: 14px;
      margin-bottom: 30px;
    }
    
    .amount {
      font-size: 48px;
      font-weight: 700;
      color: #667eea;
      margin: 20px 0;
    }
    
    .merchant {
      background: #f7fafc;
      padding: 16px;
      border-radius: 8px;
      margin: 24px 0;
      text-align: left;
    }
    
    .merchant-label {
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .merchant-name {
      font-size: 16px;
      font-weight: 600;
      color: #1a202c;
    }
    
    .order-info {
      background: #f7fafc;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      text-align: left;
      font-size: 14px;
    }
    
    .order-info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .order-info-row:last-child {
      margin-bottom: 0;
    }
    
    .order-info-label {
      color: #718096;
    }
    
    .order-info-value {
      color: #1a202c;
      font-weight: 500;
    }
    
    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 30px auto;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .processing-text {
      color: #718096;
      font-size: 16px;
      margin-top: 20px;
    }
    
    .security-badges {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 32px;
      padding-top: 32px;
      border-top: 1px solid #e2e8f0;
    }
    
    .badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #718096;
    }
    
    .badge svg {
      width: 16px;
      height: 16px;
      fill: #48bb78;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: #48bb78;
      border-radius: 50%;
      margin: 0 auto 24px;
      display: none;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 40px;
    }
    
    .success-icon.show {
      display: flex;
    }
    
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-top: 24px;
      display: none;
    }
    
    .btn:hover {
      opacity: 0.9;
    }
    
    .btn.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="payment-container">
    <div class="logo">💳</div>
    
    <h1 id="title">Processing Payment</h1>
    <p class="subtitle" id="subtitle">Please wait while we process your transaction</p>
    
    <div class="success-icon" id="success-icon">✓</div>
    
    <div class="amount" id="amount">$0.00</div>
    
    <div class="merchant">
      <div class="merchant-label">Merchant</div>
      <div class="merchant-name">Revo - Phone Trading Platform</div>
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
    
    <div class="spinner" id="spinner"></div>
    <p class="processing-text" id="processing-text">Securely processing your payment...</p>
    
    <button class="btn" id="return-btn">Return to Revo</button>
    
    <div class="security-badges">
      <div class="badge">
        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        SSL Encrypted
      </div>
      <div class="badge">
        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        PCI Compliant
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
    
    // Simulate payment processing (2-3 seconds)
    setTimeout(() => {
      // Hide spinner and processing text
      document.getElementById('spinner').style.display = 'none';
      document.getElementById('processing-text').style.display = 'none';
      
      // Show success state
      document.getElementById('title').textContent = 'Payment Successful!';
      document.getElementById('subtitle').textContent = 'Your order has been placed successfully';
      document.getElementById('success-icon').classList.add('show');
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
  </script>
</body>
</html>
