// Storage utility for managing localStorage
// where data takin naps
const STORAGE_KEYS = {
  CITY: 'revo_city',
  AUTH: 'revo_auth',
  CART: 'revo_cart',
  USER: 'revo_user',
  WALLET: 'revo_wallet',
  ORDERS: 'revo_orders_local'
};

const DEFAULT_CITY = 'Ottawa';
const DEFAULT_TAX_RATES = {
  Vancouver: 0.12,
  Edmonton: 0.05,
  Ottawa: 0.13,
  Toronto: 0.13,
  Montreal: 0.14
};

// City storage
const cityStore = {
  get: () => localStorage.getItem(STORAGE_KEYS.CITY) || DEFAULT_CITY,
  set: (city) => {
    const cityKey = city || DEFAULT_CITY;
    const taxRate = lookupTaxRate(cityKey);

    localStorage.setItem(STORAGE_KEYS.CITY, cityKey);
    if (Number.isFinite(taxRate)) {
      localStorage.setItem('revo_city_tax', String(taxRate));
    } else {
      localStorage.removeItem('revo_city_tax');
    }

    window.dispatchEvent(new CustomEvent('revo:city-changed', {
      detail: {
        key: cityKey,
        name: cityKey,
        tax: taxRate
      }
    }));
  }
};

// Auth storage
const authStore = {
  get: () => {
    const data = localStorage.getItem(STORAGE_KEYS.AUTH);
    return data ? JSON.parse(data) : null;
  },
  set: (authData) => {
    if (!authData) {
      return;
    }
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
    if (authData.token) {
      localStorage.setItem('authToken', authData.token);
    }
    window.dispatchEvent(new CustomEvent('revo:auth-changed', { detail: authData }));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem('authToken');
    window.dispatchEvent(new CustomEvent('revo:auth-changed', { detail: null }));
  },
  isAuthenticated: () => {
    const auth = authStore.get();
    if (auth && auth.token) {
      return true;
    }
    return !!localStorage.getItem('authToken');
  }
};

// Cart storage
const cartStore = {
  get: () => {
    const data = localStorage.getItem(STORAGE_KEYS.CART);
    return data ? JSON.parse(data) : [];
  },
  set: (cart) => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('revo:cart-changed', { detail: cart }));
  },
  add: (product, quantity = 1) => {
    const cart = cartStore.get();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    cartStore.set(cart);
  },
  remove: (productId) => {
    const cart = cartStore.get().filter(item => item.id !== productId);
    cartStore.set(cart);
  },
  updateQuantity: (productId, quantity) => {
    const cart = cartStore.get();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        cartStore.remove(productId);
      } else {
        item.quantity = quantity;
        cartStore.set(cart);
      }
    }
  },
  clear: () => {
    cartStore.set([]);
  },
  getCount: () => {
    return cartStore.get().reduce((total, item) => total + item.quantity, 0);
  },
  getTotal: () => {
    return cartStore.get().reduce((total, item) => total + (item.price * item.quantity), 0);
  }
};

// User storage
const userStore = {
  get: () => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },
  set: (userData) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

// Wallet storage
const walletStore = {
  get: () => {
    const data = localStorage.getItem(STORAGE_KEYS.WALLET);
    return data ? JSON.parse(data) : { balance: 0, currency: 'CAD' };
  },
  set: (walletData) => {
    localStorage.setItem(STORAGE_KEYS.WALLET, JSON.stringify(walletData));
  }
};

const LOCAL_ORDER_HISTORY_LIMIT = 25;

const orderHistoryStore = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Unable to read local orders:', error);
      return [];
    }
  },
  set: (orders) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (error) {
      console.warn('Unable to persist local orders:', error);
    }
  },
  add: (order) => {
    if (!order) {
      return;
    }
    try {
      const reference = (order.reference || order.id || `ORD${Date.now()}`).toString();
      const snapshot = {
        ...order,
        reference,
        id: order.id || reference,
        date: order.date || new Date().toISOString(),
        type: order.type || 'buy',
        status: order.status || 'pending',
        paymentStatus: order.paymentStatus || 'pending',
        _local: true
      };
      const existing = orderHistoryStore
        .get()
        .filter(entry => !matchOrderReference(entry, reference));
      existing.unshift(snapshot);
      orderHistoryStore.set(existing.slice(0, LOCAL_ORDER_HISTORY_LIMIT));
    } catch (error) {
      console.warn('Unable to save local order snapshot:', error);
    }
  },
  update: (reference, updates = {}) => {
    if (!reference) {
      return false;
    }
    try {
      const ref = reference.toString();
      const orders = orderHistoryStore.get();
      const index = orders.findIndex(entry => matchOrderReference(entry, ref));
      if (index === -1) {
        return false;
      }
      orders[index] = {
        ...orders[index],
        ...updates
      };
      orderHistoryStore.set(orders);
      return true;
    } catch (error) {
      console.warn('Unable to update local order snapshot:', error);
      return false;
    }
  },
  remove: (reference) => {
    if (!reference) {
      return;
    }
    try {
      const ref = reference.toString();
      const filtered = orderHistoryStore
        .get()
        .filter(entry => !matchOrderReference(entry, ref));
      orderHistoryStore.set(filtered);
    } catch (error) {
      console.warn('Unable to remove local order snapshot:', error);
    }
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
  }
};

function matchOrderReference(order, reference) {
  if (!order || !reference) {
    return false;
  }
  const ref = reference.toString();
  return (
    (order.reference && order.reference.toString() === ref) ||
    (order.id && order.id.toString() === ref)
  );
}

// Tax rates by city - now handled by geo.js
function getTaxRate(city) {
  const cityKey = city || localStorage.getItem(STORAGE_KEYS.CITY) || DEFAULT_CITY;
  const storedCity = localStorage.getItem(STORAGE_KEYS.CITY);
  const taxFromStorage = parseFloat(localStorage.getItem('revo_city_tax'));

  if (storedCity && storedCity === cityKey && Number.isFinite(taxFromStorage)) {
    return taxFromStorage;
  }

  return lookupTaxRate(cityKey);
}

function lookupTaxRate(cityKey) {
  if (cityKey && Object.prototype.hasOwnProperty.call(DEFAULT_TAX_RATES, cityKey)) {
    return DEFAULT_TAX_RATES[cityKey];
  }
  return DEFAULT_TAX_RATES[DEFAULT_CITY];
}

// Initialize default values
if (!localStorage.getItem(STORAGE_KEYS.CITY)) {
  cityStore.set(DEFAULT_CITY);
}

if (!localStorage.getItem(STORAGE_KEYS.CART)) {
  cartStore.set([]);
}
