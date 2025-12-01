// Register page functionality
// welcome wagon, now with extra paperwork

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const GOOGLE_CLIENT_ID = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_CLIENT_ID)
    ? CONFIG.GOOGLE_CLIENT_ID
    : '512280577272-d5tpr43puu3fqdrk81i2pfrik74ahlr3.apps.googleusercontent.com';
  if (!form) {
    return;
  }

  // Redirect to account if already authenticated
  if (authStore.isAuthenticated()) {
    window.location.href = './account.html';
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const prefillEmail = searchParams.get('googleEmail') || searchParams.get('email');
  if (prefillEmail) {
    const emailInput = form.querySelector('#email');
    if (emailInput) {
      emailInput.value = prefillEmail;
    }
  }

  if (window.googleAuth?.setupGoogleButton) {
    googleAuth.setupGoogleButton('google-register-btn', {
      clientId: GOOGLE_CLIENT_ID,
      loadingLabel: 'Signing in...',
      onAuthenticated: (backendResult) => {
        authStore.set({
          token: backendResult.token,
          user: backendResult.user
        });
        showToast('Signed up with Google', 'success');
        setTimeout(() => {
          window.location.href = './account.html';
        }, 300);
      },
      onNeedRegister: (profile) => {
        const emailInput = form.querySelector('#email');
        if (profile?.email && emailInput) {
          emailInput.value = profile.email;
          emailInput.focus();
        }
        showToast('Finish creating your account with your Google email.', 'info');
      },
      onError: (message) => {
        if (message) {
          showToast(message, 'error');
        }
      }
    });
  } else {
    console.warn('Google auth helper unavailable; Google sign-up disabled.');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = form.querySelector('#email')?.value.trim();
    const password = form.querySelector('#password')?.value || '';
    const confirmPassword = form.querySelector('#confirm-password')?.value || '';
    const termsAccepted = form.querySelector('#terms')?.checked ?? true;

    if (!email || !password) {
      showToast('Email and password are required', 'error');
      return;
    }

    if (!termsAccepted) {
      showToast('Please agree to the terms to continue', 'error');
      return;
    }

    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Creating account...';
    }

    try {
      const result = await api.register(email, password);

      if (result && result.success) {
        const token = result.token || result.data?.token;
        const user = result.user || result.data?.user;

        if (token) {
          authStore.set({ token, user });
          showToast('Account created! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = './account.html';
          }, 600);
        } else {
          showToast('Account created! Please sign in to continue.', 'success');
          setTimeout(() => {
            window.location.href = './login.html';
          }, 800);
        }
      } else {
        showToast(result?.error || 'Registration failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Unable to register right now. Please try later.', 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
      }
    }
  });
});
