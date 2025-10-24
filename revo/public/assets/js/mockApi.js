/**
 * Mock API Service
 * Simulates backend behavior before API integration
 * Auto-initializes when backend is not connected or when mockMode = true
 */

const MOCK_LATENCY = { min: 200, max: 400 }; // milliseconds
const MOCK_CREDENTIALS = {
  email: 'test@test.com',
  password: 'test'
};

class MockAPI {
  constructor() {
    this.mockMode = true;
    this.dataPath = './assets/data';
    this.sessionToken = null;
    
    // Log mock mode status
    if (this.mockMode) {
      console.log('%cMock mode enabled — using test data', 'color: #ff9800; font-weight: bold;');
    }
  }

  /**
   * Simulate network latency
   */
  async _simulateLatency() {
    const delay = Math.random() * (MOCK_LATENCY.max - MOCK_LATENCY.min) + MOCK_LATENCY.min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Fetch local JSON data with latency simulation
   */
  async _fetchData(filename) {
    await this._simulateLatency();
    
    try {
      const response = await fetch(`${this.dataPath}/${filename}`);
      if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Check if backend is available
   */
  async checkBackendConnection() {
    try {
      // Try to connect to a hypothetical backend endpoint
      const response = await fetch('/api/health', { 
        method: 'GET',
        timeout: 2000 
      });
      return response.ok;
    } catch (error) {
      console.log('Backend not available, using mock mode');
      return false;
    }
  }

  /**
   * Toggle mock mode
   */
  setMockMode(enabled) {
    this.mockMode = enabled;
    if (enabled) {
      console.log('%cMock mode enabled — using test data', 'color: #ff9800; font-weight: bold;');
    } else {
      console.log('%cMock mode disabled — using real backend', 'color: #4caf50; font-weight: bold;');
    }
  }

  /**
   * User Authentication
   */
  async login(email, password) {
    await this._simulateLatency();

    if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
      this.sessionToken = 'mock-token-12345';
      
      // Store session in localStorage
      localStorage.setItem('mockAuthToken', this.sessionToken);
      localStorage.setItem('mockUser', JSON.stringify({ email }));
      
      const userData = await this._fetchData('user.json');
      
      return {
        success: true,
        token: this.sessionToken,
        user: userData,
        message: 'Login successful'
      };
    } else {
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
  }

  /**
   * Logout
   */
  async logout() {
    await this._simulateLatency();
    
    this.sessionToken = null;
    localStorage.removeItem('mockAuthToken');
    localStorage.removeItem('mockUser');
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Check authentication status
   */
  isAuthenticated() {
    return !!localStorage.getItem('mockAuthToken');
  }

  /**
   * Get user profile
   */
  async getUser() {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const userData = await this._fetchData('user.json');
    return {
      success: true,
      data: userData
    };
  }

  /**
   * Get wallet data with balance and coupons
   */
  async getWallet() {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const walletData = await this._fetchData('wallet.json');
    return {
      success: true,
      data: walletData
    };
  }

  /**
   * Get coupons
   */
  async getCoupons() {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const coupons = await this._fetchData('coupons.json');
    return {
      success: true,
      data: coupons
    };
  }

  /**
   * Get user's selling devices
   */
  async getDevices() {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const devices = await this._fetchData('devices.json');
    return {
      success: true,
      data: devices
    };
  }

  /**
   * Get device by ID
   */
  async getDevice(deviceId) {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    const devices = await this._fetchData('devices.json');
    const device = devices.find(d => d.id === parseInt(deviceId));
    
    if (device) {
      return {
        success: true,
        data: device
      };
    } else {
      return {
        success: false,
        error: 'Device not found'
      };
    }
  }

  /**
   * Request pickup service
   */
  async requestPickup(deviceId, pickupDetails) {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    await this._simulateLatency();

    return {
      success: true,
      data: {
        pickup_id: 'PKP' + Date.now(),
        device_id: deviceId,
        engineer_assigned: 'Engineer #' + Math.floor(Math.random() * 100 + 1),
        pickup_location: pickupDetails.location || 'University of Ottawa',
        service_fee: 29.99,
        estimated_arrival: this._getEstimatedArrival(),
        status: 'Scheduled',
        message: 'Pickup scheduled successfully. Engineer will arrive within 2-3 business days.'
      }
    };
  }

  /**
   * Cancel pickup
   */
  async cancelPickup(pickupId) {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    await this._simulateLatency();

    return {
      success: true,
      message: 'Pickup cancelled — no charge applied.',
      refund: 0.00
    };
  }

  /**
   * Confirm trade-in and calculate final payment
   */
  async confirmTradeIn(deviceId, couponId = null) {
    if (!this.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    await this._simulateLatency();

    const devices = await this._fetchData('devices.json');
    const device = devices.find(d => d.id === parseInt(deviceId));
    
    if (!device) {
      return {
        success: false,
        error: 'Device not found'
      };
    }

    let subtotal = device.estimated_price;
    let serviceFee = device.service_fee;
    let discount = 0;
    let couponApplied = null;

    // Apply coupon if provided
    if (couponId) {
      const coupons = await this._fetchData('coupons.json');
      const coupon = coupons.find(c => c.id === couponId);
      
      if (coupon) {
        if (coupon.type === 'fixed') {
          discount = coupon.value;
        } else if (coupon.type === 'percentage') {
          discount = (serviceFee * coupon.value) / 100;
        }
        couponApplied = coupon;
      }
    }

    const total = subtotal - serviceFee - discount;

    return {
      success: true,
      data: {
        transaction_id: 'TXN' + Date.now(),
        device_id: deviceId,
        device_value: subtotal,
        service_fee: serviceFee,
        coupon_discount: discount,
        coupon_applied: couponApplied,
        final_amount: Math.max(total, 0).toFixed(2),
        currency: 'CAD',
        payment_method: 'wallet_credit',
        status: 'confirmed',
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Get trade-in estimate for a device
   */
  async getTradeInEstimate(deviceData) {
    await this._simulateLatency();

    // Calculate estimate based on condition and storage
    const baseValues = {
      'Apple': 300,
      'Samsung': 250,
      'Google': 220,
      'Xiaomi': 150,
      'Huawei': 180
    };

    const conditionMultipliers = {
      'Excellent': 0.9,
      'Good': 0.7,
      'Fair': 0.5,
      'Poor': 0.3
    };

    const storageBonus = {
      '64GB': 0,
      '128GB': 20,
      '256GB': 40,
      '512GB': 60
    };

    const basePrice = baseValues[deviceData.brand] || 200;
    const multiplier = conditionMultipliers[deviceData.condition] || 0.5;
    const bonus = storageBonus[deviceData.storage] || 0;

    const estimate = (basePrice * multiplier) + bonus;

    return {
      success: true,
      data: {
        estimated_price: estimate.toFixed(2),
        currency: 'CAD',
        brand: deviceData.brand,
        model: deviceData.model,
        condition: deviceData.condition,
        storage: deviceData.storage,
        service_fee: 29.99,
        valid_until: this._getExpirationDate(7),
        note: 'Pickup service fee of $29.99 will be deducted from the final trade-in value after confirmation.'
      }
    };
  }

  /**
   * Helper: Get estimated arrival time (2-3 business days)
   */
  _getEstimatedArrival() {
    const days = Math.floor(Math.random() * 2) + 2; // 2-3 days
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Helper: Get expiration date
   */
  _getExpirationDate(daysValid) {
    const date = new Date();
    date.setDate(date.getDate() + daysValid);
    return date.toISOString().split('T')[0];
  }

  /**
   * Generate random device data for testing
   */
  generateRandomDevice() {
    const brands = ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei'];
    const models = {
      'Apple': ['iPhone 13', 'iPhone 14', 'iPhone 12 Pro'],
      'Samsung': ['Galaxy S21', 'Galaxy S22', 'Galaxy Note 20'],
      'Google': ['Pixel 7', 'Pixel 6', 'Pixel 7 Pro'],
      'Xiaomi': ['Redmi Note 12', 'Mi 11', 'Redmi K40'],
      'Huawei': ['P50 Pro', 'Mate 40', 'Nova 9']
    };
    const conditions = ['Excellent', 'Good', 'Fair'];
    const storages = ['64GB', '128GB', '256GB'];

    const brand = brands[Math.floor(Math.random() * brands.length)];
    const model = models[brand][Math.floor(Math.random() * models[brand].length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const storage = storages[Math.floor(Math.random() * storages.length)];
    const price = Math.floor(Math.random() * 200) + 100;

    return {
      id: Date.now(),
      brand,
      model,
      condition,
      storage,
      estimated_price: price,
      pickup_location: 'University of Ottawa',
      service_fee: 29.99,
      status: 'Awaiting Pickup',
      note: 'Pickup service fee of $29.99 will be deducted from the final trade-in value after confirmation.'
    };
  }
}

// Create singleton instance
const mockApi = new MockAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockApi;
}
