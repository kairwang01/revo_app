import { el } from '../app/ui.js';

export default function Loader({ label = 'Loading' } = {}) {
  return el('div', { class: 'loader', role: 'status', 'aria-live': 'polite' }, [
    el('div', { class: 'spinner', 'aria-hidden': 'true' }),
    el('span', { class: 'sr-only' }, `${label}...`)
  ]);
}
