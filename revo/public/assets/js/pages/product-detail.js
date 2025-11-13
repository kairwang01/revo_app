// Product detail page functionality

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = getUrlParams();
  const productId = params.id;

  if (!productId) {
    showError();
    return;
  }

  await loadProduct(productId);
  setupAddToCart(productId);
});

async function loadProduct(productId) {
  const loading = document.getElementById('loading');
  const content = document.getElementById('product-content');
  const errorState = document.getElementById('error-state');

  try {
    const product = await api.getProduct(productId);

    if (!product) {
      showError();
      return;
    }

    currentProduct = product;

    // Hide loading, show content
    toggleElement(loading, false);
    toggleElement(content, true);

    // Populate product data
    const productImage = document.getElementById('product-image');
    const placeholder = document.querySelector('.pd-placeholder');
    
    productImage.src = product.image;
    productImage.alt = product.name;
    
    // Hide placeholder when image loads
    productImage.onload = function() {
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      productImage.style.display = 'block';
    };
    
    // Show placeholder if image fails to load
    productImage.onerror = function() {
      if (placeholder) {
        placeholder.style.display = 'flex';
      }
      productImage.style.display = 'none';
    };
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-condition').textContent = product.condition;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-rating').textContent = product.rating;
    document.getElementById('product-reviews').textContent = product.reviews;
    document.getElementById('product-location').textContent = product.location;
    const priceValue = Number(product.price) || 0;
    const originalValue = Number(product.originalPrice);

    document.getElementById('product-price').textContent = formatMoney(priceValue);
    document.getElementById('product-original-price').textContent = Number.isFinite(originalValue)
      ? formatMoney(originalValue)
      : formatMoney(priceValue);

    const discount = computeDiscountPercent(product);
    document.getElementById('product-discount').textContent = `${discount}% off`;

    // Populate highlights
    const highlightsList = document.getElementById('product-highlights');
    if (Array.isArray(product.highlights) && product.highlights.length > 0) {
      highlightsList.innerHTML = product.highlights.map(h => `<li>${h}</li>`).join('');
    }

    // Populate description if available
    if (product.description) {
      document.getElementById('product-description').textContent = product.description;
    }
    
    // Show bottom bar
    toggleElement(document.getElementById('bottom-bar'), true);
  } catch (error) {
    console.error('Error loading product:', error);
    showError();
  }
}

function computeDiscountPercent(product) {
  const price = Number(product.price);
  const original = Number(product.originalPrice);

  if (!Number.isFinite(price) || !Number.isFinite(original) || original <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((1 - price / original) * 100));
}

function showError() {
  toggleElement(document.getElementById('loading'), false);
  toggleElement(document.getElementById('product-content'), false);
  toggleElement(document.getElementById('error-state'), true);
}

function setupAddToCart(productId) {
  const addBtn = document.getElementById('add-to-cart-btn');
  const buyBtn = document.getElementById('buy-now-btn');

  if (!addBtn || !buyBtn) {
    return;
  }

  addBtn.addEventListener('click', async () => {
    const product = await ensureProductLoaded(productId);
    if (product) {
      await addProductToCart(product, 1);
      showToast('Added to cart!', 'success');
    }
  });

  buyBtn.addEventListener('click', async () => {
    const product = await ensureProductLoaded(productId);
    if (product) {
      await addProductToCart(product, 1);
      window.location.href = './checkout.html';
    }
  });
}

async function ensureProductLoaded(productId) {
  if (currentProduct && Number(currentProduct.id) === Number(productId)) {
    return currentProduct;
  }

  currentProduct = await api.getProduct(productId);
  return currentProduct;
}

async function addProductToCart(product, quantity = 1) {
  cartStore.add(product, quantity);

  if (!authStore.isAuthenticated()) {
    return;
  }

  try {
    await api.addToCart(product.id, quantity);
  } catch (error) {
    console.warn('Failed to sync cart with backend:', error);
  }
}
