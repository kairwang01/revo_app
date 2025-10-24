# Revo - Phone Recycling & Trading Platform

A modern web application for buying and selling refurbished smartphones with an integrated trade-in and recycling program.

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Mock Data Configuration](#mock-data-configuration)
- [Features](#features)
- [Development](#development)
- [API Documentation](#api-documentation)

---

## Project Overview

Revo is a Progressive Web App (PWA) focused on sustainability, allowing users to:
- Browse and purchase refurbished smartphones
- Trade-in old devices for credit
- Schedule pickup services for device recycling
- Manage orders and wallet balance
- Access coupons and promotions

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage for client-side data persistence
- **Architecture**: Component-based structure with modular JS
- **Mock API**: Simulated backend with realistic latency
- **Design**: Mobile-first responsive design

---

## Project Structure

```
public/
├── index.html                 # Home page
├── login.html                 # Login page
├── register.html              # Registration page
├── account.html               # User account dashboard (protected)
├── products.html              # Product browsing
├── product-detail.html        # Product details
├── cart.html                  # Shopping cart
├── checkout.html              # Checkout process
├── orders.html                # Order history
├── sell.html                  # Trade-in/sell device
├── settings.html              # User settings
├── clear-auth.html            # Authentication utility
├── assets/
│   ├── css/
│   │   ├── base.css          # Base styles
│   │   ├── components.css    # UI components
│   │   ├── layout.css        # Layout structures
│   │   ├── pages.css         # Page-specific styles
│   │   └── tokens.css        # Design tokens
│   ├── js/
│   │   ├── api.js            # API wrapper
│   │   ├── mockApi.js        # Mock backend service
│   │   ├── storage.js        # LocalStorage utilities
│   │   ├── ui.js             # UI utilities
│   │   ├── main.js           # App initialization
│   │   ├── geo.js            # Geolocation services
│   │   └── pages/
│   │       ├── login.js      # Login page logic
│   │       ├── account.js    # Account page logic
│   │       ├── home.js       # Home page logic
│   │       ├── products.js   # Products page logic
│   │       ├── cart.js       # Cart page logic
│   │       ├── sell.js       # Sell/trade-in logic
│   │       └── product-detail.js
│   └── data/
│       ├── user.json         # User profile data
│       ├── products.json     # Product catalog
│       ├── devices.json      # User's trade-in devices
│       ├── orders.json       # Order history
│       ├── coupons.json      # Available coupons
│       ├── wallet.json       # Wallet and transactions
│       └── categories.json   # Product categories
└── README.md                  # This file
```

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A local web server (optional, for development)

### Installation

1. Clone or download the project files
2. Navigate to the `public` directory
3. Open any HTML file in a web browser, or use a local server:

```bash
# Using Python
cd public
python -m http.server 8000

# Using Node.js (with http-server)
cd public
npx http-server -p 8000

# Using PHP
cd public
php -S localhost:8000
```

4. Visit `http://localhost:8000` in your browser

---

## Authentication

### Test Login Credentials

- **Email**: `test@test.com`
- **Password**: `test`

### Default State

**The application defaults to a logged-out state.** No authentication credentials are stored by default. Users must manually log in with the test credentials.

### Protected Pages

Certain pages require authentication and will redirect to login if accessed while not logged in:

- **account.html**: User account dashboard
  - Redirects to `login.html` if not authenticated
  - Only logged-in users can see account data and the "Sign Out" button
  - Automatically loads wallet balance and order statistics
  - Logout button clears all authentication data

### Login Flow

1. Navigate to `login.html`
2. Enter email: `test@test.com`
3. Enter password: `test`
4. Click "Sign In" button
5. Redirected to account page or return URL

### Clearing Authentication

Use the `clear-auth.html` utility to ensure a clean logged-out state:

1. Open `clear-auth.html` in your browser
2. Click "清除登录状态" (Clear Login State) button
3. All authentication data is removed from localStorage

The utility clears:
- `mockAuthToken`
- `mockUser`
- `revo_auth`
- `revo_user`
- `revo_wallet`

---

## Mock Data Configuration

All mock data has been updated with real, consistent information for testing purposes.

### Recent Changes

#### 1. Mock API (`assets/js/mockApi.js`)
- Updated `MOCK_CREDENTIALS` to use email-based authentication
- Changed from username/password to email/password
- Login function now accepts email parameter
- Error messages updated to reference "email"

#### 2. User Data (`assets/data/user.json`)
- **Email**: test@test.com
- **Name**: Test User
- **Phone**: +1 (613) 555-0100
- **Address**: 75 Laurier Ave E, Ottawa, ON K1N 6N5
- **City**: Ottawa
- **User ID**: 1

#### 3. API Layer (`assets/js/api.js`)
- Updated `login()` function to accept email parameter
- Backend API calls send email in request body
- Fallback to mock API handles email-based authentication

#### 4. Devices Data (`assets/data/devices.json`)
- Updated `user_id` from 100 to 1 to match user.json
- Both devices properly linked to test user account

#### 5. Orders Data (`assets/data/orders.json`)
- Shipping addresses updated with consistent test user information
- Name, address, and phone match user.json data

### Data Consistency

All mock data files use consistent information:
- **User ID**: 1
- **Email**: test@test.com
- **Name**: Test User
- **Location**: Ottawa, ON
- **Phone**: +1 (613) 555-0100
- **Address**: 75 Laurier Ave E, K1N 6N5
- **Postal Code**: K1N 6N5

---

## Features

### For Buyers
- Browse refurbished smartphones by brand, condition, storage
- Filter products by city availability
- Add items to cart and checkout
- Track orders and delivery status
- Manage multiple shipping addresses

### For Sellers
- Get instant trade-in estimates
- Schedule engineer pickup service
- Track device inspection status
- Receive payment to wallet
- Apply coupons for service fee discounts

### Wallet & Payments
- Digital wallet with CAD balance
- Top-up functionality
- Transaction history
- Coupon management
- Automatic payment processing

### Account Management
- View order history (buy/sell)
- Update profile information
- Manage addresses
- Notification preferences
- Settings and support

---

## Development

### Mock API System

The application uses a comprehensive mock API system (`mockApi.js`) that simulates backend behavior:

**Features:**
- Simulated network latency (200-400ms)
- Authentication with session tokens
- Data persistence via localStorage
- Error handling and validation
- Realistic response formats

**Key Methods:**
```javascript
// Authentication
mockApi.login(email, password)
mockApi.logout()
mockApi.isAuthenticated()

// User & Wallet
mockApi.getUser()
mockApi.getWallet()
mockApi.getCoupons()

// Devices & Trade-ins
mockApi.getDevices()
mockApi.getDevice(deviceId)
mockApi.getTradeInEstimate(deviceData)
mockApi.requestPickup(deviceId, pickupDetails)
mockApi.confirmTradeIn(deviceId, couponId)
```

### Storage System

The `storage.js` module provides utilities for managing localStorage:

**Stores:**
- `cityStore` - Selected city
- `authStore` - Authentication state
- `cartStore` - Shopping cart items
- `userStore` - User profile
- `walletStore` - Wallet balance

**Example Usage:**
```javascript
// Check authentication
if (authStore.isAuthenticated()) {
  const user = authStore.get();
  console.log(user.token);
}

// Manage cart
cartStore.add(product, quantity);
const total = cartStore.getTotal();
cartStore.clear();
```

### Creating Protected Pages

To protect a page with authentication:

1. Create a page-specific JS file in `assets/js/pages/`
2. Add authentication check on DOMContentLoaded:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!authStore.isAuthenticated()) {
    window.location.href = './login.html?return=' + 
      encodeURIComponent(window.location.href);
    return;
  }
  
  // Load page data
  await loadPageData();
});
```

3. Include the script in your HTML file:

```html
<script src="./assets/js/storage.js"></script>
<script src="./assets/js/api.js"></script>
<script src="./assets/js/ui.js"></script>
<script src="./assets/js/pages/your-page.js"></script>
```

### UI Components

Common UI components are available in `ui.js`:

```javascript
// Toast notifications
showToast('Success message', 'success');
showToast('Error message', 'error');
showToast('Info message', 'info');

// Loading states
showLoading();
hideLoading();
```

---

## API Documentation

### Authentication Endpoints

#### Login
```javascript
api.login(email, password)
// Returns: { success: boolean, token: string, user: object, message: string }
```

#### Logout
```javascript
api.logout()
// Returns: { success: boolean, message: string }
```

### User & Wallet Endpoints

#### Get User Profile
```javascript
api.getWallet()
// Returns: { success: boolean, data: { balance, currency, coupons, transactions } }
```

#### Get Coupons
```javascript
api.getCoupons()
// Returns: { success: boolean, data: [coupon objects] }
```

### Product Endpoints

#### Get Products
```javascript
api.getProducts({ city, brand, search, limit })
// Returns: [product objects]
```

#### Get Product by ID
```javascript
api.getProduct(id)
// Returns: product object or null
```

#### Get Categories
```javascript
api.getCategories()
// Returns: [category objects]
```

### Trade-In & Recycling Endpoints

#### Get Trade-In Estimate
```javascript
api.getTradeInEstimate({
  brand: 'Apple',
  model: 'iPhone 14',
  condition: 'Good',
  storage: '128GB'
})
// Returns: { success: boolean, data: { estimated_price, ... } }
```

#### Get User's Devices
```javascript
api.getDevices()
// Returns: { success: boolean, data: [device objects] }
```

#### Request Pickup
```javascript
api.requestPickup(deviceId, {
  location: 'University of Ottawa',
  notes: 'Optional pickup notes'
})
// Returns: { success: boolean, data: { pickup_id, engineer_assigned, ... } }
```

#### Confirm Trade-In
```javascript
api.confirmTradeIn(deviceId, couponId)
// Returns: { success: boolean, data: { transaction_id, final_amount, ... } }
```

### Order Endpoints

#### Get Orders
```javascript
api.getOrders()
// Returns: [order objects]
```

#### Checkout
```javascript
api.checkout(orderData)
// Returns: { success: boolean, orderId: string, message: string }
```

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with test@test.com / test
- [ ] Logout clears all auth data
- [ ] Protected pages redirect to login
- [ ] Invalid credentials show error message

**Product Browsing:**
- [ ] Products load on home page
- [ ] City filter works correctly
- [ ] Product detail page displays correctly
- [ ] Add to cart functionality

**Trade-In Flow:**
- [ ] Get estimate with device details
- [ ] Request pickup service
- [ ] View devices awaiting pickup
- [ ] Confirm trade-in with coupon

**Cart & Checkout:**
- [ ] Add/remove items from cart
- [ ] Update quantities
- [ ] Apply coupons
- [ ] Complete checkout

**Account Management:**
- [ ] View wallet balance
- [ ] Check order history
- [ ] Update settings
- [ ] Manage addresses

---

## Troubleshooting

### Issue: Not logged in by default
**Solution**: This is expected behavior. The app defaults to logged-out state. Use clear-auth.html to ensure clean state, then login at login.html.

### Issue: Account page shows "Sign Out" when not logged in
**Solution**: This has been fixed. The account page now checks authentication and redirects to login if not authenticated.

### Issue: Mock API not working
**Solution**: Check browser console for errors. Ensure all script files are loaded in correct order.

### Issue: LocalStorage data persists
**Solution**: Use clear-auth.html utility or manually clear localStorage in browser DevTools.

---

## License

This project is for educational and demonstration purposes.

---

## Contributing

This is a demonstration project. For questions or suggestions, please refer to the project documentation.

---

## Support

For technical issues or questions about the implementation, refer to:
- The inline code comments
- This README file
- Browser DevTools console logs

---

**Last Updated**: October 2025
**Version**: 1.0.0
