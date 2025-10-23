# Revo C2B2C Electronics Trade-In Platform

A fully functional electronics trade-in and resale Progressive Web App following the C2B2C model (Consumer-to-Business-to-Consumer), similar to platforms like Aihuishou.

## Business Flow

Revo operates on a comprehensive 5-stage trade-in process:

### Stage 1: User Initiation & Quotation
Users select their device category (phone/tablet/laptop), answer condition questions, and receive an AI-powered initial quote.

### Stage 2: Order Creation & Logistics
Users enter personal details, choose pickup methods (door pickup, self-delivery, or store drop-off), and confirm the trade-in order.

### Stage 3: Pickup & Professional Inspection
Courier collects the device, which undergoes 280+ point inspection process including appearance, functionality, and quality checks, generating a detailed report.

### Stage 4: Price Confirmation & Payment
Users receive inspection results and final price. They can accept the offer (with automatic payment) or reject it (device returned free of charge).

### Stage 5: Refurbishment & Resale
Accepted devices are refurbished, certified, and listed on the marketplace for resale, completing the C2B2C cycle.

## Key Features

- **C2B2C Trade-In Platform**: Complete electronics trade-in workflow
- **Dual Architecture**: Single-Page App (SPA) and Multi-Page App (MPA) builds
- **AI-Powered Pricing**: Dynamic quotes based on device condition, market data, and AI algorithms
- **Professional Inspection**: 280+ checkpoint inspection process with detailed reporting
- **PWA Features**: Service worker, offline support, installable app
- **Location-Aware**: City-based pricing, taxes, and logistics
- **User Authentication**: Registration, login, and account management
- **Product Marketplace**: Certified refurbished devices for resale
- **Order Tracking**: Real-time status updates throughout the trade-in process
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Pure Vanilla JavaScript**: No external frameworks or dependencies

## Quick Start

1. Open `public/index.html` directly in a modern browser for testing with mock data.
2. For full PWA features, serve via HTTP: `python -m http.server 8000` then visit `http://localhost:8000/public/index.html`.

## Project Structure

Revo supports dual build architectures: a **Single-Page Application (SPA)** for modern PWA experience and a **Multi-Page Application (MPA)** version with individual HTML pages.

### Root Directory

Core configuration and documentation:

```
revo_app/
├── README.md                    # Project documentation (this file)
├── TESTING_GUIDE.md             # Comprehensive testing scenarios
├── sw.js                        # Service worker for PWA offline support
├── .editorconfig               # Code style configuration
├── .gitattributes               # Git attributes for line endings/media
├── public/                      # SPA web root and build output
├── revo/                       # MPA build with individual HTML pages
└── src/                        # Source code (development)
```

### Source Code (src/)

Modular vanilla JavaScript architecture with ES modules:

```
src/
├── app/                        # Core application logic (ES6 modules)
│   ├── main.js                 # App initialization, routing, PWA setup
│   ├── router.js               # Client-side routing with hash navigation
│   ├── config.js               # API configuration, endpoints, route maps
│   ├── api.js                  # HTTP client, authentication, error handling
│   ├── storage.js              # LocalStorage wrapper with validation
│   ├── ui.js                   # DOM utilities, icon injection, loaders
│   ├── env.js                  # Environment detection (WebP/AVIF formats)
│   ├── guards.js               # Route guards for authentication checks
│   └── sw-register.js          # Service worker registration and updates
│
├── components/                 # Reusable UI components (ES modules)
│   ├── Header.js               # Top navigation with search and location
│   ├── BottomBar.js            # Bottom tab navigation for mobile
│   ├── CategoryStrip.js        # Horizontal scrolling category selector
│   ├── Banner.js               # Promotional/announcement banners
│   ├── Loader.js               # Loading spinners and progress indicators
│   ├── Modal.js                # Modal dialogs and overlays
│   ├── Toast.js                # Non-intrusive notifications
│   └── IconSprite.svg          # SVG sprite with all UI icons
│
├── pages/                      # Page-specific business logic modules
│   ├── Home.js                 # Homepage with featured products/banners
│   ├── Products.js             # Product catalog with filters/search
│   ├── ProductDetail.js        # Individual product view with specs
│   ├── Cart.js                 # Shopping cart management
│   ├── Checkout.js             # Multi-step checkout process
│   ├── Curated.js              # C2B2C interface for trade-in flow
│   ├── Account.js              # User profile and order history
│   ├── Login.js                # Authentication form
│   ├── Register.js             # User registration with validation
│   ├── Settings.js             # App preferences (city, notifications)
│   ├── OrderTracking.js        # Real-time order tracking interface
│   └── NotFound.js             # 404 error page
│
├── styles/                     # CSS architecture (mobile-first)
│   ├── tokens.css              # Design tokens (colors, spacing, fonts)
│   ├── base.css                # Reset, typography, global styles
│   ├── components.css          # Component-specific styles
│   └── pages.css               # Page-specific layout styles
│
└── data/                       # Mock data for development
    ├── categories.mock.json    # Product categories
    ├── products.mock.json      # Product catalog
    ├── orders.mock.json        # Order history examples
    ├── user.mock.json          # User profile data
    └── wallet.mock.json        # Payment/balance data
```

### SPA Build Output (public/)

Hosted files for the single-page application:

```
public/
├── index.html                  # Main HTML entry point with shell
├── manifest.webmanifest        # PWA manifest (install, icons, theme)
├── favicon.svg                 # Browser favicon
└── icons/                      # PWA installation icons
    ├── 192.png                 # Touch icon (192x192)
    └── 512.png                 # Splash screen icon (512x512)
```

### MPA Build Output (revo/public/)

Alternative build with separate HTML pages:

```
revo/public/
├── index.html                  # Homepage entry point
├── account.html                # User account page
├── cart.html                   # Shopping cart
├── checkout.html               # Checkout process
├── choose-city.html            # Location selection
├── login.html                  # Authentication
├── orders.html                 # Order history
├── order-tracking.html         # Individual order tracking
├── product-detail.html         # Product detail page
├── products.html               # Product catalog
├── register.html               # Registration
├── sell.html                   # Trade-in flow (C2B2C)
└── settings.html               # User preferences
│
├── assets/
│   ├── css/                    # Stylesheets (compiled)
│   │   ├── tokens.css          # Design tokens
│   │   ├── base.css            # Base styles
│   │   ├── components.css      # Component styles
│   │   ├── layout.css          # Layout utilities
│   │   └── pages.css           # Page-specific styles
│   │
│   ├── js/                     # JavaScript modules (compiled)
│   │   ├── main.js             # Main application logic
│   │   ├── api.js              # API communication
│   │   ├── ui.js               # UI utilities
│   │   ├── storage.js          # Storage management
│   │   ├── geo.js              # Geolocation utilities
│   │   └── pages/              # Page-specific scripts
│   │       ├── home.js         # Homepage interactions
│   │       ├── products.js     # Product catalog logic
│   │       ├── product-detail.js # Product detail page
│   │       ├── cart.js         # Cart functionality
│   │       └── login.js        # Login form handling
│   │
│   └── data/                   # Static data files
│       ├── products.json       # Product data
│       ├── categories.json     # Category list
│       ├── orders.json         # Order examples
│       ├── user.json           # User data
│       └── wallet.json         # Wallet balance data
│
└── revo/README.md              # Multi-page build documentation
```

### MPA Build Features

The Multi-Page Application (MPA) build in `revo/` provides a traditional multi-page architecture with individual HTML files. Key features include:

- **11 Dedicated HTML Pages**: Complete e-commerce flow with separate pages
- **City-Based Tax Calculation**: Dynamic pricing for 5 cities (Vancouver 12%, Edmonton 5%, Ottawa 13%)
- **Geolocation Integration**: Auto-detect and set city using browser geolocation API
- **Full Shopping Cart**: Add/remove products with localStorage persistence
- **Product Filtering**: Filter by brand (Apple/Samsung) and category
- **Mock Authentication**: Login/logout with localStorage state management
- **Order Management**: View and track purchase orders
- **Trade-In Estimation**: Device appraisal form for C2B2C flow
- **Green Theme Design**: Consistent #43CD80 brand color throughout

#### MPA Getting Started

1. Open `revo/public/index.html` directly in a browser
2. For optimal experience, serve with HTTP: `python -m http.server 8000` then visit `http://localhost:8000`
3. Test city selection to see tax rate updates
4. Add products to cart and complete checkout
5. Test trade-in form for device estimates

See `revo/README.md` for detailed MPA documentation including design system specifications and page descriptions.
```

## Configuration

Edit `src/app/config.js` to:

- Toggle between mock and real API: `API.MOCK = true/false`
- Set API base URL: `API.BASE_URL = 'your-api-url'`
- Configure cities, taxes, and brands

## Backend Integration

To use real API instead of mock data:

1. Set `API.MOCK = false` in config.js
2. Implement these endpoints on your backend:
   - Authentication: POST /auth/login, POST /auth/register, GET /auth/me
   - Products: GET /products, GET /products/:id
   - Orders: POST /orders, GET /orders, GET /orders/:id
   - Wallet: GET /wallet

## Testing

See TESTING_GUIDE.md for comprehensive testing scenarios.

Basic test:
- Open public/index.html
- Register an account
- Browse and add products to cart
- Complete checkout
- View orders

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers
