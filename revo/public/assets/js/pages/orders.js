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

  try {
    const response = await api.getOrders();
    allOrders = Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Failed to load orders:', error);
    allOrders = [];
    showToast('Could not load orders right now. Please try again later.', 'error');
  }

  setLoading(false);
  renderOrders();
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

  const itemsMarkup = items.length
    ? items.map(renderOrderItem).join('')
    : '<p class="text-muted" style="font-size:0.875rem;">No items listed for this order.</p>';

  return `
    <div class="order-header">
      <div>
        <div class="order-id">${escapeHtml(order.id || 'Unknown Order')}</div>
        <div class="text-muted" style="font-size:0.875rem;">${dateLabel}&nbsp;•&nbsp;${typeLabel}</div>
      </div>
      <span class="order-status ${statusClass}">${statusLabel}</span>
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
  const qty = Number(item.quantity) || 1;
  const price = Number(item.price) || 0;
  const total = price * qty;
  const image = item.image
    ? `<img src="${item.image}" alt="${escapeHtml(item.name || 'Order item')}" class="order-item-image" loading="lazy">`
    : '<div class="order-item-image" style="display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:0.75rem;">No Image</div>';

  return `
    <div class="order-item">
      ${image}
      <div>
        <div style="font-weight:600;">${escapeHtml(item.name || 'Unnamed item')}</div>
        <div class="text-muted" style="font-size:0.875rem;">
          ${escapeHtml(item.brand || '')}${item.brand ? ' • ' : ''}Qty ${qty}
          ${item.condition ? ` • Condition: ${escapeHtml(capitalize(item.condition))}` : ''}
        </div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div style="font-weight:600;">${formatMoney(total)}</div>
        <div class="text-muted" style="font-size:0.875rem;">${formatMoney(price)} each</div>
      </div>
    </div>
  `;
}

function renderOrderActions(order) {
  if (order.type === 'sell') {
    const orderId = encodeURIComponent(order.id || '');
    return `
      <a href="./order-tracking.html?orderId=${orderId}" class="btn btn-outline btn-sm">
        Track Progress
      </a>
    `;
  }

  return `
    <a href="./orders.html#${encodeURIComponent(order.id || '')}" class="btn btn-ghost btn-sm">
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
  if (key === 'completed') return 'completed';
  if (key === 'cancelled' || key === 'canceled') return 'cancelled';
  return 'pending';
}

function formatStatusLabel(status) {
  const key = (status || '').toString().toLowerCase();
  if (key === 'completed') return 'Completed';
  if (key === 'cancelled' || key === 'canceled') return 'Cancelled';
  return 'Pending';
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

function capitalize(text) {
  if (!text) {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
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
