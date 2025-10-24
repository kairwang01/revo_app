// API module for fetching data
// Automatically uses mock data when backend is unavailable

const API_BASE = './assets/data';
const BACKEND_API_BASE = '/api'; // Real backend endpoint

// Check if mockApi is available
let useMockApi = true;

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
      // Try to check if backend is available
      const response = await fetch(`${BACKEND_API_BASE}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      
      if (response.ok) {
        useMockApi = false;
        console.log('%cBackend connected — using real API', 'color: #4caf50; font-weight: bold;');
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      useMockApi = true;
      console.log('%cMock mode enabled — using test data', 'color: #ff9800; font-weight: bold;');
    }
    return useMockApi;
  },

  // Get mock API instance
  getMockApi() {
    return window.mockApi || mockApi;
  },

  // Authentication - login
  async login(email, password) {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.login(email, password);
    }
    
    // Real backend call
    try {
      const response = await fetch(`${BACKEND_API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    } catch (error) {
      console.error('Login failed, falling back to mock:', error);
      if (typeof mockApi !== 'undefined') {
        return await mockApi.login(email, password);
      }
      throw error;
    }
  },

  // Logout
  async logout() {
    if (useMockApi && typeof mockApi !== 'undefined') {
      return await mockApi.logout();
    }
    
    try {
      const response = await fetch(`${BACKEND_API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await response.json();
    } catch (error) {
      if (typeof mockApi !== 'undefined') {
        return await mockApi.logout();
      }
      throw error;
    }
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

  // Get product by ID
  async getProduct(id) {
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
    try {
      return await getDataset('categories.json');
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get user orders
  async getOrders() {
    try {
      return await getDataset('orders.json');
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Mock register
  async register(userData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          token: 'mock.jwt.token',
          user: {
            id: 1,
            ...userData
          }
        });
      }, 500);
    });
  },

  // Mock checkout
  async checkout(orderData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          orderId: 'ORD' + Date.now(),
          message: 'Order placed successfully'
        });
      }, 1000);
    });
  }
};
