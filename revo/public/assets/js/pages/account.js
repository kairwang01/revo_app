// Account page functionality
// wallets and profile bits live here, say hi

document.addEventListener('DOMContentLoaded', async () => {
  setupAboutModal();

  if (!authStore.isAuthenticated()) {
    redirectToLogin();
    return;
  }

  const user = await ensureCurrentUser();
  if (!user) {
    return;
  }

  updateWalletDisplay();
  await loadOrderSummary();
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
});

async function ensureCurrentUser() {
  try {
    const response = await api.getCurrentUser();
    if (!response || response.success === false) {
      throw new Error(response?.error || 'Not authenticated');
    }

    const currentAuth = authStore.get() || {};
    if (!currentAuth.user) {
      const token = currentAuth.token || localStorage.getItem('authToken');
      authStore.set({
        token,
        user: response.data
      });
    }

    return response.data;
  } catch (error) {
    console.error('Failed to verify session:', error);
    redirectToLogin();
    return null;
  }
}

function redirectToLogin() {
  authStore.clear();
  window.location.href = './login.html?return=' + encodeURIComponent(window.location.href);
}

function updateWalletDisplay() {
  const wallet = walletStore.get();
  const balance = wallet?.balance || 0;
  const currency = wallet?.currency || 'CAD';
  const balanceNode = document.getElementById('wallet-balance');
  if (balanceNode) {
    balanceNode.textContent = formatMoney(balance, currency);
  }
}

async function loadOrderSummary() {
  try {
    const orders = await api.getOrders();
    const pendingStatuses = new Set(['pending', 'processing', 'created']);
    const completedStatuses = new Set(['completed', 'paid', 'fulfilled', 'shipped']);

    const pendingCount = orders.filter(order => pendingStatuses.has((order.status || '').toLowerCase())).length;
    const completedCount = orders.filter(order => completedStatuses.has((order.status || '').toLowerCase())).length;

    const pendingNode = document.getElementById('pending-count');
    const completedNode = document.getElementById('completed-count');
    if (pendingNode) pendingNode.textContent = pendingCount;
    if (completedNode) completedNode.textContent = completedCount;
  } catch (error) {
    console.error('Error loading order summary:', error);
    showToast('Could not load orders summary', 'error');
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

function setupAboutModal() {
  const trigger = document.getElementById('about-revo-trigger');
  const modal = document.getElementById('about-modal');
  const closeButtons = [
    document.getElementById('about-modal-close'),
    document.getElementById('about-modal-close-secondary')
  ];

  if (!trigger || !modal) return;

  const openModal = () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  };

  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });

  closeButtons.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', closeModal);
    }
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}
