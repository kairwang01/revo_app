// Lightweight analytics bootstrap (GA4-friendly, respects CONFIG.ANALYTICS_ID)
(function () {
  const cfg = typeof CONFIG !== 'undefined' ? CONFIG : (typeof REVO_CONFIG !== 'undefined' ? REVO_CONFIG : {});
  const MEASUREMENT_ID = cfg?.ANALYTICS_ID || null;
  const DEBUG = !!cfg?.FEATURES?.DEBUG_MODE;

  const analytics = {
    ready: false,
    init() {
      if (!MEASUREMENT_ID) {
        if (DEBUG) console.info('[analytics] Measurement ID not set; skipping GA init');
        return;
      }
      if (this.ready) return;

      this.loadGtag();
      this.ready = true;
      this.trackPageView();
    },
    loadGtag() {
      if (window.gtag) return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
      document.head.appendChild(script);
      window.gtag('js', new Date());
      window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
    },
    trackPageView(path = window.location.pathname) {
      if (!this.ready || !window.gtag) return;
      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_path: path,
        page_title: document.title || undefined
      });
    },
    trackEvent(name, params = {}) {
      if (!this.ready || !window.gtag || !name) return;
      const safeParams = params && typeof params === 'object' ? params : { value: params };
      window.gtag('event', name, safeParams);
    }
  };

  window.analytics = analytics;

  document.addEventListener('DOMContentLoaded', () => analytics.init());

  window.addEventListener('revo:cart-changed', () => {
    const count = typeof cartStore !== 'undefined' && cartStore?.getCount ? cartStore.getCount() : 0;
    analytics.trackEvent('cart_updated', {
      item_count: count,
      page: window.location.pathname
    });
  });

  window.addEventListener('revo:pickup-created', (event) => {
    const detail = event?.detail || {};
    analytics.trackEvent('tradein_pickup_created', {
      pickup_id: detail.id,
      deposit_amount: detail.deposit,
      page: window.location.pathname
    });
  });
})();

/**
 * Customer support launcher (frontend stub).
 * Creates a shared support button on every page and exposes a tiny API wrapper.
 * Until a real endpoint is wired, the UI will surface a "No connection" state.
 */
(function () {
  const NO_CONNECTION = 'no-connection';

  const state = {
    launcher: null,
    panel: null,
    statusPill: null,
    statusText: null,
    hintText: null,
    retryBtn: null,
    closeBtn: null
  };

  const supportApi = {
    /**
     * Future-friendly hook for connecting to a live support endpoint.
     * Exposed on window.supportApi so the backend can swap in quickly.
     */
    async contact(payload = {}) {
      const endpoint = getSupportEndpoint();
      if (!endpoint) {
        const error = new Error(NO_CONNECTION);
        error.code = NO_CONNECTION;
        throw error;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), getSupportTimeout());

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...payload,
            page: window.location.pathname,
            ts: new Date().toISOString()
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          const error = new Error(`support-api-${res.status}`);
          error.code = NO_CONNECTION;
          throw error;
        }

        return await res.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          error.code = 'timeout';
        } else if (!error.code) {
          error.code = NO_CONNECTION;
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    }
  };

  function getSupportEndpoint() {
    const cfg = getConfig();
    return cfg?.SUPPORT_API_URL || null;
  }

  function getSupportTimeout() {
    const cfg = getConfig();
    return cfg?.TIMEOUTS?.SUPPORT_REQUEST || cfg?.TIMEOUTS?.API_REQUEST || 8000;
  }

  function getConfig() {
    if (typeof CONFIG !== 'undefined') return CONFIG;
    if (typeof REVO_CONFIG !== 'undefined') return REVO_CONFIG;
    return {};
  }

  function ensureSupportStyles() {
    const tester = document.createElement('div');
    tester.className = 'support-launcher';
    tester.style.display = 'none';
    document.body.appendChild(tester);

    const computed = window.getComputedStyle(tester);
    const hasStyles = computed.position === 'fixed' && computed.bottom !== 'auto';
    tester.remove();

    if (hasStyles || document.getElementById('support-style-block')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'support-style-block';
    style.textContent = `
      .support-launcher {
        position: fixed;
        left: 1rem;
        bottom: calc(1.5rem + 64px);
        background: linear-gradient(135deg, #16a34a, #43cd80);
        color: #fff;
        border: none;
        border-radius: 999px;
        padding: 0.85rem 1.1rem;
        font-weight: 700;
        letter-spacing: 0.01em;
        box-shadow: 0 12px 30px rgba(34, 197, 94, 0.28);
        z-index: 1150;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease, opacity 150ms ease;
      }
      .support-launcher:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 36px rgba(34, 197, 94, 0.34);
      }
      .support-launcher:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
      .support-panel {
        position: fixed;
        left: 0.75rem;
        bottom: calc(1.5rem + 72px);
        width: min(360px, 90vw);
        background: #ffffff;
        border-radius: 14px;
        box-shadow: 0 18px 48px rgba(15, 23, 42, 0.2);
        padding: 1rem;
        border: 1px solid #e5e7eb;
        opacity: 0;
        pointer-events: none;
        transform: translateY(12px);
        transition: opacity 150ms ease, transform 150ms ease;
        z-index: 1250;
      }
      .support-panel.is-open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
      .support-panel-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }
      .support-title {
        margin: 0;
        font-size: 1.05rem;
        color: #0f172a;
      }
      .support-eyebrow {
        margin: 0;
        color: #6b7280;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
      .support-panel-close {
        background: none;
        border: 1px solid #e5e7eb;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 1.1rem;
        cursor: pointer;
        color: #6b7280;
      }
      .support-panel-body {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .support-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.65rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        background: #f3f4f6;
        color: #6b7280;
      }
      .support-status-pill.offline {
        background: #FEF3C7;
        color: #92400E;
      }
      .support-status-pill.online {
        background: #DCFCE7;
        color: #166534;
      }
      .support-status-pill.loading {
        background: #E0F2FE;
        color: #075985;
      }
      .support-status-text {
        margin: 0;
        color: #111827;
        line-height: 1.6;
      }
      .support-hint {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
      }
      .support-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .support-action {
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #0f172a;
        padding: 0.55rem 0.85rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        text-decoration: none;
      }
      .support-action.primary {
        background: #22c55e;
        border-color: #22c55e;
        color: #fff;
      }
      @media (max-width: 640px) {
        .support-launcher {
          bottom: calc(1rem + 72px);
          left: 0.75rem;
        }
        .support-panel {
          left: 0.5rem;
          bottom: calc(1rem + 80px);
          width: 94vw;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureSupportUi() {
    state.launcher = document.querySelector('[data-support-launcher]') || createLauncher();
    state.panel = document.getElementById('support-panel') || createPanel();

    state.statusPill = state.panel.querySelector('[data-support-status]');
    state.statusText = state.panel.querySelector('[data-support-text]');
    state.hintText = state.panel.querySelector('[data-support-hint]');
    state.retryBtn = state.panel.querySelector('[data-support-retry]');
    state.closeBtn = state.panel.querySelector('[data-support-close]');
  }

  function createLauncher() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'support-launcher';
    btn.setAttribute('data-support-launcher', 'true');
    btn.textContent = 'Live Support';
    btn.title = 'Live Support';
    document.body.appendChild(btn);
    return btn;
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.className = 'support-panel';
    panel.id = 'support-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div class="support-panel-header">
        <div>
          <p class="support-eyebrow">Live Support</p>
          <h3 class="support-title">Need a hand?</h3>
          <span class="support-status-pill loading" data-support-status>Checking connection…</span>
        </div>
        <button class="support-panel-close" type="button" aria-label="Close support panel" data-support-close>×</button>
      </div>
      <div class="support-panel-body">
        <p class="support-status-text" data-support-text>Setting up a secure line to support.</p>
        <p class="support-hint" data-support-hint>We will surface live chat or ticketing here once the API is wired.</p>
        <div class="support-actions">
          <button class="support-action primary" type="button" data-support-retry>Retry connection</button>
          <a class="support-action" href="mailto:support@revo.market" data-support-email>Email us</a>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function bindTriggers() {
    const triggers = new Set([
      ...document.querySelectorAll('[data-support-trigger]')
    ]);

    if (state.launcher) {
      triggers.add(state.launcher);
    }

    triggers.forEach(trigger => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        const source = trigger.dataset.supportTrigger || 'button';
        togglePanel(true);
        runConnectionCheck(source);
      });
    });

    state.retryBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      runConnectionCheck('retry');
    });

    state.closeBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      togglePanel(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        togglePanel(false);
      }
    });
  }

  function togglePanel(open) {
    if (!state.panel) return;
    const shouldOpen = open === undefined ? !state.panel.classList.contains('is-open') : open;

    if (shouldOpen) {
      state.panel.classList.add('is-open');
      state.panel.setAttribute('aria-hidden', 'false');
      state.launcher?.classList.add('is-active');
    } else {
      state.panel.classList.remove('is-open');
      state.panel.setAttribute('aria-hidden', 'true');
      state.launcher?.classList.remove('is-active');
    }
  }

  function setStatus(status, message) {
    if (state.statusPill) {
      state.statusPill.classList.remove('offline', 'online', 'loading');
      state.statusPill.classList.add(status);
      const label = status === 'online'
        ? 'Connected'
        : status === 'offline'
          ? 'No connection'
          : 'Checking…';
      state.statusPill.textContent = label;
    }

    if (message && state.statusText) {
      state.statusText.textContent = message;
    }
  }

  function setHint(message) {
    if (message && state.hintText) {
      state.hintText.textContent = message;
    }
  }

  async function runConnectionCheck(trigger = 'open') {
    setStatus('loading', 'Checking customer support availability…');
    setHint('Trying to reach our support API.');

    try {
      const response = await supportApi.contact({ trigger });
      const successMsg = response?.message || 'Connected to support. We will route you to a teammate once the API is enabled.';
      setStatus('online', successMsg);
      setHint('You will see live responses here once the API is plugged in.');
      return true;
    } catch (error) {
      const offlineMsg = 'No connection to customer support yet. This button will light up once the API is ready.';
      setStatus('offline', offlineMsg);
      setHint('You can retry anytime. We will update this state when the API goes live.');
      if (typeof showToast === 'function') {
        showToast('Customer support is not connected yet.', 'error');
      }
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const hasChatWidget = document.getElementById('chat-widget') || document.getElementById('chat-launcher');
    if (hasChatWidget) {
      // Skip rendering the live support launcher on pages that already have the AI chat bubble.
      window.supportApi = supportApi;
      window.openSupportPanel = () => {};
      return;
    }

    ensureSupportStyles();
    ensureSupportUi();
    bindTriggers();

    // Expose for future wiring or manual triggering
    window.supportApi = supportApi;
    window.openSupportPanel = () => {
      togglePanel(true);
      runConnectionCheck('manual');
    };
  });
})();
