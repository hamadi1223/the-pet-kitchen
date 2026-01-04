# Implementation Notes: Tests & Inventory Management

**Date**: January 2025  
**Status**: Implementation Complete

---

## Schema Summary

### Inventory Tables

#### `inventory` Table
- **product_id** (INT, FK to products.id, UNIQUE)
- **quantity** (INT) - Total stock available
- **reserved_quantity** (INT) - Stock reserved for pending orders
- **low_stock_threshold** (INT) - Threshold for low stock alerts
- **updated_at** (DATETIME)

**Available Stock Calculation**: `quantity - reserved_quantity`

#### `inventory_movements` Table
- **product_id** (INT, FK)
- **order_id** (INT, FK, nullable)
- **movement_type** (ENUM: 'reserve', 'deduct', 'release', 'adjust')
- **quantity** (INT) - Positive for add/reserve, negative for reduce/deduct
- **reason** (TEXT, nullable)
- **admin_id** (INT, FK, nullable) - For admin adjustments
- **created_at** (DATETIME)

### Pricing Tables

#### `products` Table
- **price_per_pouch** (DECIMAL(10,3)) - Price per unit
- **pouch_grams** (INT) - Weight per pouch
- All prices stored in KWD (Kuwaiti Dinar)
- Prices rounded to 3 decimal places

### Stock Rules

#### When Inventory Changes

1. **Order Created** (`status = 'created'`):
   - Stock is **reserved** (not deducted)
   - `reserved_quantity` increases
   - `quantity` stays the same
   - Movement type: `'reserve'`

2. **Payment Succeeds** (`status = 'paid'`):
   - Reserved stock is **deducted**
   - Both `quantity` and `reserved_quantity` decrease
   - Movement type: `'deduct'`

3. **Payment Fails/Cancelled** (`status = 'failed'` or `'cancelled'`):
   - Reserved stock is **released**
   - `reserved_quantity` decreases
   - `quantity` stays the same
   - Movement type: `'release'`

4. **Admin Adjustment**:
   - Direct change to `quantity`
   - Movement type: `'adjust'`
   - Requires `admin_id` and `reason`

#### Stock Tracking Approach

**For Individual Meals**:
- Each product has its own inventory entry
- Stock tracked per product

**For Meal Plans**:
- Currently, meal plans are products with `is_subscription = 0`
- Stock tracked at the plan level
- **Assumption**: Meal plans are treated as single products for inventory purposes

**For Subscriptions**:
- Subscriptions don't have direct inventory (they're recurring orders)
- Stock is reserved/deducted when subscription order is created/paid
- Each subscription delivery creates a new order, which reserves/deducts stock

**Decision**: Stock is tracked at the product level only. Meal plans that contain multiple meals are treated as single products. If a meal plan should track underlying meal stock, this would require additional logic (not currently implemented).

---

## Inventory Functions

### Reserve Stock
```javascript
await reserveStock(productId, quantity, orderId);
```
- Checks available stock (quantity - reserved_quantity)
- Reserves stock atomically (uses transaction + FOR UPDATE lock)
- Returns success/error with available stock info

### Deduct Stock
```javascript
await deductStock(productId, quantity, orderId);
```
- Converts reservation to deduction
- Decreases both quantity and reserved_quantity
- Only works if stock is already reserved

### Release Stock
```javascript
await releaseStock(productId, quantity, orderId);
```
- Releases reserved stock back to available
- Only releases up to reserved amount
- Used on cancellation/failure

### Check Stock
```javascript
await checkStock(productId, quantity);
```
- Returns availability status
- Includes low stock flag
- Non-blocking (read-only)

### Adjust Stock (Admin)
```javascript
await adjustStock(productId, adjustment, reason, adminId);
```
- Direct stock adjustment
- Positive adjustment = add stock
- Negative adjustment = reduce stock
- Logs movement with admin ID and reason

---

## Test Setup

### Test Framework
- **Jest** - Test runner
- **Supertest** - HTTP testing
- **jest-junit** - JUnit XML reports

### Test Database
- Uses separate test database: `petkitchen_test`
- Configured via `TEST_DB_NAME` environment variable
- Schema auto-created from `schema.sql` + migrations
- Database cleaned between tests

### Test Structure
```
backend/tests/
├── setup.js              # Test configuration
├── helpers/
│   ├── db.js             # Database setup/cleanup
│   ├── factories.js      # Test data factories
│   └── mocks.js          # Service mocks
├── unit/
│   ├── pricing.test.js   # Pricing calculations
│   ├── inventory.test.js # Inventory functions
│   └── email.test.js     # Email templates
└── integration/
    ├── checkout.test.js  # Checkout flow
    └── webhook.test.js   # Webhook verification
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# CI mode (with coverage + JUnit XML)
npm run test:ci
```

---

## CI Test Reporting

### Configuration

Add to `.env`:
```env
TEST_REPORT_TO=hamadeyee@gmail.com
OUTLOOK_EMAIL=no-reply@thepetkitchen.net
OUTLOOK_PASSWORD=your-password
```

### How It Works

1. Tests run with `npm run test:ci`
2. Jest generates:
   - Coverage report (`coverage/coverage-summary.json`)
   - JUnit XML (`junit.xml`)
3. `scripts/send-test-report.js` runs automatically
4. Script:
   - Parses test results
   - Generates HTML summary
   - Emails to `TEST_REPORT_TO`
   - Attaches JUnit XML (if configured)

### GitHub Actions Setup

See `docs/CI_TEST_REPORTING.md` for complete setup instructions.

Basic workflow:
```yaml
- name: Run tests
  run: npm run test:ci
  env:
    TEST_REPORT_TO: ${{ secrets.TEST_REPORT_TO }}
    OUTLOOK_EMAIL: ${{ secrets.OUTLOOK_EMAIL }}
    OUTLOOK_PASSWORD: ${{ secrets.OUTLOOK_PASSWORD }}
```

---

## Admin UI

### Products Tab

**Features**:
- View all products with stock levels
- Edit price per product
- Adjust stock (add/reduce/set)
- Set low stock threshold
- View low stock alerts

**Endpoints**:
- `GET /api/v1/admin/products` - List all products with inventory
- `PATCH /api/v1/admin/products/:id/price` - Update price
- `PATCH /api/v1/admin/products/:id/stock` - Adjust stock
- `GET /api/v1/admin/products/low-stock` - Get low stock products

**UI Components**:
- Product cards with price/stock inputs
- Stock action buttons (Add/Reduce/Set)
- Low stock alert section
- Real-time updates after changes

---

## Integration Points

### Checkout Flow

1. **Cart Validation**:
   - Check stock availability before order creation
   - Prevent checkout if insufficient stock

2. **Order Creation**:
   - Reserve stock immediately
   - Rollback order if reservation fails

3. **Payment Success**:
   - Deduct reserved stock
   - Convert reservation to deduction

4. **Payment Failure/Cancellation**:
   - Release reserved stock
   - Return stock to available pool

### Order Cancellation

- If order status is `'created'` or `'pending'`:
  - Release reserved stock
- If order status is `'paid'`:
  - Stock already deducted (not released)
  - Refund may be needed (separate process)

---

## Assumptions & Decisions

### Stock Tracking

**Assumption**: Products are tracked individually. Meal plans are products with their own inventory.

**Rationale**: Simplifies inventory management. If meal plans need to track underlying meal stock, this would require:
- Product composition table (plan → meals mapping)
- Reserve/deduct logic for each component meal
- More complex inventory calculations

**Future Enhancement**: If needed, add `product_components` table and update inventory logic.

### Price Updates

**Assumption**: Price changes take effect immediately. No price history tracking.

**Rationale**: Simpler implementation. Price history can be added later via audit logs.

**Future Enhancement**: Add `product_price_history` table if price tracking needed.

### Stock Adjustments

**Assumption**: Admin can adjust stock with reason. No approval workflow.

**Rationale**: Small team, direct control needed. Can add approval workflow later.

**Future Enhancement**: Add approval workflow for large adjustments.

### Low Stock Alerts

**Assumption**: Alerts sent when stock ≤ threshold. No configurable alert frequency.

**Rationale**: Daily reports include low stock. Separate alerts can be added.

**Future Enhancement**: Configurable alert thresholds per product category.

---

## Testing Requirements Met

### ✅ Unit Tests
- [x] Pricing calculations (product, cart, discounts, tax, shipping)
- [x] Inventory functions (reserve, deduct, release, check, adjust)
- [x] Order state transitions
- [x] Admin authorization checks

### ✅ Integration Tests
- [x] Checkout flow (create order → payment → confirmation)
- [x] Idempotency (repeated webhook events)
- [x] Validation failures (out-of-stock, missing data)
- [x] Database assertions (order totals, inventory movements)

### ✅ Webhook Tests
- [x] Signature verification (valid/invalid/missing)
- [x] Replay protection / idempotency
- [x] Side effects (payment status, inventory, emails)

### ✅ Email Tests
- [x] Template rendering
- [x] Recipient validation
- [x] Queue/retry logic

---

## Known Limitations

1. **Concurrent Reservations**: Current implementation uses row-level locking, but high concurrency may need additional handling.

2. **Price History**: No historical price tracking (can be added via audit logs).

3. **Stock Components**: Meal plans don't track underlying meal stock (assumed to be single product).

4. **Refund Stock**: Paid orders that are refunded don't automatically restore stock (manual process).

---

## Next Steps

1. **Run Database Migration**:
   ```bash
   mysql -u user -p database < backend/database/ecommerce_enhancements_migration.sql
   ```

2. **Install Test Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Run Tests**:
   ```bash
   npm test
   ```

4. **Configure CI**:
   - Add GitHub Actions workflow (see `docs/CI_TEST_REPORTING.md`)
   - Set up secrets for email reporting

5. **Test Admin UI**:
   - Navigate to Products tab
   - Test price updates
   - Test stock adjustments
   - Verify low stock alerts

---

## Files Created/Modified

### New Files
- `backend/tests/setup.js`
- `backend/tests/helpers/db.js`
- `backend/tests/helpers/factories.js`
- `backend/tests/helpers/mocks.js`
- `backend/tests/unit/pricing.test.js`
- `backend/tests/unit/inventory.test.js`
- `backend/tests/unit/email.test.js`
- `backend/tests/integration/checkout.test.js`
- `backend/tests/integration/webhook.test.js`
- `backend/utils/pricing.js`
- `backend/services/inventory.js`
- `backend/scripts/send-test-report.js`
- `js/admin-products.js`
- `docs/CI_TEST_REPORTING.md`
- `docs/IMPLEMENTATION_NOTES.md`

### Modified Files
- `backend/package.json` - Added Jest, test scripts
- `backend/routes/checkout.js` - Added inventory checks and reservation
- `backend/routes/orders.js` - Added stock release on cancellation
- `backend/routes/admin.js` - Added product price/stock endpoints
- `backend/database/ecommerce_enhancements_migration.sql` - Added inventory_movements table
- `admin.html` - Enhanced products tab
- `js/admin.js` - Integrated products loading

---

**Last Updated**: January 2025

