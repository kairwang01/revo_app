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

const SPEC_PATHS = {
  sim: [
    ['specs', 'sim'],
    ['specs', 'simType'],
    ['specs', 'sim_type'],
    ['simType'],
    ['sim'],
    ['sim_type'],
    ['network', 'sim'],
    ['connectivity', 'sim']
  ],
  displaySize: [
    ['specs', 'displaySize'],
    ['specs', 'screenSize'],
    ['displaySize'],
    ['screenSize'],
    ['display', 'size'],
    ['screen', 'size']
  ],
  resolution: [
    ['specs', 'resolution'],
    ['specs', 'displayResolution'],
    ['resolution'],
    ['displayResolution'],
    ['display', 'resolution'],
    ['screen', 'resolution']
  ],
  material: [
    ['specs', 'displayMaterial'],
    ['specs', 'screenMaterial'],
    ['displayMaterial'],
    ['screenMaterial'],
    ['display', 'material'],
    ['screen', 'material'],
    ['glass']
  ],
  camera: [
    ['specs', 'rearCamera'],
    ['specs', 'camera'],
    ['rearCamera'],
    ['camera'],
    ['cameraRear'],
    ['camera_main']
  ],
  battery: [
    ['specs', 'battery'],
    ['specs', 'batteryCapacity'],
    ['batteryCapacity'],
    ['battery', 'capacity'],
    ['battery']
  ],
  cpu: [
    ['specs', 'cpu'],
    ['specs', 'processor'],
    ['cpu'],
    ['processor'],
    ['chipset'],
    ['soc']
  ],
  refreshRate: [
    ['specs', 'refreshRate'],
    ['refreshRate'],
    ['display', 'refreshRate'],
    ['screen', 'refreshRate']
  ],
  release: [
    ['specs', 'releaseTime'],
    ['specs', 'release'],
    ['releaseTime'],
    ['releaseDate'],
    ['release'],
    ['launched'],
    ['year']
  ]
};

const SPEC_FALLBACK = 'See inspection report';

// Local spec catalog to backfill missing fields when the API lacks details
const LOCAL_SPEC_CATALOG = [
  {
    matchers: ['apple iphone 17 pro', 'iphone 17 pro'],
    specs: {
      sim: 'Dual eSIM / Nano + eSIM',
      displaySize: '6.3" LTPO OLED',
      resolution: '2796 × 1290',
      material: 'Ceramic Shield front, titanium frame',
      camera: '48MP main + 12MP ultra-wide + 12MP 5x tele',
      battery: '3650mAh',
      cpu: 'Apple A20 Pro',
      refreshRate: '1–120Hz ProMotion',
      release: '2026'
    }
  },
  {
    matchers: ['apple iphone 15 pro', 'iphone 15 pro'],
    specs: {
      sim: 'Dual eSIM / Nano + eSIM',
      displaySize: '6.1" LTPO OLED',
      resolution: '2556 × 1179',
      material: 'Ceramic Shield front, titanium frame',
      camera: '48MP main + 12MP ultra-wide + 12MP 5x tele',
      battery: '3274mAh',
      cpu: 'Apple A17 Pro',
      refreshRate: '1–120Hz ProMotion',
      release: '2023'
    }
  },
  {
    matchers: ['apple iphone 15', 'iphone 15'],
    specs: {
      sim: 'Dual eSIM / Nano + eSIM',
      displaySize: '6.1" OLED',
      resolution: '2556 × 1179',
      material: 'Ceramic Shield front, aluminum frame',
      camera: '48MP main + 12MP ultra-wide',
      battery: '3349mAh',
      cpu: 'Apple A16 Bionic',
      refreshRate: '60Hz',
      release: '2023'
    }
  },
  {
    matchers: ['apple iphone 14', 'iphone 14'],
    specs: {
      sim: 'Dual eSIM / Nano + eSIM',
      displaySize: '6.1" OLED',
      resolution: '2532 × 1170',
      material: 'Ceramic Shield front, aluminum frame',
      camera: '12MP main + 12MP ultra-wide',
      battery: '3279mAh',
      cpu: 'Apple A15 Bionic',
      refreshRate: '60Hz',
      release: '2022'
    }
  },
  {
    matchers: ['samsung galaxy s24', 'galaxy s24'],
    specs: {
      sim: 'Dual SIM (nano/eSIM)',
      displaySize: '6.2" LTPO AMOLED',
      resolution: '2340 × 1080',
      material: 'Gorilla Glass Victus 2, Armor Aluminum',
      camera: '50MP main + 10MP 3x tele + 12MP ultra-wide',
      battery: '4000mAh',
      cpu: 'Snapdragon 8 Gen 3',
      refreshRate: '1–120Hz',
      release: '2024'
    }
  },
  {
    matchers: ['samsung galaxy s23', 'galaxy s23'],
    specs: {
      sim: 'Dual SIM (nano/eSIM)',
      displaySize: '6.1" AMOLED',
      resolution: '2340 × 1080',
      material: 'Gorilla Glass Victus 2, Armor Aluminum',
      camera: '50MP main + 10MP 3x tele + 12MP ultra-wide',
      battery: '3900mAh',
      cpu: 'Snapdragon 8 Gen 2',
      refreshRate: '48–120Hz',
      release: '2023'
    }
  },
  {
    matchers: ['google pixel 8', 'pixel 8'],
    specs: {
      sim: 'Dual SIM (nano + eSIM)',
      displaySize: '6.2" OLED',
      resolution: '2400 × 1080',
      material: 'Gorilla Glass Victus 2, aluminum frame',
      camera: '50MP main + 12MP ultra-wide',
      battery: '4575mAh',
      cpu: 'Google Tensor G3',
      refreshRate: '60–120Hz',
      release: '2023'
    }
  },
  {
    matchers: ['google pixel 7', 'pixel 7'],
    specs: {
      sim: 'Dual SIM (nano + eSIM)',
      displaySize: '6.3" OLED',
      resolution: '2400 × 1080',
      material: 'Gorilla Glass Victus, aluminum frame',
      camera: '50MP main + 12MP ultra-wide',
      battery: '4355mAh',
      cpu: 'Google Tensor G2',
      refreshRate: '60–90Hz',
      release: '2022'
    }
  }
];

let specCatalog = [...LOCAL_SPEC_CATALOG];
const SPEC_CATALOG_URL = './assets/data/spec-catalog.json';

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
  await ensureSpecCatalogLoaded();
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
    populateProductSpecs(product);
    
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

function populateProductSpecs(product = {}) {
  const localSpecs = getLocalSpecs(product);
  const specMap = [
    { id: 'product-condition', paths: OPTION_PATHS.grade, fallback: 'N/A', defaultValue: product.condition },
    { id: 'product-brand', paths: [['brand']], fallback: 'N/A', defaultValue: product.brand },
    { id: 'product-spec-sim', paths: SPEC_PATHS.sim, fallback: SPEC_FALLBACK, specKey: 'sim' },
    { id: 'product-spec-display-size', paths: SPEC_PATHS.displaySize, fallback: SPEC_FALLBACK, specKey: 'displaySize' },
    { id: 'product-spec-resolution', paths: SPEC_PATHS.resolution, fallback: SPEC_FALLBACK, specKey: 'resolution' },
    { id: 'product-spec-material', paths: SPEC_PATHS.material, fallback: SPEC_FALLBACK, specKey: 'material' },
    { id: 'product-spec-camera', paths: SPEC_PATHS.camera, fallback: SPEC_FALLBACK, specKey: 'camera' },
    { id: 'product-spec-battery', paths: SPEC_PATHS.battery, fallback: SPEC_FALLBACK, specKey: 'battery' },
    { id: 'product-spec-cpu', paths: SPEC_PATHS.cpu, fallback: SPEC_FALLBACK, specKey: 'cpu' },
    { id: 'product-spec-refresh', paths: SPEC_PATHS.refreshRate, fallback: SPEC_FALLBACK, specKey: 'refreshRate' },
    { id: 'product-spec-release', paths: SPEC_PATHS.release, fallback: SPEC_FALLBACK, specKey: 'release' }
  ];

  specMap.forEach(spec => {
    const valueFromProduct = getOptionValue(product, spec.paths) || formatOptionValue(spec.defaultValue);
    const valueFromLocal = spec.specKey ? formatOptionValue(localSpecs?.[spec.specKey]) : null;
    const value = valueFromProduct || valueFromLocal;
    setTextContentById(spec.id, value, spec.fallback);
  });
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

function getLocalSpecs(product = {}) {
  const candidates = [
    formatOptionValue(product.model),
    formatOptionValue(product.name),
    `${formatOptionValue(product.brand)} ${formatOptionValue(product.model)}`.trim()
  ]
    .filter(Boolean)
    .map(value => value.toLowerCase());

  return specCatalog.find(entry =>
    entry.matchers.some(matcher =>
      candidates.some(candidate => candidate.includes(matcher))
    )
  )?.specs || null;
}

async function ensureSpecCatalogLoaded() {
  if (!SPEC_CATALOG_URL || !window.fetch) {
    return;
  }

  try {
    const response = await fetch(SPEC_CATALOG_URL, { cache: 'force-cache' });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const entries = Array.isArray(data) ? data : [];

    entries.forEach(entry => {
      if (!entry || !Array.isArray(entry.matchers) || !entry.matchers.length || !entry.specs) {
        return;
      }

      const normalizedMatchers = entry.matchers
        .map(m => formatOptionValue(m)?.toLowerCase())
        .filter(Boolean);

      if (!normalizedMatchers.length) {
        return;
      }

      specCatalog.push({
        matchers: normalizedMatchers,
        specs: entry.specs
      });
    });
  } catch (error) {
    console.warn('Unable to load spec catalog:', error);
  }
}
