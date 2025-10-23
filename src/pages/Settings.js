import { el, toast } from '../app/ui.js';

let root;

const entries = [
  'Address Management',
  'Account & Security',
  'Feedback',
  'User Agreement',
  'Privacy Policy',
  'Privacy Summary',
  'Personal Data Collection List',
  'Personal Data Sharing List',
  'About Revo'
];

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Settings'));
  page.appendChild(el('p', { class: 'muted', style: 'margin:0 0 1rem;' }, 'Manage your account preferences and privacy controls.'));

  const list = el('ul', { class: 'list chevron settings-list card section' });
  entries.forEach((entry) => {
    const item = el('li', {}, el('span', {}, entry));
    item.addEventListener('click', () => toast(`${entry} coming soon`));
    list.appendChild(item);
  });
  page.appendChild(list);

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
