// Orders page functionality

let allOrders = [];
let activeFilter = 'all';

const ordersDom = {
  list: null,
  empty: null,
  tabs: []
};

const LOADER_HTML = '<div class="loader-container"><div class="spinner"></div></div>';

document.addEventListener('DOMContentLoaded', async () => {
  ordersDom.list = document.getElementById('orders-list');
  ordersDom.empty = document.getElementById('empty-orders');
  ordersDom.tabs = Array.from(document.querySelectorAll('[data-tab]'));

  if (!ordersDom.list) {
    return;
  }

  // Require auth before loading orders
  if (!authStore.isAuthenticated()) {
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `./login.html?return=${redirect}`;
    return;
  }

  setupTabs();
  await loadOrders();
});

function setupTabs() {
  if (!ordersDom.tabs.length) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initial = normalizeFilter(params.get('type')) || 'all';
  applyFilter(initial, { skipRender: true });

  ordersDom.tabs.forEach(button => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab || 'all';
      applyFilter(target);
    });
  });
}

async function loadOrders() {
  setLoading(true);

  const [purchaseOrders, tradeInOrders] = await Promise.all([
    fetchPurchaseOrders(),
    fetchTradeInOrders()
  ]);

  const offlineOrders = getOfflineOrders();
  const remoteOrders = [...tradeInOrders, ...purchaseOrders];
  allOrders = mergeOrderSources(remoteOrders, offlineOrders);

  setLoading(false);
  renderOrders();
}

async function fetchPurchaseOrders() {
  try {
    const orders = await api.getOrders();
    return Array.isArray(orders) ? orders : [];
  } catch (error) {
    console.error('Failed to load purchase orders:', error);
    showToast('Could not load orders right now. Please try again later.', 'error');
    return [];
  }
}

async function fetchTradeInOrders() {
  if (!api || typeof api.getMyPickups !== 'function') {
    return [];
  }

  try {
    const response = await api.getMyPickups();
    if (response?.success === false) {
      if (response?.error) {
        console.warn('Unable to load trade-in pickups:', response.error);
      }
      return [];
    }
    const raw = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : [];
    return normalizeTradeInOrders(raw);
  } catch (error) {
    console.error('Failed to load trade-in pickups:', error);
    return [];
  }
}

function setLoading(isLoading) {
  if (!ordersDom.list) {
    return;
  }

  if (isLoading) {
    ordersDom.list.innerHTML = LOADER_HTML;
    setEmptyState(false);
  }
}

function applyFilter(filterKey, { skipRender = false } = {}) {
  const normalized = normalizeFilter(filterKey);
  activeFilter = normalized || 'all';

  updateTabState();

  if (!skipRender) {
    renderOrders();
  }
}

function updateTabState() {
  ordersDom.tabs.forEach(button => {
    const tabKey = normalizeFilter(button.dataset.tab) || 'all';
    const isActive = tabKey === activeFilter;

    button.classList.toggle('btn-primary', isActive);
    button.classList.toggle('btn-outline', !isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function renderOrders() {
  if (!ordersDom.list) {
    return;
  }

  if (!Array.isArray(allOrders) || allOrders.length === 0) {
    ordersDom.list.innerHTML = '';
    setEmptyState(true);
    return;
  }

  const visibleOrders = activeFilter === 'all'
    ? allOrders
    : allOrders.filter(order => order.type === activeFilter);

  if (visibleOrders.length === 0) {
    ordersDom.list.innerHTML = '';
    setEmptyState(true);
    return;
  }

  setEmptyState(false);

  const fragment = document.createDocumentFragment();
  visibleOrders
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .forEach(order => {
      const wrapper = document.createElement('article');
      wrapper.className = 'order-card';
      wrapper.dataset.orderId = order.id || '';
      wrapper.innerHTML = getOrderMarkup(order);
      fragment.appendChild(wrapper);
    });

  ordersDom.list.innerHTML = '';
  ordersDom.list.appendChild(fragment);
}

function getOrderMarkup(order) {
  const statusClass = normalizeStatus(order.status);
  const statusLabel = formatStatusLabel(order.status);
  const typeLabel = order.type === 'sell' ? 'Trade-In' : 'Purchase';
  const totalLabel = order.type === 'sell' ? 'Trade-In Offer' : 'Order Total';
  const totalValue = Number(order.total) || 0;
  const taxValue = Number(order.tax) || 0;
  const dateLabel = formatOrderDate(order.date);
  const items = Array.isArray(order.items) ? order.items : [];
  const orderId = order.reference || order.id || 'Order';

  const itemsMarkup = items.length
    ? items.map(renderOrderItem).join('')
    : '<p class="text-muted" style="font-size:0.875rem;">No items listed for this order.</p>';
  const statusMeta = `
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.2rem;">
      <span class="order-status ${statusClass}">${statusLabel}</span>
      ${order.isLocal ? '<span class="text-muted" style="font-size:0.75rem;">Saved locally</span>' : ''}
    </div>
  `;

  return `
    <div class="order-header">
      <div>
        <div class="order-id">${escapeHtml(orderId)}</div>
        <div class="text-muted" style="font-size:0.875rem;">${dateLabel}&nbsp;•&nbsp;${typeLabel}</div>
      </div>
      ${statusMeta}
    </div>

    <div class="order-items">
      ${itemsMarkup}
    </div>

    <div class="order-footer">
      <div>
        <div class="text-muted" style="font-size:0.875rem;">${totalLabel}</div>
        <div class="order-total">${formatMoney(totalValue)}</div>
        ${taxValue > 0 ? `<div class="text-muted" style="font-size:0.75rem;">Includes ${formatMoney(taxValue)} tax</div>` : ''}
      </div>
      ${renderOrderActions(order)}
    </div>
  `;
}

function renderOrderItem(item) {
  const qty = Number(item.quantity) || Number(item.qty) || 1;
  const price = Number(item.price) || Number(item.unit_price) || 0;
  const total = Number.isFinite(item.total) ? item.total : price * qty;
  const imageSrc = item.image || 'https://via.placeholder.com/80x80.png?text=Item';
  const itemName = item.name || item.title || 'Order item';

  return `
    <div class="order-item">
      <img src="${imageSrc}" alt="${escapeHtml(itemName)}" class="order-item-image" loading="lazy">
      <div>
        <div style="font-weight:600;">${escapeHtml(itemName)}</div>
        <div class="text-muted" style="font-size:0.875rem;">Qty ${qty}</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-weight:600;">${formatMoney(total)}</div>
        <div class="text-muted" style="font-size:0.875rem;">${formatMoney(price)} each</div>
      </div>
    </div>
  `;
}

function renderOrderActions(order) {
  const orderReference = encodeURIComponent(order.reference || order.id || '');
  if (order.type === 'sell') {
    return `
      <a href="./order-tracking.html?id=${orderReference}&type=sell" class="btn btn-outline btn-sm">
        Track Progress
      </a>
    `;
  }

  return `
    <a href="./order-tracking.html?id=${orderReference}" class="btn btn-ghost btn-sm">
      View Details
    </a>
  `;
}

function normalizeFilter(value) {
  if (!value) return 'all';
  const key = value.toString().toLowerCase();
  return ['all', 'buy', 'sell'].includes(key) ? key : 'all';
}

function normalizeStatus(status) {
  const key = (status || '').toString().toLowerCase();
  if (['completed', 'paid', 'fulfilled', 'finished', 'done', 'payout_completed'].includes(key)) return 'completed';
  if (['cancelled', 'canceled', 'rejected', 'declined'].includes(key)) return 'cancelled';
  return 'pending';
}

function formatStatusLabel(status) {
  const key = (status || '').toString().toLowerCase();
  const labelMap = {
    completed: 'Completed',
    paid: 'Paid',
    fulfilled: 'Fulfilled',
    quote_sent: 'Quote Sent',
    inspecting: 'Inspecting',
    in_pickup: 'In Pickup',
    in_transit: 'In Transit',
    requested: 'Requested',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
    canceled: 'Cancelled',
    rejected: 'Rejected'
  };
  if (labelMap[key]) {
    return labelMap[key];
  }
  return key ? key.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase()) : 'Pending';
}

function formatOrderDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(value);
  }

  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(raw) {
  if (raw === undefined || raw === null) {
    return '';
  }
  return raw
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setEmptyState(visible) {
  if (!ordersDom.empty) {
    return;
  }
  toggleElement(ordersDom.empty, visible);
}

function getOfflineOrders() {
  if (typeof orderHistoryStore === 'undefined' || typeof orderHistoryStore.get !== 'function') {
    return [];
  }
  return orderHistoryStore.get().map(normalizeLocalOrder);
}

function mergeOrderSources(remote = [], offline = []) {
  const remoteReferences = new Set(remote.map(getOrderReference).filter(Boolean));
  const localOnly = offline.filter(order => {
    const reference = getOrderReference(order);
    return reference && !remoteReferences.has(reference);
  });
  return [...localOnly, ...remote];
}

function normalizeLocalOrder(order = {}) {
  const reference = getOrderReference(order) || `ORD${Date.now()}`;
  return {
    id: order.id || reference,
    reference,
    status: order.status || 'pending',
    type: order.type || 'buy',
    total: Number(order.total) || 0,
    subtotal: Number(order.subtotal) || 0,
    tax: Number(order.tax) || 0,
    shipping: Number(order.shipping) || 0,
    date: order.date || order.timestamp || new Date().toISOString(),
    paymentStatus: order.paymentStatus || 'pending',
    items: Array.isArray(order.items) ? order.items : [],
    isLocal: true,
    raw: order
  };
}

function getOrderReference(order) {
  const ref = order?.reference || order?.id;
  return ref ? ref.toString() : '';
}

function normalizeTradeInOrders(pickups = []) {
  return pickups.map(pickup => {
    const reference = formatTradeInReference(pickup);
    const amount = extractTradeInValue(pickup);
    const deviceName = formatTradeInDeviceName(pickup);
    const image = getTradeInPhoto(pickup);
    const condition = pickup?.condition || pickup?.device_condition || '—';

    return {
      id: pickup?.id != null ? `tradein-${pickup.id}` : reference,
      reference,
      status: pickup?.status || pickup?.state || 'pending',
      type: 'sell',
      total: amount,
      subtotal: amount,
      tax: 0,
      shipping: 0,
      date: pickup?.updated_at || pickup?.created_at || pickup?.timestamp,
      items: [
        {
          id: pickup?.id ?? reference,
          name: deviceName,
          price: amount,
          quantity: 1,
          total: amount,
          image,
          condition
        }
      ],
      tradeInMeta: {
        condition,
        scheduledAt: pickup?.scheduled_at,
        address: pickup?.address_json
      }
    };
  });
}

function formatTradeInReference(pickup) {
  if (!pickup) {
    return `PK-${Date.now()}`;
  }
  if (pickup.reference) {
    return pickup.reference.toString();
  }
  if (pickup.code) {
    return pickup.code.toString();
  }
  const id = pickup.id ?? pickup.pickup_id;
  if (id !== undefined && id !== null) {
    return `PK-${id}`;
  }
  return `PK-${Date.now()}`;
}

function extractTradeInValue(pickup) {
  const candidates = [
    pickup?.offer_amount,
    pickup?.offer,
    pickup?.quoted_amount,
    pickup?.quote_amount,
    pickup?.estimated_value,
    pickup?.estimate_value,
    pickup?.estimate_amount,
    pickup?.payout_amount
  ];

  for (const value of candidates) {
    const amount = Number(value);
    if (Number.isFinite(amount)) {
      return amount;
    }
  }
  return 0;
}

function formatTradeInDeviceName(pickup) {
  const parts = [];
  const brandName = pickup?.brand_name || pickup?.brand?.name || pickup?.brand;
  const model = pickup?.model_text || pickup?.model || pickup?.device_model;
  if (brandName) {
    parts.push(brandName);
  }
  if (model) {
    parts.push(model);
  }
  return parts.join(' ') || 'Trade-in device';
}

function getTradeInPhoto(pickup) {
  if (!pickup) {
    return 'https://via.placeholder.com/80x80.png?text=Trade-in';
  }
  if (Array.isArray(pickup.photos) && pickup.photos.length) {
    return pickup.photos[0];
  }
  if (pickup.photo) {
    return pickup.photo;
  }
  return 'https://via.placeholder.com/80x80.png?text=Trade-in';
}
