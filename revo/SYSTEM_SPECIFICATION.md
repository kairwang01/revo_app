# Revo Platform - C2B2C System Specification

## 1. Overview

Revo is an electronics trade-in and resale platform following the C2B2C model (Consumer-to-Business-to-Consumer), similar to Aihuishou.

**Business Flow:**
- Users sell used devices → Platform purchases → Inspection & Refurbishment → Platform resells

## 2. Five-Stage Process

### Stage 1: User Initiation
**Goal:** Collect device info and generate initial quotation

**Steps:**
1. User selects device category (phone, tablet, laptop, etc.)
2. User answers condition questions (power-on, scratches, battery health)
3. System generates estimated price using AI pricing algorithm
4. User clicks "Confirm Trade-In" to create order

**Frontend Pages:**
- `sell.html` - Device selection and condition form
- API endpoint: `POST /api/quote`

**Request Example:**
```json
{
  "category": "phone",
  "brand": "Apple",
  "model": "iPhone 13 Pro",
  "storage": "256GB",
  "condition": {
    "powerOn": true,
    "screenCracks": false,
    "batteryHealth": 85
  }
}
```

---

### Stage 2: Online Quotation and Order Creation
**Goal:** Create complete order and choose shipping method

**Steps:**
1. System creates order record with preliminary price
2. User enters name, phone, and address
3. User chooses logistics method:
   - Door pickup
   - Self-delivery by mail
   - Store drop-off
4. System confirms estimated pickup time and displays order summary

**Frontend Pages:**
- Order confirmation page (extend `checkout.html`)
- API endpoints: `POST /api/order/create`, `PUT /api/order/update`

**Request Example:**
```json
{
  "userId": 123,
  "deviceQuote": {
    "quoteId": "Q123456",
    "estimatedPrice": 450.00
  },
  "userInfo": {
    "name": "John Doe",
    "phone": "+1-555-1234",
    "address": "123 Main St, Ottawa ON"
  },
  "logistics": {
    "method": "door_pickup",
    "preferredTime": "2025-10-25 14:00"
  }
}
```

---

### Stage 3: Pickup and Inspection
**Goal:** Collect device and perform official inspection

**Steps:**
1. Courier picks up device
2. Device arrives at Inspection Center
3. Technicians perform 280+ quality checks:
   - Appearance (scratches, cracks)
   - Functional tests (screen, touch, camera, battery)
   - Data wipe and safety
4. Digital Inspection Report generated

**Frontend Pages:**
- `order-tracking.html` - Status tracking page showing:
  - Pickup → In Transit → Inspection → Completed
- API endpoint: `GET /api/report/{order_id}`

**Response Example:**
```json
{
  "orderId": "ORD123456",
  "status": "inspected",
  "report": {
    "appearance": {
      "scratches": "minor",
      "cracks": "none",
      "grade": "99%"
    },
    "functionality": {
      "screen": "normal",
      "touch": "normal",
      "camera": "normal",
      "battery": "excellent",
      "wifi": "working"
    },
    "finalGrade": "99% NEW",
    "timestamp": "2025-10-23T10:30:00Z"
  }
}
```

---

### Stage 4: Price Confirmation and Payment
**Goal:** Confirm final quote and pay user

**Steps:**
1. User receives inspection report and final price
2. Decision flow:
   - **Price = Initial Quote** → Automatic payment
   - **Price Decreased** → User can accept or reject
     - Accept → Payment processed
     - Reject → Return shipment created

**Frontend Pages:**
- Price confirmation dialog on `orders.html`
- API endpoints: `GET /api/quote/final`, `POST /api/payment/confirm`

**Response Example:**
```json
{
  "orderId": "ORD123456",
  "initialQuote": 450.00,
  "finalQuote": 420.00,
  "reason": "Battery health lower than expected",
  "options": ["accept", "reject"]
}
```

---

### Stage 5: Refurbishment and Resale
**Goal:** Refurbish device and resell through B2C channels

**Steps:**
1. Qualified devices enter refurbishment center
2. Replace damaged parts, clean, reinstall system
3. Mark as "Certified Used Device"
4. List on marketplace with new price
5. Sync stock and track profit

**Frontend Pages:**
- `products.html` - Display refurbished devices for buyers
- `product-detail.html` - Show detailed inspection report and specs
- API endpoint: `GET /api/store/list`

**Response Example:**
```json
{
  "products": [
    {
      "id": "P12345",
      "originalOrderId": "ORD123456",
      "brand": "Apple",
      "model": "iPhone 13 Pro",
      "condition": "99% NEW",
      "buyingPrice": 420.00,
      "refurbishCost": 30.00,
      "sellingPrice": 599.00,
      "profit": 149.00,
      "stock": 1,
      "certified": true
    }
  ]
}
```

---

## 3. System Modules

| Module | Description | Key Endpoints |
|--------|-------------|---------------|
| User Management | Registration, login, authentication | `/api/user/*` |
| Device Valuation | Estimate price using algorithm | `/api/quote` |
| Order Management | Create and track trade-in orders | `/api/order/*` |
| Inspection System | Handle quality inspection and reports | `/api/report/*` |
| Payment Service | Handle payout and refund | `/api/payment/*` |
| Refurbishment & Inventory | Manage refurbished devices | `/api/inventory/*` |
| Notification | Send email/app updates | `/api/notify/*` |
| Analytics | Data for sales, return rate, profit | `/api/analytics/*` |

---

## 4. Data Structure (SQL Schema)

### Tables

**users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**devices**
```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  model VARCHAR(100),
  brand VARCHAR(50),
  category VARCHAR(20),
  specs JSONB,
  base_price DECIMAL(10,2)
);
```

**orders**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  device_id INT REFERENCES devices(id),
  quote_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**reports**
```sql
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  inspection_results JSONB,
  condition_score INT,
  final_grade VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**payments**
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  method VARCHAR(20),
  amount DECIMAL(10,2),
  status VARCHAR(20),
  transaction_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**inventory**
```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  device_id INT REFERENCES devices(id),
  source_order_id INT REFERENCES orders(id),
  refurbish_status VARCHAR(20),
  buying_price DECIMAL(10,2),
  refurbish_cost DECIMAL(10,2),
  resale_price DECIMAL(10,2),
  stock INT DEFAULT 1,
  listed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Order Status Flow

```
created → in_pickup → in_transit → inspecting → 
awaiting_confirmation → confirmed → paid/returned → 
refurbished → resold
```

**Status Definitions:**
- `created` - Order initiated, awaiting pickup
- `in_pickup` - Courier dispatched
- `in_transit` - Device en route to inspection center
- `inspecting` - Under quality inspection
- `awaiting_confirmation` - User needs to confirm final price
- `confirmed` - User accepted final price
- `paid` - Payment processed to user
- `returned` - User rejected, device returned
- `refurbished` - Device refurbished and ready for resale
- `resold` - Device sold to new customer

---

## 6. Business Logic

### Profit Calculation
```
Profit = Resale Price - (Buying Price + Logistics Cost + Refurbish Cost + Platform Fee)
```

**Example:**
- Buying Price: $420
- Logistics: $10
- Refurbish: $30
- Platform Fee: $10
- Total Cost: $470
- Resale Price: $599
- **Profit: $129**

### Pricing Algorithm Factors
1. Device age and model
2. Market demand
3. Condition score (0-100%)
4. Competitor pricing
5. Seasonal trends
6. Brand reputation

---

## 7. Frontend Development Scope

### Existing Pages to Enhance:
1. **sell.html** - Add full C2B flow:
   - Device selection wizard
   - Condition questionnaire
   - Initial quote display
   - Order creation form

2. **orders.html** - Add trade-in orders:
   - Separate tabs for "Buy Orders" and "Sell Orders"
   - Status tracking
   - Price confirmation UI

3. **order-tracking.html** - New page for tracking:
   - Visual timeline
   - Real-time status updates
   - Inspection report viewer

4. **products.html** - Display refurbished devices:
   - Filter by condition grade
   - Show certification badges

5. **product-detail.html** - Enhanced with:
   - Quality inspection report section
   - Condition grade visualization
   - Warranty information

### API Integration Points (Frontend Only)

All API calls use placeholder mock responses for now:

```javascript
// TODO: bind to Python FastAPI backend
const response = await fetch('/api/quote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer mock.jwt.token'
  },
  body: JSON.stringify(quoteData)
});
```

---

## 8. Backend Optimization Goals (Agent Task)

The backend agent should implement:

1. **Automated Quotation Engine**
   - ML model for pricing
   - Real-time market data integration
   - Dynamic pricing adjustments

2. **Inspection Workflow Automation**
   - Digital inspection form templates
   - Automated report generation
   - Photo upload and storage

3. **Payment Processing**
   - Multiple payment gateways (Stripe, PayPal)
   - Automatic payout on confirmation
   - Refund handling

4. **Inventory Management**
   - Stock tracking
   - Automatic listing to marketplace
   - Price optimization

5. **Analytics Dashboard**
   - Daily trade-in volume
   - Average profit per device
   - Return rate tracking
   - Customer satisfaction metrics

---

## 9. Frontend-Backend Contract

### API Endpoints Summary

#### Quote & Valuation
- `POST /api/quote` - Generate initial quote
- `GET /api/quote/{id}` - Get quote details
- `POST /api/quote/confirm` - Confirm and create order

#### Order Management
- `POST /api/order/create` - Create new trade-in order
- `GET /api/order/{id}` - Get order details
- `PUT /api/order/{id}` - Update order
- `GET /api/order/user/{userId}` - List user's orders

#### Inspection & Reports
- `POST /api/report/create` - Submit inspection report
- `GET /api/report/{orderId}` - Get inspection report
- `POST /api/report/photos` - Upload inspection photos

#### Payment
- `POST /api/payment/confirm` - Confirm payment
- `GET /api/payment/{orderId}` - Get payment status
- `POST /api/payment/refund` - Process refund

#### Inventory & Resale
- `GET /api/store/list` - List refurbished products
- `GET /api/store/product/{id}` - Get product details
- `POST /api/store/purchase` - Buy refurbished device

#### Logistics
- `POST /api/logistics/schedule` - Schedule pickup
- `GET /api/logistics/track/{orderId}` - Track shipment

---

## 10. Quality Assurance Standards

### Inspection Criteria (280+ Checkpoints)

**Appearance (2 items):**
- Scratches severity (none/minor/moderate/severe)
- Dents/cracks (none/minor/moderate/severe)

**Functional Tests (36 items):**
- Display test
- Touch response
- Camera (front/rear)
- Audio (speaker/microphone)
- Connectivity (WiFi/Bluetooth/Cellular)
- Sensors (GPS/Accelerometer/Gyroscope)
- Buttons (Power/Volume/Home)
- Ports (Charging/Headphone)
- Face ID / Touch ID
- Battery health
- ...and more

**Grade Categories:**
- **99% NEW** - Almost no signs of use
- **95% NEW** - Minimal cosmetic wear
- **90% NEW** - Light usage marks
- **80% NEW** - Moderate wear, fully functional
- **70% NEW** - Noticeable wear, minor issues possible

---

## 11. Trust & Safety Features

1. **Inspection Transparency**
   - Every device gets unique report ID
   - Photos at each inspection stage
   - PDF certificate downloadable

2. **Price Protection**
   - If final < initial, user must approve
   - Clear explanation of price changes
   - Option to reject and return

3. **Payment Security**
   - Escrow-style holding
   - Released only after confirmation
   - Multiple payout methods

4. **Resale Warranty**
   - 1-year warranty on all resold devices
   - 7-day no-questions return
   - Official invoice provided

---

## 12. Tech Stack

### Frontend (Current)
- HTML5 + CSS3 + Vanilla JavaScript
- No frameworks
- Progressive Web App (PWA) ready
- Offline-capable with Service Worker

### Backend (To Be Implemented by Agent)
- **Python FastAPI** - Main API server
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Celery** - Background tasks
- **TensorFlow/PyTorch** - ML pricing model
- **AWS S3** - Photo storage
- **Stripe/PayPal** - Payment processing

---

## 13. Future Enhancements

1. **Mobile App** - Native iOS/Android
2. **Live Chat** - Customer support
3. **Video Inspection** - Remote evaluation
4. **Blockchain** - Ownership and authenticity tracking
5. **AI Chatbot** - Automated customer service
6. **Multi-language** - International expansion

---

## End of Specification
</content>
