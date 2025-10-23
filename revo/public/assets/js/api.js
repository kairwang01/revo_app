// API module for fetching data
// TODO: bind to Python FastAPI backend

const API_BASE = './assets/data';

const api = {
  // Get all products
  async getProducts(filters = {}) {
    try {
      const response = await fetch(`${API_BASE}/products.json`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.jwt.token'
        }
      });
      
      let products = await response.json();
      
      // Apply filters
      if (filters.city) {
        products = products.filter(p => 
          p.cityAvailability && p.cityAvailability.includes(filters.city)
        );
      }
      
      if (filters.brand) {
        products = products.filter(p => p.brand === filters.brand);
      }
      
      if (filters.search) {
        const query = filters.search.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.model.toLowerCase().includes(query)
        );
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
      const products = await this.getProducts();
      return products.find(p => p.id === parseInt(id));
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Get categories
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE}/categories.json`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.jwt.token'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Get user orders
  async getOrders() {
    try {
      const response = await fetch(`${API_BASE}/orders.json`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.jwt.token'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Get user data
  async getUser() {
    try {
      const response = await fetch(`${API_BASE}/user.json`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.jwt.token'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  // Get wallet data
  async getWallet() {
    try {
      const response = await fetch(`${API_BASE}/wallet.json`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.jwt.token'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching wallet:', error);
      return { balance: 0, currency: 'CAD' };
    }
  },

  // Mock login
  async login(email, password) {
    // TODO: bind to Python FastAPI backend
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          resolve({
            success: true,
            token: 'mock.jwt.token',
            user: {
              id: 1,
              email,
              name: 'Demo User'
            }
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials'
          });
        }
      }, 500);
    });
  },

  // Mock register
  async register(userData) {
    // TODO: bind to Python FastAPI backend
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
    // TODO: bind to Python FastAPI backend
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

  // Mock trade-in estimate
  async getTradeInEstimate(deviceData) {
    // TODO: bind to Python FastAPI backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // Calculate mock estimate based on condition
        const basePrice = 500;
        const conditionMultipliers = {
          excellent: 0.9,
          good: 0.7,
          fair: 0.5,
          poor: 0.3
        };
        
        const multiplier = conditionMultipliers[deviceData.condition] || 0.5;
        const estimate = basePrice * multiplier;
        
        resolve({
          success: true,
          estimate: estimate.toFixed(2),
          currency: 'CAD',
          expiresIn: 7 // days
        });
      }, 1000);
    });
  }
};
