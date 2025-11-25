# Revo Frontend Document
## Author: Kair Wang Group 1
## Date: Nov 11th, 2025
## Verison: 0.1

## Last update date: Nov 25,2025
Static, multi-page storefront + trade-in experience for Apple and Samsung hardware. Everything in this repo is frontend-only: vanilla HTML/CSS/JS served from `/public` with no build step or framework. The UI talks to a hosted FastAPI backend via `fetch`, but you can point it to any compatible API.

## What’s in the repo
- `public/*.html`: Page shells (home, products, product detail, cart, checkout, auth, account, orders, order-tracking, sell, settings, choose-city, payment-success, api-test, fake-payment stub).
- `public/assets/css/`: Design tokens, resets, layout primitives, components, and page-level styles (`tokens.css`, `base.css`, `layout.css`, `components.css`, `pages.css`).
- `public/assets/js/`: Core runtime (`config.js`, `backendApi.js`, `api.js`, `storage.js`, `ui.js`, `main.js`, `geo.js`) plus per-page controllers in `pages/`.
- No bundler or transpiler; everything is ES5/ES6 that runs directly in the browser. `geo.js` is the only ES module (imported with `type="module"`).

## Technology profile
- **HTML**: Semantic, multi-page structure with inline SVG sprites for icons and dedicated HTML per flow (no SPA router).
- **CSS**: Token-driven design system (brand palette, spacing/radius scales, typography stack), mobile-first layout utilities, reusable buttons/cards/forms, and page-specific overrides. Light + airy aesthetic with gradients on hero/payment screens.
- **JavaScript**: Plain ES modules and globals. `fetch`-based API client with JSON parsing and graceful error dispatch (`revo:api-error` event). LocalStorage-backed state for city, cart, auth, wallet, preferences, and offline order history.
- **City + tax logic**: `geo.js` houses supported cities, tax rates, nearest-city detection (Haversine), `setCity`/`getCity`, and emits both `revo:cityChanged` (document) and `revo:city-changed` (window) for module/inline listeners. `storage.js` exposes a `getTaxRate` helper that reads `revo_city_tax`.
- **UI utilities**: `ui.js` (money formatting, toasts, dropdown/search helpers), `main.js` (auto backend health check, active tab highlighting, cart badge sync), `storage.js` (auth/cart/user/wallet stores with events).

## How it works (high level)
- Load any HTML from `/public` in a browser (served via simple static server). Scripts are plain `<script>` tags; order matters: `storage.js` → `config.js` → `backendApi.js` → `api.js` → `ui.js` → page script → `main.js` (when present).
- On first load, `storage.js` seeds defaults (city, empty cart) and exposes LocalStorage-backed stores. `geo.js` tries to detect the nearest city; if blocked, it emits `revo:cityChanged`/`revo:city-changed` so pages know to show the manual picker (`choose-city.html`).
- `main.js` runs a backend health check (`CONFIG.FEATURES.AUTO_INIT`), highlights the current tab, and wires cart badge updates via `revo:cart-changed`.
- Page controllers in `assets/js/pages/*.js` call the `api` facade, which delegates to `backendApi` (uses `CONFIG.BACKEND_URL` + `/api`). Failed requests emit `revo:api-error`; cart/auth/city changes emit their own events for cross-page updates.
- Checkout happy path: cart → `checkout.html` (requires auth) → collects address/shipping → calls `api.checkout` → redirects to `fake-payment.php?amount=&orderId=` → fake gateway sets `lastOrder*` + address in LocalStorage → `payment-success.html` marks the local order paid, clears cart, and shows confirmation.
- Trade-in path: `sell.html` pulls brands/models, calculates estimate, collects photos/condition, creates a pickup via `api.createPickupRequest`, then surfaces the “sell” order in `orders.html` and `order-tracking.html`.

## Runtime architecture
- **Configuration** (`assets/js/config.js`): `CONFIG.BACKEND_URL`, `API_PREFIX`, feature flags (`USE_BACKEND`, `AUTO_INIT`, `DEBUG_MODE`), and timeouts. Exposed globally as `window.REVO_CONFIG`.
- **Backend client** (`backendApi.js`): Low-level HTTP wrapper with auth token injection, JSON normalization, and endpoint coverage for auth, products, cart, orders, categories, trade-in, pickup requests, locations, and addresses. Emits `revo:api-error` on failures.
- **API facade** (`api.js`): Thin layer that normalizes responses (orders, checkout payloads) and exposes semantic calls (`getProducts`, `getProduct`, `getDeals`, `checkout`, `getTradeinBrands`, `createPickupRequest`, `getAddresses`, etc.).
- **State + events** (`storage.js`): LocalStorage keys (`revo_city`, `revo_city_tax`, `revo_cart`, `revo_auth`, `revo_user`, `revo_wallet`, `revo_orders_local`). Dispatches `revo:city-changed`, `revo:auth-changed`, and `revo:cart-changed` on updates. Includes `orderHistoryStore` for offline order snapshots.
- **City detection** (`geo.js`): Provides city list, nearest-city lookup, setters that persist tax, and a `initCitySelection()` helper that auto-selects or redirects to `choose-city.html` if geolocation is denied.

## Page flows
- **Home (`index.html`, `pages/home.js`)**: Loads categories from `api.getCategories`, fetches deals/curations scoped to the active city, renders “My Items” card (wallet, cart count, city) for signed-in users, and reacts to city/auth/cart events.
- **Products (`products.html`, `pages/products.js`)**: Fetches inventory by city, provides filter chips (Apple/Samsung/device type) and debounced search. Renders product cards via `createProductCard`.
- **Product detail (`product-detail.html`, `pages/product-detail.js`)**: Loads a product by `id` query param, renders dynamic badges/flags/options, toggles shipping mode (regular vs fast), shows popular products carousel, and syncs cart both locally and remotely on add/buy.
- **Cart (`cart.html`, `pages/cart.js`)**: Pure LocalStorage cart with quantity updates/removal, city-based tax calculation, and checkout gating.
- **Checkout (`checkout.html`, `pages/checkout.js`)**: Auth-only (redirects to login with `return` param). Manages shipping option persistence, local/remote address book (falls back to LocalStorage when the backend is unavailable), validates addresses, computes totals (tax + shipping), calls `api.checkout`, saves offline order snapshots, and redirects to the fake payment gateway.
- **Fake payment + success (`fake-payment.php`, `payment-success.html`)**: Simulated processor that echoes query params (`amount`, `orderId`, optional `method`), hydrates shipping from `lastCheckoutAddress` in LocalStorage, shows a locked card UI, then redirects to `payment-success.html` which marks local orders paid, clears the cart, and animates a success state.
- **Auth (`login.html`, `pages/login.js`; `register.html`, `pages/register.js`)**: OAuth2 password login and registration; tokens persisted to LocalStorage. Supports `?return=` redirect.
- **Account (`account.html`, `pages/account.js`)**: Ensures session validity, caches current user, shows wallet balance, order counts, and logout (clears auth + redirects home).
- **Orders (`orders.html`, `pages/orders.js`)**: Merges remote purchase orders (`api.getOrders`) with trade-in pickups (`api.getMyPickups`) and offline snapshots. Filter tabs for buy/sell/all. Each card links to tracking.
- **Order tracking (`order-tracking.html`)**: Reads `id`/`type` from query string, resolves purchase or trade-in records, maps many backend status aliases to timeline stages, and shows inspection/price confirmation placeholders.
- **Trade-in (`sell.html`, `pages/sell.js`)**: Loads brands from `api.getTradeinBrands`, suggests models per brand via `api.getProducts`, normalizes condition codes, requests instant estimate, presents refundable deposit modal, uploads optional photos, and submits pickup requests to `api.createPickupRequest`.
- **Settings (`settings.html`, `pages/settings.js`)**: City selector backed by `geo.js`, location-based auto-detect, notification preferences persisted locally, session reset (clears stored keys but preserves city), and storage counters.
- **Choose city (`choose-city.html`)**: Standalone picker that sets city and returns to the originating page (via `from` query param). Uses `initCitySelection` for GPS-based default.
- **API test harness (`api-test.html`)**: Manual playground for auth, products, cart, and orders against the configured backend; useful for contract smoke tests without touching the rest of the UI.

## Styling system
- **tokens.css**: Colors (brand greens, semantic states), typography scale, spacing/radius/z-index maps, safe-area variables, and motion constants.
- **base.css**: Resets, text helpers, focus ring, accessibility (`sr-only`), and light-mode defaults.
- **layout.css**: Page wrapper, header/tabbar, grid utilities, containers, and responsive spacing.
- **components.css**: Buttons (primary/secondary/ghost/outline), chips/badges, cards, lists, dropdowns, loaders, toasts, forms, tabbar, FAB, etc.
- **pages.css**: Screen-specific tweaks for home, products, product detail, cart, checkout, auth, orders, trade-in, settings, and payment success.

## Backend expectations (frontend contract)
- Default base URL: `https://revo-backend-o03w.onrender.com/` with `/api` prefix (`CONFIG` can override).
- Endpoints used by the UI:  
  - Auth: `POST /auth/register`, `POST /auth/token`, `GET /auth/me`  
  - Catalog: `GET /products`, `GET /products/{id}`, `GET /products/search`, `GET /products/deals`, `GET /categories`  
  - Cart/Orders: `GET /cart`, `GET /cart/count`, `POST /cart/items`, `PUT /cart/items/{id}`, `DELETE /cart/items/{id}`, `POST /orders/checkout`, `POST /orders/`, `GET /orders/me`  
  - Trade-in: `GET /tradein/brands`, `POST /tradein/estimate`, `POST /tradein/pickup-requests`, `GET /tradein/pickup-requests/me`, `POST /tradein/pickup-requests/{id}/respond`  
  - Locations/Addresses: `GET /locations`, `GET /locations/{id}`, `GET/POST/PUT/DELETE /addresses/`  
Failures emit `revo:api-error`; city/tax changes emit `revo:city-changed`; auth updates emit `revo:auth-changed`.

## Running locally
```bash
cd public
python -m http.server 8000   # or `npx http-server -p 8000`, `php -S 127.0.0.1:8000`
# visit http://localhost:8000
```
- Update `public/assets/js/config.js` to point at your backend. `CONFIG.FEATURES.AUTO_INIT` pings `/api/health` on load; disable if you’re offline.
- For quick contract checks, open `api-test.html` and run through auth/products/cart flows.
- Geolocation (`geo.js`) only works on `https://` or `http://localhost`; if blocked, users are redirected to `choose-city.html` to pick manually.

## Manual test checklist
- City switch + tax recalc: change city (header dropdown or Settings) and verify cart/checkout totals update.
- Auth flows: register/login/logout, confirm `revo_auth` + `authToken` persistence, and `return` redirect works.
- Catalog: load home/products/product-detail, search/filter, add to cart, verify cart badge and detail add/buy flows.
- Checkout: add addresses (backend or local fallback), toggle shipping mode, place order, complete fake payment, confirm `orders.html` shows the new order and `payment-success.html` clears the cart.
- Trade-in: run `sell.html` end-to-end (brand/model suggestion, estimate, deposit modal, pickup creation) and verify it appears as a “sell” order in `orders.html` + tracking page.
- Settings: reset session preserves city, toggles notification prefs, and location detect updates city/tax.

## Development notes
- Keep script order: `storage.js` → `config.js` → `backendApi.js` → `api.js` → `ui.js` → page script → `main.js` (when used).
- Use the event hooks (`revo:*`) instead of polling where possible; cart badge and city-aware pages already subscribe.
- When the backend is unreachable, cart/addresses still function locally; orders fall back to `orderHistoryStore` snapshots so users can see local purchases until sync resumes.
