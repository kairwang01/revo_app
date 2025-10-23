import { ROUTE_MAP } from './config.js';
import { qs } from './ui.js';

const ROUTES = [
  { name: 'Home', pattern: /^\/home\/?$/, module: 'Home' },
  { name: 'Curated', pattern: /^\/curated\/?$/, module: 'Curated' },
  { name: 'Products', pattern: /^\/products\/?$/, module: 'Products' },
  { name: 'ProductDetail', pattern: /^\/product\/(\w[\w-]*)\/?$/, module: 'ProductDetail', params: ['id'] },
  { name: 'Account', pattern: /^\/account\/?$/, module: 'Account' },
  { name: 'Login', pattern: /^\/login\/?$/, module: 'Login' },
  { name: 'Register', pattern: /^\/register\/?$/, module: 'Register' },
  { name: 'Settings', pattern: /^\/settings\/?$/, module: 'Settings' },
  { name: 'Cart', pattern: /^\/cart\/?$/, module: 'Cart' },
  { name: 'Checkout', pattern: /^\/checkout\/?$/, module: 'Checkout' },
  { name: 'OrderTracking', pattern: /^\/orders\/(\w[\w-]*)\/?$/, module: 'OrderTracking', params: ['id'] },
  { name: 'NotFound', pattern: /^\/notfound\/?$/, module: 'NotFound' }
];

const legacyRedirects = new Map([
  ['#!/home', '/home'],
  ['#!/products', '/products'],
  ['#/dashboard', '/account'],
  ['#/bag', '/cart']
]);

const beforeHooks = [];
const afterHooks = [];
let currentModule = null;
let currentRoute = null;

function normalisePath(hash) {
  const raw = (hash || location.hash || '').replace(/^#/, '') || '/home';
  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  const trimmed = prefixed.replace(/\/+$/, '') || '/home';
  const legacy = mapLegacy(trimmed);
  return (legacy || trimmed) || '/home';
}

function mapLegacy(path) {
  if (legacyRedirects.has(path)) return legacyRedirects.get(path);
  if (path.startsWith('/item/')) {
    return path.replace(/^\/item\//, '/product/');
  }
  if (path === '/#!/home' || path === '/!/home') return '/home';
  if (!path.startsWith('/')) return `/${path.replace(/^#+/, '')}`;
  return path;
}

function matchRoute(path) {
  for (const r of ROUTES) {
    const m = path.match(r.pattern);
    if (m) {
      const params = {};
      (r.params || []).forEach((name, idx) => {
        params[name] = decodeURIComponent(m[idx + 1]);
      });
      return { ...r, params };
    }
  }
  return { name: 'NotFound', module: 'NotFound', params: {} };
}

async function loadModule(name) {
  return import(`../pages/${name}.js`);
}

async function runHooks(list, context) {
  for (const hook of list) {
    const res = await hook(context);
    if (res === false) return false;
    if (typeof res === 'string') {
      navigateTo(res);
      return false;
    }
  }
  return true;
}

function updateActiveTab(name) {
  const map = {
    Home: 'home',
    Curated: 'curated',
    Products: 'products',
    Cart: 'cart',
    Account: 'account'
  };
  qs('#bottom-tabbar')?.querySelectorAll('.tabbar-btn').forEach((btn) => btn.removeAttribute('aria-current'));
  const key = map[name];
  if (!key) return;
  const btn = qs(`#bottom-tabbar .tabbar-btn[data-tab="${key}"]`);
  if (btn) btn.setAttribute('aria-current', 'page');
}

async function renderRoute(route) {
  const target = qs('#app');
  const context = { route, params: route.params, target };
  const proceed = await runHooks(beforeHooks, context);
  if (proceed === false) return;
  if (currentModule?.unmount) {
    currentModule.unmount();
  }
  try {
    const mod = await loadModule(route.module);
    currentModule = mod;
    currentRoute = route;
    await mod.mount(target, route.params);
    await runHooks(afterHooks, { ...context, module: mod });
  } catch (err) {
    console.error('[router] failed to load module', err);
    if (route.module !== 'NotFound') {
      navigateTo('/notfound');
    }
  }
  updateActiveTab(route.name);
  document.body.dataset.route = route.name || '';
}

export async function navigate(forcePath) {
  const raw = forcePath ? (forcePath.startsWith('/') ? forcePath : `/${forcePath}`) : null;
  const path = raw ? mapLegacy(raw) : normalisePath();
  const route = matchRoute(path);
  await renderRoute(route);
}

export function startRouter() {
  window.addEventListener('hashchange', () => navigate());
  if (!location.hash || location.hash === '#/' || location.hash === '#') {
    navigateTo('/home');
  } else {
    navigate();
  }
}

export function navigateTo(path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (location.hash === `#${clean}`) {
    navigate(clean);
    return;
  }
  location.hash = `#${clean}`;
}

export function beforeEach(fn) { beforeHooks.push(fn); }
export function afterEach(fn) { afterHooks.push(fn); }

export function legacyMap(hash) {
  return mapLegacy(hash);
}

export function currentRouteName() {
  return currentRoute?.name || null;
}
