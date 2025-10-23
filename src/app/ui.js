import { LOCALE } from './config.js';

export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null) return;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.entries(value).forEach(([k, v]) => node.dataset[k] = v);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'style') node.setAttribute('style', value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else node.setAttribute(key, value);
  });
  const append = (child) => {
    if (child == null) return;
    if (Array.isArray(child)) child.forEach(append);
    else if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  };
  append(children);
  return node;
}

export function icon(name, { size = 22, className = '' } = {}) {
  const svg = el('svg', { class: `icon${className ? ` ${className}` : ''}`, width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': 'true' });
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.appendChild(use);
  return svg;
}

export const money = (value) => LOCALE.currencyFormatter.format(Number.isFinite(value) ? value : 0);
export const formatDate = (iso) => new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });

function portalHost(id) {
  const host = qs(id);
  if (!host) throw new Error(`Portal ${id} missing in shell`);
  return host;
}

export function toast(message, { timeout = 2600 } = {}) {
  const node = el('div', { class: 'toast', role: 'status' }, message);
  portalHost('#portal-toasts').appendChild(node);
  setTimeout(() => node.remove(), timeout);
}

export function actionSheet({ title, options = [], selectedValue = null, cancelLabel = 'Cancel' }) {
  return new Promise((resolve) => {
    const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true' });
    const sheet = el('div', { class: 'sheet' });
    if (title) sheet.appendChild(el('header', {}, title));
    options.forEach((opt) => {
      const button = el('button', { class: 'sheet-option', 'aria-selected': String(opt.value === selectedValue) }, [
        el('span', {}, opt.label),
        opt.value === selectedValue ? icon('check', { size: 18, className: 'sm' }) : null
      ]);
      button.addEventListener('click', () => {
        overlay.remove();
        resolve(opt.value);
      });
      sheet.appendChild(button);
    });
    const cancel = el('button', { class: 'sheet-option', type: 'button' }, cancelLabel);
    cancel.addEventListener('click', () => { overlay.remove(); resolve(null); });
    sheet.appendChild(cancel);
    overlay.addEventListener('click', (evt) => { if (evt.target === overlay) { overlay.remove(); resolve(null); } });
    overlay.appendChild(sheet);
    portalHost('#portal-overlays').appendChild(overlay);
  });
}

export function showLoader(show = true) {
  const host = portalHost('#global-loader');
  if (show) {
    host.hidden = false;
    host.setAttribute('aria-busy', 'true');
    host.innerHTML = `<div class="loader"><div class="spinner" aria-hidden="true"></div><span class="sr-only">Loading...</span></div>`;
  } else {
    host.removeAttribute('aria-busy');
    host.hidden = true;
    host.innerHTML = '';
  }
}

export function injectSprite(svgText) {
  let mount = document.getElementById('svg-sprite-host');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'svg-sprite-host';
    mount.style.position = 'absolute';
    mount.style.width = '0';
    mount.style.height = '0';
    mount.style.overflow = 'hidden';
    document.body.appendChild(mount);
  }
  mount.innerHTML = svgText;
}

export function lazy(img, src) {
  if ('loading' in HTMLImageElement.prototype) {
    img.loading = 'lazy';
    img.src = src;
    return;
  }
  const observer = new IntersectionObserver((entries, ob) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        img.src = src;
        ob.unobserve(entry.target);
      }
    });
  }, { rootMargin: '120px' });
  observer.observe(img);
}

export function progressSteps(steps = [], currentIndex = 0) {
  const clamped = Math.min(Math.max(currentIndex, 0), Math.max(steps.length - 1, 0));
  const row = el('div', {
    class: 'progress-steps',
    role: 'progressbar',
    'aria-valuemax': String(Math.max(steps.length, 1)),
    'aria-valuenow': String(clamped + 1)
  });
  steps.forEach((label, index) => {
    const step = el('div', { class: 'step' }, [
      el('span', { class: 'dot', style: `background: ${index <= clamped ? 'var(--brand-700)' : 'rgba(148,163,184,0.4)'}; color: #fff;` }, index + 1),
      el('span', {}, label)
    ]);
    row.appendChild(step);
  });
  return row;
}

// Analytics stub
window.analytics = window.analytics || {
  track(name, payload) {
    if (typeof console !== 'undefined') console.debug('[analytics]', name, payload || {});
  }
};
