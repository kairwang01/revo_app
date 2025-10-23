import { API } from './config.js';

const KEY_PREFIX = 'REVO_';
const allowedBrands = new Set(API.ALLOWED_BRANDS);

const storage = {
  read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(`${KEY_PREFIX}${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      console.warn('[storage] read failed', err);
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(`${KEY_PREFIX}${key}`, JSON.stringify(value));
    } catch (err) {
      console.warn('[storage] write failed', err);
    }
  },
  remove(key) {
    try { localStorage.removeItem(`${KEY_PREFIX}${key}`); } catch (err) { console.warn('[storage] remove failed', err); }
  }
};

export const authStore = {
  get() { return storage.read('AUTH', null); },
  set(session) { storage.write('AUTH', session); },
  clear() { storage.remove('AUTH'); }
};

export const cityStore = {
  get() { return storage.read('CITY', 'Vancouver'); },
  set(city) { storage.write('CITY', city); }
};

function sanitiseCart(cart = { items: [] }) {
  const items = Array.isArray(cart.items) ? cart.items : [];
  const cleaned = items
    .filter((item) => allowedBrands.has(item.brand))
    .map((item) => ({
      ...item,
      qty: Math.max(1, Number.parseInt(item.qty, 10) || 1)
    }));
  return { items: cleaned };
}

export const cartStore = {
  get() {
    const cart = sanitiseCart(storage.read('CART', { items: [] }));
    storage.write('CART', cart);
    return cart;
  },
  set(next) {
    storage.write('CART', sanitiseCart(next));
  },
  clear() { storage.write('CART', { items: [] }); }
};

export const walletStore = {
  get() { return storage.read('WALLET', { balance: 0 }); },
  set(wallet) { storage.write('WALLET', wallet); }
};

export const countersStore = {
  get() { return storage.read('COUNTERS', { cartCount: 0 }); },
  set(counts) { storage.write('COUNTERS', { cartCount: Math.max(0, counts?.cartCount || 0) }); }
};

export { storage };
