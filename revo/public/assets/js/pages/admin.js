// Admin trade-in dashboard
// keeps an eye on pickups, offers, and deletes (nicely)

document.addEventListener('DOMContentLoaded', () => {
  const ADMIN_DEFAULTS = {
    email: 'adminuser@example.com',
    password: 'password123'
  };

  const state = {
    backendReady: false,
    tradeins: [],
    lastLoaded: null,
    user: null
  };

  // Ensure admin endpoints exist even if older scripts are cached
  function ensureAdminEndpoints() {
    if (typeof backendApi !== 'undefined') {
      if (typeof backendApi.getAdminTradeins !== 'function') {
        backendApi.getAdminTradeins = async function () {
          try {
            const data = await this._request('/admin/tradeins', { method: 'GET' });
            return { success: true, data };
          } catch (error) {
            return { success: false, error: error.message || 'Failed to load trade-ins', data: [] };
          }
        };
      }
      if (typeof backendApi.evaluateTradein !== 'function') {
        backendApi.evaluateTradein = async function (pickupId, evaluation) {
          try {
            const data = await this._request(`/admin/tradeins/${pickupId}/evaluate`, {
              method: 'PUT',
              body: JSON.stringify(evaluation)
            });
            return { success: true, data, message: 'Evaluation saved' };
          } catch (error) {
            return { success: false, error: error.message || 'Failed to save evaluation' };
          }
        };
      }
      if (typeof backendApi.deleteTradein !== 'function') {
        backendApi.deleteTradein = async function (pickupId) {
          try {
            await this._request(`/admin/tradeins/${pickupId}`, { method: 'DELETE' });
            return { success: true, message: 'Trade-in deleted' };
          } catch (error) {
            return { success: false, error: error.message || 'Failed to delete trade-in' };
          }
        };
      }
    }

    if (typeof api !== 'undefined') {
      if (typeof api.getAdminTradeins !== 'function' && typeof backendApi?.getAdminTradeins === 'function') {
        api.getAdminTradeins = (...args) => backendApi.getAdminTradeins(...args);
      }
      if (typeof api.evaluateTradein !== 'function' && typeof backendApi?.evaluateTradein === 'function') {
        api.evaluateTradein = (...args) => backendApi.evaluateTradein(...args);
      }
      if (typeof api.deleteTradein !== 'function' && typeof backendApi?.deleteTradein === 'function') {
        api.deleteTradein = (...args) => backendApi.deleteTradein(...args);
      }
    }
  }

  // Defensive wrapper in case api.js is missing admin helpers (older bundle)
  const adminApi = {
    getTradeins: (...args) => {
      ensureAdminEndpoints();
      if (api && typeof api.getAdminTradeins === 'function') {
        return api.getAdminTradeins(...args);
      }
      if (typeof backendApi?.getAdminTradeins === 'function') {
        return backendApi.getAdminTradeins(...args);
      }
      throw new Error('Admin trade-in API not available');
    },
    evaluate: (...args) => {
      ensureAdminEndpoints();
      if (api && typeof api.evaluateTradein === 'function') {
        return api.evaluateTradein(...args);
      }
      if (typeof backendApi?.evaluateTradein === 'function') {
        return backendApi.evaluateTradein(...args);
      }
      throw new Error('Admin evaluation API not available');
    },
    delete: (...args) => {
      ensureAdminEndpoints();
      if (api && typeof api.deleteTradein === 'function') {
        return api.deleteTradein(...args);
      }
      if (typeof backendApi?.deleteTradein === 'function') {
        return backendApi.deleteTradein(...args);
      }
      throw new Error('Admin delete API not available');
    }
  };

  const els = {
    connectionChip: document.getElementById('connection-chip'),
    authChip: document.getElementById('auth-chip'),
    backendUrl: document.getElementById('backend-url'),
    loginForm: document.getElementById('admin-login-form'),
    loginBtn: document.getElementById('admin-login-btn'),
    logoutBtn: document.getElementById('logout-admin-btn'),
    fillDefaultsBtn: document.getElementById('fill-default-btn'),
    refreshBtn: document.getElementById('refresh-tradeins'),
    tradeinsList: document.getElementById('tradeins-list'),
    tradeinsEmpty: document.getElementById('tradeins-empty'),
    rawResponse: document.getElementById('raw-response'),
    copyResponseBtn: document.getElementById('copy-response-btn'),
    collapseResponseBtn: document.getElementById('collapse-response-btn'),
    statTotal: document.getElementById('stat-total'),
    statPending: document.getElementById('stat-pending'),
    statEvaluated: document.getElementById('stat-evaluated'),
    lastUpdated: document.getElementById('last-updated')
  };

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char] || char));
  }

  function formatDateTime(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  function formatMoneySafe(amount) {
    const num = Number(amount);
    if (!Number.isFinite(num)) return '—';
    return typeof formatMoney === 'function' ? formatMoney(num) : `$${num.toFixed(2)}`;
  }

  function setChip(el, text, tone = 'muted') {
    if (!el) return;
    el.textContent = text;

    const tones = {
      success: { bg: 'rgba(34,197,94,0.15)', color: '#15803d' },
      danger: { bg: 'rgba(239,68,68,0.16)', color: '#b91c1c' },
      info: { bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' },
      muted: { bg: 'var(--surface-subtle)', color: 'var(--muted)' }
    };

    const palette = tones[tone] || tones.muted;
    el.style.background = palette.bg;
    el.style.color = palette.color;
  }

  function setBackendUrl() {
    if (!els.backendUrl) return;
    const base = (window.CONFIG && typeof CONFIG.getApiUrl === 'function')
      ? CONFIG.getApiUrl()
      : (CONFIG?.BACKEND_URL || '') + (CONFIG?.API_PREFIX || '/api');
    els.backendUrl.value = base;
  }

  function updateAuthChip(user) {
    if (!els.authChip) return;
    if (user) {
      const name = user.full_name || user.fullName || user.email || 'Admin';
      const role = user.role ? ` · ${user.role}` : '';
      setChip(els.authChip, `Signed in as ${name}${role}`, 'info');
    } else {
      setChip(els.authChip, 'Not signed in', 'muted');
    }
  }

  function updateConnectionChip(connected) {
    if (!els.connectionChip) return;
    setChip(els.connectionChip, connected ? 'Backend live' : 'Backend offline', connected ? 'success' : 'danger');
  }

  function renderStats() {
    const total = state.tradeins.length;
    const evaluated = state.tradeins.filter(item => {
      const pickupStatus = (item?.pickup?.status || '').toLowerCase();
      return item?.evaluation || pickupStatus === 'evaluated' || pickupStatus === 'completed';
    }).length;
    const pending = total - evaluated;

    if (els.statTotal) els.statTotal.textContent = total;
    if (els.statEvaluated) els.statEvaluated.textContent = evaluated;
    if (els.statPending) els.statPending.textContent = pending < 0 ? 0 : pending;

    if (els.lastUpdated) {
      els.lastUpdated.textContent = state.lastLoaded
        ? `Updated ${formatDateTime(state.lastLoaded)}`
        : 'Not loaded';
    }
  }

  function renderRawResponse() {
    if (!els.rawResponse) return;
    els.rawResponse.textContent = state.tradeins.length
      ? JSON.stringify(state.tradeins, null, 2)
      : 'No data yet. Sign in and refresh.';
  }

  function statusChip(status) {
    const normalized = (status || 'pending').toLowerCase();
    const palette = {
      evaluated: { bg: 'rgba(34,197,94,0.15)', color: '#15803d' },
      completed: { bg: 'rgba(34,197,94,0.15)', color: '#15803d' },
      requested: { bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' },
      scheduled: { bg: 'rgba(245,158,11,0.18)', color: '#b45309' },
      rejected: { bg: 'rgba(239,68,68,0.16)', color: '#b91c1c' },
      cancelled: { bg: 'rgba(239,68,68,0.16)', color: '#b91c1c' },
      offer_sent: { bg: 'rgba(59,130,246,0.15)', color: '#1d4ed8' }
    };

    const colors = palette[normalized] || { bg: 'var(--surface-subtle)', color: 'var(--muted)' };
    return `<span class="chip" style="background:${colors.bg};color:${colors.color};text-transform:capitalize;">${escapeHtml(normalized)}</span>`;
  }

  function getDiagnosticsString(diagnostics) {
    if (!diagnostics) return '';
    try {
      return JSON.stringify(diagnostics, null, 2);
    } catch (error) {
      return String(diagnostics);
    }
  }

  function buildTradeinCard(item) {
    const pickup = item?.pickup || {};
    const user = item?.user || {};
    const evaluation = item?.evaluation || null;
    const diagSource = evaluation?.diagnostics_json || evaluation?.diagnostics;
    const parts = evaluation?.parts_replaced_json || evaluation?.parts_replaced || [];
    const partsList = Array.isArray(parts) ? parts.join(', ') : '';
    const diagnostics = getDiagnosticsString(diagSource);
    const finalOffer = evaluation?.final_offer;
    const evaluationCost = evaluation?.evaluation_cost;
    const pickupId = pickup.id ?? '';

    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.pickupId = pickupId;

    const address = pickup.address_json?.value || pickup.address_json?.label || 'Not provided';
    const createdAt = formatDateTime(pickup.created_at);
    const evaluationSummary = evaluation
      ? `
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; margin-bottom:0.25rem;">
          ${statusChip(pickup.status)}
          <span class="chip" style="background: rgba(99,102,241,0.12); color: #4338ca;">Offer ${formatMoneySafe(finalOffer)}</span>
          ${evaluationCost !== undefined && evaluationCost !== null ? `<span class="chip" style="background: rgba(148,163,184,0.16); color: #0f172a;">Cost ${formatMoneySafe(evaluationCost)}</span>` : ''}
        </div>
        <div class="text-muted" style="font-size:0.9rem;">Notes: ${escapeHtml(evaluation.notes || '—')}</div>
        ${partsList ? `<div class="text-muted" style="font-size:0.9rem;">Parts: ${escapeHtml(partsList)}</div>` : ''}
      `
      : `<p class="text-muted" style="margin:0;">No evaluation yet.</p>`;

    card.innerHTML = `
      <div class="card-header" style="align-items: flex-start;">
        <div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
            <span class="chip" style="background: rgba(148,163,184,0.16); color: #0f172a;">#${escapeHtml(pickupId)}</span>
            ${statusChip(pickup.status)}
            ${user.email ? `<span class="chip" style="background: rgba(59,130,246,0.12); color: #1d4ed8;">${escapeHtml(user.email)}</span>` : ''}
          </div>
          <div class="text-muted" style="margin-top:0.35rem; font-size:0.9rem;">
            ${escapeHtml(pickup.model_text || 'Unknown device')} · ${escapeHtml(pickup.storage || 'n/a')} · Condition ${escapeHtml(pickup.condition || '?')}
          </div>
          <div class="text-muted" style="font-size:0.9rem;">Created ${escapeHtml(createdAt)}</div>
        </div>
        <div style="text-align: right; font-size: 0.9rem;">
          <div style="font-weight:600;">${escapeHtml(user.full_name || user.fullName || 'Customer')}</div>
          <div class="text-muted">${escapeHtml(address)}</div>
        </div>
      </div>
      <div class="card-body">
        <div class="list" style="margin-bottom: 0.75rem;">
          <div class="list-item"><span>Additional info</span><span class="text-muted">${escapeHtml(pickup.additional_info || '—')}</span></div>
          <div class="list-item"><span>Deposit</span><span>${pickup.deposit_amount ? formatMoneySafe(pickup.deposit_amount) : '—'}</span></div>
          <div class="list-item"><span>Scheduled</span><span>${escapeHtml(formatDateTime(pickup.scheduled_at))}</span></div>
        </div>
        <div style="padding: 0.9rem; background: var(--surface-subtle); border-radius: var(--radius-md);">
          ${evaluationSummary}
          ${diagnostics ? `<pre style="margin-top:0.5rem; background: rgba(148,163,184,0.12); padding:0.75rem; border-radius: var(--radius-sm); white-space: pre-wrap;">${escapeHtml(diagnostics)}</pre>` : ''}
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem;">
          <button class="btn btn-primary btn-sm" data-action="toggle-eval" data-id="${escapeHtml(pickupId)}">${evaluation ? 'Update evaluation' : 'Add evaluation'}</button>
          <button class="btn btn-outline btn-sm" style="border-color:#dc2626; color:#dc2626;" data-action="delete-tradein" data-id="${escapeHtml(pickupId)}">
            <svg width="16" height="16" style="fill: currentColor;"><use href="#icon-trash"></use></svg>
            Delete
          </button>
        </div>
        <form class="evaluation-form hidden" data-pickup-id="${escapeHtml(pickupId)}" style="margin-top:0.75rem; border-top:1px solid var(--border); padding-top:0.75rem;">
          <div class="grid grid-2" style="gap:0.75rem;">
            <div class="form-group">
              <label class="form-label">Final Offer (CAD)</label>
              <input type="number" step="0.01" name="final_offer" class="form-input" value="${evaluation?.final_offer ?? ''}" placeholder="120">
            </div>
            <div class="form-group">
              <label class="form-label">Evaluation Cost</label>
              <input type="number" step="0.01" name="evaluation_cost" class="form-input" value="${evaluationCost ?? ''}" placeholder="0">
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <input type="text" name="status" class="form-input" list="status-options" value="${escapeHtml(pickup.status || '')}" placeholder="evaluated">
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <input type="text" name="notes" class="form-input" value="${escapeHtml(evaluation?.notes || '')}" placeholder="Short note for the customer">
            </div>
            <div class="form-group">
              <label class="form-label">Diagnostics (JSON or text)</label>
              <textarea name="diagnostics" class="form-textarea" rows="3" placeholder='{"condition":"A"}'>${escapeHtml(diagnostics)}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Parts Replaced (comma separated)</label>
              <input type="text" name="parts_replaced" class="form-input" value="${escapeHtml(partsList)}" placeholder="battery, screen">
            </div>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem;">
            <button type="submit" class="btn btn-primary btn-sm">Save evaluation</button>
            <button type="button" class="btn btn-secondary btn-sm" data-action="close-eval" data-id="${escapeHtml(pickupId)}">Close</button>
          </div>
        </form>
      </div>
    `;

    return card;
  }

  function renderTradeins() {
    if (!els.tradeinsList) return;
    els.tradeinsList.innerHTML = '';

    if (!state.tradeins.length) {
      if (els.tradeinsEmpty) {
        els.tradeinsEmpty.classList.remove('hidden');
      }
      updateEmptyState();
      return;
    }

    if (els.tradeinsEmpty) {
      els.tradeinsEmpty.classList.add('hidden');
    }

    state.tradeins.forEach(item => {
      els.tradeinsList.appendChild(buildTradeinCard(item));
    });
  }

  function updateEmptyState() {
    if (!els.tradeinsEmpty) return;
    const title = els.tradeinsEmpty.querySelector('h3');
    const message = els.tradeinsEmpty.querySelector('p');

    if (!state.tradeins.length && !authStore.isAuthenticated()) {
      if (title) title.textContent = 'Sign in to view trade-ins';
      if (message) message.textContent = 'Use the admin credentials above to pull live pickup requests.';
    } else {
      if (title) title.textContent = 'No trade-ins yet';
      if (message) message.textContent = "Once customers submit trade-in pickups, they'll appear here.";
    }
  }

  function setLoadingList() {
    if (!els.tradeinsList) return;
    els.tradeinsList.innerHTML = `
      <div class="loader-container">
        <div class="spinner"></div>
      </div>
    `;
  }

  async function checkBackend() {
    try {
      const connected = await api.init();
      state.backendReady = connected;
      updateConnectionChip(connected);
      return connected;
    } catch (error) {
      console.error('Backend check failed', error);
      state.backendReady = false;
      updateConnectionChip(false);
      return false;
    }
  }

  async function hydrateUser() {
    try {
      const current = await api.getCurrentUser();
      if (current?.success && current.data) {
        state.user = current.data;
        authStore.set({ token: localStorage.getItem('authToken'), user: current.data });
        updateAuthChip(current.data);
        return current.data;
      }
    } catch (error) {
      console.warn('Unable to load current user', error);
    }
    updateAuthChip(null);
    return null;
  }

  function parseEvaluationForm(form) {
    const get = (name) => {
      const field = form.querySelector(`[name="${name}"]`);
      return field ? field.value.trim() : '';
    };

    const finalOffer = get('final_offer');
    const evaluationCost = get('evaluation_cost');
    const notes = get('notes');
    const status = get('status') || 'evaluated';
    const diagnosticsText = get('diagnostics');
    const partsText = get('parts_replaced');

    let diagnostics = {};
    if (diagnosticsText) {
      try {
        diagnostics = JSON.parse(diagnosticsText);
      } catch {
        diagnostics = { notes: diagnosticsText };
      }
    }

    const parts_replaced = partsText
      ? partsText.split(',').map(part => part.trim()).filter(Boolean)
      : [];

    return {
      final_offer: finalOffer === '' ? 0 : Number(finalOffer),
      evaluation_cost: evaluationCost === '' ? 0 : Number(evaluationCost),
      notes: notes || '',
      status,
      diagnostics,
      parts_replaced
    };
  }

  async function loadTradeins(showAuthWarning = true) {
    if (!authStore.isAuthenticated()) {
      if (showAuthWarning && typeof showToast === 'function') {
        showToast('Sign in as admin to load trade-ins', 'info');
      }
      renderTradeins();
      return;
    }

    setLoadingList();
    try {
      const response = await adminApi.getTradeins();
      if (!response?.success) {
        throw new Error(response?.error || 'Unable to load trade-ins');
      }
      state.tradeins = Array.isArray(response.data) ? response.data : [];
      state.lastLoaded = new Date();
      renderStats();
      renderRawResponse();
      renderTradeins();
    } catch (error) {
      console.error('Failed to load trade-ins', error);
      if (els.tradeinsList) {
        els.tradeinsList.innerHTML = `<p class="text-muted">Failed to load trade-ins: ${escapeHtml(error.message || error)}</p>`;
      }
      if (typeof showToast === 'function') {
        showToast('Failed to load trade-ins', 'error');
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!els.loginBtn) return;

    const email = document.getElementById('admin-email')?.value?.trim();
    const password = document.getElementById('admin-password')?.value;

    if (!email || !password) {
      showToast('Email and password are required', 'error');
      return;
    }

    els.loginBtn.disabled = true;
    els.loginBtn.textContent = 'Signing in...';

    try {
      await checkBackend();
      const result = await api.login(email, password);
      if (!result?.success) {
        throw new Error(result?.error || 'Login failed');
      }
      authStore.set({ token: result.token, user: result.user });
      state.user = result.user;
      const pwdInput = document.getElementById('admin-password');
      if (pwdInput) pwdInput.value = '';
      updateAuthChip(result.user);
      showToast('Signed in as admin', 'success');
      await loadTradeins(false);
    } catch (error) {
      console.error('Admin login failed', error);
      showToast(error.message || 'Unable to sign in', 'error');
    } finally {
      els.loginBtn.disabled = false;
      els.loginBtn.textContent = 'Sign In as Admin';
    }
  }

  function handleFillDefaults() {
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    if (emailInput && !emailInput.value) {
      emailInput.value = ADMIN_DEFAULTS.email;
    } else if (emailInput) {
      emailInput.value = ADMIN_DEFAULTS.email;
    }
    if (passwordInput) {
      passwordInput.value = ADMIN_DEFAULTS.password;
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
      authStore.clear();
      state.user = null;
      state.tradeins = [];
      renderStats();
      renderRawResponse();
      renderTradeins();
      updateAuthChip(null);
      showToast('Session cleared', 'info');
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  async function handleDelete(pickupId) {
    if (!pickupId) return;
    const proceed = window.confirm(`Delete pickup #${pickupId}? This removes its evaluation too.`);
    if (!proceed) return;

    try {
      const result = await adminApi.delete(pickupId);
      if (!result?.success) {
        throw new Error(result?.error || 'Delete failed');
      }
      showToast(`Pickup #${pickupId} deleted`, 'success');
      await loadTradeins(false);
    } catch (error) {
      console.error('Delete failed', error);
      showToast(error.message || 'Unable to delete pickup', 'error');
    }
  }

  async function handleEvaluationSubmit(event) {
    const form = event.target.closest('.evaluation-form');
    if (!form) return;
    event.preventDefault();

    const pickupId = form.dataset.pickupId;
    if (!pickupId) {
      showToast('Missing pickup id', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      const payload = parseEvaluationForm(form);
      const result = await adminApi.evaluate(pickupId, payload);
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to save evaluation');
      }
      showToast(`Saved evaluation for #${pickupId}`, 'success');
      await loadTradeins(false);
    } catch (error) {
      console.error('Evaluation save failed', error);
      showToast(error.message || 'Failed to save evaluation', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save evaluation';
      }
    }
  }

  function toggleEvaluationForm(pickupId, shouldShow = null) {
    const form = els.tradeinsList?.querySelector(`form[data-pickup-id="${pickupId}"]`);
    if (!form) return;
    const show = shouldShow !== null ? shouldShow : form.classList.contains('hidden');
    form.classList.toggle('hidden', !show);
  }

  async function copyResponse() {
    if (!navigator?.clipboard || !els.rawResponse) return;
    try {
      await navigator.clipboard.writeText(els.rawResponse.textContent);
      showToast('Copied latest response to clipboard', 'success');
    } catch (error) {
      console.warn('Copy failed', error);
      showToast('Unable to copy', 'error');
    }
  }

  function toggleRawCollapse() {
    if (!els.rawResponse) return;
    els.rawResponse.classList.toggle('hidden');
  }

  function attachEvents() {
    els.loginForm?.addEventListener('submit', handleLogin);
    els.fillDefaultsBtn?.addEventListener('click', handleFillDefaults);
    els.logoutBtn?.addEventListener('click', handleLogout);
    els.refreshBtn?.addEventListener('click', () => loadTradeins(false));
    els.copyResponseBtn?.addEventListener('click', copyResponse);
    els.collapseResponseBtn?.addEventListener('click', toggleRawCollapse);

    els.tradeinsList?.addEventListener('click', (event) => {
      const actionBtn = event.target.closest('[data-action]');
      if (!actionBtn) return;
      const pickupId = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;

      if (action === 'toggle-eval') {
        toggleEvaluationForm(pickupId);
      } else if (action === 'close-eval') {
        toggleEvaluationForm(pickupId, false);
      } else if (action === 'delete-tradein') {
        handleDelete(pickupId);
      }
    });

    els.tradeinsList?.addEventListener('submit', handleEvaluationSubmit);
  }

  async function init() {
    ensureAdminEndpoints();
    setBackendUrl();
    attachEvents();
    handleFillDefaults();

    await checkBackend();

    if (authStore.isAuthenticated()) {
      await hydrateUser();
      await loadTradeins(false);
    } else {
      renderStats();
      renderRawResponse();
    }
  }

  init();
});
