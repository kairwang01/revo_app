# Revo E-Commerce Platform - Static Build

A fully functional local static e-commerce platform for Apple & Samsung refurbished devices, built with vanilla HTML, CSS, and JavaScript. No frameworks required.

## 🎯 Features

- **Multi-page Architecture**: 11 dedicated HTML pages for complete e-commerce flow
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Geolocation Support**: Auto-detect user's city using browser geolocation API
- **City-Based Pricing**: Dynamic tax rates for 5 cities (Vancouver 12%, Edmonton 5%, Toronto 13%, Montreal 14.975%, Ottawa 13%)
- **Shopping Cart**: Full cart functionality with localStorage persistence
- **Product Catalog**: Filterable product listings with search
- **Trade-In System**: Device trade-in estimation form
- **Mock Authentication**: Login/register with localStorage
- **Orders Management**: View purchase and trade-in orders
- **Green Theme**: Revo brand color (#43CD80) throughout

## 📁 Project Structure

```
revo/
├── public/
│   ├── index.html              # Home page
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── account.html            # User account dashboard
│   ├── settings.html           # Settings page
│   ├── products.html           # Product listing
│   ├── product-detail.html     # Product details
│   ├── cart.html               # Shopping cart
│   ├── checkout.html           # Checkout flow
│   ├── orders.html             # Order history
│   ├── sell.html               # Trade-in/sell page
│   ├── favicon.svg             # Site favicon
│   │
│   └── assets/
│       ├── css/
│       │   ├── tokens.css      # Design tokens & variables
│       │   ├── base.css        # Base styles & resets
│       │   ├── layout.css      # Layout utilities
│       │   ├── components.css  # Component styles
│       │   └── pages.css       # Page-specific styles
│       │
│       ├── js/
│       │   ├── storage.js      # LocalStorage management
│       │   ├── api.js          # API/data fetching
│       │   ├── ui.js           # UI utilities
│       │   ├── main.js         # App initialization
│       │   └── pages/
│       │       ├── home.js
│       │       ├── login.js
│       │       ├── cart.js
│       │       └── products.js
│       │
│       └── data/
│           ├── products.json    # Mock product data
│           ├── categories.json  # Product categories
│           ├── orders.json      # Mock order data
│           ├── user.json        # Mock user data
│           └── wallet.json      # Mock wallet data
│
└── README.md
```

## 🚀 Getting Started

### Option 1: Open Directly in Browser

Simply double-click `public/index.html` to open in your default browser.

### Option 2: Use Local Server (Recommended)

#### Using Python:
```bash
cd revo/public
python -m http.server 8000
```

Then open: http://localhost:8000

#### Using PHP:
```bash
cd revo/public
php -S 127.0.0.1:8000
```

Then open: http://127.0.0.1:8000

#### Using Node.js (http-server):
```bash
npm install -g http-server
cd revo/public
http-server -p 8000
```

Then open: http://localhost:8000

## 🎨 Design System

### Color Palette
- **Primary Green**: `#43CD80` - Main brand color
- **Dark Green**: `#22B37A` - Accents & gradients
- **Background**: `#F6F9F7` - Light gray-green
- **Surface**: `#FFFFFF` - Card backgrounds
- **Text**: `#1a1d1f` - Primary text

### Typography
- **Font Family**: 'Inter', 'Noto Sans SC', system fonts
- **Base Size**: 16px (1rem)
- **Scale**: 0.75rem, 0.875rem, 1rem, 1.125rem, 1.375rem, 1.75rem

### Spacing Scale
- Based on 4px grid: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem

### Border Radius
- **XS**: 8px - Small elements
- **SM**: 12px - Buttons, inputs
- **MD**: 16px - Cards
- **LG**: 22px - Large cards
- **Pill**: 999px - Fully rounded

## 🛠️ Features & Functionality

### City Selection
- Dropdown in header allows city selection
- Affects product availability and tax calculation
- Persisted in localStorage

### Shopping Cart
- Add/remove products
- Update quantities
- Automatic tax calculation based on selected city
- Persisted in localStorage

### Product Filtering
- Filter by brand (Apple/Samsung)
- Filter by category (Phones, Laptops, Tablets)
- Real-time search functionality

### Mock Authentication
- Login with any email/password
- Registration form
- Auth state persisted in localStorage
- Protected routes redirect to login

### Tax Rates by City
- **Vancouver, BC**: 12% (HST)
- **Edmonton, AB**: 5% (GST)
- **Ottawa, ON**: 13% (HST)

## 📱 Page Descriptions

### Home (`index.html`)
- Hero banner with promotion
- Category navigation
- My Items section
- Deals Center
- Trending curations
- Bottom navigation bar
- Floating "Trade-In" FAB button

### Products (`products.html`)
- Product grid with filters
- City-based availability
- Search functionality
- Category filtering

### Product Detail (`product-detail.html`)
- Full product information
- Image, price, highlights
- Add to cart functionality
- Buy now option

### Cart (`cart.html`)
- Cart item list
- Quantity adjustment
- Remove items
- Tax calculation
- Checkout button

### Checkout (`checkout.html`)
- Delivery address selection
- Payment method selection
- Order summary
- Place order button

### Account (`account.html`)
- Wallet balance display
- Order summary stats
- Quick access to orders
- Settings link

### Trade-In/Sell (`sell.html`)
- Device information form
- Condition selection
- Photo upload
- Instant estimate calculation

## 🔌 Backend Integration Placeholders

All API calls are marked with:
```javascript
// TODO: bind to Python FastAPI backend
```

### API Endpoints to Implement

```javascript
// Products
GET /api/products?city={city}&brand={brand}
GET /api/products/{id}

// Categories
GET /api/categories

// Orders
GET /api/orders
POST /api/orders

// User
GET /api/user
POST /api/auth/login
POST /api/auth/register

// Trade-In
POST /api/tradein/estimate
POST /api/tradein/submit

// Wallet
GET /api/wallet
POST /api/wallet/topup
```

### Authentication Header
```javascript
headers: {
  'Authorization': 'Bearer {jwt_token}',
  'Content-Type': 'application/json'
}
```

## 💾 LocalStorage Schema

### Keys Used
- `revo_city`: Selected city
- `revo_auth`: Authentication data
- `revo_cart`: Shopping cart items
- `revo_user`: User profile
- `revo_wallet`: Wallet information

## 🧪 Testing

1. Open `public/index.html` in a browser
2. Test city selection (check tax rates update)
3. Add products to cart
4. Test login/logout flow
5. Complete a checkout
6. Test trade-in form

## 📦 No Dependencies

This project uses:
- ✅ Pure HTML5
- ✅ Pure CSS3 (with CSS Variables)
- ✅ Vanilla JavaScript (ES6+)
- ❌ No React/Vue/Angular
- ❌ No jQuery
- ❌ No Bootstrap
- ❌ No CDN dependencies

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔜 Future Python Backend Integration

When connecting to a Python FastAPI backend:

1. Update `API_BASE` in `assets/js/api.js`
2. Replace mock functions with actual HTTP requests
3. Implement JWT token refresh
4. Add proper error handling
5. Connect to PostgreSQL/MySQL database

## 📝 License

This is a demonstration project for educational purposes.

## 🤝 Contributing

This is a static prototype. For production use, connect to a proper backend API.

---

**Built with ❤️ using Vanilla JS, HTML5 & CSS3**
