# Revo Frontend

Progressive web experience for the Revo C2B2C electronics trade-in platform. The UI talks exclusively to the hosted backend at `https://revo-backend-o03w.onrender.com`, so there is no mock API, fixture JSON, or local data hydration step required.

## Tech Stack

- **UI**: Vanilla HTML, CSS, and modern ES modules (no framework runtime).
- **State**: LocalStorage helpers in `assets/js/storage.js`.
- **API**: REST calls proxied through `assets/js/backendApi.js` with configuration in `assets/js/config.js`.

## Project Structure

```
public/
├── index.html
├── account.html
├── cart.html
├── checkout.html
├── login.html
├── orders.html
├── order-tracking.html
├── product-detail.html
├── products.html
├── register.html
├── sell.html
├── settings.html
└── assets/
    ├── css/                # Design tokens + page/layout styles
    └── js/
        ├── config.js       # Backend URL + feature flags
        ├── backendApi.js   # Low-level HTTP client
        ├── api.js          # App-level API helpers
        ├── storage.js      # LocalStorage utilities
        ├── ui.js           # Common UI helpers (toasts, cards, etc.)
        ├── main.js         # App bootstrap (health check, cart badge, city switcher)
        └── pages/          # Page-specific controllers (home, products, cart, account…)
```

All legacy mock data files inside `assets/data/` have been removed. Every page now depends on live responses from the backend deployment.

## Getting Started

1. `cd revo/public`
2. Serve the directory with any static server (`python -m http.server 8000`, `npx http-server`, etc.)
3. Navigate to `http://localhost:8000`
4. The frontend immediately runs `api.init()` which pings `/api/health` on the configured backend. Check the browser console for connectivity messages.

`config.js` exposes:

```js
const CONFIG = {
  BACKEND_URL: 'https://revo-backend-o03w.onrender.com/',
  API_PREFIX: '/api',
  FEATURES: {
    USE_BACKEND: true,
    AUTO_INIT: true,
    DEBUG_MODE: true,
  },
};
```

Adjust `BACKEND_URL` if you deploy a different backend instance.

## Authentication Flow

1. Open `register.html` to create a real customer through `POST /api/auth/register`. The UI enforces the backend’s minimum password length and terms acceptance.
2. After registration, the JWT returned by the backend is saved in `localStorage` (`authStore`), and the user is redirected to `account.html`.
3. Existing users can sign in from `login.html`, which calls `POST /api/auth/token` and hydrates the current profile via `GET /api/auth/me`.
4. Protected pages (`account.html`, `orders.html`, `order-tracking.html`, `checkout.html`, etc.) verify authentication on load and redirect to login with a `return` query param when necessary.

To reset your local session simply log out from the account screen; no mock tokens are stored anywhere else.

## Feature Highlights

- **Products & Deals**: `home.html` and `products.html` pull listings from `/api/products` with live filters (city, brand, etc.).
- **Product Detail**: `product-detail.html` fetches `/api/products/{id}` and lets authenticated users sync adds to the remote cart.
- **Cart & Checkout**: `cart.html` mirrors local cart state, and `checkout.html` submits orders to `/api/orders/checkout`.
- **Orders Dashboard**: `orders.html` loads `/api/orders/me` and normalizes the payload for display.
- **Trade-in Flow**: `sell.html` requests `/api/tradein/estimate`, `GET /api/tradein/brands`, and submits pickup forms to `/api/tradein/pickup-requests`.
- **Order Tracking**: `order-tracking.html` now looks up the selected order ID against `/api/orders/me` instead of a mock payload.

## Development Notes

- The browser is the runtime. There is no bundler/CLI build step.
- Keep `storage.js` and `backendApi.js` in sync if you introduce new persistence keys or API endpoints.
- When adding new pages, always include `config.js`, `backendApi.js`, and `api.js` so the backend health check and auth helpers stay consistent.

## API Reference

Full OpenAPI definitions live at `https://revo-backend-o03w.onrender.com/openapi.json`. Primary groups:

- `GET /api/products`, `/api/products/search`, `/api/products/{id}`
- `POST /api/auth/register`, `POST /api/auth/token`, `GET /api/auth/me`
- `GET/POST /api/cart/*`
- `POST /api/orders/checkout`, `GET /api/orders/me`
- `POST /api/tradein/estimate`, `/api/tradein/pickup-requests`, `/api/tradein/brands`

Use the backend spec when wiring up additional UI features—no local mock data is available anymore.
