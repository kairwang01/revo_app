// Shared Google authentication helper for login/register flows
// keeps the Google button logic in one place so both pages stay in sync

(function () {
  const DEFAULT_CLIENT_ID = '512280577272-d5tpr43puu3fqdrk81i2pfrik74ahlr3.apps.googleusercontent.com';
  const DEFAULT_SCOPE = 'openid email profile';

  function getConfig() {
    if (typeof CONFIG !== 'undefined') return CONFIG;
    if (typeof REVO_CONFIG !== 'undefined') return REVO_CONFIG;
    return {};
  }

  function getBackendGoogleEndpoint() {
    const cfg = getConfig();
    const base = (cfg.BACKEND_URL || '').replace(/\/$/, '');
    const prefix = cfg.API_PREFIX || '/api';
    if (cfg.GOOGLE_AUTH_ENDPOINT) return cfg.GOOGLE_AUTH_ENDPOINT;
    return base ? `${base}${prefix}/auth/google` : null;
  }

  function toastError(message) {
    if (typeof showToast === 'function') {
      showToast(message, 'error');
    } else {
      console.error('[google-auth]', message);
    }
  }

  function waitForGoogle(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google);
        return;
      }

      const timer = setTimeout(() => {
        clearInterval(poller);
        reject(new Error('google-not-loaded'));
      }, timeoutMs);

      const poller = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(poller);
          clearTimeout(timer);
          resolve(window.google);
        }
      }, 50);
    });
  }

  async function fetchGoogleProfile(accessToken) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data || null;
    } catch {
      return null;
    }
  }

  async function exchangeGoogleToken(accessToken) {
    const endpoint = getBackendGoogleEndpoint();
    if (!endpoint) {
      return { success: false, error: 'Backend not configured for Google login.', code: 'no-endpoint' };
    }

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken })
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        const code = resp.status === 404 ? 'endpoint_not_found' : undefined;
        return {
          success: false,
          error: data?.detail || data?.message || 'Google auth failed',
          status: resp.status,
          code
        };
      }

      return {
        success: true,
        token: data?.token || data?.access_token || null,
        user: data?.user || data?.data?.user || null
      };
    } catch (error) {
      return { success: false, error: error.message || 'Network error during Google auth' };
    }
  }

  function setupGoogleButton(buttonIdOrEl, options = {}) {
    const button = typeof buttonIdOrEl === 'string'
      ? document.getElementById(buttonIdOrEl)
      : buttonIdOrEl;
    if (!button) return;

    const baseLabel = options.label || button.textContent.trim() || 'Continue with Google';
    const loadingLabel = options.loadingLabel || 'Connecting...';
    const preppingLabel = options.preparingLabel || 'Loading Google...';

    const setLoadingState = (isLoading, text) => {
      button.disabled = !!isLoading;
      button.textContent = isLoading ? (text || loadingLabel) : baseLabel;
    };

    // Keep the user informed while we wait for the Google SDK
    setLoadingState(true, preppingLabel);
    waitForGoogle(options.waitTimeoutMs || 8000)
      .then(() => setLoadingState(false))
      .catch(() => {
        setLoadingState(false);
        toastError('Google sign-in is unavailable right now.');
      });

    button.addEventListener('click', (event) => {
      event.preventDefault();

      setLoadingState(true);
      waitForGoogle(options.waitTimeoutMs || 8000)
        .then(() => {
          if (!window.google?.accounts?.oauth2) {
            throw new Error('Google SDK not ready');
          }

          const cfg = getConfig();
          const fallbackClientId = cfg.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
          const client = google.accounts.oauth2.initTokenClient({
            client_id: options.clientId || fallbackClientId,
            scope: options.scope || DEFAULT_SCOPE,
            callback: async (tokenResponse) => {
              if (!tokenResponse?.access_token) {
                setLoadingState(false);
                toastError('Google sign-in failed. Please try again.');
                options.onError?.('Google sign-in failed. Please try again.');
                return;
              }

              try {
                const backendResult = await exchangeGoogleToken(tokenResponse.access_token);
                if (backendResult?.success) {
                  options.onAuthenticated?.(backendResult);
                } else {
                  const message = backendResult?.error || 'Google sign-in failed on server';
                  if (backendResult?.code === 'endpoint_not_found' || backendResult?.status === 404) {
                    const profile = await fetchGoogleProfile(tokenResponse.access_token);
                    if (profile?.email) {
                      options.onNeedRegister?.({
                        email: profile.email,
                        name: profile.name,
                        picture: profile.picture
                      });
                    } else {
                      options.onError?.('No account found. Please register.');
                      toastError('No account found. Please register.');
                    }
                  } else {
                    toastError(message);
                    options.onError?.(message);
                  }
                }
              } catch (err) {
                toastError('Google login error. Please try again.');
                options.onError?.(err?.message || 'Google login error.');
              } finally {
                setLoadingState(false);
              }
            }
          });

          client.requestAccessToken();
        })
        .catch(() => {
          setLoadingState(false);
          toastError('Google sign-in is unavailable right now.');
          options.onError?.('Google sign-in is unavailable right now.');
        });
    });
  }

  window.googleAuth = {
    setupGoogleButton,
    exchangeGoogleToken,
    fetchGoogleProfile,
    waitForGoogle
  };
})();
