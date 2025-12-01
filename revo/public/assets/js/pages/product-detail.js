// Product detail page functionality
// gadgets showing off here, no fingerprints pls

let currentProduct = null;
let galleryImages = [];
let activeGalleryIndex = 0;
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

const PURCHASE_CHANNEL_PATHS = [
  ['purchaseChannel'],
  ['purchase_channel'],
  ['purchase', 'channel'],
  ['channel'],
  ['origin'],
  ['originCountry'],
  ['origin_country'],
  ['market'],
  ['region'],
  ['source'],
  ['sourcing', 'channel']
];

document.addEventListener('DOMContentLoaded', async () => {
  const params = getUrlParams();
  const productId = params.id;

  if (!productId) {
    showError();
    return;
  }

  setupShippingSelector();
  setupGalleryTools();
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

    setupGallery(product);

    // Populate product data
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
    updatePurchaseChannel(product);
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

// Build the hero gallery from any available media fields and make it clickable when multiple images exist
function setupGallery(product = {}) {
  const stage = document.querySelector('.pd-gallery-stage');
  const productImage = document.getElementById('product-image');
  const placeholder = document.querySelector('.pd-placeholder');

  galleryImages = normalizeProductImages(product);
  activeGalleryIndex = 0;

  const hasImages = galleryImages.length > 0;
  const total = Math.max(galleryImages.length || 0, 1);

  if (productImage) {
    productImage.onload = () => {
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      productImage.style.display = 'block';
    };

    productImage.onerror = () => {
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
      productImage.style.display = 'none';
    };
  }

  if (hasImages) {
    setGalleryImage(activeGalleryIndex);
  } else {
    updateGalleryCounter(1, total);
  }

  if (stage) {
    stage.classList.toggle('is-interactive', galleryImages.length > 1);
    stage.onclick = galleryImages.length > 1
      ? () => {
          const nextIndex = (activeGalleryIndex + 1) % galleryImages.length;
          setGalleryImage(nextIndex);
        }
      : null;
  }
}

// Wire gallery chips to actions: scroll to specs/details or open a zoomed image
function setupGalleryTools() {
  const tools = document.querySelectorAll('.pd-gallery-tool[data-action]');
  if (!tools.length) {
    return;
  }

  const actions = {
    'quick-specs': () => scrollToSectionById('quick-specs-section'),
    zoom: () => openCurrentImage(),
    details: () => scrollToSectionById('product-description', 'report-section')
  };

  tools.forEach(tool => {
    const action = tool.dataset.action;
    const handler = actions[action];
    if (!handler) {
      return;
    }

    tool.addEventListener('click', handler);
    tool.addEventListener('keypress', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handler();
      }
    });
  });
}

function setGalleryImage(index = 0) {
  if (!galleryImages.length) {
    updateGalleryCounter(1, 1);
    return;
  }

  const productImage = document.getElementById('product-image');
  const safeIndex = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
  activeGalleryIndex = safeIndex;

  if (productImage) {
    productImage.src = galleryImages[safeIndex];
    productImage.alt = formatOptionValue(currentProduct?.name) || 'Product photo';
  }

  updateGalleryCounter(safeIndex + 1, Math.max(galleryImages.length, 1));
}

function updateGalleryCounter(current = 1, total = 1) {
  const counter = document.getElementById('gallery-counter');
  if (!counter) {
    return;
  }

  const safeTotal = Math.max(1, Number(total) || 0);
  const safeCurrent = Math.min(Math.max(1, Number(current) || 1), safeTotal);

  counter.textContent = `${safeCurrent}/${safeTotal}`;
}

function scrollToSectionById(id, fallbackId = null) {
  const target = document.getElementById(id) || (fallbackId ? document.getElementById(fallbackId) : null);
  if (!target) {
    return;
  }
  const highlightTarget = target.classList.contains('pd-card') ? target : target.closest('.pd-card') || target;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  highlightElement(highlightTarget);
}

function highlightElement(element) {
  if (!element) {
    return;
  }
  element.classList.add('pd-section-highlight');
  setTimeout(() => element.classList.remove('pd-section-highlight'), 1200);
}

function openCurrentImage() {
  const imageEl = document.getElementById('product-image');
  const src = formatOptionValue(galleryImages[activeGalleryIndex]) || imageEl?.src;

  if (!src) {
    return;
  }

  const popup = window.open(src, '_blank', 'noopener');
  if (!popup && typeof showToast === 'function') {
    showToast('Opening full-size image blocked. Please allow pop-ups or long-press to open.', 'info');
  }
}

// Gather possible image URLs from different backend shapes so the gallery counter reflects reality
function normalizeProductImages(product = {}) {
  const candidates = [
    product.images,
    product.photos,
    product.gallery,
    getValueByPath(product, ['media', 'images']),
    getValueByPath(product, ['media', 'photos']),
    getValueByPath(product, ['assets', 'images']),
    getValueByPath(product, ['assets', 'photos']),
    getValueByPath(product, ['details', 'images']),
    getValueByPath(product, ['details', 'photos']),
    product.image
  ];

  const unique = [];
  candidates.forEach(candidate => {
    extractImageUrls(candidate).forEach(url => {
      const normalized = formatOptionValue(url);
      if (normalized && !unique.includes(normalized)) {
        unique.push(normalized);
      }
    });
  });

  return unique;
}

// Accept strings, arrays, or objects with url-ish keys and normalize them into a flat list of URLs
function extractImageUrls(value) {
  if (!value) {
    return [];
  }
  if (typeof value === 'string') {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => extractImageUrls(item));
  }
  if (typeof value === 'object') {
    const possibleKeys = ['url', 'src', 'image', 'href', 'path'];
    const nested = possibleKeys
      .map(key => value[key])
      .filter(Boolean);

    if (nested.length) {
      return nested.flatMap(item => extractImageUrls(item));
    }
  }
  return [];
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

function updatePurchaseChannel(product = {}) {
  const purchaseChannel = derivePurchaseChannel(product);
  setTextContentById('product-purchase-channel', purchaseChannel, 'Canada');
}

// Prefer explicit purchase channel; otherwise infer Canada based on location/availability
function derivePurchaseChannel(product = {}) {
  const directValue = getOptionValue(product, PURCHASE_CHANNEL_PATHS);
  if (directValue) {
    return directValue;
  }

  const locationValue = detectCanadianOrigin(product.location);
  if (locationValue) {
    return locationValue;
  }

  const availabilityValue = detectCanadianOrigin(product.cityAvailability);
  if (availabilityValue) {
    return availabilityValue;
  }

  const countryValue = formatOptionValue(product.country || product.countryOfOrigin);
  if (countryValue) {
    return countryValue;
  }

  return 'Canada';
}

// Lightweight matcher that treats any Canadian city/marker as a Canada origin
function detectCanadianOrigin(value) {
  const normalized = Array.isArray(value)
    ? value.map(entry => formatOptionValue(entry)).filter(Boolean).join(' ')
    : formatOptionValue(value);

  if (!normalized) {
    return null;
  }

  const markers = ['canada', 'ottawa', 'vancouver', 'edmonton', 'toronto', 'montreal', 'calgary', 'quebec'];
  const text = normalized.toLowerCase();
  return markers.some(marker => text.includes(marker)) ? 'Canada' : null;
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
