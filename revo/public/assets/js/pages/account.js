// Account page functionality

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  if (!authStore.isAuthenticated()) {
    // Redirect to login page if not authenticated
    window.location.href = './login.html?return=' + encodeURIComponent(window.location.href);
    return;
  }

  // Load user data
  await loadUserData();
  
  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

async function loadUserData() {
  try {
    // Load wallet balance
    const walletResponse = await api.getWallet();
    if (walletResponse.success) {
      const balance = walletResponse.data.balance || 0;
      const currency = walletResponse.data.currency || 'CAD';
      document.getElementById('wallet-balance').textContent = `$${balance.toFixed(2)} ${currency}`;
    }

    // Load orders summary
    const orders = await api.getOrders();
    if (orders && Array.isArray(orders)) {
      const pendingCount = orders.filter(order => order.status === 'pending').length;
      const completedCount = orders.filter(order => order.status === 'completed').length;
      
      document.getElementById('pending-count').textContent = pendingCount;
      document.getElementById('completed-count').textContent = completedCount;
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showToast('Failed to load account data', 'error');
  }
}

async function handleLogout() {
  try {
    const result = await api.logout();
    
    if (result.success) {
      // Clear auth store
      authStore.clear();
      
      // Show success message
      showToast('Logged out successfully', 'success');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = './index.html';
      }, 500);
    } else {
      showToast('Logout failed', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force logout even on error
    authStore.clear();
    showToast('Logged out', 'success');
    
    setTimeout(() => {
      window.location.href = './index.html';
    }, 500);
  }
}
