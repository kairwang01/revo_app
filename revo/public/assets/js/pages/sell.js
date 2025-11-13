// Sell/Trade-in Page Logic

const CONDITION_MAP = {
  excellent: 'A',
  good: 'B',
  fair: 'C',
  poor: 'D'
};

const TRADEIN_DEPOSIT_AMOUNT = 29;
const DEFAULT_PICKUP_ADDRESS = 'University of Ottawa';

let lastFormValues = null;

let brandSelect = null;
let modelInput = null;
let modelOptionsList = null;
let modelHelperText = null;
const brandModelCache = new Map();
const brandModelPromises = new Map();
let modelRequestToken = 0;

document.addEventListener('DOMContentLoaded', () => {
  cacheTradeInFormElements();
  loadBrandOptions();
  initFormSubmit();
  initImageUpload();
});

function cacheTradeInFormElements() {
  brandSelect = document.getElementById('brand');
  modelInput = document.getElementById('model');
  modelOptionsList = document.getElementById('model-options');
  modelHelperText = document.getElementById('model-helper');

  disableModelInput('Select a brand to see suggested models or type your device model.');
}

async function loadBrandOptions() {
  if (!brandSelect || typeof api === 'undefined') {
    return;
  }

  const previousValue = brandSelect.value;
  brandSelect.disabled = true;
  setBrandSelectMessage('Loading brands...');

  try {
    const result = await api.getTradeinBrands();
    if (result && result.success === false) {
      throw new Error(result.error || 'Failed to load brands');
    }

    const brands = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : [];

    if (!brands.length) {
      setBrandSelectMessage('No brands available yet');
      showToast('No trade-in brands available right now.', 'error');
      return;
    }

    brandSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select brand';
    brandSelect.appendChild(placeholder);

    brands.forEach(brand => {
      if (!brand?.name) {
        return;
      }
      const option = document.createElement('option');
      option.value = brand.name;
      option.textContent = brand.name;
      if (brand.id !== undefined) {
        option.dataset.brandId = brand.id;
      }
      brandSelect.appendChild(option);
    });

    brandSelect.disabled = false;
    brandSelect.removeEventListener('change', handleBrandChange);
    brandSelect.addEventListener('change', handleBrandChange);

    const hasPreviousValue = previousValue && brands.some(brand => brand.name === previousValue);
    if (hasPreviousValue) {
      brandSelect.value = previousValue;
      populateModelSuggestions(previousValue);
    } else {
      brandSelect.value = '';
      disableModelInput('Select a brand to see suggested models or type your device model.');
    }
  } catch (error) {
    console.error('Error loading trade-in brands:', error);
    setBrandSelectMessage('Unable to load brands');
    showToast('Unable to load trade-in brands. Please try again later.', 'error');
  }
}

function setBrandSelectMessage(message) {
  if (!brandSelect) {
    return;
  }
  brandSelect.innerHTML = '';
  const option = document.createElement('option');
  option.value = '';
  option.textContent = message;
  brandSelect.appendChild(option);
  brandSelect.disabled = true;
}

function handleBrandChange() {
  const brandName = brandSelect?.value || '';
  if (!brandName) {
    disableModelInput('Select a brand to see suggested models or type your device model.');
    return;
  }
  populateModelSuggestions(brandName);
}

function disableModelInput(message) {
  if (modelInput) {
    modelInput.value = '';
    modelInput.disabled = true;
  }
  if (modelOptionsList) {
    modelOptionsList.innerHTML = '';
  }
  if (message) {
    setModelHelperText(message);
  }
}

function setModelHelperText(message) {
  if (modelHelperText) {
    modelHelperText.textContent = message;
  }
}

async function populateModelSuggestions(brandName) {
  if (!modelInput) {
    return;
  }

  const currentToken = ++modelRequestToken;
  modelInput.value = '';
  modelInput.disabled = true;
  setModelHelperText(`Loading ${brandName} models...`);

  try {
    const models = await fetchBrandModels(brandName);
    if (currentToken !== modelRequestToken) {
      return;
    }
    renderModelSuggestions(models, brandName);
  } catch (error) {
    console.error(`Error loading models for ${brandName}:`, error);
    if (currentToken !== modelRequestToken) {
      return;
    }
    renderModelSuggestions([], brandName);
    showToast(`Unable to load ${brandName} models. Please type your model manually.`, 'error');
  }
}

function fetchBrandModels(brandName) {
  if (brandModelCache.has(brandName)) {
    return Promise.resolve(brandModelCache.get(brandName));
  }
  if (brandModelPromises.has(brandName)) {
    return brandModelPromises.get(brandName);
  }

  const request = api.getProducts({ brand: brandName })
    .then(products => {
      const models = extractUniqueModels(products);
      brandModelCache.set(brandName, models);
      brandModelPromises.delete(brandName);
      return models;
    })
    .catch(error => {
      brandModelPromises.delete(brandName);
      throw error;
    });

  brandModelPromises.set(brandName, request);
  return request;
}

function extractUniqueModels(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  const seen = new Set();
  const models = [];

  products.forEach(product => {
    const candidate = (product?.model || product?.name || '').toString().trim();
    if (!candidate) {
      return;
    }
    const key = candidate.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    models.push(candidate);
  });

  return models.sort((a, b) => a.localeCompare(b));
}

function renderModelSuggestions(models, brandName) {
  if (modelOptionsList) {
    modelOptionsList.innerHTML = '';
    models.forEach(modelName => {
      const option = document.createElement('option');
      option.value = modelName;
      modelOptionsList.appendChild(option);
    });
  }

  if (modelInput) {
    modelInput.disabled = false;
    modelInput.focus();
  }

  if (models.length && brandName) {
    setModelHelperText(`Select a ${brandName} model or type your own.`);
  } else if (brandName) {
    setModelHelperText(`No catalog models for ${brandName} yet. Please type your device model.`);
  } else {
    setModelHelperText('Enter your device model.');
  }
}

// Handle form submission
function initFormSubmit() {
  const form = document.getElementById('trade-in-form');
  const estimateBtn = document.getElementById('estimate-btn');

  if (!form || !estimateBtn) {
    return;
  }
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const brandValue = (formData.get('brand') || '').trim();
    const modelValue = (formData.get('model') || '').trim();
    const storageValue = (formData.get('storage') || '').trim();
    const conditionValue = (formData.get('condition') || '').trim();
    const notesValue = (formData.get('notes') || '').trim();
    const selectedBrandOption = brandSelect?.selectedOptions?.[0] || null;
    const brandIdValue = selectedBrandOption?.dataset?.brandId;
    
    const deviceData = {
      brand: brandValue,
      brandId: brandIdValue ? Number(brandIdValue) : null,
      model: modelValue,
      storage: storageValue,
      condition: conditionValue,
      notes: notesValue
    };
    
    // Validate
    if (!deviceData.brand || !deviceData.model || !deviceData.storage || !deviceData.condition) {
      alert('Please fill in all required fields');
      return;
    }

    const conditionCode = normalizeCondition(deviceData.condition);
    lastFormValues = {
      ...deviceData,
      conditionCode
    };
    
    // Show loading
    estimateBtn.disabled = true;
    estimateBtn.textContent = 'Calculating...';
    
    try {
      // Get estimate from API
      const response = await api.getTradeInEstimate({
        brand: deviceData.brand,
        model: deviceData.model,
        storage: deviceData.storage,
        condition: conditionCode,
        notes: deviceData.notes
      });
      
      if (response.success) {
        showEstimateResult(response.data);
      } else {
        alert(response.error || 'Failed to get estimate. Please try again.');
      }
    } catch (error) {
      console.error('Error getting estimate:', error);
      alert('Failed to get estimate. Please try again.');
    } finally {
      estimateBtn.disabled = false;
      estimateBtn.textContent = 'Get Instant Estimate';
    }
  });
}

// Show estimate result
function showEstimateResult(data) {
  const resultDiv = document.getElementById('estimate-result');
  const amountDiv = document.getElementById('estimate-amount');
  const form = document.getElementById('trade-in-form');

  const estimatedValue = Number(data?.estimated_price) || 0;
  amountDiv.textContent = formatMoney(estimatedValue);
  
  // Show result section
  form.style.display = 'none';
  resultDiv.classList.remove('hidden');
  
  // Store estimate data for later use
  sessionStorage.setItem('currentEstimate', JSON.stringify(data));
  
  // Handle accept offer
  const acceptBtn = document.getElementById('accept-offer-btn');
  acceptBtn.onclick = function() {
    showDepositPayment(data);
  };
}

// Show deposit payment modal
function showDepositPayment(estimateData) {
  const depositAmount = TRADEIN_DEPOSIT_AMOUNT;
  const estimatedValue = Number(estimateData?.estimated_price) || 0;
  const serviceFee = Number(estimateData?.service_fee) || 0;
  const rawNetAmount = Number(estimateData?.net_amount);
  const computedNet = Number.isFinite(rawNetAmount) ? rawNetAmount : estimatedValue - serviceFee;
  const netAmount = Number.isFinite(computedNet) ? computedNet : 0;

  const estimatedLabel = formatMoney(estimatedValue);
  const feeLabel = formatMoney(serviceFee);
  const netLabel = formatMoney(netAmount);
  const depositLabel = formatMoney(depositAmount);
  
  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; padding: 2rem;">
      <h2 style="margin-bottom: 1rem;">Confirm Trade-In</h2>
      
      <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Estimated Value:</span>
          <strong>${estimatedLabel}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Service Fee:</span>
          <span>${feeLabel}</span>
        </div>
        <div style="border-top: 1px solid #ddd; margin-top: 0.5rem; padding-top: 0.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <strong>You will receive:</strong>
            <strong>${netLabel}</strong>
          </div>
        </div>
      </div>
      
      <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #ffd700;">
        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Deposit Required</h3>
        <p style="color: #333; margin-bottom: 1rem;">
          A refundable deposit of <strong>${depositLabel}</strong> is required to schedule the engineer pickup service.
        </p>
        <ul style="color: #555; font-size: 0.9rem; padding-left: 1.5rem; margin: 0;">
          <li>Deposit will be refunded after successful device inspection</li>
          <li>Free cancellation before engineer arrives</li>
          <li>Engineer will arrive within 2-3 business days</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Pickup Address</label>
        <input 
          type="text" 
          id="pickup-address" 
          value="${DEFAULT_PICKUP_ADDRESS}" 
          readonly
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;"
        />
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary btn-full" onclick="this.closest('.modal-overlay').remove()">
          Cancel
        </button>
        <button class="btn btn-primary btn-full" id="confirm-deposit-btn">
          Pay ${depositLabel}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle deposit payment
  document.getElementById('confirm-deposit-btn').onclick = async function() {
    await processDepositPayment(estimateData, depositAmount, modal);
  };
}

// Process deposit payment
async function processDepositPayment(estimateData, depositAmount, modal) {
  const btn = document.getElementById('confirm-deposit-btn');
  const depositLabel = formatMoney(depositAmount);
  btn.disabled = true;
  btn.textContent = 'Processing...';

  if (!authStore.isAuthenticated()) {
    btn.disabled = false;
    btn.textContent = `Pay ${depositLabel}`;
    window.location.href = './login.html?return=' + encodeURIComponent(window.location.href);
    return;
  }

  if (!lastFormValues) {
    showToast('Please submit the device details again.', 'error');
    btn.disabled = false;
    btn.textContent = `Pay ${depositLabel}`;
    return;
  }
  
  try {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const formData = buildPickupRequestFormData(depositAmount);
    const pickupResponse = await api.createPickupRequest(formData);
    
    if (pickupResponse.success) {
      modal.remove();
      showEngineerNotification(pickupResponse.data, depositAmount);
    } else {
      alert(pickupResponse.error || 'Payment failed. Please try again.');
      btn.disabled = false;
      btn.textContent = `Pay ${depositLabel}`;
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('Payment failed. Please try again.');
    btn.disabled = false;
    btn.textContent = `Pay ${depositLabel}`;
  }
}

// Show engineer notification
function showEngineerNotification(pickupData, depositAmount) {
  const notification = document.createElement('div');
  notification.className = 'modal-overlay';
  const pickupAddress = extractPickupAddress(pickupData?.address_json);
  const pickupId = pickupData?.id ? `PK-${pickupData.id}` : 'Pending ID';
  const depositLabel = formatMoney(depositAmount);
  notification.innerHTML = `
    <div class="modal-content" style="max-width: 500px; padding: 2rem; text-align: center;">
      <div style="width: 80px; height: 80px; background: #4caf50; border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h2 style="margin-bottom: 1rem;">Payment Successful!</h2>
      
      <p style="color: #555; margin-bottom: 2rem;">
        Your deposit of ${depositLabel} has been received. An engineer has been assigned to pick up your device.
      </p>
      
      <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; text-align: left; margin-bottom: 1.5rem;">
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Pickup ID</div>
          <strong>${pickupId}</strong>
        </div>
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Engineer Assigned</div>
          <strong>Scheduling now</strong>
        </div>
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Estimated Arrival</div>
          <strong>2-3 business days</strong>
        </div>
        <div>
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Pickup Location</div>
          <strong>${pickupAddress}</strong>
        </div>
      </div>
      
      <p style="color: #555; font-size: 0.9rem; margin-bottom: 2rem;">
        You will receive a notification when the engineer is on the way. Please have your device ready for inspection.
      </p>
      
      <button class="btn btn-primary btn-full" onclick="window.location.href='./account.html'">
        View My Trade-Ins
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
}

function normalizeCondition(value) {
  if (!value) return 'B';
  const key = value.toLowerCase();
  return CONDITION_MAP[key] || 'B';
}

function buildPickupRequestFormData(depositAmount) {
  const formData = new FormData();
  const addressValue = document.getElementById('pickup-address')?.value || DEFAULT_PICKUP_ADDRESS;
  const additionalInfo = [];

  if (lastFormValues.notes) {
    additionalInfo.push(lastFormValues.notes);
  }
  additionalInfo.push(`Deposit paid: ${formatMoney(depositAmount)}`);

  if (lastFormValues.brandId) {
    formData.append('brand_id', lastFormValues.brandId);
  }
  if (lastFormValues.brand) {
    formData.append('brand_name', lastFormValues.brand);
  }
  formData.append('model_text', lastFormValues.model);
  if (lastFormValues.storage) {
    formData.append('storage', lastFormValues.storage);
  }
  formData.append('condition', lastFormValues.conditionCode || 'B');
  formData.append('additional_info', additionalInfo.join('\n'));
  formData.append('address_json', JSON.stringify({ label: 'Pickup address', value: addressValue }));

  const photoInput = document.getElementById('photos');
  if (photoInput && photoInput.files && photoInput.files.length) {
    Array.from(photoInput.files).forEach(file => {
      formData.append('photos', file);
    });
  }

  return formData;
}

function extractPickupAddress(addressJson) {
  if (!addressJson) {
    return DEFAULT_PICKUP_ADDRESS;
  }

  if (typeof addressJson === 'string') {
    try {
      const parsed = JSON.parse(addressJson);
      return parsed.value || parsed.street || parsed.address || addressJson;
    } catch {
      return addressJson;
    }
  }

  if (typeof addressJson === 'object') {
    return addressJson.value || addressJson.street || addressJson.address || DEFAULT_PICKUP_ADDRESS;
  }

  return DEFAULT_PICKUP_ADDRESS;
}

// Handle image upload
function initImageUpload() {
  const fileInput = document.getElementById('photos');
  const uploadArea = document.getElementById('image-upload-area');
  const previewArea = document.getElementById('image-preview');
  
  if (!fileInput || !uploadArea) return;
  
  uploadArea.onclick = function() {
    fileInput.click();
  };
  
  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }
    
    previewArea.innerHTML = '';
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(file.name + ' is too large. Maximum size is 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginRight = '10px';
        previewArea.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}
