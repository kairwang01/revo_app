// Product detail page functionality
// gadgets showing off here, no fingerprints pls

let currentProduct = null;
const DEFAULT_SHIPPING_MODE = 'regular';
const SHIPPING_STORAGE_KEY = 'revo-shipping-mode';
const POPULAR_PRODUCTS_LIMIT = 6;

const SHIPPING_OPTIONS = {
  regular: {
    carrier: 'Canada Post',
    badge: 'Regular',
    line: 'Free shipping via Canada Post. Pay before 18:00, ship today.',
    subtext: 'Tracked delivery in 2-4 business days with doorstep confirmation.'
  },
  fast: {
    carrier: 'FedEx Express',
    badge: 'Priority',
    line: 'Priority shipping via FedEx Express. Order by 18:00 for same-day dispatch.',
    subtext: 'Expedited delivery in 1-2 business days with signature required.'
  }
};

const OPTION_PATHS = {
  color: [
    ['options', 'color'],
    ['options', 'colour'],
    ['options', 'colors'],
    ['options', 'availableColors'],
    ['attributes', 'color'],
    ['attributes', 'colour'],
    ['details', 'color'],
    ['details', 'colour'],
    ['color'],
    ['colour'],
    ['colors'],
    ['availableColors']
  ],
  storage: [
    ['options', 'storage'],
    ['options', 'storageSize'],
    ['options', 'memory'],
    ['attributes', 'storage'],
    ['attributes', 'storageSize'],
    ['specs', 'storage'],
    ['specs', 'memory'],
    ['storage'],
    ['storageSize'],
    ['memory'],
    ['capacity']
  ],
  variant: [
    ['options', 'variant'],
    ['options', 'configuration'],
    ['options', 'model'],
    ['attributes', 'variant'],
    ['attributes', 'configuration'],
    ['details', 'variant'],
    ['details', 'configuration'],
    ['variant'],
    ['configuration'],
    ['model']
  ],
  grade: [
    ['options', 'grade'],
    ['options', 'condition'],
    ['attributes', 'grade'],
    ['attributes', 'condition'],
    ['details', 'grade'],
    ['conditionGrade'],
    ['grade'],
    ['condition']
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  const params = getUrlParams();
  const productId = params.id;

  if (!productId) {
    showError();
    return;
  }

  setupShippingSelector();
  await loadProduct(productId);
  setupAddToCart(productId);
});

async function loadProduct(productId) {
  const loading = document.getElementById('loading');
  const content = document.getElementById('product-content');
  const errorState = document.getElementById('error-state');

  try {
    const product = await api.getProduct(productId);

    if (!product) {
      showError();
      return;
    }

    currentProduct = product;

    // Hide loading, show content
    toggleElement(loading, false);
    toggleElement(content, true);

    // Populate product data
    const productImage = document.getElementById('product-image');
    const placeholder = document.querySelector('.pd-placeholder');
    
    productImage.src = product.image;
    productImage.alt = product.name;
    
    //hide placeholder when image loads
    productImage.onload = function() {
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      productImage.style.display = 'block';
    };
    
    // Show placeholder if image fails to load
    productImage.onerror = function() {
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
      productImage.style.display = 'none';
    };
    setTextContentById('product-brand', product.brand);
    setTextContentById('product-condition', product.condition);
    setTextContentById('product-name', product.name);
    setTextContentById('product-name-report', product.name);
    const ratingValue = Number(product.rating);
    setTextContentById('product-rating', Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : null);
    const reviewsValue = Number(product.reviews);
    setTextContentById('product-reviews', Number.isFinite(reviewsValue) ? reviewsValue : null);
    setTextContentById('product-location', product.location);
    updateProductBadge(product);
    renderProductFlags(product);
    const priceValue = Number(product.price) || 0;
    const originalValue = Number(product.originalPrice);

    document.getElementById('product-price').textContent = formatMoney(priceValue);
    const formattedOriginal = Number.isFinite(originalValue)
      ? formatMoney(originalValue)
      : formatMoney(priceValue);
    document.getElementById('product-original-price').textContent = formattedOriginal;

    const retailPriceEl = document.getElementById('product-retail-price');
    if (retailPriceEl) {
      retailPriceEl.textContent = formattedOriginal;
    }

    const newDevicePriceEl = document.getElementById('product-new-price');
    if (newDevicePriceEl) {
      newDevicePriceEl.textContent = formattedOriginal;
    }

    const discount = computeDiscountPercent(product);
    document.getElementById('product-discount').textContent = `${discount}% off`;

    // Populate highlights
    const highlightsList = document.getElementById('product-highlights');
    if (Array.isArray(product.highlights) && product.highlights.length > 0) {
      highlightsList.innerHTML = product.highlights.map(h => `<li>${h}</li>`).join('');
    } else if (highlightsList) {
      highlightsList.innerHTML = '<li>N/A</li>';
    }

    // Populate description if available
    setTextContentById('product-description', product.description);

    populateProductOptions(product);
    
    // Show bottom bar
    toggleElement(document.getElementById('bottom-bar'), true);
    loadPopularProducts(product.id);
  } catch (error) {
    console.error('Error loading product:', error);
    showError();
  }
}

function computeDiscountPercent(product) {
  const price = Number(product.price);
  const original = Number(product.originalPrice);

  if (!Number.isFinite(price) || !Number.isFinite(original) || original <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((1 - price / original) * 100));
}

function showError() {
  toggleElement(document.getElementById('loading'), false);
  toggleElement(document.getElementById('product-content'), false);
  toggleElement(document.getElementById('error-state'), true);
}

function setupAddToCart(productId) {
  const addBtn = document.getElementById('add-to-cart-btn');
  const buyBtn = document.getElementById('buy-now-btn');

  if (!addBtn || !buyBtn) {
    return;
  }

  addBtn.addEventListener('click', async () => {
    const product = await ensureProductLoaded(productId);
    if (product) {
      await addProductToCart(product, 1);
      showToast('Added to cart!', 'success');
    }
  });

  buyBtn.addEventListener('click', async () => {
    const product = await ensureProductLoaded(productId);
    if (product) {
      await addProductToCart(product, 1);
      window.location.href = './checkout.html';
    }
  });
}

async function ensureProductLoaded(productId) {
  if (currentProduct && Number(currentProduct.id) === Number(productId)) {
    return currentProduct;
  }

  currentProduct = await api.getProduct(productId);
  return currentProduct;
}

async function addProductToCart(product, quantity = 1) {
  cartStore.add(product, quantity);

  if (!authStore.isAuthenticated()) {
    return;
  }

  try {
    await api.addToCart(product.id, quantity);
  } catch (error) {
    console.warn('Failed to sync cart with backend:', error);
  }
}

function setupShippingSelector() {
  const selector = document.getElementById('shipping-selector');
  if (!selector) {
    return;
  }

  const initialMode = getSavedShippingMode();
  setActiveShippingOption(selector, initialMode);
  updateShippingDetails(initialMode);

  selector.addEventListener('click', event => {
    const option = event.target.closest('[data-mode]');
    if (!option) {
      return;
    }
    const mode = option.getAttribute('data-mode') || DEFAULT_SHIPPING_MODE;
    setActiveShippingOption(selector, mode);
    updateShippingDetails(mode);
    saveShippingMode(mode);
  });
}

function setActiveShippingOption(selector, mode) {
  selector.querySelectorAll('[data-mode]').forEach(button => {
    button.classList.toggle('active', button.getAttribute('data-mode') === mode);
  });
}

function updateShippingDetails(mode = DEFAULT_SHIPPING_MODE) {
  const details = SHIPPING_OPTIONS[mode] || SHIPPING_OPTIONS[DEFAULT_SHIPPING_MODE];
  const lineEl = document.getElementById('shipping-line');
  const subtextEl = document.getElementById('shipping-subtext');
  const carrierEl = document.getElementById('shipping-carrier');

  if (lineEl) lineEl.textContent = details.line;
  if (subtextEl) subtextEl.textContent = details.subtext;
  if (carrierEl) carrierEl.textContent = `${details.carrier} · ${details.badge}`;
}

function saveShippingMode(mode) {
  try {
    localStorage.setItem(SHIPPING_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Unable to persist shipping mode', error);
  }
}

function getSavedShippingMode() {
  try {
    return localStorage.getItem(SHIPPING_STORAGE_KEY) || DEFAULT_SHIPPING_MODE;
  } catch (error) {
    return DEFAULT_SHIPPING_MODE;
  }
}

async function loadPopularProducts(activeProductId) {
  const container = document.getElementById('popular-products');
  if (!container || typeof api?.getProducts !== 'function') {
    return;
  }

  container.innerHTML = `<div class="pd-carousel-card pd-carousel-placeholder">Loading popular devices...</div>`;

  try {
    const list = await api.getProducts();
    const productsArray = Array.isArray(list) ? list : Array.isArray(list?.data) ? list.data : [];
    const filtered = productsArray.filter(item => Number(item?.id) !== Number(activeProductId));
    const popular = filtered.slice(0, POPULAR_PRODUCTS_LIMIT);

    if (!popular.length) {
      container.innerHTML = `<div class="pd-carousel-card pd-carousel-empty">Popular picks will appear here soon.</div>`;
      return;
    }

    container.innerHTML = popular.map(renderPopularCard).join('');
  } catch (error) {
    console.error('Error loading popular products:', error);
    container.innerHTML = `<div class="pd-carousel-card pd-carousel-empty">Unable to load popular devices.</div>`;
  }
}

function renderPopularCard(product) {
  const name = product?.name || 'Revo Device';
  const priceValue = Number(product?.price) || 0;
  const priceLabel = formatMoney(priceValue);
  const originalValue = Number(product?.originalPrice);
  const originalLabel = Number.isFinite(originalValue) ? formatMoney(originalValue) : '';
  const discount = computeDiscountPercent(product);
  const id = product?.id ?? '';

  return `
    <a class="pd-carousel-card" href="./product-detail.html?id=${encodeURIComponent(id)}">
      <div style="font-weight:600;">${name}</div>
      <div class="pd-section-subtitle" style="margin:var(--space-2) 0;">Save ${discount}%</div>
      <div style="font-size:1.25rem; font-weight:700;">${priceLabel}</div>
      ${originalLabel ? `<div class="pd-section-subtitle" style="margin-top:var(--space-1);">Retail ${originalLabel}</div>` : ''}
    </a>
  `;
}

function populateProductOptions(product = {}) {
  setOptionValue('product-option-color', getOptionValue(product, OPTION_PATHS.color));
  setOptionValue('product-option-storage', getOptionValue(product, OPTION_PATHS.storage));
  setOptionValue('product-option-variant', getOptionValue(product, OPTION_PATHS.variant));
  const gradeValue = getOptionValue(product, OPTION_PATHS.grade) || formatOptionValue(product.condition);
  setOptionValue('product-option-grade', gradeValue);
}

function setOptionValue(id, value) {
  setTextContentById(id, value);
}

function getOptionValue(product, pathList = []) {
  for (const path of pathList) {
    const rawValue = getValueByPath(product, path);
    const formatted = formatOptionValue(rawValue);
    if (formatted) {
      return formatted;
    }
  }
  return null;
}

function getValueByPath(obj, path) {
  if (!obj) {
    return undefined;
  }
  const segments = Array.isArray(path) ? path : String(path).split('.');
  let current = obj;
  for (const segment of segments) {
    if (current == null) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function formatOptionValue(value) {
  if (Array.isArray(value)) {
    const normalized = value
      .map(item => formatOptionValue(item))
      .filter(Boolean);
    return normalized.length ? normalized.join(', ') : null;
  }
  if (value && typeof value === 'object') {
    if (Object.prototype.hasOwnProperty.call(value, 'label')) {
      return formatOptionValue(value.label);
    }
    if (Object.prototype.hasOwnProperty.call(value, 'value')) {
      return formatOptionValue(value.value);
    }
    return null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length ? text : null;
}

function setTextContentById(id, value, fallback = 'N/A') {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }
  const text = formatOptionValue(value);
  node.textContent = text || fallback;
}

function updateProductBadge(product = {}) {
  const badge = document.getElementById('product-badge');
  const badgeText = document.getElementById('product-badge-text');
  if (!badge || !badgeText) {
    return;
  }

  const parts = [];
  const descriptor = formatOptionValue(product.model)
    || formatOptionValue(product.brand)
    || formatOptionValue(product.name);
  if (descriptor) {
    parts.push(descriptor);
  }

  const condition = formatOptionValue(product.condition);
  if (condition) {
    parts.push(`${condition} condition`);
  }

  const uniqueParts = [];
  parts.forEach(part => {
    const value = part?.trim();
    if (value && !uniqueParts.includes(value)) {
      uniqueParts.push(value);
    }
  });

  if (!uniqueParts.length) {
    badge.classList.add('hidden');
    badgeText.textContent = '';
    return;
  }

  badge.classList.remove('hidden');
  badgeText.textContent = uniqueParts.join(' • ');
}

function renderProductFlags(product = {}) {
  const container = document.getElementById('product-flags');
  if (!container) {
    return;
  }

  const flags = [];
  const locationLabel = formatOptionValue(product.location);
  if (locationLabel) {
    flags.push(`Ships from ${locationLabel}`);
  }

  const cityAvailability = Array.isArray(product.cityAvailability)
    ? product.cityAvailability.map(city => formatOptionValue(city)).filter(Boolean)
    : [];

  if (cityAvailability.length) {
    flags.push(`Available in ${cityAvailability.join(', ')}`);
  }

  const condition = formatOptionValue(product.condition);
  if (condition) {
    flags.push(`${condition} grade`);
  }

  const uniqueFlags = [];
  flags.forEach(flag => {
    const value = flag?.trim();
    if (value && !uniqueFlags.includes(value)) {
      uniqueFlags.push(value);
    }
  });

  if (!uniqueFlags.length) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  const fragment = document.createDocumentFragment();
  uniqueFlags.slice(0, 3).forEach(flag => {
    const chip = document.createElement('span');
    chip.className = 'pd-chip';
    chip.textContent = flag;
    fragment.appendChild(chip);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
  container.classList.remove('hidden');
}
