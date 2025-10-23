import { el } from '../app/ui.js';

export default function Modal({ title, content, onClose } = {}) {
  const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
  const sheet = el('div', { class: 'sheet' });
  if (title) sheet.appendChild(el('header', {}, title));
  sheet.appendChild(el('div', { class: 'sheet-content' }, content));

  const close = () => {
    overlay.remove();
    onClose?.();
  };

  overlay.addEventListener('click', (evt) => {
    if (evt.target === overlay) close();
  });

  const root = document.querySelector('#portal-overlays') || document.body;
  overlay.appendChild(sheet);
  root.appendChild(overlay);

  return { close };
}
