# Backend Integration Guide

## Overview

Your Revo frontend connects directly to the backend API at https://revo-backend-o03w.onrender.com/

## Files Created

1. `assets/js/backendApi.js` - Backend API integration
2. `assets/js/config.js` - Configuration settings
3. `assets/js/api.js` - Main API module
4. `index.html` - Updated with scripts

## Quick Setup

### Step 1: Add Scripts to HTML Files

Add these scripts to ALL HTML files (before other JavaScript):

```html
<!-- API Integration -->
<script src="./assets/js/config.js"></script>
<script src="./assets/js/backendApi.js"></script>
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

### Step 2: Test Connection

Open browser console and check for "Backend API Connected" message.

## Configuration

Backend URL is set in `assets/js/config.js`:

```javascript
BACKEND_URL: 'https://revo-backend-o03w.onrender.com/'
```


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

All authenticated requests include:
```
Authorization: Bearer <access_token>
```

## Testing

### Test Backend Connection

```javascript
// In browser console
await api.init();
```

Should show "Backend API Connected" in console.

## Troubleshooting

### Backend Not Connecting

1. Check backend URL in config.js
2. Verify backend is running: https://revo-backend-o03w.onrender.com/api/health
3. Check browser console for errors
4. Check network tab in DevTools

### Authentication Issues

1. Backend must return access_token and token_type
2. Token stored in localStorage as authToken
3. Backend must accept application/x-www-form-urlencoded

### CORS Errors

Backend must have CORS enabled for your frontend domain.

### 404 Errors

1. Verify API prefix is /api
2. Check endpoint paths match backend
3. Verify backend version

## Architecture

```
Frontend Pages
      |
      v
   api.js
      |
      v
backendApi.js
      |
      v
Backend Server
(https://revo-backend-o03w.onrender.com/)
```

## Next Steps

1. Add script tags to remaining HTML files
2. Test all features with backend
3. Deploy frontend

---

Last Updated: November 2025
Version: 1.0.0
