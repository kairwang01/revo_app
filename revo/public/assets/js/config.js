/**
 * Configuration file for Revo Frontend
 * Update BACKEND_URL to match your backend deployment
 */
// config vibes: change with care, hydrate often

const CONFIG = {
  // Backend API URL
  BACKEND_URL: 'https://revo-backend-o03w.onrender.com/',

  // Analytics (set to a GA4 Measurement ID like G-XXXXXX to enable)
  ANALYTICS_ID: null,

  // Optional override for Google auth endpoint. Leave null to use `${BACKEND_URL}${API_PREFIX}/auth/google`
  GOOGLE_AUTH_ENDPOINT: null,
  // Google OAuth client ID (frontend uses token client)
  GOOGLE_CLIENT_ID: '512280577272-d5tpr43puu3fqdrk81i2pfrik74ahlr3.apps.googleusercontent.com',
  
  // Optional customer support endpoint (kept null until wired)
  SUPPORT_API_URL: null,
  
  // API endpoints
  API_PREFIX: '/api',
  
  // Feature flags
  FEATURES: {
    USE_BACKEND: true,  // Frontend always relies on the live backend
    AUTO_INIT: true,    // Automatically check backend on page load
    DEBUG_MODE: true    // Enable console logging
  },
  
  // Timeouts (in milliseconds)
  TIMEOUTS: {
    HEALTH_CHECK: 3000,
    API_REQUEST: 10000,
    SUPPORT_REQUEST: 8000
  },
  
  // Get full API URL
  getApiUrl() {
    return this.BACKEND_URL + this.API_PREFIX;
  },
  
  // Check if backend should be used
  shouldUseBackend() {
    return this.FEATURES.USE_BACKEND;
  }
};

// Make config available globally
if (typeof window !== 'undefined') {
  window.REVO_CONFIG = CONFIG;
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
