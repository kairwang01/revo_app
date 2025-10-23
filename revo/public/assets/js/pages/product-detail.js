// Product detail page functionality

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
    
    // Hide loading, show content
    toggleElement(loading, false);
    toggleElement(content, true);
    
    // Populate product data
    document.getElementById('product-image').src = product.image;
    document.getElementById('product-image').alt = product.name;
    document.getElementById('product-brand').textContent = product.brand;
    document.getElementById('product-condition').textContent = product.condition;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-rating').textContent = product.rating;
    document.getElementById('product-reviews').textContent = product.reviews;
    document.getElementById('product-location').textContent = product.location;
    document.getElementById('product-price').textContent = formatMoney(product.price);
    document.getElementById('product-original-price').textContent = formatMoney(product.originalPrice);
    
    const discount = Math.round((1 - product.price / product.originalPrice) * 100);
    document.getElementById('product-discount').textContent = `${discount}% off`;
    
    // Populate highlights
    const highlightsList = document.getElementById('product-highlights');
    if (product.highlights && product.highlights.length > 0) {
      highlightsList.innerHTML = product.highlights.map(h => `<li>${h}</li>`).join('');
    }
    
    // Populate description if available
    if (product.description) {
      document.getElementById('product-description').textContent = product.description;
    }
    
  } catch (error) {
    console.error('Error loading product:', error);
    showError();
  }
}

function showError() {
  toggleElement(document.getElementById('loading'), false);
  toggleElement(document.getElementById('product-content'), false);
  toggleElement(document.getElementById('error-state'), true);
}

function setupAddToCart(productId) {
  const addBtn = document.getElementById('add-to-cart-btn');
  const buyBtn = document.getElementById('buy-now-btn');
  
  addBtn.addEventListener('click', async () => {
    const product = await api.getProduct(productId);
    if (product) {
      cartStore.add(product, 1);
      showToast('Added to cart!', 'success');
    }
  });
  
  buyBtn.addEventListener('click', async () => {
    const product = await api.getProduct(productId);
    if (product) {
      cartStore.add(product, 1);
      window.location.href = './checkout.html';
    }
  });
}
