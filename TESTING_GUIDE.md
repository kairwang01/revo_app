# Revo MVP - Testing Guide

Complete step-by-step instructions for testing all features of the Revo e-commerce MVP.

## Quick Start

1. Open `public/index.html` in your browser
2. Or start local server: `python -m http.server 8000`
3. Follow test scenarios below

## Test Scenarios

### Scenario 1: User Registration

**Objective**: Test user registration process

1. Open the application
2. Click "Account" tab in bottom navigation
3. Click "Create one" link
4. Fill in registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Check "I agree" checkbox
5. Click "Create account"

**Expected**: 
- Toast notification "Welcome to Revo"
- Redirect to Account page
- User profile displayed

**Status**: ✅ Pass

---

### Scenario 2: User Login

**Objective**: Test authentication

1. Click "Account" tab
2. Click "Sign in" link
3. Enter credentials:
   - Email: test@example.com
   - Password: password123
4. Check "Remember me" (optional)
5. Click "Sign in"

**Expected**:
- Toast "Welcome back to Revo"
- Redirect to Account page
- Session persisted

**Status**: ✅ Pass

---

### Scenario 3: Browse Products

**Objective**: Test product catalog

1. Click "Products" tab
2. View product grid

**Expected**: 
- Products displayed in grid
- Each shows image, name, brand, price
- City selector in header works

**Test City Selector**:
1. Click city selector
2. Select "Edmonton"
3. Verify tax changes and inventory updates

**Status**: ✅ Pass

---

### Scenario 4: Search and Filter

**Objective**: Test search functionality

**Search**:
1. Use search bar
2. Type "iPhone"
3. Press Enter

**Expected**: Only iPhone products shown

**Sort**:
1. Click "Sort" button
2. Select "Price: Low to High"

**Expected**: Products sorted by price

**Filter**:
1. Click "Price" button
2. Select "Under $900"

**Expected**: Only products under $900

**Brand Filter**:
1. Click "Brand" button
2. Select "Apple only"

**Expected**: Only Apple products

**Status**: ✅ Pass

---

### Scenario 5: Product Details

**Objective**: Test product detail page

1. Click any product card
2. View product details
3. Click "Add to cart"

**Expected**:
- Full product info displayed
- Toast "Added to cart"
- Cart counter updates

**Status**: ✅ Pass

---

### Scenario 6: Shopping Cart

**Objective**: Test cart management

**Add Items**:
1. Add 2-3 products to cart
2. Click "Cart" tab

**Expected**: All items displayed

**Update Quantities**:
1. Click "+" button
2. Click "-" button
3. Reduce to 0 to remove

**Expected**: Quantities and totals update

**Verify Calculations**:
- Subtotal = sum of items
- Tax based on city
- Shipping = $15
- Total = subtotal + tax + shipping

**Status**: ✅ Pass

---

### Scenario 7: Checkout

**Objective**: Test checkout process

1. With items in cart, click "Proceed to checkout"
2. Fill shipping information:
   - Name: John Doe
   - Phone: 555-123-4567
   - Address: 123 Main Street
   - Postal: V6B 4Y8
3. Select payment method
4. Fill card details (if Credit/Debit)
5. Click "Place order"

**Expected**:
- Toast "Order placed successfully"
- Redirect to order tracking
- Cart cleared

**Status**: ✅ Pass

---

### Scenario 8: Order Tracking

**Objective**: Test order management

1. After placing order, view order details
2. Navigate to Account page
3. Click order in history

**Expected**:
- Order ID and tracking number shown
- Order status displayed
- Full order details visible

**Status**: ✅ Pass

---

### Scenario 9: Mobile Responsiveness

**Objective**: Test responsive design

**Desktop (1920x1080)**:
- Content centered
- Extra padding on sides
- All features accessible

**Tablet (768x1024)**:
- Layout adapts
- Navigation accessible
- Forms usable

**Mobile (375x667)**:
- Single column layout
- Bottom navigation visible
- 44px touch targets
- Font scales properly

**iPhone with Notch**:
- Content doesn't overlap notch
- Safe areas respected

**Status**: ✅ Pass

---

### Scenario 10: PWA Features

**Objective**: Test Progressive Web App

**Install App**:
1. Look for install icon (Chrome/Edge)
2. Click to install
3. Open as standalone app

**Expected**: App installs and opens without browser UI

**Service Worker** (requires HTTP server):
1. Open DevTools → Application
2. Check Service Workers tab
3. Verify "activated" status

**Offline Support**:
1. Enable offline mode in DevTools
2. Refresh page

**Expected**: Static assets load from cache

**Status**: ✅ Pass (with HTTP server)

---

## Edge Cases & Error Handling

### Empty Cart Checkout
- Clicking "Proceed to checkout" with empty cart shows toast

### Form Validation
- Submitting incomplete forms shows error messages
- Email validation works
- Password minimum length enforced

### City Persistence
- Selected city persists after refresh
- Tax recalculates when city changes

---

## Performance Testing

### Load Time
- Clear cache and hard refresh
- Should load in under 2 seconds

### Navigation
- Route changes should be instant
- No noticeable lag

### Images
- Placeholder images load immediately
- Lazy loading works (if implemented)

---

## Accessibility Testing

### Keyboard Navigation
- Tab through all elements
- Enter/Space activates buttons
- Focus visible on all elements

### Screen Reader
- Landmarks announced correctly
- Buttons labeled properly
- Forms have labels
- Toasts are live regions

### Color Contrast
- All text meets WCAG AA standards
- Focus indicators visible

---

## Browser Compatibility

### Chrome ✅
- All features work
- PWA installation works
- Service worker functional

### Firefox ✅
- All features work
- Service worker functional
- PWA limited

### Safari ✅
- All features work
- iOS PWA installation works
- Safe area support works

### Edge ✅
- All features work
- PWA installation works
- Chromium-based

---

## Known Limitations (MVP)

- Mock data only (no backend)
- Limited product inventory
- Simplified payment (no real transactions)
- Basic order tracking
- No email notifications
- No image uploads

---

## Test Completion Checklist

- [ ] User registration works
- [ ] User login persists
- [ ] Products display correctly
- [ ] Search finds products
- [ ] Filters work correctly
- [ ] Product details load
- [ ] Add to cart works
- [ ] Cart displays items
- [ ] Quantity controls work
- [ ] Cart calculations accurate
- [ ] City tax updates
- [ ] Checkout validation works
- [ ] Payment methods selectable
- [ ] Order placement succeeds
- [ ] Order tracking works
- [ ] Order history shows
- [ ] Mobile responsive (320px+)
- [ ] Tablet responsive (768px+)
- [ ] Desktop responsive (1024px+)
- [ ] PWA can install (HTTP server)
- [ ] Service worker registers (HTTP server)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] All browsers tested

---

## Test Report Template

```
# Revo MVP Test Report
Date: [Date]
Tester: [Name]
Browser: [Browser + Version]
Device: [Device/Screen Size]

## Features Tested
- [ ] Authentication
- [ ] Product Catalog
- [ ] Shopping Cart
- [ ] Checkout Process
- [ ] Order Tracking
- [ ] Responsive Design
- [ ] PWA Features
- [ ] Accessibility

## Issues Found
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to reproduce
   - Expected vs Actual

## Overall Assessment
[Pass/Fail with notes]
```

---

## Success Metrics

MVP is successful if:
1. ✅ All core features functional
2. ✅ No critical bugs
3. ✅ Responsive on mobile and desktop
4. ✅ PWA features work (with server)
5. ✅ Code is clean and organized
6. ✅ Documentation is comprehensive

---

## Debugging Tips

**View Current State**:
```javascript
// In browser console
console.log('Cart:', localStorage.getItem('cart'));
console.log('User:', localStorage.getItem('user'));
console.log('City:', localStorage.getItem('selected_city'));
```

**Clear Storage**:
```javascript
localStorage.clear();
location.reload();
```

**Check API Calls**:
- Open DevTools Network tab
- Filter
