import { api } from '../app/api.js';
import { authStore } from '../app/storage.js';
import { el, icon, toast } from '../app/ui.js';

let root;

function rememberEmail(value) {
  try { localStorage.setItem('REVO_REMEMBER_EMAIL', value); } catch { /* noop */ }
}

function getRememberedEmail() {
  try { return localStorage.getItem('REVO_REMEMBER_EMAIL') || ''; } catch { return ''; }
}

export async function mount(container) {
  root = container;
  container.innerHTML = '';
  const page = el('div', { class: 'container' });
  page.appendChild(el('h1', { style: 'margin:1rem 0 0.5rem;font-size:1.3rem;' }, 'Sign in to Revo'));
  page.appendChild(el('p', { class: 'muted', style: 'margin:0 0 1rem;' }, 'Access your wallet, vouchers, and track orders in Canada.'));

  const form = el('form', { class: 'card section', novalidate: 'true' });
  const email = el('input', { type: 'email', name: 'email', required: 'true', placeholder: 'Email', value: getRememberedEmail() });
  const password = el('input', { type: 'password', name: 'password', required: 'true', placeholder: 'Password', style: 'margin-top:0.65rem;' });
  const rememberInput = el('input', { type: 'checkbox', name: 'remember', ...(email.value ? { checked: '' } : {}) });
  const remember = el('label', { style: 'display:flex;align-items:center;gap:0.45rem;margin-top:0.75rem;font-size:0.85rem;' }, [
    rememberInput,
    'Remember me'
  ]);
  const forgot = el('button', { type: 'button', class: 'btn inline', style: 'margin-left:auto;margin-top:0.75rem;' }, ['Forgot?', icon('chevron-right', { size: 14, className: 'sm' })]);
  forgot.addEventListener('click', () => toast('Password reset email sent (mock)'));
  const submit = el('button', { class: 'btn primary', type: 'submit', style: 'width:100%;margin-top:1rem;' }, 'Sign in');

  form.append(email, password, remember, forgot, submit);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const credentials = { email: email.value.trim(), password: password.value.trim() };
    if (!credentials.email || !credentials.password) {
      toast('Enter email and password');
      return;
    }
    const response = await api.login(credentials);
    authStore.set({ token: response.token, user: response.user });
    rememberEmail(rememberInput.checked ? credentials.email : '');
    toast('Welcome back to Revo');
    location.hash = '#/account';
  });

  page.appendChild(form);
  page.appendChild(el('p', { style: 'margin:1rem 0;text-align:center;' }, [
    'No account? ',
    el('a', { href: '#/register' }, 'Create one')
  ]));

  container.appendChild(page);
}

export function unmount() {
  if (root) root.innerHTML = '';
}

export default { mount, unmount };
