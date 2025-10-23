import { el, icon } from '../app/ui.js';

let root;

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container empty-state', style: 'padding:2rem 1rem;' }, [
    icon('planet', { size: 48, className: 'lg' }),
    el('strong', {}, 'Page not found'),
    el('p', { class: 'muted', text: 'The page you were looking for has moved or no longer exists.' }),
    el('button', { class: 'btn primary', type: 'button', onclick: () => { location.hash = '#/home'; } }, 'Back to home')
  ]);
  container.appendChild(page);
}

export function unmount() { if (root) root.innerHTML = ''; }

export default { mount, unmount };
