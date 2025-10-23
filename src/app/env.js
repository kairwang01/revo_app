export const env = {
  supports: { webp: false, avif: false },
  platform: { ios: false, android: false, desktop: false, touch: false }
};

function testImage(type, dataUri) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = dataUri;
  });
}

export async function detectFormats() {
  try {
    env.supports.webp = await testImage('webp', 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoEAAQAAVAfJZgCdAAP7m8CAA==');
  } catch { env.supports.webp = false; }
  try {
    env.supports.avif = await testImage('avif', 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAG1pZjFhdmlmAAABAG1ldGEAAAABbWhkbHIALQ==');
  } catch { env.supports.avif = false; }
  detectPlatform();
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  env.platform.ios = /iPad|iPhone|iPod/.test(ua);
  env.platform.android = /Android/.test(ua);
  env.platform.touch = 'ontouchstart' in window;
  env.platform.desktop = !env.platform.ios && !env.platform.android;
}
