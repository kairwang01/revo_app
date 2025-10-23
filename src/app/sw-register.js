export async function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('../sw.js');
    reg.addEventListener('updatefound', () => {
      // placeholder hook for update flow
    });
  } catch (err) {
    // Fail silently in non-secure contexts (e.g., file://)
    console.debug('[sw] registration skipped:', err?.message || err);
  }
}

