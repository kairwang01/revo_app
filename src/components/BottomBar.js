import { el, icon } from '../app/ui.js';

const TABS = [
  { key: 'home', label: 'Home', hash: '#/home', icon: 'home' },
  { key: 'curated', label: 'Curated', hash: '#/curated', icon: 'star' },
  { key: 'products', label: 'Products', hash: '#/products', icon: 'bag' },
  { key: 'cart', label: 'Cart', hash: '#/cart', icon: 'cart' },
  { key: 'account', label: 'Account', hash: '#/account', icon: 'user' }
];

function createTab({ key, label, hash, icon: name }) {
  const button = el('button', { class: 'tabbar-btn', type: 'button', 'data-tab': key, 'aria-label': label }, [
    icon(name, { size: 22 }),
    el('span', { text: label })
  ]);
  button.addEventListener('click', () => {
    location.hash = hash;
    window.analytics.track('tab_select', { target: key });
  });
  return button;
}

function mount(container) {
  if (!container) return;
  container.innerHTML = '';
  TABS.forEach((tab) => container.appendChild(createTab(tab)));
}

export default { mount };
