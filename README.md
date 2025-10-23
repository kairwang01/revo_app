# Revo - Mobile-first SPA (Vanilla JS)

Revo is a progressive web app for trading and purchasing certified Apple and Samsung devices in Canada. The experience mirrors a native app with a sticky shell, mobile-first components, and fast hash-based navigation - all built with HTML5, CSS3, and modern ES modules without external frameworks.

## Highlights
- **SPA shell & router**: Hash router with dynamic imports, before/after hooks, and legacy redirect map.
- **Responsive core**: REM scaling (320-750px), safe-area CSS variables, and mobile touch targets (>=44px).
- **Commerce UX**: City-aware pricing (Vancouver 12%, Edmonton 5%, Ottawa 13%), brand guards, curated listings, PDP trade-in flow, cart + checkout with payment toggles, and order tracking.
- **Reusable UI primitives**: Header city selector, sticky tab bar + FAB, category strip, toasts/overlays, loader, and inline SVG sprite.
- **Performance & PWA**: Lightweight CSS/JS, lazy images, prefers-reduced-motion support, manifest + service worker (cache-first static, network-first API).
- **Accessibility**: Semantic landmarks, focus-visible, screen-reader helpers, aria-live toasts, reduced motion fallbacks.

## Getting started
1. Clone or download the repository.
2. Open `public/index.html` in a modern browser (no build step required).
3. For full PWA behaviour (service worker), serve the project via HTTPS or `http://localhost`.

## Development notes
- Tech stack: HTML5, CSS3, Vanilla JavaScript (ES modules). No third-party UI frameworks or external fonts.
- Currency: `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })`.
- Regions: Vancouver, Edmonton, Ottawa with persisted selection and dynamic tax computation.
- API layer: Fetch wrapper pre-configured with JWT Bearer header (`// TODO: bind to real DB`). Mock JSON lives under `src/data/` when `API.MOCK = true`.
- Analytics: Stubbed via `window.analytics.track(name, payload)`.

## Project structure
```
public/       # Shell, icons, manifest
src/app/      # Core runtime, router, API, utilities
src/components/ # Shared UI pieces (header, tab bar, banners, sprite)
src/pages/    # Route modules, each exporting mount/unmount
src/styles/   # Tokens, globals, component and page styles
src/data/     # Mock responses used when API.MOCK = true
sw.js         # Service worker (cache-first static)
```

## Testing checklist
- [OK] Hash routes work: `/home`, `/curated`, `/products`, `/product/:id`, `/account`, `/login`, `/register`, `/settings`, `/cart`, `/checkout`, `/orders/:id`, `/notfound`.
- [OK] City switch recalculates pricing and taxes across cart and checkout.
- [OK] Brand guard limits catalogue to Apple & Samsung, including persisted cart items.
- [OK] FAB, bottom tab bar, and header controls keep 44px touch targets.
- [OK] Service worker installs in secure contexts and serves cached shell assets offline.

Feel free to extend the mocks or wire the API layer to a real backend by flipping `API.MOCK` to `false` and binding the routes defined in `src/app/config.js`.
