export const API = {
  BASE_URL: 'https://mock.revo/api',          // TODO: bind to real DB
  JWT: 'mock.jwt.token',                      // TODO: real token source
  MOCK: true,
  LOCALE: 'en-CA',
  CURRENCY: 'CAD',
  ALLOWED_BRANDS: ['Apple', 'Samsung'],
  ALLOWED_CITIES: ['Vancouver', 'Edmonton', 'Ottawa'],
  TAX_BY_CITY: { Vancouver: 0.12, Edmonton: 0.05, Ottawa: 0.13 }, // TODO: backend-driven
  ROUTES: {
    auth: { login: '/auth/login', register: '/auth/register', me: '/users/me' },
    wallet: '/wallet', categories: '/categories',
    products: '/products', product: (id) => `/products/${id}`, search: '/products/search',
    cart: '/cart', cartCount: '/cart/count',
    orders: '/orders', track: (id) => `/orders/${id}/track`,
    locations: '/locations'
  }
};

export const ROUTE_MAP = {
  '/home': 'Home',
  '/curated': 'Curated',
  '/products': 'Products',
  '/product/:id': 'ProductDetail',
  '/account': 'Account',
  '/login': 'Login',
  '/register': 'Register',
  '/settings': 'Settings',
  '/cart': 'Cart',
  '/checkout': 'Checkout',
  '/orders/:id': 'OrderTracking',
  '/notfound': 'NotFound'
};

export const LOCALE = {
  currencyFormatter: new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
};
