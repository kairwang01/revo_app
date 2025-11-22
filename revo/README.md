# Revo C2B2C Electronics Platform

Revo is a consumer-to-business-to-consumer (C2B2C) trade-in and resale experience for Apple and Samsung hardware. The frontend is a multi-page progressive web experience written in vanilla HTML, CSS, and ES modules, while the backend (FastAPI + PostgreSQL) exposes live pricing, cart, order, and trade-in services. This repository consolidates the UI implementation, backend integration contract, and the complete system specification so that engineering, product, and operations share a single source of truth.

## Table of Contents
- [High-Level Overview](#high-level-overview)
- [Repository Layout](#repository-layout)
- [Frontend Experience](#frontend-experience)
- [Backend Integration Workflow](#backend-integration-workflow)
- [Trade-In and Order Lifecycle](#trade-in-and-order-lifecycle)
- [Data Model Snapshot](#data-model-snapshot)
- [API Surface Summary](#api-surface-summary)
- [Getting Started](#getting-started)
- [Testing and QA](#testing-and-qa)
- [Roadmap](#roadmap)
- [License and Contribution](#license-and-contribution)

## High-Level Overview
- **Business Model**: Users sell devices to Revo (C2B), Revo refurbishes and resells inventory to new customers (B2C). Reference competitor: Aihuishou.
- **Frontend Stack**: Static assets served from `/public` with no bundler. Modern CSS variables, utility styles, and modular JavaScript coordinate UI state, LocalStorage, and backend calls.
- **Backend Stack**: FastAPI services backed by PostgreSQL, Redis, Celery workers, ML-based quotation engine, and AWS S3 for inspection imagery.
- **Key Capabilities**: Mobile-first storefront, dynamic tax calculation by city, geolocation hints, live inventory, trade-in estimator, authenticated cart and checkout, and an orders dashboard that tracks both purchases and trade-ins.
- **Design System**: Revo green `#43CD80`, 4px spacing scale, Inter/Noto Sans typography, rounded components, and consistent card-based layout.

## Repository Layout
```
revo/
├── public/
│   ├── *.html                # 11 core pages plus order tracking
│   └── assets/
│       ├── css/              # tokens.css, base.css, layout.css, components.css, pages.css
│       └── js/
│           ├── config.js     # BACKEND_URL, API flags
│           ├── backendApi.js # Low-level HTTP client + auth helpers
│           ├── api.js        # Feature-specific API surface
│           ├── storage.js    # LocalStorage utilities
│           ├── ui.js, main.js
│           └── pages/        # Controllers per screen (home, products, cart…)
├── SYSTEM_SPECIFICATION.md   # Full C2B2C process spec and backend contract
├── public/BACKEND_SETUP.md   # Frontend ↔ backend wiring guide
└── README.md                 # Consolidated documentation (this file)
```

## Frontend Experience

### Technology Profile
- **UI Runtime**: Plain HTML5 templates enhanced with ES modules; no frameworks or build tooling.
- **State Handling**: `storage.js` centralizes LocalStorage usage (`revo_city`, `revo_cart`, `revo_auth`, etc.).
- **API Layer**: `backendApi.js` manages authentication headers, retries, and base URL composition. `api.js` exposes semantic calls such as `getProducts`, `checkout`, and `getTradeInEstimate`.
- **Responsive Design**: Layouts target mobile first, then scale up via CSS utility classes; service worker hooks allow PWA readiness.

### Core Screens
- `index.html`: Hero, curated deals, quick links, FAB for trade-in, and city selector.
- `products.html` / `product-detail.html`: Live catalogue with filters (brand, category, search) plus detail view with add-to-cart.
- `cart.html` and `checkout.html`: Synced cart totals, tax per city, delivery and payment selection, order submission.
- `login.html`, `register.html`, `account.html`: Authentication, wallet snapshot, profile shortcuts, logout.
- `orders.html` and `order-tracking.html`: Combined view of purchase and trade-in pipelines, price confirmation dialogs, status timeline.
- `sell.html`: Trade-in wizard that captures device info, condition, photos, and uses backend estimation.
- `settings.html`: City preference, notification toggles, session reset.

### UX Highlights
- City-based tax matrix (Vancouver 12%, Edmonton 5%, Toronto 13%, Montreal 14.975%, Ottawa 13%) persisted across sessions.
- Geolocation hints default the city selector on first load.
- Local cart badge, toast notifications, and skeleton loaders handled in `ui.js`.
- Authentication gate enforces login on protected pages with `return` parameters to resume flow after sign-in.

## Backend Integration Workflow

1. **Global Scripts**: Every HTML page includes `config.js`, `backendApi.js`, and `api.js` before other scripts to guarantee consistent configuration and health checks.
   ```html
   <script src="./assets/js/config.js"></script>
   <script src="./assets/js/backendApi.js"></script>
   <script src="./assets/js/api.js"></script>
   ```
2. **Configuration**: `CONFIG.BACKEND_URL` defaults to `https://revo-backend-o03w.onrender.com/` with `/api` prefix. Toggle `FEATURES.USE_BACKEND` or point to another deployment as needed.
3. **Initialization**: `api.init()` automatically pings `/api/health`; success logs “Backend API Connected”. Failures surface in DevTools for quick troubleshooting.
4. **Authentication**: OAuth2 password flow via `POST /api/auth/token` stores `access_token` in LocalStorage. `backendApi` injects `Authorization: Bearer <token>` on protected calls and exposes `api.isAuthenticated()`.
5. **Trade-In Utilities**: Helper methods wrap `GET /api/tradein/brands`, `POST /api/tradein/estimate`, pickup requests, and response handling.
6. **Error Handling**: Standardized JSON parsing with graceful fallback if backend returns non-2xx responses; debug logging controlled via `CONFIG.FEATURES.DEBUG_MODE`.

## Trade-In and Order Lifecycle

### Five-Stage Trade-In Flow
1. **User Initiation** (`sell.html`, `POST /api/quote`): Capture device metadata, run AI-based estimate, display initial quote.
2. **Quotation & Order Creation** (`checkout.html` extension, `POST /api/order/create`): Collect contact data, logistics preference (door pickup, mail-in, store drop-off).
3. **Pickup & Inspection** (`order-tracking.html`, `GET /api/report/{orderId}`): Courier transfer, 280+ checkpoint inspection, digital report generation.
4. **Price Confirmation & Payment** (`orders.html`, `GET /api/quote/final`, `POST /api/payment/confirm`): User accepts or rejects adjustments; automatic payout or return handling.
5. **Refurbishment & Resale** (`products.html`, `GET /api/store/list`): Certified inventory listed with profitability data (buying price, refurbish cost, selling price).

### Order Status Pipeline
`created → in_pickup → in_transit → inspecting → awaiting_confirmation → confirmed → paid/returned → refurbished → resold`

Status definition drives UI badges, notifications, and the tracking timeline.

### Profitability Formula
`Profit = Resale Price - (Buying Price + Logistics Cost + Refurbish Cost + Platform Fee)`

Use the inspection report and final quote deltas to keep customers informed before profit realization.

## Data Model Snapshot

| Table | Purpose | Key Fields |
| --- | --- | --- |
| `users` | Account registry | id, name, email, phone, created_at |
| `devices` | Catalog of models and specs | brand, category, specs JSONB, base_price |
| `orders` | Trade-in orders | user_id, device_id, quote_price, final_price, status |
| `reports` | Inspection outcomes | order_id, inspection_results JSONB, condition_score, final_grade |
| `payments` | Payout and refund tracking | order_id, method, amount, transaction_id |
| `inventory` | Refurbished stock | source_order_id, refurbish_status, resale_price, stock |

These SQL definitions live in `SYSTEM_SPECIFICATION.md` and align with the endpoints exposed by FastAPI services.

## API Surface Summary

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/token`
- `GET /api/auth/me`

### Products and Inventory
- `GET /api/products`, `/api/products/search`, `/api/products/deals`, `/api/products/{id}`
- `GET /api/categories`
- `GET /api/store/list`, `/api/store/product/{id}`, `POST /api/store/purchase`

### Cart and Checkout
- `GET /api/cart`, `/api/cart/count`
- `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`
- `POST /api/orders/checkout`, `POST /api/orders`, `GET /api/orders/me`

### Trade-In and Logistics
- `POST /api/quote`, `GET /api/quote/{id}`, `POST /api/quote/confirm`
- `POST /api/tradein/estimate`, `/api/tradein/brands`
- `POST /api/tradein/pickup-requests`, `GET /api/tradein/pickup-requests/me`, `POST /api/tradein/pickup-requests/{id}/respond`
- `POST /api/logistics/schedule`, `GET /api/logistics/track/{orderId}`

### Inspection, Payments, and Analytics
- `POST /api/report/create`, `GET /api/report/{orderId}`, `POST /api/report/photos`
- `GET /api/payment/{orderId}`, `POST /api/payment/confirm`, `POST /api/payment/refund`
- `GET /api/analytics/*` plus notification services for customer updates

## Getting Started

1. **Serve the UI**  
   ```bash
   cd revo/public
   python -m http.server 8000
   # or: php -S 127.0.0.1:8000, or npx http-server -p 8000
   ```  
   Visit `http://localhost:8000` (or `127.0.0.1:8000`) to load the site.

2. **Verify Backend Connectivity**  
   Open the browser console; `api.init()` should log the health-check result. If it fails, confirm `CONFIG.BACKEND_URL` and test `https://revo-backend-o03w.onrender.com/api/health`.

3. **Create a User and Explore**  
   - Register via `register.html`, then inspect wallet/order summaries on `account.html`.  
   - Browse `products.html`, add items to the cart, and complete checkout.  
   - Run through the trade-in questionnaire on `sell.html` to watch the full five-stage lifecycle propagate to `orders.html`.

4. **Switch Cities**  
   Use the header selector to validate tax recalculation and LocalStorage persistence across reloads.

## Testing and QA
- Run the manual flow above whenever backend contracts change. Prioritize auth, city pricing, and the trade-in estimator.
- Confirm the order status timeline transitions in `order-tracking.html` for the sample statuses listed earlier.
- Use DevTools Network tab to ensure every page fetches from live endpoints (no references to deprecated mock JSON in `assets/data`).
- CORS or authentication issues typically stem from stale tokens; clear LocalStorage via `settings.html` or the browser Application tab.
- Inspection and payment workflows should surface clear reasoning when final quotes deviate from initial estimates.

## Roadmap
1. Automated quotation engine that blends ML pricing with market feeds.
2. Inspection workflow automation with templated reports and photo uploads.
3. Multi-gateway payout support (Stripe, PayPal) plus escrow logic.
4. Inventory sync to external marketplaces with price optimization.
5. Analytics dashboards for trade-in volume, profit per device, and return rates.
6. Future enhancements: native mobile clients, live chat, video inspection, blockchain-based provenance, AI assistant, and multilingual rollout.

## License and Contribution

This repository represents an educational prototype. Contributions is focused on enhancing the static frontend, improving backend integrations, or extending the documented specification. When proposing changes, keep the documentation synchronized so product, engineering, and operations stay aligned.
