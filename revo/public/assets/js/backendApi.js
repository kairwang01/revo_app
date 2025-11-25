/**
 * Backend API Integration Service
 * Connects frontend with Revo Backend API
 * Handles authentication, products, cart, orders, and trade-in operations
 */
// warning: contains nerdy fetches, handle with smile

// Backend API base URL - uses CONFIG if available, otherwise fallback
const BACKEND_URL = (typeof CONFIG !== 'undefined' && CONFIG.BACKEND_URL) 
  ? CONFIG.BACKEND_URL.replace(/\/$/, '') // Remove trailing slash
  : 'http://localhost:8000';
const API_PREFIX = (typeof CONFIG !== 'undefined' && CONFIG.API_PREFIX) 
  ? CONFIG.API_PREFIX 
  : '/api';

class BackendAPI {
  constructor() {
    this.baseUrl = BACKEND_URL + API_PREFIX;
    this.token = null;
    this.isConnected = false;
    
    // Load token from storage if exists
    this.token = localStorage.getItem('authToken');
  }

  /**
   * Check backend health and connectivity
   */
  async checkHealth() {
    try {
      // Try /api/health first
      let response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      // If that fails, try root /health
      if (!response.ok) {
        response = await fetch(`${BACKEND_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
      }
      
      this.isConnected = response.ok;
      
      if (this.isConnected) {
        console.log('%c✓ Backend connected', 'color: #4caf50; font-weight: bold;');
        console.log('Backend URL:', BACKEND_URL);
      }
      
      return this.isConnected;
    } catch (error) {
      console.log('%c✗ Backend not available', 'color: #f44336; font-weight: bold;');
      console.error('Connection error:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get authorization headers
   */
  _getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {};
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  /**
   * Handle API response
   */
  async _handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw {
          status: response.status,
          message: data.detail || data.message || 'Request failed',
          data
        };
      }
      
      return data;
    }
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: `Request failed with status ${response.status}`
      };
    }
    
    return response;
  }

  /**
   * Make API request
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this._getHeaders(options.auth !== false, options.contentType),
          ...options.headers
        }
      });
      
      return await this._handleResponse(response);
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      try {
        window.dispatchEvent(new CustomEvent('revo:api-error', {
          detail: {
            endpoint,
            url,
            error
          }
        }));
      } catch (eventError) {
        console.warn('Failed to dispatch API error event', eventError);
      }
      throw error;
    }
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(email, password, profile = {}) {
    try {
      const payload = {
        email,
        password
      };

      const fullName = profile.full_name || profile.fullName;
      const phoneNumber = profile.phone_number || profile.phoneNumber;

      if (fullName) {
        payload.full_name = fullName;
      }
      if (phoneNumber) {
        payload.phone_number = phoneNumber;
      }

      const registration = await this._request('/auth/register', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(payload)
      });

      // Automatically sign the user in so the frontend receives a token
      try {
        const loginResult = await this.login(email, password);
        if (loginResult?.success) {
          return {
            ...loginResult,
            message: registration?.message || loginResult.message || 'Registration successful',
            data: {
              registration,
              user: loginResult.user
            }
          };
        }
      } catch (loginError) {
        console.warn('Auto-login after registration failed:', loginError);
      }

      return {
        success: true,
        message: registration?.message || 'Registration successful',
        data: registration,
        token: this.token,
        user: registration?.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Login user
   * POST /api/auth/token
   */
  async login(email, password) {
    try {
      // Backend expects form data for OAuth2 token endpoint
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      formData.append('grant_type', 'password');
      
      const data = await this._request('/auth/token', {
        method: 'POST',
        auth: false,
        contentType: 'application/x-www-form-urlencoded',
        body: formData.toString()
      });
      
      // Store token
      this.token = data.access_token;
      localStorage.setItem('authToken', this.token);
      
      // Get user info
      const userInfo = await this.getCurrentUser();
      
      return {
        success: true,
        token: this.token,
        user: userInfo.data,
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  async getCurrentUser() {
    try {
      const data = await this._request('/auth/me', {
        method: 'GET'
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get user info'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.token;
  }

  // ==================== PRODUCTS ====================

  /**
   * Get products list with filters
   * GET /api/products/
   */
  async getProducts(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.condition) params.append('condition', filters.condition);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.city) params.append('city', filters.city);
      
      const queryString = params.toString();
      const endpoint = `/products/${queryString ? '?' + queryString : ''}`;
      
      const data = await this._request(endpoint, {
        method: 'GET',
        auth: false
      });
      
      return data; // Returns array of products
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  /**
   * Search products
   * GET /api/products/search
   */
  async searchProducts(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      
      const data = await this._request(`/products/search?${params.toString()}`, {
        method: 'GET',
        auth: false
      });
      
      return data; // Returns array of products
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get deals (products with discounts)
   * GET /api/products/deals
   */
  async getDeals(limit = 10, minDiscount = null) {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (minDiscount) params.append('min_discount', minDiscount);
      
      const data = await this._request(`/products/deals?${params.toString()}`, {
        method: 'GET',
        auth: false
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  /**
   * Get single product by ID
   * GET /api/products/{product_id}
   */
  async getProduct(productId) {
    try {
      const data = await this._request(`/products/${productId}`, {
        method: 'GET',
        auth: false
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  // ==================== CART ====================

  /**
   * Get cart
   * GET /api/cart/
   */
  async getCart() {
    try {
      const data = await this._request('/cart/', {
        method: 'GET'
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get cart'
      };
    }
  }

  /**
   * Get cart count
   * GET /api/cart/count
   */
  async getCartCount() {
    try {
      const data = await this._request('/cart/count', {
        method: 'GET'
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        count: 0
      };
    }
  }

  /**
   * Add item to cart
   * POST /api/cart/items
   */
  async addToCart(productId, quantity = 1) {
    try {
      const data = await this._request('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          qty: quantity
        })
      });
      
      return {
        success: true,
        data,
        message: 'Item added to cart'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add item to cart'
      };
    }
  }

  /**
   * Update cart item quantity
   * PUT /api/cart/items/{product_id}
   */
  async updateCartItem(productId, quantity) {
    try {
      const data = await this._request(`/cart/items/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ qty: quantity })
      });
      
      return {
        success: true,
        data,
        message: 'Cart updated'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update cart'
      };
    }
  }

  /**
   * Remove item from cart
   * DELETE /api/cart/items/{product_id}
   */
  async removeFromCart(productId) {
    try {
      await this._request(`/cart/items/${productId}`, {
        method: 'DELETE'
      });
      
      return {
        success: true,
        message: 'Item removed from cart'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to remove item'
      };
    }
  }

  // ==================== ORDERS ====================

  /**
   * Create order from cart
   * POST /api/orders/
   */
  async createOrder() {
    try {
      const data = await this._request('/orders/', {
        method: 'POST'
      });
      
      return {
        success: true,
        data,
        message: 'Order created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create order'
      };
    }
  }

  /**
   * Checkout (compatible endpoint)
   * POST /api/orders/checkout
   */
  async checkout(checkoutData) {
    try {
      const data = await this._request('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData)
      });
      
      return {
        success: true,
        data,
        message: 'Checkout successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Checkout failed'
      };
    }
  }

  /**
   * Get user's orders
   * GET /api/orders/me
   */
  async getOrders(status = null, limit = 50, offset = 0) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('limit', limit);
      params.append('offset', offset);
      
      const data = await this._request(`/orders/me?${params.toString()}`, {
        method: 'GET'
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get orders',
        data: []
      };
    }
  }

  // ==================== TRADE-IN ====================

  /**
   * Get trade-in brands
   * GET /api/tradein/brands
   */
  async getTradeinBrands() {
    try {
      const data = await this._request('/tradein/brands', {
        method: 'GET',
        auth: false
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get brands',
        data: []
      };
    }
  }

  /**
   * Get trade-in estimate
   * POST /api/tradein/estimate
   */
  async getTradeInEstimate(deviceData) {
    try {
      const data = await this._request('/tradein/estimate', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get estimate'
      };
    }
  }

  /**
   * Create pickup request
   * POST /api/tradein/pickup-requests
   */
  async createPickupRequest(formData) {
    try {
      // FormData is already in the correct format for multipart/form-data
      const data = await this._request('/tradein/pickup-requests', {
        method: 'POST',
        contentType: null, // Let browser set content-type with boundary
        body: formData
      });
      
      return {
        success: true,
        data,
        message: 'Pickup request created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create pickup request'
      };
    }
  }

  /**
   * Get user's pickup requests
   * GET /api/tradein/pickup-requests/me
   */
  async getMyPickups() {
    try {
      const data = await this._request('/tradein/pickup-requests/me', {
        method: 'GET'
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get pickups',
        data: []
      };
    }
  }

  /**
   * Respond to trade-in offer
   * POST /api/tradein/pickup-requests/{pickup_id}/respond
   */
  async respondToOffer(pickupId, action) {
    try {
      const data = await this._request(`/tradein/pickup-requests/${pickupId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      
      return {
        success: true,
        data,
        message: `Offer ${action}ed successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to respond to offer'
      };
    }
  }

  // ==================== CATEGORIES ====================

  /**
   * Get categories
   * GET /api/categories/
   */
  async getCategories() {
    try {
      const data = await this._request('/categories/', {
        method: 'GET',
        auth: false
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // ==================== LOCATIONS ====================

  /**
   * Get locations
   * GET /api/locations/
   */
  async getLocations() {
    try {
      const data = await this._request('/locations/', {
        method: 'GET',
        auth: false
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get locations',
        data: []
      };
    }
  }

  /**
   * Get location by ID
   * GET /api/locations/{location_id}
   */
  async getLocation(locationId) {
    try {
      const data = await this._request(`/locations/${locationId}`, {
        method: 'GET',
        auth: false
      });
      
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to get location'
      };
    }
  }

  // ==================== ADDRESSES ====================

  /**
   * Get current user's addresses
   * GET /api/addresses/
   */
  async getAddresses() {
    try {
      const data = await this._request('/addresses/', {
        method: 'GET'
      });

      return {
        success: true,
        data: Array.isArray(data) ? data : []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to load addresses',
        status: error.status,
        data: []
      };
    }
  }

  /**
   * Create a new address
   * POST /api/addresses/
   */
  async createAddress(addressData) {
    try {
      const data = await this._request('/addresses/', {
        method: 'POST',
        body: JSON.stringify(addressData)
      });

      return {
        success: true,
        data,
        message: 'Address added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add address',
        status: error.status
      };
    }
  }

  /**
   * Update an address
   * PUT /api/addresses/{address_id}
   */
  async updateAddress(addressId, addressData) {
    try {
      const data = await this._request(`/addresses/${addressId}`, {
        method: 'PUT',
        body: JSON.stringify(addressData)
      });

      return {
        success: true,
        data,
        message: 'Address updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update address',
        status: error.status
      };
    }
  }

  /**
   * Delete an address
   * DELETE /api/addresses/{address_id}
   */
  async deleteAddress(addressId) {
    try {
      await this._request(`/addresses/${addressId}`, {
        method: 'DELETE'
      });

      return {
        success: true,
        message: 'Address removed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to delete address',
        status: error.status
      };
    }
  }
}

// Create singleton instance
const backendApi = new BackendAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = backendApi;
}
