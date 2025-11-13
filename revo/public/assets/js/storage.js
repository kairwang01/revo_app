// Storage utility for managing localStorage
const STORAGE_KEYS = {
  CITY: 'revo_city',
  AUTH: 'revo_auth',
  CART: 'revo_cart',
  USER: 'revo_user',
  WALLET: 'revo_wallet'
};

// City storage
const cityStore = {
  get: () => localStorage.getItem(STORAGE_KEYS.CITY) || 'Vancouver',
  set: (city) => {
    localStorage.setItem(STORAGE_KEYS.CITY, city);
    window.dispatchEvent(new CustomEvent('revo:city-changed', { detail: city }));
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

// Tax rates by city - now handled by geo.js
function getTaxRate(city) {
  // First check localStorage for tax rate set by geo.js
  const taxFromStorage = localStorage.getItem("revo_city_tax");
  if (taxFromStorage) {
    return parseFloat(taxFromStorage);
  }
  
  // Fallback tax rates
  const TAX_RATES = {
    'Vancouver': 0.12,
    'Edmonton': 0.05,
    'Ottawa': 0.13,
    'Toronto': 0.13,
    'Montreal': 0.14975
  };
  
  return TAX_RATES[city] || 0.12;
}

// Initialize default values
if (!localStorage.getItem(STORAGE_KEYS.CITY)) {
  cityStore.set('Vancouver');
}

if (!localStorage.getItem(STORAGE_KEYS.CART)) {
  cartStore.set([]);
}
