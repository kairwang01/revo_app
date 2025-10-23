import { API } from './config.js';
import { countersStore, storage } from './storage.js';

const headers = () => ({
  Authorization: `Bearer ${API.JWT}`,
  'Content-Type': 'application/json'
});

async function http(path, { method = 'GET', body } = {}) {
  const url = `${API.BASE_URL}${path}`; // TODO: bind to real DB
  const res = await fetch(url, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error('Network request failed');
  const type = res.headers.get('content-type') || '';
  return type.includes('application/json') ? res.json() : res.text();
}

async function mockImport(file) {
  try {
    const module = await import(`../data/${file}`, { assert: { type: 'json' } });
    return structuredClone(module.default);
  } catch (err) {
    const response = await fetch(`../src/data/${file}`);
    return response.json();
  }
}

function guardBrands(list) {
  return list.filter((item) => API.ALLOWED_BRANDS.includes(item.brand));
}

function filterByCity(list, city) {
  if (!city) return list;
  return list.filter((item) => {
    if (!item.cityAvailability) return true;
    return item.cityAvailability.includes(city);
  });
}

export const api = {
  async getCategories() {
    if (API.MOCK) return mockImport('categories.mock.json');
    return http(API.ROUTES.categories); // TODO: bind to real DB
  },
  async getProducts({ city } = {}) {
    if (API.MOCK) {
      const all = await mockImport('products.mock.json');
      return filterByCity(guardBrands(all), city);
    }
    return http(API.ROUTES.products); // TODO: bind to real DB
  },
  async searchProducts({ q, city, sort = 'relevance' } = {}) {
    if (API.MOCK) {
      const all = await mockImport('products.mock.json');
      let list = filterByCity(guardBrands(all), city);
      if (q) {
        const query = q.toLowerCase();
        list = list.filter((item) => (`${item.name} ${item.model} ${item.brand}`).toLowerCase().includes(query));
      }
      if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
      if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
      if (sort === 'newest') list.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
      return list;
    }
    return http(API.ROUTES.search, { method: 'POST', body: { q, city, sort } }); // TODO: bind to real DB
  },
  async getProduct(id) {
    if (API.MOCK) {
      const all = await mockImport('products.mock.json');
      return guardBrands(all).find((item) => String(item.id) === String(id)) || null;
    }
    return http(API.ROUTES.product(id)); // TODO: bind to real DB
  },
  async getUser() {
    if (API.MOCK) return mockImport('user.mock.json');
    return http(API.ROUTES.auth.me); // TODO: bind to real DB
  },
  async login(credentials) {
    if (API.MOCK) {
      const user = await mockImport('user.mock.json');
      return { token: API.JWT, user };
    }
    return http(API.ROUTES.auth.login, { method: 'POST', body: credentials }); // TODO: bind to real DB
  },
  async register(payload) {
    if (API.MOCK) {
      const user = await mockImport('user.mock.json');
      return { token: API.JWT, user };
    }
    return http(API.ROUTES.auth.register, { method: 'POST', body: payload }); // TODO: bind to real DB
  },
  async getWallet() {
    if (API.MOCK) return mockImport('wallet.mock.json');
    return http(API.ROUTES.wallet); // TODO: bind to real DB
  },
  async getCartCount() {
    if (API.MOCK) {
      const counts = countersStore.get();
      return { count: counts.cartCount || 0 };
    }
    return http(API.ROUTES.cartCount); // TODO: bind to real DB
  },
  async getOrders() {
    if (API.MOCK) {
      const orders = await mockImport('orders.mock.json');
      const recent = storage.read('LAST_ORDER');
      if (recent) {
        const existingIndex = orders.findIndex((order) => String(order.id) === String(recent.id));
        if (existingIndex >= 0) orders.splice(existingIndex, 1);
        orders.unshift(recent);
      }
      return orders;
    }
    return http(API.ROUTES.orders); // TODO: bind to real DB
  },
  async createOrder(payload) {
    if (API.MOCK) {
      const order = {
        ...payload,
        id: Math.floor(Math.random() * 1_000_000),
        status: 'placed',
        createdAt: new Date().toISOString(),
        trackingNumber: `RV-${Math.floor(100000 + Math.random() * 900000)}`,
        steps: ['Placed', 'Shipped', 'Delivered']
      };
      storage.write('LAST_ORDER', order);
      return order;
    }
    return http(API.ROUTES.orders, { method: 'POST', body: payload }); // TODO: bind to real DB
  },
  async trackOrder(id) {
    if (API.MOCK) {
      const recent = storage.read('LAST_ORDER');
      if (recent && String(recent.id) === String(id)) {
        return recent;
      }
      const all = await mockImport('orders.mock.json');
      return all.find((order) => String(order.id) === String(id)) || null;
    }
    return http(API.ROUTES.track(id)); // TODO: bind to real DB
  }
};
