// Login page functionality
// passwords go brr, keep them secret ok

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const GOOGLE_CLIENT_ID = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
    ? CONFIG.GOOGLE_CLIENT_ID
    : '512280577272-d5tpr43puu3fqdrk81i2pfrik74ahlr3.apps.googleusercontent.com';
  const SITE_KEY = '6LcbbhwsAAAAAPq5fx5TfatMN8MhgTeggarDm8jf';
  if (!form) return;
  
  // Redirect if already logged in
  if (authStore.isAuthenticated()) {
    const existing = authStore.get();
    const isAdmin = existing?.user?.role === 'admin';
    window.location.href = isAdmin ? './admin.html' : './account.html';
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    const captchaToken = await getRecaptchaToken(SITE_KEY, 'login_submit');
    if (!captchaToken) {
      console.warn('reCAPTCHA token unavailable, proceeding with fallback login.');
      showToast('Verification temporarily unavailable, proceeding...', 'info');
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    
    try {
      const result = await api.login(email, password);
      
      if (result.success) {
        authStore.set({
          token: result.token,
          user: result.user
        });
        
        showToast('Login successful!', 'success');
        try {
          if (window.analytics && typeof window.analytics.trackEvent === 'function') {
            window.analytics.trackEvent('login_success', {
              role: result?.user?.role || 'user',
              email: result?.user?.email
            });
          }
        } catch (analyticsError) {
          console.warn('Login analytics event failed', analyticsError);
        }
        
        // Redirect admins to admin page; others honor ?return or account
        const isAdmin = result?.user?.role === 'admin';
        const returnUrl = isAdmin
          ? './admin.html'
          : (new URLSearchParams(window.location.search).get('return') || './account.html');
        setTimeout(() => {
          window.location.href = returnUrl;
        }, 500);
      } else {
        showToast(result.error || 'Login failed', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });

  if (window.googleAuth?.setupGoogleButton) {
    googleAuth.setupGoogleButton('google-login-btn', {
      clientId: GOOGLE_CLIENT_ID,
      loadingLabel: 'Signing in...',
      onAuthenticated: (backendResult) => {
        authStore.set({
          token: backendResult.token,
          user: backendResult.user
        });
        showToast('Signed in with Google', 'success');
        try {
          if (window.analytics && typeof window.analytics.trackEvent === 'function') {
            window.analytics.trackEvent('login_success', {
              role: backendResult?.user?.role || 'user',
              email: backendResult?.user?.email,
              provider: 'google'
            });
          }
        } catch (analyticsError) {
          console.warn('Login analytics event failed', analyticsError);
        }
        const isAdmin = backendResult?.user?.role === 'admin';
        const returnUrl = isAdmin
          ? './admin.html'
          : (new URLSearchParams(window.location.search).get('return') || './account.html');
        setTimeout(() => { window.location.href = returnUrl; }, 300);
      },
      onNeedRegister: (profile) => {
        const params = new URLSearchParams();
        if (profile?.email) params.set('googleEmail', profile.email);
        showToast('No account found for this Google email. Please sign up.', 'info');
        window.location.href = `./register.html?${params.toString()}`;
      },
      onError: (message) => {
        if (message) {
          showToast(message, 'error');
        }
      }
    });
  } else {
    console.warn('Google auth helper unavailable; Google login disabled.');
  }
});

async function getRecaptchaToken(siteKey, action) {
  if (typeof grecaptcha === 'undefined' || !siteKey) {
    console.warn('reCAPTCHA not available or site key missing. 密钥类型无效?');
    return null;
  }
  try {
    const api = grecaptcha.enterprise || grecaptcha;
    await api.ready();
    const token = await api.execute(siteKey, { action });
    return token || null;
  } catch (error) {
    console.warn('Unable to get reCAPTCHA token', error);
    return null;
  }
}
