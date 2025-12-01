# Revo Frontend
Static multi-page storefront and trade-in UI for Revo. Everything lives in `public/` and runs as plain HTML, CSS, and JavaScript. Default API target is the FastAPI backend at `https://revo-backend-o03w.onrender.com/api`.

## Directory map
- `public/*.html`: Home, products, product detail, cart, checkout, login, register, account, orders, order-tracking, sell (trade-in), admin trade-ins, settings, choose-city, payment-success, fake-payment stub, api-test.
- `public/assets/css/`: `tokens.css` (colors, type, spacing), `base.css` (reset and helpers), `layout.css` (grid, header, tab bar), `components.css` (buttons, cards, tabs, loaders), `pages.css` (page-specific tweaks).
- `public/assets/js/`: Shared modules `config.js`, `backendApi.js`, `api.js`, `storage.js`, `ui.js`, `main.js`, `geo.js` (ES module), `googleAuth.js`, `support.js`. Per-page controllers live in `assets/js/pages/`.
- No bundler. Scripts load directly via `<script>` tags.

## Key flows
- Catalog: `index.html` and `products.html` load categories and products for the active city. Cards link to `product-detail.html`.
- Cart: Cart is stored in `localStorage`. Quantity changes and city tax are handled on the client.
- Checkout: Requires login. Uses backend addresses when available and falls back to local storage. Lets users pick shipping speed, calculates totals, and sends the cart to `api.checkout` before redirecting to `fake-payment.php` and `payment-success.html`.
- Orders: `orders.html` merges backend orders, trade-in pickups, and offline order snapshots. `order-tracking.html` renders a tracking timeline for a given id.
- Trade-in: `sell.html` loads brands and models, requests an estimate, collects photos, and creates pickup requests. `admin.html` lets admins list, evaluate, and delete trade-in pickups.
- Auth: Email/password login and registration, Google sign-in via `googleAuth.js`, login uses reCAPTCHA, sessions are stored in `localStorage`. Admin users land on `admin.html` after login.
- City + tax: `geo.js` and `storage.js` store the chosen city and tax rate, auto-detect city with geolocation, and emit `revo:city-changed` when it updates. `settings.html` and `choose-city.html` allow manual selection.
- Extras: Dialogflow chat iframe on `index.html`. GA4 bootstrap and event hooks in `support.js` (set `CONFIG.ANALYTICS_ID`). Optional support launcher that pings `CONFIG.SUPPORT_API_URL`.

## Backend contract
- Base URL is `CONFIG.BACKEND_URL` with prefix `CONFIG.API_PREFIX` (default `/api`).
- Auth: `POST /auth/register`, `POST /auth/token`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/google`.
- Catalog: `GET /products`, `GET /products/{id}`, `GET /products/search`, `GET /products/deals`, `GET /categories`, `GET /locations`, `GET /locations/{id}`.
- Cart/Orders: `GET /cart`, `GET /cart/count`, `POST /cart/items`, `PUT /cart/items/{id}`, `DELETE /cart/items/{id}`, `POST /orders/checkout`, `GET /orders/me`.
- Trade-in: `GET /tradein/brands`, `POST /tradein/estimate`, `POST /tradein/pickup-requests`, `GET /tradein/pickup-requests/me`, `POST /tradein/pickup-requests/{id}/respond`, admin `GET/PUT/DELETE /admin/tradeins`.
- Addresses: `GET/POST/PUT/DELETE /addresses/`. Checkout falls back to local address storage if the backend is unavailable.
- Errors dispatch `revo:api-error` so the UI can warn users.

## Config
- Edit `public/assets/js/config.js` to set backend URL, API prefix, Google client ID, optional Google auth endpoint, analytics measurement ID, and support endpoint. Feature flags control auto health check and debug logging.
- Data stored in `localStorage`: `revo_city`, `revo_city_tax`, `revo_cart`, `revo_auth`, `authToken`, `revo_user`, `revo_wallet`, `revo_orders_local`, address and preference keys used by checkout and settings.
- Keep script order in HTML: `storage.js` → `config.js` → `backendApi.js` → `api.js` → `ui.js` → page script → `main.js` → `support.js` (plus `geo.js` module imports when needed).

## Third-party dependencies
- Google Analytics GA4 via gtag.js. Set `CONFIG.ANALYTICS_ID` to a Measurement ID to enable it.
- Google Identity Services for OAuth login/register. Set `CONFIG.GOOGLE_CLIENT_ID` and optional `CONFIG.GOOGLE_AUTH_ENDPOINT`.
- Google reCAPTCHA Enterprise on `login.html` for bot protection. The site key is embedded in the page.
- Dialogflow web demo iframe on `index.html` for the chat assistant. Swap the iframe `src` to use your own bot or remove the chat.

## Running locally
- From repo root: `cd public && python -m http.server 8000` then open `http://localhost:8000`.
- Update `public/assets/js/config.js` to point at your backend. `CONFIG.FEATURES.AUTO_INIT` pings `/api/health`.
- Use `api-test.html` for quick contract checks.

## Smoke tests
- Switch cities and confirm tax changes in cart and checkout.
- Create an account or log in (email or Google), add items to cart, place checkout, and confirm the fake payment clears the cart and shows in orders.
- Run the trade-in flow in `sell.html` and confirm it appears in orders and in the admin view.
- Add, edit, and delete addresses during checkout and confirm the local fallback works when the backend is offline.
- Sign in as an admin and verify trade-in evaluate and delete actions.
