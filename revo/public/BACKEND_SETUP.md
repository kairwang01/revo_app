# Backend Integration Guide

## Overview

Your Revo frontend now connects to the backend API automatically. When the backend is available, it uses real data. When unavailable, it uses mock data as fallback.

## Files Created

1. `assets/js/backendApi.js` - Backend API integration
2. `assets/js/config.js` - Configuration settings
3. `assets/js/api.js` - Updated main API module
4. `index.html` - Updated with new scripts

## Quick Setup

### Step 1: Configure Backend URL

Edit `assets/js/config.js` and change the backend URL:

```javascript
const CONFIG = {
  BACKEND_URL: 'http://localhost:8000',  // Change this
  // ...
};
```

For production:
```javascript
BACKEND_URL: 'https://api.yourapp.com',
```

### Step 2: Update HTML Files

Add these scripts to ALL HTML files (before other JavaScript):

```html
<!-- API Integration -->
<script src="./assets/js/config.js"></script>
<script src="./assets/js/backendApi.js"></script>
<script src="./assets/js/mockApi.js"></script>
<script src="./assets/js/api.js"></script>
```

Files to update:
- index.html (done)
- products.html
- product-detail.html
- cart.html
- checkout.html
- login.html
- register.html
- account.html
- orders.html
- sell.html
- settings.html

### Step 3: Start Backend

Make sure your backend is running at the configured URL.

### Step 4: Test

Open browser console and check for:
- "Using Backend API" (green) - Backend connected
- "Using Mock API" (orange) - Using fallback

## API Endpoints

### Authentication
- POST /api/auth/register - Register user
- POST /api/auth/token - Login (OAuth2)
- GET /api/auth/me - Get current user

### Products
- GET /api/products/ - List products with filters
- GET /api/products/search - Search products
- GET /api/products/deals - Get deals
- GET /api/products/{id} - Get single product

### Cart
- GET /api/cart/ - Get cart
- GET /api/cart/count - Get cart count
- POST /api/cart/items - Add to cart
- PUT /api/cart/items/{id} - Update item
- DELETE /api/cart/items/{id} - Remove item

### Orders
- POST /api/orders/ - Create order
- POST /api/orders/checkout - Checkout
- GET /api/orders/me - Get user orders

### Trade-in
- GET /api/tradein/brands - Get brands
- POST /api/tradein/estimate - Get estimate
- POST /api/tradein/pickup-requests - Create pickup
- GET /api/tradein/pickup-requests/me - Get user pickups
- POST /api/tradein/pickup-requests/{id}/respond - Respond to offer

### Other
- GET /api/categories/ - Get categories
- GET /api/locations/ - Get locations
- GET /api/locations/{id} - Get location

## Usage Examples

### Authentication

```javascript
// Register
const result = await api.register('user@example.com', 'password123');

// Login
const result = await api.login('user@example.com', 'password123');
if (result.success) {
  console.log('Logged in');
}

// Check if authenticated
if (api.isAuthenticated()) {
  const user = await api.getCurrentUser();
}

// Logout
await api.logout();
```

### Products

```javascript
// Get all products
const products = await api.getProducts();

// Get with filters
const filtered = await api.getProducts({
  category: 'Phone',
  brand: 'Apple',
  city: 'Ottawa',
  min_price: 100,
  max_price: 500
});

// Search
const results = await api.searchProducts('iPhone');

// Get deals
const deals = await api.getDeals(10);

// Get single product
const product = await api.getProduct(123);
```

### Cart

```javascript
// Add to cart
await api.addToCart(productId, quantity);

// Get cart
const cart = await api.getCart();

// Update quantity
await api.updateCartItem(productId, newQuantity);

// Remove item
await api.removeFromCart(productId);

// Get count
const count = await api.getCartCount();
```

### Orders

```javascript
// Checkout
const result = await api.checkout({
  items: cartItems,
  total: 299.99,
  paymentMethod: 'credit_card'
});

// Get orders
const orders = await api.getOrders();
```

### Trade-in

```javascript
// Get estimate
const estimate = await api.getTradeInEstimate({
  brand: 'Apple',
  model: 'iPhone 14',
  condition: 'A',
  storage: '256GB'
});

// Create pickup request
const formData = new FormData();
formData.append('brand_name', 'Apple');
formData.append('model_text', 'iPhone 14 Pro');
formData.append('condition', 'A');
formData.append('photos', fileInput.files[0]);

const result = await api.createPickupRequest(formData);

// Get user pickups
const pickups = await api.getMyPickups();

// Respond to offer
await api.respondToOffer(pickupId, 'accept');
```

## Configuration

### Backend URL

```javascript
// config.js
BACKEND_URL: 'http://localhost:8000'  // Development
BACKEND_URL: 'https://api.yourapp.com'  // Production
```

### Force Mock Mode

```javascript
FEATURES: {
  USE_BACKEND: false  // Use only mock data
}
```

### Debug Mode

```javascript
FEATURES: {
  DEBUG_MODE: true  // Show detailed logs
}
```

## Backend Requirements

### Authentication

Backend uses OAuth2 password flow:

```
POST /api/auth/token
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123&grant_type=password
```

Response:
```json
{
  "access_token": "token_here",
  "token_type": "bearer"
}
```

All authenticated requests need:
```
Authorization: Bearer <access_token>
```

### CORS Setup

Backend must allow CORS:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Testing

### Test Backend Connection

```javascript
// In browser console
await api.init();
await backendApi.checkHealth();
```

### Test with Mock Data

Mock credentials:
- Email: test@test.com
- Password: test

## Troubleshooting

### Backend Not Connecting

1. Check backend URL in config.js
2. Verify backend is running: curl http://localhost:8000/api/health
3. Check CORS settings
4. Check browser console for errors

### Authentication Issues

1. Backend must return access_token and token_type
2. Token stored in localStorage as authToken
3. Backend must accept application/x-www-form-urlencoded

### CORS Errors

Add CORS middleware to backend (see Backend Requirements section)

### 404 Errors

1. Verify API prefix is /api
2. Check endpoint paths match backend
3. Verify backend version

## Production Deployment

### Update Configuration

```javascript
// config.js
const CONFIG = {
  BACKEND_URL: 'https://api.yourapp.com',
  FEATURES: {
    DEBUG_MODE: false
  }
};
```

### Environment Variables

```javascript
const CONFIG = {
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
};
```

## Architecture

```
Frontend Pages
      |
      v
   api.js (Main Interface)
      |
      +-- backendApi.js (Real API)
      |        |
      |        v
      |   Backend Server
      |
      +-- mockApi.js (Fallback)
               |
               v
          Local JSON Files
```

## Key Features

1. Automatic backend detection
2. Seamless fallback to mock data
3. Unified API interface
4. Automatic token management
5. Error handling with fallback

## Next Steps

1. Update remaining HTML files with script includes
2. Configure backend URL
3. Test all features
4. Deploy to production

---

Last Updated: January 2025
Version: 1.0.0
