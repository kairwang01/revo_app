// Sell/Trade-in Page Logic

// Model data
const phoneModels = {
  Apple: ['iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 12'],
  Samsung: ['Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy S22', 'Galaxy S21', 'Galaxy Z Fold 4']
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  initBrandChange();
  initFormSubmit();
  initImageUpload();
});

// Handle brand change
function initBrandChange() {
  const brandSelect = document.getElementById('brand');
  const modelSelect = document.getElementById('model');
  
  brandSelect.addEventListener('change', function() {
    const selectedBrand = this.value;
    modelSelect.innerHTML = '<option value="">Select model</option>';
    
    if (selectedBrand && phoneModels[selectedBrand]) {
      phoneModels[selectedBrand].forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      modelSelect.disabled = false;
    } else {
      modelSelect.disabled = true;
    }
  });
}

// Handle form submission
function initFormSubmit() {
  const form = document.getElementById('trade-in-form');
  const estimateBtn = document.getElementById('estimate-btn');
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const deviceData = {
      brand: formData.get('brand'),
      model: formData.get('model'),
      storage: formData.get('storage'),
      condition: formData.get('condition'),
      notes: formData.get('notes')
    };
    
    // Validate
    if (!deviceData.brand || !deviceData.model || !deviceData.storage || !deviceData.condition) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Show loading
    estimateBtn.disabled = true;
    estimateBtn.textContent = 'Calculating...';
    
    try {
      // Get estimate from API
      const response = await api.getTradeInEstimate(deviceData);
      
      if (response.success) {
        showEstimateResult(response.data);
      } else {
        alert('Failed to get estimate. Please try again.');
      }
    } catch (error) {
      console.error('Error getting estimate:', error);
      alert('Failed to get estimate. Please try again.');
    } finally {
      estimateBtn.disabled = false;
      estimateBtn.textContent = 'Get Instant Estimate';
    }
  });
}

// Show estimate result
function showEstimateResult(data) {
  const resultDiv = document.getElementById('estimate-result');
  const amountDiv = document.getElementById('estimate-amount');
  const form = document.getElementById('trade-in-form');
  
  // Display estimated price
  amountDiv.textContent = `$${data.estimated_price} CAD`;
  
  // Show result section
  form.style.display = 'none';
  resultDiv.classList.remove('hidden');
  
  // Store estimate data for later use
  sessionStorage.setItem('currentEstimate', JSON.stringify(data));
  
  // Handle accept offer
  const acceptBtn = document.getElementById('accept-offer-btn');
  acceptBtn.onclick = function() {
    showDepositPayment(data);
  };
}

// Show deposit payment modal
function showDepositPayment(estimateData) {
  const depositAmount = 29.00;
  
  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; padding: 2rem;">
      <h2 style="margin-bottom: 1rem;">Confirm Trade-In</h2>
      
      <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Estimated Value:</span>
          <strong>$${estimateData.estimated_price} CAD</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Service Fee:</span>
          <span>$${estimateData.service_fee} CAD</span>
        </div>
        <div style="border-top: 1px solid #ddd; margin-top: 0.5rem; padding-top: 0.5rem;">
          <div style="display: flex; justify-content: space-between;">
            <strong>You will receive:</strong>
            <strong>$${(parseFloat(estimateData.estimated_price) - parseFloat(estimateData.service_fee)).toFixed(2)} CAD</strong>
          </div>
        </div>
      </div>
      
      <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #ffd700;">
        <h3 style="margin-bottom: 0.5rem; font-size: 1rem;">Deposit Required</h3>
        <p style="color: #333; margin-bottom: 1rem;">
          A refundable deposit of <strong>$${depositAmount.toFixed(2)} CAD</strong> is required to schedule the engineer pickup service.
        </p>
        <ul style="color: #555; font-size: 0.9rem; padding-left: 1.5rem; margin: 0;">
          <li>Deposit will be refunded after successful device inspection</li>
          <li>Free cancellation before engineer arrives</li>
          <li>Engineer will arrive within 2-3 business days</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Pickup Address</label>
        <input 
          type="text" 
          id="pickup-address" 
          value="University of Ottawa" 
          readonly
          style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5;"
        />
      </div>
      
      <div style="display: flex; gap: 1rem;">
        <button class="btn btn-secondary btn-full" onclick="this.closest('.modal-overlay').remove()">
          Cancel
        </button>
        <button class="btn btn-primary btn-full" id="confirm-deposit-btn">
          Pay $${depositAmount.toFixed(2)} Deposit
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle deposit payment
  document.getElementById('confirm-deposit-btn').onclick = async function() {
    await processDepositPayment(estimateData, depositAmount, modal);
  };
}

// Process deposit payment
async function processDepositPayment(estimateData, depositAmount, modal) {
  const btn = document.getElementById('confirm-deposit-btn');
  btn.disabled = true;
  btn.textContent = 'Processing...';
  
  try {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Request pickup through API
    const pickupResponse = await api.requestPickup(null, {
      location: document.getElementById('pickup-address').value,
      device: estimateData,
      deposit_paid: depositAmount
    });
    
    if (pickupResponse.success) {
      // Close modal
      modal.remove();
      
      // Show engineer notification
      showEngineerNotification(pickupResponse.data);
    } else {
      alert('Payment failed. Please try again.');
      btn.disabled = false;
      btn.textContent = 'Pay $' + depositAmount.toFixed(2) + ' Deposit';
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    alert('Payment failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Pay $' + depositAmount.toFixed(2) + ' Deposit';
  }
}

// Show engineer notification
function showEngineerNotification(pickupData) {
  const notification = document.createElement('div');
  notification.className = 'modal-overlay';
  notification.innerHTML = `
    <div class="modal-content" style="max-width: 500px; padding: 2rem; text-align: center;">
      <div style="width: 80px; height: 80px; background: #4caf50; border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      
      <h2 style="margin-bottom: 1rem;">Payment Successful!</h2>
      
      <p style="color: #555; margin-bottom: 2rem;">
        Your deposit of $29.00 CAD has been received. An engineer has been assigned to pick up your device.
      </p>
      
      <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; text-align: left; margin-bottom: 1.5rem;">
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Pickup ID</div>
          <strong>${pickupData.pickup_id}</strong>
        </div>
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Engineer Assigned</div>
          <strong>${pickupData.engineer_assigned}</strong>
        </div>
        <div style="margin-bottom: 1rem;">
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Estimated Arrival</div>
          <strong>${pickupData.estimated_arrival}</strong>
        </div>
        <div>
          <div style="color: #888; font-size: 0.875rem; margin-bottom: 0.25rem;">Pickup Location</div>
          <strong>${pickupData.pickup_location}</strong>
        </div>
      </div>
      
      <p style="color: #555; font-size: 0.9rem; margin-bottom: 2rem;">
        You will receive a notification when the engineer is on the way. Please have your device ready for inspection.
      </p>
      
      <button class="btn btn-primary btn-full" onclick="window.location.href='./account.html'">
        View My Trade-Ins
      </button>
    </div>
  `;
  
  document.body.appendChild(notification);
}

// Handle image upload
function initImageUpload() {
  const fileInput = document.getElementById('photos');
  const uploadArea = document.getElementById('image-upload-area');
  const previewArea = document.getElementById('image-preview');
  
  if (!fileInput || !uploadArea) return;
  
  uploadArea.onclick = function() {
    fileInput.click();
  };
  
  fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      alert('Maximum 5 photos allowed');
      return;
    }
    
    previewArea.innerHTML = '';
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(file.name + ' is too large. Maximum size is 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(event) {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginRight = '10px';
        previewArea.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}
