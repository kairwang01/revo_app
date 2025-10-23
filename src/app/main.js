import { registerSW } from './sw-register.js';
import { startRouter, beforeEach, afterEach } from './router.js';
import { injectSprite, qs, showLoader } from './ui.js';
import { cityStore } from './storage.js';
import { API } from './config.js';
import Header from '../components/Header.js';
import BottomBar from '../components/BottomBar.js';
import { detectFormats, env } from './env.js';

const MAX_W = 750;
const MIN_W = 320;

const roundEven = (value) => Math.round(value / 2) * 2;

function applyRootMetrics() {
  const width = Math.max(MIN_W, Math.min(window.innerWidth, MAX_W));
  const base = roundEven((width / MAX_W) * 200);
  document.documentElement.style.fontSize = `${base}px`;
  const extra = Math.max(0, window.innerWidth - MAX_W) / 2;
  document.documentElement.style.setProperty('--wide-screen-extra-space', `${extra}px`);
}

function updateSafeAreas() {
  const vv = window.visualViewport;
  if (!vv) return;
  const topInset = Math.max(0, vv.offsetTop);
  const bottomInset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
  document.documentElement.style.setProperty('--safe-area-inset-top', `${Math.round(topInset)}px`);
  document.documentElement.style.setProperty('--safe-area-inset-bottom', `${Math.round(bottomInset)}px`);
}

function ensureCity() {
  const stored = cityStore.get();
  if (!API.ALLOWED_CITIES.includes(stored)) {
    cityStore.set('Vancouver');
  }
  document.body.dataset.city = cityStore.get();
}

function wireCityEvents() {
  window.addEventListener('revo:city-changed', (event) => {
    if (!event?.detail) return;
    document.body.dataset.city = event.detail;
  });
}

async function bootstrapIcons() {
  try {
    const svg = await fetch(new URL('../components/IconSprite.svg', import.meta.url)).then((res) => res.text());
    injectSprite(svg);
  } catch (err) {
    console.warn('[sprite] failed to load icon sprite', err);
  }
}

function setupRouterHooks() {
  let loaderTimer;
  beforeEach(() => {
    clearTimeout(loaderTimer);
    loaderTimer = setTimeout(() => showLoader(true), 120);
  });
  afterEach(({ route }) => {
    clearTimeout(loaderTimer);
    showLoader(false);
    if (route?.name) {
      document.title = `Revo - ${route.name}`;
      window.analytics.track('page_view', { name: route.name, hash: location.hash });
    }
  });
}

function mountShell() {
  Header.mount(qs('#app-header'));
  BottomBar.mount(qs('#bottom-tabbar'));
  const fab = qs('#fab-trade');
  fab?.addEventListener('click', () => {
    location.hash = '#/curated';
    window.analytics.track('fab_trade', { source: 'fab', destination: 'curated' });
  });
}

(function init() {
  applyRootMetrics();
  updateSafeAreas();
  ensureCity();
  wireCityEvents();
  bootstrapIcons();
  detectFormats().then(() => {
    document.documentElement.dataset.webp = String(env.supports.webp);
    document.documentElement.dataset.avif = String(env.supports.avif);
  });
  window.addEventListener('resize', () => {
    applyRootMetrics();
    updateSafeAreas();
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', updateSafeAreas, { passive: true });
  window.visualViewport?.addEventListener('scroll', updateSafeAreas, { passive: true });

  mountShell();
  setupRouterHooks();
  startRouter();
  registerSW();
})();
