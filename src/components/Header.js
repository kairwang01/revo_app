import { actionSheet, el, icon, qs, toast } from '../app/ui.js';
import { API } from '../app/config.js';
import { cityStore, countersStore } from '../app/storage.js';
import { api } from '../app/api.js';

function CitySelector() {
  const label = el('span', { class: 'city-label', text: cityStore.get() });
  const button = el('button', { class: 'btn ghost city-btn', 'aria-haspopup': 'dialog' }, [
    icon('location', { size: 18, className: 'sm' }),
    label
  ]);
  button.addEventListener('click', async () => {
    const current = cityStore.get();
    const choice = await actionSheet({
      title: 'Choose a city',
      options: API.ALLOWED_CITIES.map((city) => ({ label: city, value: city })),
      selectedValue: current
    });
    if (!choice || choice === current) return;
    cityStore.set(choice);
    label.textContent = choice;
    window.dispatchEvent(new CustomEvent('revo:city-changed', { detail: choice }));
    toast(`Showing inventory in ${choice}`);
  });
  return button;
}

function SearchField() {
  const input = el('input', { type: 'search', placeholder: 'Search devices (Apple/Samsung)', 'aria-label': 'Search Revo inventory' });
  const field = el('form', { class: 'field search-field', role: 'search' }, [
    icon('search', { size: 18, className: 'sm' }),
    input
  ]);
  field.addEventListener('submit', async (event) => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) {
      toast('Type a model to search');
      return;
    }
    sessionStorage.setItem('REVO_LAST_SEARCH', JSON.stringify({ q, city: cityStore.get(), sort: 'relevance' }));
    window.analytics.track('search', { q, city: cityStore.get() });
    location.hash = '#/products';
  });
  return field;
}

function CartButton() {
  const badge = el('span', { class: 'badge cart-badge', text: '0' });
  const button = el('button', { class: 'btn icon cart-btn', 'aria-label': 'Open cart' }, icon('cart'));
  const wrapper = el('div', { class: 'cart-wrapper' }, [button, badge]);

  async function refresh() {
    try {
      const { count } = await api.getCartCount();
      badge.textContent = String(count || 0);
      countersStore.set({ cartCount: count || 0 });
    } catch (err) {
      console.warn('[header] cart count fallback', err);
      badge.textContent = String(countersStore.get().cartCount || 0);
    }
    badge.hidden = Number(badge.textContent) === 0;
  }

  button.addEventListener('click', () => {
    location.hash = '#/cart';
  });
  refresh();
  window.addEventListener('revo:cart-updated', refresh);
  return wrapper;
}

function mount(container) {
  if (!container) return;
  container.innerHTML = '';
  container.append(
    CitySelector(),
    SearchField(),
    CartButton()
  );
}

export default { mount };
