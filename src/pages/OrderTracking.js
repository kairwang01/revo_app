import { api } from '../app/api.js';
import { el, formatDate, icon, toast } from '../app/ui.js';

let root;

function tracker(order) {
  const wrap = el('div', { class: 'tracker' });
  const steps = order.steps || ['Placed', 'Shipped', 'Delivered'];
  steps.forEach((name, index) => {
    const step = el('div', { class: `tracker-step${index <= (order.currentStep ?? 0) ? ' active' : ''}` }, name);
    wrap.appendChild(step);
  });
  return wrap;
}

export async function mount(container, params) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.25rem;' }, `Order #${params.id}`));

  const order = await api.trackOrder(params.id);
  if (!order) {
    page.appendChild(el('p', { class: 'muted', text: 'Order not found. Try another tracking number.' }));
    container.appendChild(page);
    return;
  }

  page.appendChild(el('div', { class: 'order-meta' }, [
    el('div', {}, ['Status: ', el('strong', {}, order.status)]),
    el('div', {}, ['Placed: ', formatDate(order.createdAt)]),
    el('div', {}, ['Last update: ', order.lastUpdate ? formatDate(order.lastUpdate) : '-']),
    el('div', {}, ['City: ', order.city || 'Canada-wide']),
    el('div', {}, ['Items: ', String(order.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0)])
  ]));

  page.appendChild(tracker(order));

  page.appendChild(el('div', { class: 'card section' }, [
    el('div', { class: 'card-title' }, ['Tracking number', icon('ticket', { size: 16, className: 'sm' })]),
    el('strong', { style: 'letter-spacing:0.08em;' }, order.trackingNumber),
    el('button', { class: 'btn inline primary', type: 'button', style: 'margin-top:0.75rem;', onclick: () => toast('Opening carrier tracking (mock)') }, ['Track package', icon('chevron-right', { size: 16, className: 'sm' })])
  ]));

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
