import { el } from '../app/ui.js';

const CATEGORIES = ['Phones', 'Laptops', 'Tablets', 'Wearables', 'Accessories', 'All'];

export default function CategoryStrip({ onSelect = () => {}, selected = 'All' } = {}) {
  const row = el('div', { class: 'cat-strip', role: 'tablist', 'aria-label': 'Browse categories' });
  CATEGORIES.forEach((category) => {
    const pill = el('button', { class: 'cat-pill', role: 'tab', 'aria-pressed': String(category === selected) }, category);
    pill.addEventListener('click', () => {
      row.querySelectorAll('.cat-pill').forEach((node) => node.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
      onSelect(category);
    });
    row.appendChild(pill);
  });
  return row;
}
