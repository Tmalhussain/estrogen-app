# Estrogen Pharmacy — Specification Part 2
## Sections 6–9: Dashboards, POS Integration, Workflows

---

# 6. Pharmacist Dashboard Features

## 6.1 Login and Authentication
- Pharmacist accounts are created exclusively by Admin
- Login: email + password
- 2FA enforced on all pharmacist accounts (OTP via SMS or TOTP authenticator app)
- Session inactivity timeout: 30 minutes
- Device trust: new device login requires secondary verification
- Failed login lockout: 5 attempts → 15-minute lockout, admin alerted

## 6.2 Dashboard Overview Screen

The pharmacist dashboard home screen displays:
- **Queue Summary:** Total pending prescriptions, pending today, average review time today
- **Order Status Summary:** Orders awaiting action, orders in packing, delivered today
- **Alerts:** Stock concern flags, held orders awaiting patient response
- **Quick Actions:** "Open Next Prescription", "View All Orders"
- **Shift Status:** If shift system is enabled — shift start/end time, assigned queue

---

## 6.3 Prescription Queue

### Queue Display
- List of all pending prescriptions ordered by: submission time (oldest first, configurable)
- Each queue item shows:
  - Order ID
  - Patient alias (not full name, for privacy-by-default — admin-configurable)
  - Products requested (list)
  - Upload time
  - Current status badge (Pending / Hold / Substitution Pending)
- Pharmacist opens a prescription item to enter review mode

### Review Mode
Full-screen prescription review interface:
- **Left panel:** Prescription image viewer (zoomable, rotatable, multi-page)
- **Right panel:** Order details
  - Ordered products with generic names, strengths, quantities
  - Patient's declared allergies and medical notes (read-only)
  - Patient's pregnancy/breastfeeding status if declared
  - Previous orders for this patient (last 3, read-only summary)
- **Action buttons:** Approve | Reject | Hold | Substitute | Escalate

---

## 6.4 Approval Flow

### Approve
1. Pharmacist reviews prescription image
2. Verifies product match, dosage, physician signature, date
3. Clicks "Approve"
4. Optional: add pharmacist note (patient-visible)
5. Optional: add internal note (admin-visible only)
6. Order status → "Approved" → fulfillment team notified
7. Patient receives push + SMS notification: "Your prescription has been approved. Your order is being prepared."
8. Action logged in audit log with pharmacist ID and timestamp

### Reject
1. Pharmacist identifies issue (illegible, expired, mismatch)
2. Clicks "Reject"
3. Must select rejection reason from dropdown:
   - Prescription illegible
   - Prescription expired
   - Prescription does not match ordered product
   - Prescription lacks required information (missing stamp, date, etc.)
   - Controlled substance — special process required
4. Optional: add message to patient
5. Order status → "Rejected"
6. Patient notified with reason
7. Patient can resubmit a corrected prescription

### Hold
1. Pharmacist needs additional information
2. Clicks "Hold"
3. Enters message for patient (e.g., "Please upload a clearer image of your prescription")
4. Order status → "Held"
5. Patient receives notification with pharmacist message
6. Patient responds (Phase 2: in-app chat; MVP: patient resubmits via app)

### Substitute
1. Ordered product is out of stock or pharmacist identifies clinical reason for substitution
2. Pharmacist clicks "Suggest Substitution"
3. Search for replacement product in catalog (same active ingredient, different brand or strength)
4. Enter reason for substitution
5. Patient notified: "Pharmacist has suggested an alternative — [Product Name]. Accept or Decline?"
6. Patient responds → if accept: order updated; if decline: order returned to pharmacist for further action

### Escalate
1. Order requires admin-level decision (controlled substance, unusual case, suspected fraud)
2. Pharmacist clicks "Escalate to Admin"
3. Enter escalation notes
4. Admin receives alert
5. Order placed in "Escalated" state — no further pharmacist action required until admin resolves

---

## 6.5 Order Review Access

Pharmacists can view (not edit) the following for any order they are assigned:
- Order items and quantities
- Delivery address (city/district only for privacy — full address accessible only to fulfillment team)
- Payment status (paid / unpaid only — not payment details)
- Order notes from customer
- Prescription documents

Pharmacists cannot view:
- Credit card numbers or banking details
- Full personal contact information beyond what's needed for order context
- Other pharmacists' queues (unless admin grants cross-access)
- Financial or business analytics

---

## 6.6 Stock Visibility

- Pharmacist can view current stock level for any product they are actively reviewing
- Stock display: "In Stock", "Low Stock (X units remaining)", "Out of Stock"
- Pharmacist can flag a product: "Stock concern — please verify" → admin notified
- Pharmacist cannot edit stock quantities, prices, or product details

---

## 6.7 Pharmacist Activity Logs

Each pharmacist has a personal activity log visible to them and to admin:
- Prescriptions reviewed (count per day/week)
- Average review time
- Approvals, rejections, holds, substitutions (counts and rates)
- Escalations
- Messages sent to patients

Pharmacists can view their own log. Admins can view all pharmacist logs.

---

## 6.8 Shift-Based Assignment (Phase 2)

- Admin configures shifts (e.g., Morning: 8am–4pm, Evening: 4pm–12am)
- Pharmacists are assigned to shifts
- Queue auto-assigns new prescriptions to on-shift pharmacists in round-robin order
- Off-shift pharmacists cannot receive new queue items but can complete in-progress reviews

---

## 6.9 What Pharmacists Can Edit vs. View-Only vs. Cannot Access

| Item | Pharmacist Access Level |
|---|---|
| Prescription images | View + zoom/rotate |
| Patient allergy/medical notes | View only (read-only) |
| Order items | View only |
| Prescription status | Edit (approve/reject/hold) |
| Pharmacist notes (patient-visible) | Create/edit own |
| Internal notes | Create/edit own |
| Product stock levels | View only |
| Product catalog | View only |
| Pricing | View only |
| User contact information | Limited view (alias) |
| Other pharmacists' queues | No access (unless granted by admin) |
| Admin settings | No access |
| Financial data | No access |
| Audit logs (full) | No access |
| Own activity log | View only |

---

# 7. Admin Dashboard Features

## 7.1 User Management

### User List
- Search users by: name, phone, email, account status, registration date, order count
- Filter by: active, inactive, flagged, verified, unverified
- Export user list to CSV

### User Detail View
- Personal profile information
- Account status (active/disabled/deleted)
- Order history summary
- Prescription history summary
- Support tickets linked to account
- Internal support notes (admin-editable)
- Account flags (e.g., "Suspected fraud", "Duplicate account")
- Last login date and device type

### User Actions
- Disable account (user cannot log in; data retained)
- Delete account (soft delete; 30-day recovery window)
- Force password reset
- Override delivery address for fulfillment issues
- Add internal support note
- View full order and prescription history

### KYC / Identity Verification
- National ID or Iqama number field (optional at registration; may be required for prescription orders — must be validated with compliance advisor)
- Verification status: unverified / pending / verified
- Admin can mark as verified after manual review
- Document storage: encrypted, access-controlled

---

## 7.2 Pharmacist Management

### Pharmacist List
- Name, email, license number, status (active/inactive), last active, queue count
- Filter by: active/inactive, shift, queue load

### Pharmacist Profile
- Full name, email, phone
- License number and expiry date
- Pharmacy council registration status
- Shift assignment
- Active order count
- Performance summary (approvals/rejections/average review time)

### Pharmacist Actions
- Add new pharmacist (email invite → account setup)
- Edit pharmacist profile
- Deactivate/reactivate account
- Reassign pending queue items to another pharmacist
- View full activity log
- Set permissions override (e.g., grant cross-queue access)

### License Tracking
- License expiry date field
- Automated alert: 30 days before expiry → admin notified
- Expired license: pharmacist account auto-suspended pending renewal confirmation

---

## 7.3 Product and Catalog Management

### Product List
- Table view: product name (AR/EN), category, brand, SKU, price, stock status, prescription required, active/inactive
- Search and filter: name, category, brand, stock status, prescription flag
- Bulk actions: activate, deactivate, update category, export

### Product Detail / Edit
- Product name (Arabic — required, English — optional)
- Short description (Arabic + English)
- Full description (rich text editor, Arabic-first)
- Category assignment (primary + subcategory)
- Brand
- SKU (must match POS SKU)
- Barcode (optional)
- Price (VAT-inclusive display; VAT-exclusive storage)
- Discount price and date range
- Prescription required: yes/no toggle
- Age restrictions: none / 18+ / requires consultation
- Health tags: pregnancy-safe / breastfeeding-safe / avoid in pregnancy / consult pharmacist
- Chronic condition tags: for condition-based filtering
- Images: upload, reorder, delete (max 8 images per product)
- Storage/handling instructions
- Pharmacist note: admin-editable content displayed on product page
- Status: active / inactive / hidden / out of stock (manual override)

### Categories
- Create/edit/delete categories and subcategories
- Assign icon and display image
- Set display order
- Activate/deactivate

### Product Bundles (Phase 2)
- Create bundle: select products + set bundle price
- Bundle SKU auto-generated
- Inventory deducted at item level when bundle is purchased

### Brands
- Create/edit/delete brands
- Brand name (AR/EN), brand description, logo image
- Associate products with brand

---

## 7.4 Order Management

### Order List
- All orders across all states
- Filter: date range, status, order type (OTC/prescription), customer, pharmacist, delivery zone
- Search by order ID, customer name/phone
- Export to CSV/Excel

### Order Detail View
- Order ID, creation timestamp, customer details
- Order items, quantities, prices
- Prescription documents (if applicable)
- Pharmacist review notes
- Payment status and method
- Delivery address and zone
- Status history (timestamped state changes)
- Customer note
- Internal admin notes

### Order Actions
- Override status manually (with mandatory reason note for audit)
- Cancel order (pre-fulfillment)
- Initiate refund
- Reassign to different pharmacist
- Flag order (suspected fraud, compliance issue)
- Add internal admin note

### Order State Machine

```
Placed → [Prescription Required? Yes → Pharmacist Review] → Approved → Packing → Ready for Courier → Out for Delivery → Delivered
                                                            ↓ Rejected → Customer Notified → Resubmit or Cancel
                                         [No Prescription → Direct to Packing]
```

### Cancellations
- Before pharmacist approval: customer or admin can cancel
- After approval but before packing: admin can cancel with mandatory note
- After packing begins: cancellation requires manager approval (configurable role)
- After dispatch: cannot cancel; must process as return after delivery

### Refunds
- Admin initiates refund from order detail
- Refund amount: full or partial
- Refund to: original payment method
- Processing time: depends on payment gateway (typically 5–10 business days — must align with gateway SLA)
- Refund reason recorded for audit

---

## 7.5 Inventory and Stock Monitoring

### Synced Stock View
- Table of all products with: SKU, name, synced stock quantity, last sync time, sync source (POS name)
- Filter: low stock, out of stock, sync error
- Color coding: green (>10 units), orange (1–10 units), red (0 units)

### Manual Override
- Admin can manually set stock quantity for a product (override POS sync)
- Override is flagged visually: "Manual Override — Last synced: [time]"
- Override reason recorded
- Next successful POS sync will clear override unless "lock" flag is set

### Low Stock Alerts
- Admin-configurable threshold per product or category (e.g., alert when stock < 5 units)
- Alert channels: in-dashboard notification + email + SMS to admin
- Pharmacist sees low-stock indicator when processing an order for that product

### Out-of-Stock Behavior
- Product is marked out-of-stock on app (no add-to-cart)
- User can tap "Notify me when available" → saved; admin notified when restock occurs
- Admin can configure: auto-hide out-of-stock products vs. show with out-of-stock label

### Stock Reconciliation
- Admin can trigger manual reconciliation: compare app database stock vs. POS stock
- Discrepancy report generated
- Admin resolves discrepancy: accept POS value or accept app value or manual override

### Sync Error Logs
- Every sync event logged: timestamp, status (success/failure), records synced, error message if failed
- Admin can filter errors, view details, retry failed syncs
- Email alert to admin if sync fails 3 consecutive times

---

## 7.6 Content Management

### Banners
- Create/edit/delete homepage banners
- Upload image (Arabic and English variants)
- Set link destination (product, category, article, external URL)
- Set display period (start date, end date)
- Set display order
- Preview before publishing

### Homepage Sections
- Configure which sections appear on homepage
- Enable/disable: Featured Collection, Flash Deals, Health Tips, New Arrivals
- Reorder sections via drag-and-drop

### Featured Collections
- Create curated product collections: "Pregnancy Essentials", "Thyroid Care Kit", "Skin Health"
- Assign products manually or by tag filter
- Set collection image and description (AR/EN)
- Activate/deactivate, set display period

### Health Articles (Phase 2)
- Rich text editor for creating articles
- Categorize by: life stage, condition, product-related
- Tag: pregnancy-safe, teen-appropriate, etc.
- Publish/draft/archive states
- SEO metadata fields (title, description)
- Medical disclaimer auto-appended to all articles

### FAQs
- Create/edit FAQ items
- Group by category
- Reorder within category
- Activate/deactivate

### Policy Pages
- Terms of Service, Privacy Policy, Return Policy, Prescription Policy
- Rich text editor
- Version history
- Publish date displayed to users

---

## 7.7 Promotions and Loyalty

### Coupons
- Create coupon code (custom or auto-generated)
- Discount type: percentage / fixed amount / free delivery
- Minimum order value requirement
- Maximum uses (total uses, per user limit)
- Valid date range
- Product/category restrictions (apply only to specific items)
- Usage report (how many times used, total discount given)

### Referral Campaigns (Phase 2)
- User gets unique referral link/code
- Referrer receives reward when referred user completes first order
- Reward: loyalty points or coupon
- Admin configures reward amounts

### Loyalty Points (Phase 2)
- Earn points on every purchase (configurable: X points per SAR spent)
- Bonus points on specific products or during campaigns
- Points redemption at checkout (configurable redemption rate)
- Points expire after X months (configurable)
- Admin can manually adjust user point balance with reason

### Seasonal Campaigns
- Create time-limited promotional campaigns
- Bundle discounts, bonus points, flash deals
- Campaign performance tracking

---

## 7.8 Analytics and Reporting

### Sales Dashboard
- Total revenue (daily/weekly/monthly/custom range)
- Orders count
- Average order value
- Revenue by category
- Revenue by product (top 20)
- Revenue by payment method
- Revenue by delivery zone

### Customer Analytics
- New vs. returning customers
- Customer acquisition by channel (if tracked)
- Retention cohort analysis
- Lifetime value estimates
- Top customers by order value

### Product Performance
- Top products by sales volume and revenue
- Out-of-stock frequency per product
- Product conversion rate (views → purchases)
- Refund rate per product

### Pharmacist Performance
- Prescriptions reviewed per pharmacist per period
- Average review time
- Approval rate / rejection rate
- Escalation rate
- Response time (Phase 2: chat)

### Stock Analytics
- Stock turnover by product
- Low stock incidents (frequency and duration)
- Sync error rate
- Manual override frequency

### Conversion Funnel
- App opens → product views → add to cart → checkout started → order placed
- Drop-off rate at each stage

### Campaign Performance
- Coupon usage by campaign
- Revenue attributable to promotions
- Referral conversion rate (Phase 2)

---

## 7.9 Settings and Configuration

### Delivery Zones
- Create/edit delivery zones (by city, district, or postal code)
- Per-zone: standard delivery fee, express fee, free delivery threshold, estimated delivery time
- Enable/disable zones
- Map view (Phase 2)

### Payment Methods
- Enable/disable payment methods
- Configure payment gateway credentials (encrypted storage)
- Set minimum/maximum order values per payment method
- Cash on delivery: enable/disable by zone

### Notification Templates
- Edit SMS, push, and email templates for each notification type
- Dual-language templates (Arabic and English versions)
- Template variables (e.g., {{customer_name}}, {{order_id}})
- Preview function
- Send test notification

### Tax Settings
- Configure VAT rate (currently 15% in KSA)
- Set VAT-exempt product categories
- Enable/disable tax-inclusive pricing display

### API Credentials
- POS API endpoint configuration
- API key storage (encrypted)
- Webhook URL configuration
- Sync schedule configuration
- Test connection button

### Language Configuration
- Set default language for new users
- Enable/disable English as secondary language
- Manage translation keys (for admin-customized UI strings)

### Privacy Settings
- Data retention period configuration
- Configure what patient data is visible to pharmacists
- Configure data export capabilities (PDPL compliance settings)

---

## 7.10 Audit and Security

### Audit Log
- Every action that modifies data is logged:
  - Who performed it (user ID, role)
  - What action was taken
  - Which record was affected (entity type + ID)
  - Before and after values for edits
  - Timestamp
  - IP address
- Cannot be edited or deleted (append-only log)
- Admin can search/filter by: date range, user, action type, entity type

### Access Log
- Every login attempt (success and failure) logged
- New device detection logged
- Session duration logged
- API access by external systems logged

### Role Change Log
- Any change to user roles or permissions logged
- Old role / new role / changed by / timestamp

### Sensitive Action Tracking
- These actions trigger immediate email alert to super-admin:
  - Role elevation (user → admin)
  - Bulk user data export
  - System settings change
  - Payment gateway reconfiguration
  - Deletion of pharmacist accounts
  - Manual override of prescription status

---

# 8. POS and Inventory API Integration

## 8.1 Integration Goals

| Goal | Description |
|---|---|
| Automatic stock sync | App stock levels reflect POS inventory without manual updates |
| Order sync | Orders placed in app are recorded in POS for fulfillment |
| SKU consistency | Same SKU used in both systems to prevent mismatch |
| Real-time updates | Stock changes in POS propagate to app quickly (< 5 minutes for critical items) |
| Reduce overselling | App shows out-of-stock before user can place order on depleted item |
| Central source of truth | POS is the authoritative source for stock; app is authoritative for order intent |

---

## 8.2 Integration Options and Recommendation

### Option A: Direct POS API Integration
The app backend calls the POS API directly to push/pull data.
- **Pros:** Simple architecture for single POS system
- **Cons:** Tight coupling; POS API downtime affects app directly; difficult to add more branches later

### Option B: Middleware Integration Layer (Recommended)
A dedicated integration service (microservice or module) acts as a buffer between the app backend and the POS API.
- **Pros:** Decoupled; resilient to POS downtime (buffer + retry); easier to add branches or switch POS vendors; enables transformation/normalization of data; supports multiple integration patterns
- **Cons:** Additional service to maintain

### Option C: Webhooks from POS
POS pushes change events to the app backend via webhooks.
- **Pros:** Near-real-time; event-driven
- **Cons:** Not all POS systems support outbound webhooks; requires reliable POS uptime

### Option D: Scheduled Polling
App backend polls POS API on a schedule (e.g., every 5 minutes).
- **Pros:** Simple; POS-agnostic
- **Cons:** Delay in stock updates; API call volume

### Recommended Architecture
**Hybrid: Middleware Layer + Event-Driven Webhooks with Polling Fallback**

```
[POS System]
    ↓ Webhooks (real-time, if supported)
    ↓ Polling fallback (every 5 min, for systems without webhooks)
[Integration Middleware Service]
    ↓ Normalizes data, applies business rules, logs all events
    ↓ Queues sync events (Redis Queue / Bull / SQS)
[App Backend API]
    ↓ Updates product stock, prices in app database
    ↓ Publishes stock-change events to real-time store (Redis pub/sub)
[Mobile App / Admin Dashboard]
    ↓ Reflects updated stock in real time
```

**Why this is best for MVP with future scale:**
- Middleware service can be a module in the monolith for MVP (no premature microservices overhead)
- Upgrades to a true microservice when multi-branch is needed (Phase 4)
- Queue-based processing means POS downtime doesn't cascade to user experience
- Retry logic built into queue processing

---

## 8.3 Data to Sync

### POS → App (Inbound Sync)

| Data Object | Fields Synced | Priority |
|---|---|---|
| Product | SKU, name, category, active status | High |
| Stock Quantity | SKU, quantity on hand, location (branch) | Critical |
| Price | SKU, price, sale price, VAT flag | High |
| Batch Information | Batch number, manufacture date | Medium |
| Expiration Date | Expiry date per batch/SKU | High |
| Product Status | Active/discontinued | High |

### App → POS (Outbound Sync)

| Data Object | Fields Sent | Priority |
|---|---|---|
| Order | Order ID, items, quantities, customer reference, payment status | Critical |
| Order Status | Order ID, new status, timestamp | High |
| Return/Refund | Order ID, returned items, quantities | High |
| Stock Adjustment | SKU, adjustment reason, quantity (for admin overrides) | Medium |

### Not Synced (Privacy Boundary)
- Full customer personal data is not sent to POS (only an anonymized customer reference ID if needed for POS records)
- Prescription documents are not sent to POS
- Chat/communication data is not sent to POS

---

## 8.4 Sync Direction and Source of Truth

| Data | Source of Truth | Sync Direction |
|---|---|---|
| Stock Quantity | POS | POS → App |
| Product Pricing | POS (with admin override capability) | POS → App (admin can lock override) |
| Product Status | POS (with admin override) | POS → App |
| Product Name/Description | App (admin-managed) | App only (not synced back to POS) |
| Order Intent | App | App → POS |
| Order Fulfillment Status | POS/Fulfillment | POS → App |
| Customer Data | App | App only |
| Prescription Data | App | App only |

### Conflict Resolution Rules
- **Stock conflict:** If app stock ≠ POS stock after sync, POS value wins unless admin has set a manual override lock
- **Price conflict:** POS price wins unless admin has set an app-specific price override (e.g., promotional price)
- **Order conflict:** If same order is submitted twice (duplicate), app backend deduplicates by order ID before sending to POS
- **SKU conflict:** If app SKU ≠ POS SKU, a mismatch alert is raised in admin dashboard; sync halts for that product until resolved

---

## 8.5 API Endpoints

### Inbound (POS → App Middleware)

```
POST /api/sync/stock-update
Request:
{
  "sku": "EST-12345",
  "quantity": 48,
  "location": "main-branch",
  "timestamp": "2026-03-09T14:00:00Z"
}
Response:
{
  "status": "accepted",
  "sync_log_id": "sync_abc123"
}

POST /api/sync/price-update
Request:
{
  "sku": "EST-12345",
  "price": 45.00,
  "sale_price": 38.00,
  "currency": "SAR",
  "vat_included": true,
  "timestamp": "2026-03-09T14:00:00Z"
}

POST /api/sync/product-update
Request:
{
  "sku": "EST-12345",
  "name_ar": "فيتامين د ٣",
  "name_en": "Vitamin D3",
  "active": true,
  "expiry_date": "2027-06-01",
  "batch_number": "B20240601"
}
```

### Outbound (App → POS)

```
POST /pos/api/orders
Request:
{
  "order_id": "ORD-20260309-001",
  "customer_ref": "CUST-ANON-78901",
  "items": [
    { "sku": "EST-12345", "quantity": 2, "unit_price": 45.00 },
    { "sku": "EST-67890", "quantity": 1, "unit_price": 20.00 }
  ],
  "payment_status": "paid",
  "payment_method": "card",
  "order_date": "2026-03-09T14:30:00Z"
}

PATCH /pos/api/orders/:order_id/status
Request:
{
  "status": "cancelled",
  "reason": "Customer request",
  "timestamp": "2026-03-09T15:00:00Z"
}

POST /pos/api/returns
Request:
{
  "order_id": "ORD-20260309-001",
  "return_id": "RET-20260310-001",
  "items": [
    { "sku": "EST-67890", "quantity": 1, "reason": "damaged" }
  ]
}
```

### Admin/Internal

```
GET /api/admin/inventory
Response: Array of { sku, name, quantity, last_sync, sync_status }

GET /api/admin/sync-logs?page=1&limit=50&status=error
Response: Paginated sync log entries

POST /api/admin/sync/trigger
Body: { "scope": "full" | "products" | "stock" | "prices" }

GET /api/admin/sku-mismatches
Response: Array of { app_sku, pos_sku, product_name, last_detected }
```

---

## 8.6 Sync Frequency

| Data Type | Sync Frequency | Method |
|---|---|---|
| Stock quantity | Every 5 minutes (polling) + real-time webhooks if POS supports | Webhook primary, polling fallback |
| Price changes | Every 15 minutes | Polling |
| Product status | Every 30 minutes | Polling |
| Order to POS | On order placement (immediate) | Direct API call + queue retry |
| Order status from POS | Every 5 minutes | Polling |
| Full reconciliation | Daily at 2:00 AM (low traffic) | Scheduled job |

### Retry Policy
- Failed sync events: retry with exponential backoff (1 min, 5 min, 15 min, 1 hour)
- After 4 retries: move to dead-letter queue; admin alerted
- Dead-letter queue items: visible in admin sync error log
- Admin can manually retry from error log

---

## 8.7 Failure Scenarios

| Scenario | System Behavior |
|---|---|
| **POS API down** | Last known stock values maintained; "stock may not be current" banner shown in admin; no new orders blocked (risk-accepted for MVP; Phase 2: show warning to users) |
| **App cannot update stock to POS** | Order queued in retry queue; POS notified on next successful connection; admin alerted |
| **SKU mismatch** | Sync halted for affected SKU; admin alerted with SKU details; product marked as "sync error" in admin; product remains purchasable if in stock (old value) |
| **Duplicate orders** | App-side deduplication by order ID + idempotency key before sending to POS |
| **Network timeout** | Retry with exponential backoff; if all retries fail → dead-letter queue |
| **Stale stock (overselling)** | At checkout, real-time stock check performed; if stock is 0 at checkout time, order blocked with "item no longer available" message; stock revalidated at cart open |
| **POS returns wrong quantity** | Integration middleware validates response; if quantity is negative or implausibly high, sync is flagged for admin review |

---

## 8.8 Admin Sync Visibility

Admin dashboard "Inventory Sync" section includes:

| Dashboard Element | Description |
|---|---|
| **Last Sync Time** | Timestamp of last successful sync per data type |
| **Sync Health Indicator** | Green/Orange/Red based on last sync status and age |
| **Sync Events Log** | Paginated list of all sync events with status, timestamp, records affected |
| **Error Log** | Failed sync events with error message, retry count, last retry time |
| **SKU Mismatch Report** | List of SKUs present in app but not POS, or POS but not app |
| **Inventory Discrepancy Report** | Per-product comparison of app stock vs. POS stock |
| **Manual Resync Button** | Trigger full or partial resync on demand |
| **Sync Alerts Configuration** | Configure email/SMS alert rules for sync failures |

---

# 9. End-to-End Workflows

## 9.1 OTC Order Flow

1. User opens app → authenticated session active
2. User browses catalog or searches for product
3. User views product page → product is in stock → no prescription required
4. User taps "Add to Cart"
5. User reviews cart → applies promo code (optional)
6. User proceeds to checkout
7. System performs real-time stock check at checkout open
8. User selects delivery address
9. User selects delivery type (standard)
10. User reviews order summary (subtotal, VAT, delivery, total)
11. User selects payment method (e.g., STC Pay)
12. User taps "Place Order"
13. Payment processed via payment gateway
14. On payment success:
    - Order created in app database
    - Order sent to POS via API (with retry if needed)
    - Stock quantity decremented in app (pending POS confirmation)
15. User receives in-app and SMS confirmation: "Order #ORD-XXX placed successfully"
16. Fulfillment team picks order in dashboard
17. Order packed → status updated to "Ready for Courier"
18. Courier assigned → status "Out for Delivery"
19. Delivery confirmed → status "Delivered"
20. User receives "Delivered" notification
21. User can rate experience (Phase 2)

**Total expected flow time (MVP): < 3 minutes from product view to order confirmation**

---

## 9.2 Prescription Order Flow

1. User adds prescription product to cart
2. System detects prescription-required item at checkout
3. User prompted: "This item requires a prescription. Please upload your prescription to continue."
4. User uploads prescription image/PDF (max 10MB)
5. Order placed with status: "Pending Pharmacist Review"
6. Payment captured or pre-authorized at this step (must validate with payment gateway; pre-auth recommended for prescription orders)
7. User receives confirmation: "Your order is pending pharmacist review. You will be notified within [X] hours."
8. Pharmacist receives queue notification: new prescription for review
9. **→ Pharmacist Review Flow (Section 9.3)**
10. On approval: order proceeds to packing
11. On rejection: payment reversed/refunded; user notified with reason; can resubmit
12. Fulfillment and delivery follows same path as OTC order (Steps 16–20 above)

**Target pharmacist review time: < 2 hours during operating hours**

---

## 9.3 Pharmacist Review Flow

1. Pharmacist logs in to dashboard
2. Dashboard shows pending queue count
3. Pharmacist opens prescription review screen
4. Reviews prescription document (zoom, rotate, multi-page)
5. Checks:
   - Patient name matches account
   - Prescription date is valid and not expired
   - Products on prescription match ordered products
   - Dosage and quantity are appropriate
   - Physician stamp and signature present
   - Patient's declared allergies do not conflict with medication
   - Patient's pregnancy/breastfeeding status considered if declared
6. **Decision:**
   - **Approve:** Click Approve → add optional patient note → confirm → order moves to "Approved"
   - **Reject:** Select reason → add message to patient → confirm → order moved to "Rejected" → refund triggered
   - **Hold:** Add message requesting clarification → patient notified → order held
   - **Substitute:** Search for alternative → propose to patient → await acceptance
   - **Escalate:** Add escalation note → admin alerted → order frozen pending admin action
7. All actions logged with pharmacist ID, timestamp, and notes

---

## 9.4 Admin Intervention Flow

**Trigger:** Pharmacist escalates an order, a user reports a complaint, or an automated flag is raised.

1. Admin receives alert in dashboard + email notification
2. Admin opens escalated order in Order Management
3. Admin reviews:
   - Full prescription document
   - Pharmacist notes
   - Patient profile (medical notes, allergy, order history)
   - Escalation reason
4. Admin decision options:
   - **Override and Approve:** Admin approves (with mandatory reason note); audit logged
   - **Override and Reject:** Admin rejects (with reason); patient notified; refund triggered
   - **Return to Pharmacist:** Admin reassigns to different pharmacist with guidance note
   - **Flag for Compliance Review:** Mark for legal/compliance team review (external process)
5. If fraud suspected: account flagged; order cancelled; user notified; internal report created
6. All actions logged in audit log with admin ID, timestamp, and reason

---

## 9.5 Stock Sync Flow

**Scheduled Polling Path:**
1. Sync scheduler triggers every 5 minutes (stock) / 15 minutes (price) / 30 minutes (product status)
2. Middleware calls POS API: `GET /pos/inventory`
3. POS returns current stock quantities for all SKUs
4. Middleware compares with current app database values
5. For each changed SKU:
   - Update `inventory` table in app database
   - If stock drops to 0: trigger out-of-stock event → product marked out-of-stock → "Notify me" feature activated
   - If stock rises from 0: trigger back-in-stock event → notify users who requested notification
6. Sync event logged: timestamp, SKUs updated, errors if any
7. Admin dashboard "Last Sync" indicator updated

**Webhook Path (if POS supports):**
1. POS fires webhook on stock change event
2. Middleware receives: `POST /api/sync/stock-update` with SKU and new quantity
3. Middleware validates payload (schema check, authentication header)
4. App database updated immediately
5. Sync event logged

---

## 9.6 Out-of-Stock Flow

**Scenario: Product goes out of stock while customer is browsing**

1. User is on product detail page; product was in stock when page loaded
2. Another user completes purchase → stock drops to 0
3. Stock sync updates product to out-of-stock in app database (within 5-minute window)
4. User taps "Add to Cart" on stale page
5. System checks stock at add-to-cart time → returns "Out of Stock" error
6. User sees: "عذراً، هذا المنتج نفد من المخزون" (Sorry, this product is out of stock)
7. App prompts: "Would you like to be notified when this product is back in stock?"
8. User taps "Notify Me" → their user ID + SKU saved in waitlist
9. When stock is replenished (next sync cycle), system identifies waitlist users
10. Push notification + SMS sent: "Good news! [Product Name] is back in stock. Order now."

**Scenario: Product is out of stock at checkout time (cart-level validation)**

1. User has item in cart that goes out-of-stock before checkout
2. User opens checkout
3. Real-time stock check at checkout: out-of-stock item detected
4. Checkout blocked; item highlighted: "This item is no longer available"
5. User offered: remove item and continue, or browse alternatives
6. If user removes item and continues: normal checkout flow

---

## 9.7 Refund and Cancellation Flow

### Cancellation by User (Before Packing)
1. User opens order in Order History
2. Taps "Cancel Order"
3. Selects reason
4. System checks order state: if "Placed" or "Pharmacist Review" → cancellation allowed
5. Order status → "Cancelled"
6. POS notified of cancellation
7. Stock reverted in app database
8. Refund triggered automatically (same payment method)
9. User receives confirmation SMS + in-app notification
10. Refund processing time: per payment gateway SLA

### Cancellation by Admin
1. Admin opens order in Order Management
2. Clicks "Cancel Order"
3. Mandatory: enter reason (visible in audit log)
4. System cancels order → POS notified → stock reverted → refund triggered
5. User notified via push + SMS: "Your order has been cancelled. Refund will be processed within X business days."

### Return/Refund After Delivery
1. User opens delivered order → taps "Request Return/Refund"
2. Selects items to return
3. Selects reason: wrong item received / damaged / expired / product quality issue
4. Uploads photo if damage/wrong item (optional but recommended)
5. Support ticket auto-created and linked to order
6. Admin reviews within SLA (e.g., 24 hours)
7. Admin approves or rejects return
8. If approved: refund initiated; if physical return needed: courier arranged
9. User notified of decision + refund timeline

**Note: Prescription medication returns are generally not permitted under Saudi pharmacy regulations. Must be validated with compliance advisor.**

---

## 9.8 Reorder / Refill Flow

1. User opens Order History
2. Finds previous order → taps "Reorder"
3. System checks current stock for each item in the previous order
4. Items in stock → added to new cart
5. Items out of stock → flagged in cart with "Currently unavailable" message
6. Prescription items → flagged: "Prescription required — please upload a valid prescription at checkout"
7. User reviews new cart (pre-filled with previous order items)
8. User proceeds through standard checkout

**Refill Reminder Flow (Phase 2):**
1. User enables refill reminder on a product (from product page or order history)
2. User sets reminder period (e.g., "Remind me in 30 days")
3. System stores reminder schedule linked to user + SKU
4. On reminder date: push + SMS notification: "Time to refill your [Product Name]. Tap to reorder."
5. Tap opens directly to product page or pre-filled cart
6. Repeat medication patterns auto-detected (Phase 3): system suggests enabling reminders proactively

---

## 9.9 User-Pharmacist Chat Flow (Phase 2)

1. User has an active order containing a prescription product that was approved
2. User navigates to Order Detail → taps "Message Pharmacist"
3. In-app chat thread opens, linked to the order
4. User types question (e.g., "Can I take this medication with food?")
5. Message delivered to pharmacist dashboard
6. Pharmacist sees unread message badge on their dashboard
7. Pharmacist opens message thread → views user's order, allergies, medical notes (read-only) in sidebar
8. Pharmacist types response
9. User receives push notification: "Your pharmacist has replied to your question"
10. User opens app → reads response
11. Conversation continues until resolved
12. Pharmacist marks conversation as resolved
13. Thread archived (accessible to both user and admin for audit purposes)
14. Admin can view any conversation (audit access)

**Privacy Rules:**
- Pharmacist cannot initiate new chat — only respond to user-initiated threads
- Pharmacist cannot save or export conversation outside the platform
- User cannot contact a pharmacist outside of an active order context
- Conversation data retained for minimum 5 years (must be validated with compliance advisor)
- Both parties receive a notice: "This conversation is private and secure. It is archived for quality and safety purposes."
