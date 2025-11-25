// Login page functionality
// passwords go brr, keep them secret ok

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  
  // Redirect if already logged in
  if (authStore.isAuthenticated()) {
    window.location.href = './account.html';
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    
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
        
        // Redirect to account page or return URL
        const returnUrl = new URLSearchParams(window.location.search).get('return') || './account.html';
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
});
