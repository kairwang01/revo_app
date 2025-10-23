import Banner from '../components/Banner.js';
import { api } from '../app/api.js';
import { authStore, walletStore } from '../app/storage.js';
import { el, icon, money, toast } from '../app/ui.js';

let root;

async function loadWallet() {
  const data = await api.getWallet();
  walletStore.set(data);
  return data;
}

async function loadProfile(session) {
  if (!session) return null;
  try {
    return await api.getUser();
  } catch (err) {
    console.warn('[account] failed to load profile', err);
    return session.user || null;
  }
}

function actionsBar() {
  const bar = el('div', { class: 'account-top-actions' });
  const settings = el('button', { class: 'btn icon', type: 'button', 'aria-label': 'Open settings' }, icon('gear'));
  settings.addEventListener('click', () => location.hash = '#/settings');
  const cart = el('button', { class: 'btn icon', type: 'button', 'aria-label': 'Open cart' }, icon('cart'));
  cart.addEventListener('click', () => location.hash = '#/cart');
  bar.append(settings, cart);
  return bar;
}

function statsGrid(stats) {
  const grid = el('div', { class: 'account-stats' });
  const items = [
    { label: 'Vouchers', value: stats?.vouchers ?? 0 },
    { label: 'Carbon Saved (kg)', value: stats?.carbonSavedKg ?? 0 },
    { label: 'Orders', value: stats?.orders ?? 0 }
  ];
  items.forEach((item) => {
    const card = el('div', { class: 'stat' }, [
      el('span', { class: 'muted', text: item.label }),
      el('strong', {}, String(item.value))
    ]);
    grid.appendChild(card);
  });
  return grid;
}

function featureGrid() {
  const grid = el('div', { class: 'feature-grid' });
  [
    { title: 'Inspection report', copy: 'Access the diagnostic history for each device.' },
    { title: 'Store warranty', copy: '12-month coverage on all Revo certified devices.' },
    { title: 'Trade-in calculator', copy: 'Estimate payouts before you trade.' },
    { title: 'Sustainability', copy: 'Track carbon saved with every device you extend.' }
  ].forEach((feature) => {
    const card = el('div', { class: 'feature-card' }, [
      el('h3', {}, feature.title),
      el('p', { class: 'muted', style: 'margin:0;font-size:0.85rem;' }, feature.copy)
    ]);
    card.addEventListener('click', () => toast('Coming soon'));
    grid.appendChild(card);
  });
  return grid;
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });

  const session = authStore.get();
  const profile = session ? await loadProfile(session) : null;
  page.appendChild(actionsBar());

  const hero = el('div', { class: 'account-hero' });
  if (session) {
    hero.append(
      el('span', {}, `Welcome back, ${profile?.name ?? 'Revo Member'}`),
      el('strong', {}, 'Manage trade-ins, wallet, and rewards.'),
      el('button', { class: 'btn inline', type: 'button', onclick: () => { location.hash = '#/orders/500001'; } }, 'View latest order')
    );
  } else {
    hero.append(
      el('strong', {}, 'Sign in now >'),
      el('span', {}, 'Access wallet, vouchers, and order tracking.'),
      el('button', { class: 'btn inline primary', type: 'button', onclick: () => { location.hash = '#/login'; } }, 'Sign in')
    );
  }
  page.appendChild(hero);

  const wallet = await loadWallet();
  page.appendChild(el('div', { class: 'card section' }, [
    el('div', { class: 'card-title' }, ['Wallet balance', icon('wallet', { size: 18, className: 'sm' })]),
    el('div', { style: 'font-size:1.6rem;font-weight:700;' }, money(wallet.balance || 0)),
    el('p', { class: 'muted', style: 'margin:0;' }, `${wallet.points} points - Last credit ${wallet.lastCredit ? new Date(wallet.lastCredit).toLocaleDateString('en-CA') : '-'}`)
  ]));

  page.appendChild(statsGrid(profile?.stats));

  const ordersSection = el('div', { class: 'account-orders' });
  [
    { label: 'Trade-in orders', target: '#/orders/500001' },
    { label: 'Purchase history', target: '#/orders/500002' }
  ].forEach((link) => {
    const card = el('div', { class: 'order-card' }, [
      el('span', {}, link.label),
      icon('chevron-right', { size: 16, className: 'sm' })
    ]);
    card.addEventListener('click', () => { location.hash = link.target; });
    ordersSection.appendChild(card);
  });
  page.appendChild(ordersSection);

  page.appendChild(el('div', { class: 'card section' }, Banner({ onClick: () => { location.hash = '#/curated'; } }))); 

  page.appendChild(featureGrid());

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
