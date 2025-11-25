// API module - connects to backend API
// Requires: config.js and backendApi.js to be loaded first
// hi dev, this file is full of tiny robots, be kind plz

const ORDER_PLACEHOLDER_IMAGE = "https://via.placeholder.com/80x80.png?text=Device";

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeOrders(rawOrders = []) {
  return rawOrders.map(order => {
    const id = order?.orderId || order?.order_id || order?.id;
    const reference = id ? `ORD${id}` : undefined;
    return {
      id: id ?? order?.id,
      reference: reference || `ORD${order?.id ?? ''}`,
      status: order?.status || 'pending',
      type: 'buy',
      total: normalizeNumber(order?.total),
      subtotal: normalizeNumber(order?.subtotal),
      tax: normalizeNumber(order?.tax),
      shipping: normalizeNumber(order?.shipping_fee),
      date: order?.created_at,
      paymentStatus: order?.payment?.status || null,
      items: Array.isArray(order?.items)
        ? order.items.map(item => ({
            id: item?.product_id,
            name: item?.product?.title || item?.title || 'Device',
            price: normalizeNumber(item?.unit_price),
            quantity: item?.qty ?? item?.quantity ?? 0,
            total: normalizeNumber(item?.line_total),
            image: item?.product?.image || ORDER_PLACEHOLDER_IMAGE
          }))
        : [],
      raw: order
    };
  });
}

const api = {
  // Initialize and check backend connection
  async init() {
    try {
      if (typeof backendApi === 'undefined') {
        console.error('Backend API module not loaded');
        return false;
      }

      const isConnected = await backendApi.checkHealth();
      
      if (isConnected) {
        console.log('%cBackend API Connected', 'color: #4caf50; font-weight: bold;');
        return true;
      }
      
      console.error('%cBackend API Not Available', 'color: #f44336; font-weight: bold;');
      return false;
    } catch (error) {
      console.error('%cBackend Connection Error', 'color: #f44336; font-weight: bold;', error);
      return false;
    }
  },

  // Authentication
  async login(email, password) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.login(email, password);
  },

  async logout() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.logout();
  },

  async register(email, password, profile = {}) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.register(email, password, profile);
  },

  async getCurrentUser() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getCurrentUser();
  },

  isAuthenticated() {
    if (backendApi) {
      return backendApi.isAuthenticated();
    }
    return !!localStorage.getItem('authToken');
  },

  // Products
  async getProducts(filters = {}) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getProducts(filters);
  },

  async searchProducts(query, filters = {}) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.searchProducts(query, filters);
  },

  async getDeals(limit = 10, minDiscount = null) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getDeals(limit, minDiscount);
  },

  async getProduct(id) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getProduct(id);
  },

  // Categories
  async getCategories() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getCategories();
  },

  // Orders
  async getOrders(status = null, limit = 50, offset = 0) {
    if (!backendApi) throw new Error('Backend API not available');
    const response = await backendApi.getOrders(status, limit, offset);
    if (!response || response.success === false) {
      console.error('Failed to load orders', response?.error);
      return [];
    }
    return normalizeOrders(response.data || []);
  },

  // Cart
  async getCart() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getCart();
  },

  async getCartCount() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getCartCount();
  },

  async addToCart(productId, quantity = 1) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.addToCart(productId, quantity);
  },

  async updateCartItem(productId, quantity) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.updateCartItem(productId, quantity);
  },

  async removeFromCart(productId) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.removeFromCart(productId);
  },

  // Checkout
  async checkout(orderData) {
    if (!backendApi) throw new Error('Backend API not available');
    const result = await backendApi.checkout(orderData);
    if (!result || result.success === false) {
      return result;
    }

    const payload = result.data || {};
    return {
      success: true,
      orderId: payload.orderId || payload.order_id,
      paymentIntent: payload.client_secret || null,
      data: payload,
      message: result.message || 'Checkout successful'
    };
  },

  async createOrder() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.createOrder();
  },

  // Trade-in
  async getTradeinBrands() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getTradeinBrands();
  },

  async getTradeInEstimate(deviceData) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getTradeInEstimate(deviceData);
  },

  async createPickupRequest(formData) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.createPickupRequest(formData);
  },

  async getMyPickups() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getMyPickups();
  },

  async respondToOffer(pickupId, action) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.respondToOffer(pickupId, action);
  },

  // Locations
  async getLocations() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getLocations();
  },

  async getLocation(locationId) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getLocation(locationId);
  },

  // Addresses
  async getAddresses() {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.getAddresses();
  },

  async createAddress(addressData) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.createAddress(addressData);
  },

  async updateAddress(addressId, addressData) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.updateAddress(addressId, addressData);
  },

  async deleteAddress(addressId) {
    if (!backendApi) throw new Error('Backend API not available');
    return await backendApi.deleteAddress(addressId);
  }
};
