// API module for fetching data
// Automatically uses backend API when available, falls back to mock data

const API_BASE = './assets/data';

// Backend API will be initialized
let useBackendApi = false;
let backendReady = false;

const DATASET_TTL = 5 * 60 * 1000; // 5 minutes cache window
const datasetCache = new Map();
const datasetPromises = new Map();

function cloneData(data) {
  if (data === undefined || data === null) {
    return data;
  }
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch (error) {
      // Fall through to JSON clone if structuredClone fails
    }
  }
  return JSON.parse(JSON.stringify(data));
}

async function loadDataset(filename, { bypassCache = false } = {}) {
  const now = Date.now();

  if (!bypassCache) {
    const cached = datasetCache.get(filename);
    if (cached && (now - cached.timestamp) < DATASET_TTL) {
      return cached.payload;
    }
  }

  if (!datasetPromises.has(filename)) {
    const request = fetch(`${API_BASE}/${filename}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock.jwt.token'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filename}`);
        }
        return response.json();
      })
      .then(data => {
        datasetCache.set(filename, { payload: data, timestamp: Date.now() });
        datasetPromises.delete(filename);
        return data;
      })
      .catch(error => {
        datasetPromises.delete(filename);
        throw error;
      });

    datasetPromises.set(filename, request);
  }

  const payload = await datasetPromises.get(filename);

  if (bypassCache) {
    datasetCache.set(filename, { payload, timestamp: Date.now() });
  }

  return payload;
}

async function getDataset(filename, options) {
  const payload = await loadDataset(filename, options);
  return cloneData(payload);
}

const api = {
  // Initialize and check backend connection
  async init() {
    try {
      // Check if backendApi is available
      if (typeof backendApi !== 'undefined') {
        const isConnected = await backendApi.checkHealth();
        
        if (isConnected) {
          useBackendApi = true;
          backendReady = true;
          console.log('%c✓ Using Backend API', 'color: #4caf50; font-weight: bold;');
          return false; // Not using mock
        }
      }
      
      // Fallback to mock
      useBackendApi = false;
      backendReady = false;
      console.log('%c⚠ Using Mock API (Backend unavailable)', 'color: #ff9800; font-weight: bold;');
      return true; // Using mock
    } catch (error) {
      useBackendApi = false;
      backendReady = false;
      console.log('%c⚠ Using Mock API (Error connecting)', 'color: #ff9800; font-weight: bold;');
      return true; // Using mock
    }
  },

  // Get mock API instance
  getMockApi() {
    return window.mockApi || mockApi;
  },

  // Authentication - login
  async login(email, password) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.login(email, password);
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined') {
      return await mockApi.login(email, password);
    }
    
    throw new Error('No API available');
  },

  // Logout
  async logout() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.logout();
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined') {
      return await mockApi.logout();
    }
    
    return { success: true, message: 'Logged out' };
  },

  // Register
  async register(email, password) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.register(email, password);
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined') {
      return await mockApi.register ? mockApi.register(email, password) : {
        success: true,
        message: 'Registration successful (mock)'
      };
    }
    
    return { success: true, message: 'Registration successful (mock)' };
  },

  // Get current user
  async getCurrentUser() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getCurrentUser();
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined' && mockApi.getUser) {
      return await mockApi.getUser();
    }
    
    return { success: false, error: 'Not authenticated' };
  },

  // Check authentication
  isAuthenticated() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return backendApi.isAuthenticated();
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined' && mockApi.isAuthenticated) {
      return mockApi.isAuthenticated();
    }
    
    return !!localStorage.getItem('authToken') || !!localStorage.getItem('mockAuthToken');
  },

  // Get user wallet
  async getWallet() {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.getWallet();
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/wallet`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching wallet, using mock data:', error);
      if (typeof mockApi !== 'undefined') {
        return await mockApi.getWallet();
      }
      
      // Fallback to local file
      try {
        const data = await getDataset('wallet.json');
        return { success: true, data };
      } catch (fallbackError) {
        return { success: false, error: 'Failed to fetch wallet data' };
      }
    }
  },

  // Get coupons
  async getCoupons() {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.getCoupons();
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/coupons`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        }
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.getCoupons();
      }
      
      try {
        const data = await getDataset('coupons.json');
        return { success: true, data };
      } catch (fallbackError) {
        return { success: false, error: 'Failed to fetch coupons' };
      }
    }
  },

  // Get selling devices
  async getDevices() {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.getDevices();
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/devices`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        }
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.getDevices();
      }
      
      try {
        const data = await getDataset('devices.json');
        return { success: true, data };
      } catch (fallbackError) {
        return { success: false, error: 'Failed to fetch devices' };
      }
    }
  },

  // Get device by ID
  async getDevice(deviceId) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.getDevice(deviceId);
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/devices/${deviceId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        }
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.getDevice(deviceId);
      }
      try {
        const devices = await getDataset('devices.json');
        const device = devices.find(d => d.id === parseInt(deviceId, 10));
        if (device) {
          return { success: true, data: device };
        }
        return { success: false, error: 'Device not found' };
      } catch (fallbackError) {
        throw error;
      }
    }
  },

  // Request pickup
  async requestPickup(deviceId, pickupDetails) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.requestPickup(deviceId, pickupDetails);
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/pickup/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        },
        body: JSON.stringify({ device_id: deviceId, ...pickupDetails })
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.requestPickup(deviceId, pickupDetails);
      }
      throw error;
    }
  },

  // Cancel pickup
  async cancelPickup(pickupId) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.cancelPickup(pickupId);
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/pickup/${pickupId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        }
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.cancelPickup(pickupId);
      }
      throw error;
    }
  },

  // Confirm trade-in
  async confirmTradeIn(deviceId, couponId = null) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.confirmTradeIn(deviceId, couponId);
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        },
        body: JSON.stringify({ device_id: deviceId, coupon_id: couponId })
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.confirmTradeIn(deviceId, couponId);
      }
      throw error;
    }
  },

  // Get trade-in estimate
  async getTradeInEstimate(deviceData) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.getTradeInEstimate(deviceData);
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || 'mock.jwt.token')
        },
        body: JSON.stringify(deviceData)
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.getTradeInEstimate(deviceData);
      }
      throw error;
    }
  },
  
  // Get all products
  async getProducts(filters = {}) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getProducts(filters);
    }
    
    // Fallback to local data
    try {
      let products = await getDataset('products.json');

      // Apply filters
      if (filters.city) {
        products = products.filter(product =>
          Array.isArray(product.cityAvailability) &&
          product.cityAvailability.includes(filters.city)
        );
      }

      if (filters.brand) {
        products = products.filter(product => product.brand === filters.brand);
      }

      if (filters.category) {
        products = products.filter(product => 
          product.category && product.category.toLowerCase() === filters.category.toLowerCase()
        );
      }

      if (filters.search) {
        const query = filters.search.toLowerCase();
        products = products.filter(product => {
          const haystacks = [
            product.name,
            product.brand,
            product.model,
            product.condition
          ].filter(Boolean);

          return haystacks.some(value => value.toLowerCase().includes(query));
        });
      }

      if (typeof filters.limit === 'number') {
        products = products.slice(0, filters.limit);
      }

      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(query, filters = {}) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.searchProducts(query, filters);
    }
    
    // Fallback to local search
    return await this.getProducts({ ...filters, search: query });
  },

  // Get deals
  async getDeals(limit = 10, minDiscount = null) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getDeals(limit, minDiscount);
    }
    
    // Fallback to local data
    try {
      const products = await getDataset('products.json');
      const deals = products
        .filter(p => p.originalPrice && p.price < p.originalPrice)
        .sort((a, b) => {
          const discountA = ((a.originalPrice - a.price) / a.originalPrice) * 100;
          const discountB = ((b.originalPrice - b.price) / b.originalPrice) * 100;
          return discountB - discountA;
        })
        .slice(0, limit);
      
      return deals;
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  },

  // Get product by ID
  async getProduct(id) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getProduct(id);
    }
    
    // Fallback to local data
    try {
      const products = await getDataset('products.json');
      return products.find(product => product.id === parseInt(id, 10)) || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get categories
  async getCategories() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getCategories();
    }
    
    // Fallback to local data
    try {
      return await getDataset('categories.json');
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get user orders
  async getOrders(status = null, limit = 50, offset = 0) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getOrders(status, limit, offset);
    }
    
    // Fallback to local data
    try {
      const orders = await getDataset('orders.json');
      return { success: true, data: orders };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, data: [] };
    }
  },

  // Cart operations
  async getCart() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getCart();
    }
    
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": [], "total": 0}');
    return { success: true, data: cart };
  },

  async getCartCount() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getCartCount();
    }
    
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": []}');
    return { success: true, count: cart.items?.length || 0 };
  },

  async addToCart(productId, quantity = 1) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.addToCart(productId, quantity);
    }
    
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": [], "total": 0}');
    const existingItem = cart.items.find(item => item.product_id === productId);
    
    if (existingItem) {
      existingItem.qty += quantity;
    } else {
      cart.items.push({ product_id: productId, qty: quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, message: 'Item added to cart' };
  },

  async updateCartItem(productId, quantity) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.updateCartItem(productId, quantity);
    }
    
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": []}');
    const item = cart.items.find(item => item.product_id === productId);
    
    if (item) {
      item.qty = quantity;
      localStorage.setItem('cart', JSON.stringify(cart));
      return { success: true, message: 'Cart updated' };
    }
    
    return { success: false, error: 'Item not found' };
  },

  async removeFromCart(productId) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.removeFromCart(productId);
    }
    
    // Fallback to localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '{"items": []}');
    cart.items = cart.items.filter(item => item.product_id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    return { success: true, message: 'Item removed' };
  },

  // Checkout
  async checkout(orderData) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.checkout(orderData);
    }
    
    // Fallback to mock
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: 'ORD' + Date.now(),
          message: 'Order placed successfully'
        });
      }, 1000);
    });
  },

  // Trade-in operations
  async getTradeinBrands() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getTradeinBrands();
    }
    
    return { success: true, data: [] };
  },

  async getTradeInEstimate(deviceData) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getTradeInEstimate(deviceData);
    }
    
    // Fallback to mock
    if (typeof mockApi !== 'undefined' && mockApi.getTradeInEstimate) {
      return await mockApi.getTradeInEstimate(deviceData);
    }
    
    return { success: false, error: 'Service unavailable' };
  },

  async createPickupRequest(formData) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.createPickupRequest(formData);
    }
    
    return { success: false, error: 'Service unavailable' };
  },

  async getMyPickups() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getMyPickups();
    }
    
    return { success: true, data: [] };
  },

  async respondToOffer(pickupId, action) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.respondToOffer(pickupId, action);
    }
    
    return { success: false, error: 'Service unavailable' };
  },

  // Locations
  async getLocations() {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getLocations();
    }
    
    return { success: true, data: [] };
  },

  async getLocation(locationId) {
    if (useBackendApi && typeof backendApi !== 'undefined') {
      return await backendApi.getLocation(locationId);
    }
    
    return { success: false, error: 'Service unavailable' };
  }
};
