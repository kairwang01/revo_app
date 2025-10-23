import { api } from '../app/api.js';
import { authStore } from '../app/storage.js';
import { el, icon, toast } from '../app/ui.js';

let root;

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Create your Revo account'));
  page.appendChild(el('p', { class: 'muted', style: 'margin:0 0 1rem;' }, 'Buy and trade-in Apple and Samsung devices across Canada.'));

  const form = el('form', { class: 'card section', novalidate: 'true' });
  const name = el('input', { type: 'text', name: 'name', required: 'true', placeholder: 'Full name' });
  const email = el('input', { type: 'email', name: 'email', required: 'true', placeholder: 'Email', style: 'margin-top:0.65rem;' });
  const password = el('input', { type: 'password', name: 'password', required: 'true', placeholder: 'Password (min 8 chars)', style: 'margin-top:0.65rem;' });
  const consent = el('label', { style: 'display:flex;align-items:flex-start;gap:0.45rem;margin-top:0.85rem;font-size:0.85rem;' }, [
    el('input', { type: 'checkbox', name: 'consent', required: 'true' }),
    el('span', {}, ['I agree to the ', el('a', { href: '#/settings' }, 'Revo user agreement'), '.'])
  ]);
  const submit = el('button', { class: 'btn primary', type: 'submit', style: 'width:100%;margin-top:1rem;' }, ['Create account', icon('chevron-right', { size: 16, className: 'sm' })]);
  form.append(name, email, password, consent, submit);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = { name: name.value.trim(), email: email.value.trim(), password: password.value.trim() };
    if (!payload.name || !payload.email || payload.password.length < 3) {
      toast('Complete all fields');
      return;
    }
    const response = await api.register(payload);
    authStore.set({ token: response.token, user: response.user });
    toast('Welcome to Revo');
    location.hash = '#/account';
  });

  page.appendChild(form);
  page.appendChild(el('p', { style: 'margin:1rem 0;text-align:center;' }, [
    'Have an account? ',
    el('a', { href: '#/login' }, 'Sign in')
  ]));

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
