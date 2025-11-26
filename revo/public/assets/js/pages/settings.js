// settings
import { REVO_CITIES, setCity, getCity, nearestCity } from '../geo.js';

const PREFERENCES_KEY = 'revo_preferences';
const LOCAL_ADDRESS_STORAGE_KEY = 'revo-addresses';
const LOCAL_ORDER_STORAGE_KEY = 'revo_orders_local';
const SESSION_KEYS = [
  'revo_auth',
  'authToken',
  'revo_cart',
  'revo_user',
  'revo_wallet',
  'revo_preferences',
  'revo_city',
  'revo_city_tax',
  LOCAL_ADDRESS_STORAGE_KEY,
  LOCAL_ORDER_STORAGE_KEY
];

const DEFAULT_PREFERENCES = {
  notifications: {
    orderUpdates: true,
    priceAlerts: true,
    marketing: false,
    smsAlerts: false
  }
};

let preferences = loadPreferences();
let notificationInputs = [];
let citySelect = null;

document.addEventListener('DOMContentLoaded', () => {
  citySelect = document.getElementById('city-select');
  // Ensure defaults are persisted so toggles stay in sync across visits.
  savePreferences(preferences);
  renderCityOptions();
  initNotificationToggles();
  updateLocalDataSummary();
  bindActions();
});

window.addEventListener('revo:city-changed', (event) => {
  const nextCity = resolveCityInput(event?.detail);
  updateCityDisplay(nextCity);
  updateLocalDataSummary();
});

window.addEventListener('revo:cart-changed', updateLocalDataSummary);
window.addEventListener('revo:auth-changed', updateLocalDataSummary);
window.addEventListener('storage', (event) => {
  if (!event.key) {
    return;
  }
  const isRevoKey = event.key.startsWith('revo') || event.key === 'authToken';
  if (isRevoKey) {
    updateLocalDataSummary();
  }
});

function bindActions() {
  const openPickerBtn = document.getElementById('open-city-picker');
  if (openPickerBtn) {
    openPickerBtn.addEventListener('click', () => {
      window.location.href = './choose-city.html?from=settings';
    });
  }

  const locationBtn = document.getElementById('use-my-location');
  if (locationBtn) {
    locationBtn.addEventListener('click', handleUseCurrentLocation);
  }

  const resetBtn = document.getElementById('reset-session-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetSession);
  }

  if (citySelect) {
    citySelect.addEventListener('change', (event) => {
      const cityKey = event.target.value;
      const city = setCity(cityKey);
      updateCityDisplay(city);
      updateLocalDataSummary();
      safeToast(`City changed to ${city.name}`, 'success');
    });
  }
}

function renderCityOptions() {
  if (!citySelect) {
    return;
  }

  citySelect.innerHTML = REVO_CITIES.map(city => {
    return `<option value="${city.key}">${city.name} · ${formatTax(city.tax)}</option>`;
  }).join('');

  const activeCity = getActiveCity();
  if (activeCity) {
    citySelect.value = activeCity.key;
  }
  updateCityDisplay(activeCity);
}

function getActiveCity() {
  return getCity() || REVO_CITIES[0] || null;
}

function resolveCityInput(input) {
  if (!input) {
    return getActiveCity();
  }

  if (typeof input === 'string') {
    return REVO_CITIES.find(city => city.key === input || city.name === input) || getActiveCity();
  }

  if (input && typeof input === 'object') {
    const key = input.key || input.name;
    if (key) {
      const match = REVO_CITIES.find(city => city.key === key || city.name === key);
      if (match) {
        return { ...match, ...input };
      }
      return {
        key,
        name: input.name || key,
        tax: input.tax
      };
    }
  }

  return getActiveCity();
}

async function handleUseCurrentLocation(event) {
  const button = event.currentTarget;
  setButtonBusy(button, true, 'Locating…');
  try {
    const city = await locateCityByGPS();
    updateCityDisplay(city);
    updateLocalDataSummary();
    safeToast(`Detected ${city.name}`, 'success');
  } catch (error) {
    console.error('Location detection failed:', error);
    const denied = typeof error?.code === 'number' && error.code === 1;
    const message = denied
      ? 'Location permission denied'
      : error?.message === 'not-supported'
        ? 'Geolocation is not supported on this device'
        : 'Unable to detect your location';
    safeToast(message, 'error');
  } finally {
    setButtonBusy(button, false);
  }
}

function locateCityByGPS() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('not-supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearest = nearestCity(latitude, longitude);
        resolve(setCity(nearest.key));
      },
      (error) => reject(error),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  });
}

function updateCityDisplay(city = null) {
  const label = document.getElementById('active-city-label');
  const taxLabel = document.getElementById('city-tax-label');
  const active = resolveCityInput(city);

  if (citySelect && active) {
    citySelect.value = active.key;
  }

  if (label) {
    label.textContent = active ? active.name : 'Not set';
  }

  if (taxLabel) {
    taxLabel.textContent = active
      ? `Local tax: ${formatTax(active.tax)}`
      : 'Local tax: —';
  }
}

function initNotificationToggles() {
  notificationInputs = Array.from(document.querySelectorAll('[data-pref]'));
  updateNotificationControls();
  notificationInputs.forEach(input => {
    input.addEventListener('change', () => {
      const key = input.dataset.pref;
      preferences.notifications[key] = input.checked;
      savePreferences(preferences);
      updateNotificationSummary();
    });
  });
  updateNotificationSummary();
}

function updateNotificationControls() {
  notificationInputs.forEach(input => {
    const key = input.dataset.pref;
    input.checked = !!preferences.notifications[key];
  });
}

function updateNotificationSummary() {
  const summaryNode = document.getElementById('notification-summary');
  if (!summaryNode) {
    return;
  }
  const enabledCount = Object.values(preferences.notifications || {}).filter(Boolean).length;
  if (enabledCount === 0) {
    summaryNode.textContent = 'All notifications muted';
  } else if (enabledCount === 1) {
    summaryNode.textContent = '1 notification enabled';
  } else {
    summaryNode.textContent = `${enabledCount} notifications enabled`;
  }
}

function updateLocalDataSummary() {
  const cartCountNode = document.getElementById('settings-cart-count');
  if (cartCountNode) {
    cartCountNode.textContent = getCartItemCount();
  }

  const addressNode = document.getElementById('settings-address-count');
  if (addressNode) {
    addressNode.textContent = getAddressCount();
  }

  const authNode = document.getElementById('settings-auth-state');
  if (authNode) {
    authNode.textContent = hasAuthSession() ? 'Signed in' : 'Guest';
  }

  const orderNode = document.getElementById('settings-order-count');
  if (orderNode) {
    orderNode.textContent = getOrderSnapshotCount();
  }

  const storageNode = document.getElementById('settings-storage-count');
  if (storageNode) {
    storageNode.textContent = formatStoredKeyCount();
  }
}

function handleResetSession() {
  const shouldReset = window.confirm('Reset local session? You will be signed out and cached data will be cleared.');
  if (!shouldReset) {
    return;
  }

  const preservedCity = getActiveCity();
  SESSION_KEYS.forEach(key => localStorage.removeItem(key));
  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }

  preferences = cloneDefaultPreferences();
  savePreferences(preferences);
  updateNotificationControls();
  updateNotificationSummary();

  const resetCity = preservedCity ? setCity(preservedCity.key) : setCity(REVO_CITIES[0].key);
  updateCityDisplay(resetCity);
  updateLocalDataSummary();

  safeToast('Session cleared. Sign in again to sync data.', 'success');
}

function getCartItemCount() {
  try {
    const raw = localStorage.getItem('revo_cart');
    if (!raw) {
      return 0;
    }
    const cart = JSON.parse(raw);
    if (!Array.isArray(cart)) {
      return 0;
    }
    return cart.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      return sum + qty;
    }, 0);
  } catch (error) {
    console.warn('Failed to parse cart:', error);
    return 0;
  }
}

function getAddressCount() {
  try {
    const raw = localStorage.getItem(LOCAL_ADDRESS_STORAGE_KEY);
    if (!raw) {
      return 0;
    }
    const addresses = JSON.parse(raw);
    return Array.isArray(addresses) ? addresses.length : 0;
  } catch (error) {
    console.warn('Failed to parse addresses:', error);
    return 0;
  }
}

function getOrderSnapshotCount() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDER_STORAGE_KEY);
    if (!raw) {
      return 0;
    }
    const orders = JSON.parse(raw);
    return Array.isArray(orders) ? orders.length : 0;
  } catch (error) {
    console.warn('Failed to parse orders:', error);
    return 0;
  }
}

function hasAuthSession() {
  return !!localStorage.getItem('revo_auth') || !!localStorage.getItem('authToken');
}

function formatStoredKeyCount() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('revo') || key === 'authToken')) {
      count += 1;
    }
  }
  return `${count} keys`;
}

function setButtonBusy(button, busy, busyLabel = 'Working…') {
  if (!button) {
    return;
  }
  if (busy) {
    button.dataset.originalLabel = button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalLabel || button.textContent;
    button.disabled = false;
  }
}

function formatTax(rate) {
  if (!Number.isFinite(rate)) {
    return '—';
  }
  const precision = rate * 100 % 1 === 0 ? 0 : 2;
  const value = (rate * 100).toFixed(precision);
  return `${value}%`;
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return cloneDefaultPreferences();
    }
    const parsed = JSON.parse(raw);
    return mergePreferences(parsed);
  } catch (error) {
    console.warn('Failed to load preferences:', error);
    return cloneDefaultPreferences();
  }
}

function savePreferences(next) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to persist preferences:', error);
  }
}

function mergePreferences(source = {}) {
  const defaults = cloneDefaultPreferences();
  return {
    ...defaults,
    ...source,
    notifications: {
      ...defaults.notifications,
      ...(source.notifications || {})
    }
  };
}

function cloneDefaultPreferences() {
  return {
    notifications: { ...DEFAULT_PREFERENCES.notifications }
  };
}

function safeToast(message, type) {
  if (typeof showToast === 'function') {
    showToast(message, type);
  } else {
    console.log(`[${type}] ${message}`);
  }
}
