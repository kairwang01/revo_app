// Checkout page functionality
// shipping choices live here, hope they behave
const SHIPPING_STORAGE_KEY = 'revo-shipping-mode';
const SHIPPING_CHOICES = {
  regular: {
    name: 'Canada Post Regular',
    carrier: 'Canada Post',
    cost: 0,
    eta: '2-4 business days'
  },
  fast: {
    name: 'FedEx Express',
    carrier: 'FedEx Express',
    cost: 24.99,
    eta: '1-2 business days'
  }
};

let selectedShippingMode = getSavedShippingMode();
let checkoutCart = [];

const addressDom = {
  list: null,
  empty: null,
  toggleBtn: null,
  form: null
};

const addressState = {
  items: [],
  selectedId: null,
  editingId: null
};

const ADDRESS_LIMITS = {
  full_name: { min: 1, max: 100, label: 'Full name' },
  phone_number: { min: 1, max: 20, label: 'Phone number' },
  address_line1: { min: 1, max: 200, label: 'Address line 1' },
  address_line2: { min: 0, max: 200, label: 'Address line 2', optional: true },
  city: { min: 1, max: 100, label: 'City' },
  state: { min: 1, max: 100, label: 'Province / State' },
  postal_code: { min: 1, max: 20, label: 'Postal code' },
  country: { min: 1, max: 100, label: 'Country', optional: true }
};
const LOCAL_ADDRESS_STORAGE_KEY = 'revo-addresses';
const localAddressService = createLocalAddressService();
let addressAuthRedirectScheduled = false;

function getAddressService() {
  if (typeof api !== 'undefined' && api && typeof api.getAddresses === 'function') {
    return api;
  }
  if (typeof backendApi !== 'undefined' && backendApi && typeof backendApi.getAddresses === 'function') {
    return backendApi;
  }
  if (localAddressService) {
    return localAddressService;
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!authStore.isAuthenticated()) {
    window.location.href = './login.html?return=' + encodeURIComponent(window.location.href);
    return;
  }

  assignAddressDomRefs();
  await initAddressSection();

  setupShippingOptions();
  loadCartItems();
  populateWalletBalance();
  setupPaymentMethods();
  setupPlaceOrder();
});

function loadCartItems() {
  const cart = cartStore.get();
  const itemsContainer = document.getElementById('order-items');
  
  if (!cart || cart.length === 0) {
    itemsContainer.innerHTML = '<p class="text-muted">Your cart is empty</p>';
    document.getElementById('place-order-btn').disabled = true;
    return;
  }
  
  checkoutCart = cart;

  // Render cart items
  itemsContainer.innerHTML = cart.map(item => `
    <div style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--border-light);">
      <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 0.25rem;">${item.name}</div>
        <div style="font-size: 0.875rem; color: var(--muted);">Qty: ${item.quantity}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 600;">${formatMoney(item.price * item.quantity)}</div>
        <div style="font-size: 0.875rem; color: var(--muted);">${formatMoney(item.price)} each</div>
      </div>
    </div>
  `).join('');
  
  // Calculate and display totals
  calculateTotals(cart);
}

function calculateTotals(cart) {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = getTaxRate(cityStore.get()) || 0.12;
  const tax = subtotal * taxRate;
  const shippingOption = SHIPPING_CHOICES[selectedShippingMode] || SHIPPING_CHOICES.regular;
  const shipping = shippingOption.cost;
  const total = subtotal + tax + shipping;
  
  document.getElementById('checkout-subtotal').textContent = formatMoney(subtotal);
  document.getElementById('checkout-tax-rate').textContent = (taxRate * 100).toFixed(0);
  document.getElementById('checkout-tax').textContent = formatMoney(tax);
  document.getElementById('checkout-shipping').textContent = shipping === 0 ? 'Free' : formatMoney(shipping);
  const shippingLabel = document.getElementById('checkout-shipping-selected');
  if (shippingLabel) {
    shippingLabel.textContent = `${shippingOption.name} · ${shippingOption.eta}`;
  }
  document.getElementById('checkout-total').textContent = formatMoney(total);
  
  // Store total for payment page
  window.checkoutTotal = total.toFixed(2);
  window.checkoutShipping = {
    mode: selectedShippingMode,
    ...shippingOption
  };
  window.checkoutBreakdown = {
    subtotal,
    tax,
    taxRate,
    shipping,
    total
  };
}

function populateWalletBalance() {
  const balanceNode = document.getElementById('wallet-balance');
  if (!balanceNode) {
    return;
  }

  try {
    const wallet = walletStore.get();
    const balance = wallet?.balance || 0;
    balanceNode.textContent = balance.toFixed(2);
  } catch (error) {
    console.error('Error loading wallet balance:', error);
    balanceNode.textContent = '0.00';
  }
}

function setupPaymentMethods() {
  const paymentMethods = document.querySelectorAll('.payment-method');
  
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      // Remove selected class from all
      paymentMethods.forEach(m => m.classList.remove('selected'));
      // Add to clicked
      method.classList.add('selected');
      // Check the radio button
      const radio = method.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
      }
    });
  });
}

function setupPlaceOrder() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  
  placeOrderBtn.addEventListener('click', async () => {
    const cart = cartStore.get();
    
    if (!cart || cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    
    // Get selected payment method
    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
      showToast('Please select a payment method', 'error');
      return;
    }
    
    const paymentMethod = selectedPayment.value;
    let paymentMethodName = 'Credit Card';
    
    if (paymentMethod === 'wallet') {
      paymentMethodName = 'Revo Wallet';
    } else if (paymentMethod === 'cod') {
      paymentMethodName = 'Cash on Delivery';
    }
    
    const checkoutTotal = Number(window.checkoutTotal) || 0;
    const shippingDetails = SHIPPING_CHOICES[selectedShippingMode];
    if (!shippingDetails) {
      showToast('Please select a shipment option', 'error');
      return;
    }

    const selectedAddress = getSelectedAddress();
    const shippingAddressPayload = mapAddressToShippingPayload(selectedAddress);
    if (!shippingAddressPayload) {
      showToast('Please add a delivery address to continue.', 'error');
      return;
    }
    
    // Disable button and show loading
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing...';
    
    try {
      // Create order
      const orderData = {
        items: cart,
        total: checkoutTotal,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        shipping: {
          mode: selectedShippingMode,
          carrier: shippingDetails.carrier,
          cost: shippingDetails.cost,
          eta: shippingDetails.eta
        },
        shippingAddress: shippingAddressPayload
      };
      
      const result = await api.checkout(orderData);
      
      if (result && result.success) {
        // Generate order ID
        const orderId = result.orderId || result.data?.orderId || result.data?.order_id || 'ORD' + Date.now();
        try {
          window.dispatchEvent(new CustomEvent('revo:order-placed', {
            detail: {
              orderId,
              total: checkoutTotal,
              payment_method: paymentMethodName
            }
          }));
          if (window.analytics && typeof window.analytics.trackEvent === 'function') {
            window.analytics.trackEvent('order_placed', {
              order_id: orderId,
              total_value: checkoutTotal,
              payment_method: paymentMethodName,
              shipping_mode: shippingDetails?.mode
            });
          }
        } catch (eventError) {
          console.warn('Order event failed', eventError);
        }
        
        rememberLastCheckoutAddress(shippingAddressPayload, shippingDetails);
        saveLocalOrderSnapshot(orderId, cart, shippingAddressPayload, paymentMethodName, shippingDetails);

        // Clear local cart after successful checkout
        cartStore.clear();
        
        // Redirect to fake payment gateway
        window.location.href = `./fake-payment.php?amount=${window.checkoutTotal}&orderId=${orderId}&method=${encodeURIComponent(paymentMethodName)}`;
      } else {
        showToast(result?.error || 'Order failed. Please try again.', 'error');
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showToast('An error occurred. Please try again.', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  });
}

function setupShippingOptions() {
  const container = document.getElementById('shipping-options');
  if (!container) {
    return;
  }

  const options = Array.from(container.querySelectorAll('.shipping-option'));
  applyShippingSelection(options, selectedShippingMode);

  options.forEach(option => {
    option.addEventListener('click', () => {
      const mode = option.dataset.shipping;
      if (!mode || !SHIPPING_CHOICES[mode]) {
        return;
      }
      selectedShippingMode = mode;
      saveShippingMode(mode);
      applyShippingSelection(options, mode);
      if (checkoutCart.length) {
        calculateTotals(checkoutCart);
      }
    });
  });
}

function applyShippingSelection(optionNodes, mode) {
  optionNodes.forEach(option => {
    const input = option.querySelector('input[type="radio"]');
    const isActive = option.dataset.shipping === mode;
    option.classList.toggle('selected', isActive);
    if (input) {
      input.checked = isActive;
    }
  });
}

function getSavedShippingMode() {
  try {
    const saved = localStorage.getItem(SHIPPING_STORAGE_KEY);
    return saved && SHIPPING_CHOICES[saved] ? saved : 'regular';
  } catch (error) {
    return 'regular';
  }
}

function saveShippingMode(mode) {
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Unable to persist shipping mode', error);
  }
}

function assignAddressDomRefs() {
  addressDom.list = document.getElementById('address-list');
  addressDom.empty = document.getElementById('address-empty');
  addressDom.toggleBtn = document.getElementById('add-address-btn');
  addressDom.form = document.getElementById('address-form');
}

async function initAddressSection() {
  if (!addressDom.list) {
    return;
  }
  setupAddressForm();
  await loadAddressBook();
}

async function loadAddressBook(preferredId = null) {
  const service = getAddressService();
  if (!service) {
    console.warn('Address service unavailable: missing API client');
    addressState.items = [];
    showAddressUnavailableMessage();
    updateAddressEmptyState();
    return [];
  }

  showAddressLoadingState();
  try {
    const response = await service.getAddresses();
    if (response?.success) {
      addressState.items = Array.isArray(response.data) ? response.data : [];
    } else {
      if (handleAddressAuthFailure(response)) {
        addressState.items = [];
        renderAddressList();
        updateAddressEmptyState();
        return [];
      }
      addressState.items = [];
      if (response?.error) {
        console.warn('Unable to load addresses:', response.error);
      }
    }
  } catch (error) {
    if (handleAddressAuthFailure(error)) {
      addressState.items = [];
      renderAddressList();
      updateAddressEmptyState();
      return [];
    }
    console.error('Unable to load addresses:', error);
    addressState.items = [];
  }

  if (preferredId) {
    addressState.selectedId = String(preferredId);
  } else if (addressState.items.length) {
    const defaultAddress = addressState.items.find(addr => addr.is_default);
    const first = defaultAddress || addressState.items[0];
    addressState.selectedId = first?.id != null ? String(first.id) : null;
  } else {
    addressState.selectedId = null;
  }

  renderAddressList();
  updateAddressEmptyState();
  return addressState.items;
}

function setupAddressForm() {
  if (!addressDom.form || !addressDom.toggleBtn) {
    return;
  }

  resetAddressForm();

  addressDom.toggleBtn.addEventListener('click', () => {
    resetAddressForm();
    toggleAddressForm(true);
  });

  const cancelBtn = addressDom.form.querySelector('[data-action="cancel-address"]');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetAddressForm();
      toggleAddressForm(false);
    });
  }

  addressDom.form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const service = getAddressService();
    if (!service || typeof service.createAddress !== 'function') {
      showToast('Address service unavailable.', 'error');
      return;
    }

    const payload = getAddressPayloadFromForm(event.target);
    if (!payload) {
      return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    const isEditing = Boolean(addressState.editingId);

    try {
      const response = isEditing
        ? await service.updateAddress(addressState.editingId, payload)
        : await service.createAddress(payload);
      if (response?.success) {
        showToast('Address saved', 'success');
        const preferredId = response.data?.id ?? addressState.editingId;
        resetAddressForm();
        await loadAddressBook(preferredId);
        toggleAddressForm(false);
      } else {
        if (handleAddressAuthFailure(response)) {
          return;
        }
        showToast(response?.error || 'Unable to save address', 'error');
      }
    } catch (error) {
      if (handleAddressAuthFailure(error)) {
        return;
      }
      console.error('Failed to save address:', error);
      showToast('Unable to save address right now.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = addressState.editingId ? 'Update Address' : 'Save Address';
      }
    }
  });
}

function toggleAddressForm(visible) {
  if (!addressDom.form || !addressDom.toggleBtn) {
    return;
  }
  addressDom.form.classList.toggle('hidden', !visible);
  addressDom.toggleBtn.classList.toggle('hidden', visible);
}

function resetAddressForm() {
  if (!addressDom.form) {
    return;
  }
  addressDom.form.reset();
  const countryInput = addressDom.form.querySelector('[name="country"]');
  if (countryInput && !countryInput.value) {
    countryInput.value = 'Canada';
  }
  addressState.editingId = null;
  addressDom.form.dataset.mode = 'create';
  updateAddressFormCopy();
}

function populateAddressForm(address) {
  if (!addressDom.form) {
    return;
  }
  const fields = ['full_name', 'phone_number', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'];
  fields.forEach(field => {
    const input = addressDom.form.querySelector(`[name="${field}"]`);
    if (!input) {
      return;
    }
    input.value = address[field] ?? '';
  });
  const checkbox = addressDom.form.querySelector('[name="is_default"]');
  if (checkbox) {
    checkbox.checked = Boolean(address.is_default);
  }
  addressDom.form.dataset.mode = 'edit';
  updateAddressFormCopy();
}

function updateAddressFormCopy() {
  if (!addressDom.form) {
    return;
  }
  const isEditing = addressDom.form.dataset.mode === 'edit';
  const title = addressDom.form.querySelector('[data-form-title]');
  const hint = addressDom.form.querySelector('[data-form-hint]');
  const submitBtn = addressDom.form.querySelector('button[type="submit"]');

  if (title) {
    title.textContent = isEditing ? 'Update address' : 'Add new address';
  }
  if (hint) {
    hint.textContent = isEditing
      ? 'Editing a saved address will update future checkouts.'
      : 'Saved addresses help you checkout even faster.';
  }
  if (submitBtn) {
    submitBtn.textContent = isEditing ? 'Update Address' : 'Save Address';
  }
}

function getAddressPayloadFromForm(form) {
  const formData = new FormData(form);
  const payload = {
    full_name: formData.get('full_name')?.trim(),
    phone_number: formData.get('phone_number')?.trim(),
    address_line1: formData.get('address_line1')?.trim(),
    address_line2: formData.get('address_line2')?.trim() || null,
    city: formData.get('city')?.trim(),
    state: formData.get('state')?.trim(),
    postal_code: formData.get('postal_code')?.trim(),
    country: formData.get('country')?.trim() || 'Canada',
    is_default: formData.get('is_default') === 'on'
  };

  const requiredFields = ['full_name', 'phone_number', 'address_line1', 'city', 'state', 'postal_code'];
  const hasMissing = requiredFields.some(key => !payload[key]);
  if (hasMissing) {
    showToast('Please complete all required address fields.', 'error');
    return null;
  }

  const validation = validateAddressPayload(payload);
  if (!validation.valid) {
    showToast(validation.error || 'Address is invalid.', 'error');
    return null;
  }

  return validation.payload;
}

function validateAddressPayload(data) {
  const sanitized = { ...data };

  for (const [field, rule] of Object.entries(ADDRESS_LIMITS)) {
    const raw = data[field];
    if ((raw === undefined || raw === null || raw === '') && rule.optional) {
      sanitized[field] = null;
      continue;
    }

    if (raw === undefined || raw === null || raw === '') {
      return { valid: false, error: `${rule.label} is required.` };
    }

    const value = String(raw).trim();
    const length = value.length;
    if (length < (rule.min ?? 0) || length > (rule.max ?? Infinity)) {
      return {
        valid: false,
        error: `${rule.label} must be between ${rule.min || 0} and ${rule.max || length} characters.`
      };
    }

    sanitized[field] = value;
  }

  sanitized.is_default = Boolean(data.is_default);
  return { valid: true, payload: sanitized };
}

function renderAddressList() {
  if (!addressDom.list) {
    return;
  }

  const items = Array.isArray(addressState.items) ? addressState.items : [];
  addressDom.list.innerHTML = '';

  if (!items.length) {
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(address => {
    const card = document.createElement('div');
    card.className = 'address-card';
    if (String(address.id) === String(addressState.selectedId)) {
      card.classList.add('selected');
    }
    card.dataset.addressId = address.id;

    const heading = document.createElement('div');
    heading.style.fontWeight = '600';
    heading.textContent = address.full_name || 'Saved Address';

    if (address.is_default) {
      const badge = document.createElement('span');
      badge.className = 'chip';
      badge.style.marginLeft = '0.5rem';
      badge.textContent = 'Default';
      heading.appendChild(badge);
    }

    const details = document.createElement('div');
    details.className = 'text-muted';
    details.style.fontSize = '0.875rem';
    details.innerHTML = formatAddressLines(address);

    card.appendChild(heading);
    card.appendChild(details);
    card.appendChild(buildAddressActions(address));
    fragment.appendChild(card);
  });

  addressDom.list.appendChild(fragment);
  addressDom.list.querySelectorAll('[data-address-id]').forEach(card => {
    card.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-address-action]');
      if (actionBtn) {
        event.stopPropagation();
        handleAddressAction(actionBtn.dataset.addressAction, card.dataset.addressId, actionBtn);
        return;
      }
      setSelectedAddress(card.dataset.addressId);
    });
  });
}

function buildAddressActions(address) {
  const wrapper = document.createElement('div');
  wrapper.className = 'address-actions';

  if (!address.is_default) {
    wrapper.appendChild(createAddressActionButton('Set Default', 'set-default'));
  } else {
    const defaultLabel = document.createElement('span');
    defaultLabel.className = 'address-default-label';
    defaultLabel.textContent = 'Default address';
    wrapper.appendChild(defaultLabel);
  }

  wrapper.appendChild(createAddressActionButton('Edit', 'edit'));
  wrapper.appendChild(createAddressActionButton('Delete', 'delete'));

  return wrapper;
}

function createAddressActionButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'address-action-btn';
  button.dataset.addressAction = action;
  button.textContent = label;
  return button;
}

function handleAddressAction(action, addressId, trigger) {
  switch (action) {
    case 'set-default':
      markAddressAsDefault(addressId, trigger);
      break;
    case 'edit':
      beginAddressEdit(addressId);
      break;
    case 'delete':
      deleteAddress(addressId, trigger);
      break;
    default:
      break;
  }
}

async function markAddressAsDefault(addressId, trigger) {
  const service = getAddressService();
  if (!service || typeof service.updateAddress !== 'function') {
    showToast('Address service unavailable.', 'error');
    return;
  }

  if (trigger) {
    trigger.disabled = true;
  }

  try {
    const response = await service.updateAddress(addressId, { is_default: true });
    if (!response?.success) {
      if (handleAddressAuthFailure(response)) {
        return;
      }
      showToast(response?.error || 'Unable to update default address.', 'error');
      return;
    }
    showToast('Default address updated', 'success');
    await loadAddressBook(addressId);
  } catch (error) {
    if (handleAddressAuthFailure(error)) {
      return;
    }
    console.error('Failed to set default address:', error);
    showToast('Unable to update default address.', 'error');
  } finally {
    if (trigger) {
      trigger.disabled = false;
    }
  }
}

function beginAddressEdit(addressId) {
  const address = getAddressById(addressId);
  if (!address) {
    showToast('Address not found', 'error');
    return;
  }

  addressState.editingId = String(addressId);
  populateAddressForm(address);
  toggleAddressForm(true);
}

async function deleteAddress(addressId, trigger) {
  if (!window.confirm('Remove this address?')) {
    return;
  }

  const service = getAddressService();
  if (!service || typeof service.deleteAddress !== 'function') {
    showToast('Address service unavailable.', 'error');
    return;
  }

  if (trigger) {
    trigger.disabled = true;
  }

  try {
    const response = await service.deleteAddress(addressId);
    if (response && response.success === false) {
      if (handleAddressAuthFailure(response)) {
        return;
      }
      showToast(response.error || 'Unable to delete address.', 'error');
      return;
    }
    showToast('Address removed', 'success');
    if (addressState.editingId === String(addressId)) {
      resetAddressForm();
      toggleAddressForm(false);
    }
    await loadAddressBook();
  } catch (error) {
    if (handleAddressAuthFailure(error)) {
      return;
    }
    console.error('Failed to delete address:', error);
    showToast('Unable to delete address.', 'error');
  } finally {
    if (trigger) {
      trigger.disabled = false;
    }
  }
}

function setSelectedAddress(addressId) {
  addressState.selectedId = addressId != null ? String(addressId) : null;
  renderAddressList();
}

function getSelectedAddress() {
  if (!addressState.selectedId) {
    return null;
  }
  return addressState.items.find(addr => String(addr.id) === String(addressState.selectedId)) || null;
}

function getAddressById(addressId) {
  if (!addressId) {
    return null;
  }
  return addressState.items.find(addr => String(addr.id) === String(addressId)) || null;
}

function mapAddressToShippingPayload(address) {
  if (!address) {
    return null;
  }
  const streetParts = [address.address_line1, address.address_line2].filter(Boolean);
  const fullStreet = streetParts.join(', ');
  return {
    fullName: address.full_name || address.fullName || 'Customer',
    phone: address.phone_number || address.phone,
    street: fullStreet || address.address_line1,
    address: fullStreet || address.address_line1,
    city: address.city,
    province: address.state,
    state: address.state,
    postalCode: address.postal_code,
    zipCode: address.postal_code,
    country: address.country || 'Canada'
  };
}

function updateAddressEmptyState() {
  if (!addressDom.empty) {
    return;
  }
  const isEmpty = !addressState.items.length;
  toggleElement(addressDom.empty, isEmpty);
}

function showAddressLoadingState() {
  if (!addressDom.list) {
    return;
  }
  addressDom.list.innerHTML = '<p class="text-muted">Loading saved addresses...</p>';
}

function showAddressUnavailableMessage() {
  if (!addressDom.list) {
    return;
  }
  addressDom.list.innerHTML = '<p class="text-muted">Address service is unavailable. Please refresh and try again.</p>';
}

function formatAddressLines(address) {
  const lines = [];
  if (address.address_line1) lines.push(address.address_line1);
  if (address.address_line2) lines.push(address.address_line2);
  const cityState = [address.city, address.state].filter(Boolean).join(', ');
  if (cityState) lines.push(cityState);
  if (address.postal_code) lines.push(address.postal_code);
  if (address.country) lines.push(address.country);
  if (address.phone_number) lines.push(`Phone: ${address.phone_number}`);
  return lines.map(escapeHtml).join('<br>');
}

function escapeHtml(value) {
  if (value === undefined || value === null) {
    return '';
  }
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function handleAddressAuthFailure(source) {
  if (!isUnauthorizedResponse(source)) {
    return false;
  }

  if (addressAuthRedirectScheduled) {
    return true;
  }

  addressAuthRedirectScheduled = true;

  try {
    if (authStore && typeof authStore.clear === 'function') {
      authStore.clear();
    } else {
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.warn('Failed to clear auth state after unauthorized response:', error);
  }

  if (typeof showToast === 'function') {
    showToast('Please sign in to manage your addresses.', 'error');
  }

  setTimeout(() => {
    const target = './login.html?return=' + encodeURIComponent(window.location.href);
    window.location.href = target;
  }, 1200);

  return true;
}

function isUnauthorizedResponse(source) {
  if (!source || typeof source !== 'object') {
    return false;
  }
  const status = source.status ?? source.status_code ?? source.code;
  if (status === 401) {
    return true;
  }

  const detailCandidates = [
    source.detail,
    source.message,
    source.error,
    source?.data?.detail
  ];

  return detailCandidates.some(candidate => {
    if (typeof candidate !== 'string') {
      return false;
    }
    const normalized = candidate.toLowerCase();
    return normalized.includes('unauthorized') || normalized.includes('not authenticated');
  });
}

function createLocalAddressService() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const testKey = '__revo_address_fallback__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch (error) {
    console.warn('Local address fallback unavailable:', error);
    return null;
  }

  return {
    async getAddresses() {
      return {
        success: true,
        data: readLocalAddresses()
      };
    },
    async createAddress(payload) {
      const addresses = readLocalAddresses();
      const timestamp = new Date().toISOString();
      const isDefault = Boolean(payload.is_default || !addresses.length);
      const newAddress = {
        id: generateLocalAddressId(),
        full_name: payload.full_name,
        phone_number: payload.phone_number,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2 || null,
        city: payload.city,
        state: payload.state,
        postal_code: payload.postal_code,
        country: payload.country || 'Canada',
        is_default: isDefault,
        created_at: timestamp,
        updated_at: timestamp
      };

      addresses.push(newAddress);
      ensureLocalDefault(addresses, isDefault ? newAddress.id : undefined);
      writeLocalAddresses(addresses);

      return {
        success: true,
        data: newAddress,
        message: 'Address saved locally'
      };
    },
    async updateAddress(addressId, payload) {
      const addresses = readLocalAddresses();
      const index = addresses.findIndex(addr => String(addr.id) === String(addressId));

      if (index === -1) {
        return {
          success: false,
          error: 'Address not found'
        };
      }

      const timestamp = new Date().toISOString();
      const current = addresses[index];
      const updated = {
        ...current,
        ...payload,
        id: current.id,
        address_line2: payload.address_line2 ?? current.address_line2 ?? null,
        country: payload.country || current.country || 'Canada',
        is_default: payload.is_default ?? current.is_default,
        updated_at: timestamp
      };

      addresses[index] = updated;
      if (payload.is_default === true) {
        ensureLocalDefault(addresses, updated.id);
      } else if (payload.is_default === false) {
        ensureLocalDefault(addresses, null);
      } else {
        ensureLocalDefault(addresses);
      }
      writeLocalAddresses(addresses);

      return {
        success: true,
        data: updated,
        message: 'Address updated locally'
      };
    },
    async deleteAddress(addressId) {
      const addresses = readLocalAddresses();
      const next = addresses.filter(addr => String(addr.id) !== String(addressId));

      if (next.length === addresses.length) {
        return {
          success: false,
          error: 'Address not found'
        };
      }

      ensureLocalDefault(next);
      writeLocalAddresses(next);

      return {
        success: true,
        message: 'Address removed locally'
      };
    }
  };
}

function readLocalAddresses() {
  try {
    const raw = localStorage.getItem(LOCAL_ADDRESS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to read local addresses:', error);
    return [];
  }
}

function writeLocalAddresses(addresses) {
  try {
    localStorage.setItem(LOCAL_ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
  } catch (error) {
    console.warn('Failed to persist local addresses:', error);
  }
}

function ensureLocalDefault(addresses, defaultId) {
  let hasDefault = false;
  if (defaultId !== undefined) {
    addresses.forEach(addr => {
      addr.is_default = defaultId !== null && String(addr.id) === String(defaultId);
      if (addr.is_default) {
        hasDefault = true;
      }
    });
  } else {
    addresses.forEach(addr => {
      if (addr.is_default) {
        hasDefault = true;
      }
    });
  }

  if (!hasDefault && addresses.length) {
    addresses[0].is_default = true;
  }
}

function generateLocalAddressId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function saveLocalOrderSnapshot(orderId, cartItems, shippingAddress, paymentMethodLabel, shippingDetails) {
  if (typeof orderHistoryStore === 'undefined' || !orderHistoryStore.add) {
    return;
  }

  const breakdown = window.checkoutBreakdown || {};
  const snapshot = {
    id: orderId,
    reference: orderId,
    status: 'pending',
    paymentStatus: 'pending',
    total: Number(breakdown.total ?? window.checkoutTotal ?? 0),
    subtotal: Number(breakdown.subtotal ?? 0),
    tax: Number(breakdown.tax ?? 0),
    shipping: Number(
      breakdown.shipping ?? (shippingDetails?.cost ?? 0)
    ),
    date: new Date().toISOString(),
    type: 'buy',
    paymentMethod: paymentMethodLabel,
    shippingSummary: {
      carrier: shippingDetails?.carrier,
      eta: shippingDetails?.eta,
      mode: shippingDetails?.mode || selectedShippingMode,
      name: shippingDetails?.name,
      address: shippingAddress
    },
    items: normalizeCartItemsForOrder(cartItems)
  };

  try {
    orderHistoryStore.add(snapshot);
  } catch (error) {
    console.warn('Unable to cache local order snapshot:', error);
  }
}

function normalizeCartItemsForOrder(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map(item => {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    return {
      id: item.id,
      name: item.name || item.title || 'Device',
      price,
      quantity,
      total: price * quantity,
      image: item.image
    };
  });
}

function rememberLastCheckoutAddress(address, shippingInfo) {
  if (!address || typeof localStorage === 'undefined') {
    return;
  }
  const payload = {
    ...address,
    shipping: shippingInfo
      ? {
          name: shippingInfo.name,
          carrier: shippingInfo.carrier,
          eta: shippingInfo.eta,
          cost: shippingInfo.cost,
          mode: shippingInfo.mode || selectedShippingMode
        }
      : null,
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem('lastCheckoutAddress', JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist checkout address snapshot:', error);
  }
}
