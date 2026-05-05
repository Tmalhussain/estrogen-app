# Estrogen Pharmacy — Specification Part 3
## Sections 10–14: Information Architecture, Database, Tech Stack, Security, Notifications

---

# 10. Information Architecture

## 10.1 User App Navigation

### Primary Navigation (Bottom Tab Bar)
The app uses a 5-tab bottom navigation bar, visible across all main screens.

```
[ Home ]  [ Shop ]  [ Prescriptions ]  [ Orders ]  [ Account ]
```

### Tab: Home (الرئيسية)
- Personalized greeting
- Featured banner carousel
- Quick-access category row
- "My Reorders" shortcut (for registered users)
- Promotional sections
- Health tip widget
- Back-in-stock alerts (if user has notifications)

### Tab: Shop (تسوق)
- Category grid (all categories)
- Search bar prominent at top
- Active filter chips
- Product listing (grid or list toggle)
- Sub-navigation: All / OTC / Prescription / New / On Sale

### Tab: Prescriptions (وصفاتي)
- Saved prescriptions list
- Upload new prescription button
- Prescription status history
- Associated orders per prescription
- Expiry indicators

### Tab: Orders (طلباتي)
- Active orders (with live status bar)
- Order history (paginated)
- Quick reorder button per order
- Return/refund request from order detail
- Order detail view:
  - Items ordered, quantities, prices
  - Delivery address
  - Status timeline
  - Pharmacist notes (if prescription order)
  - Message pharmacist (Phase 2)

### Tab: Account (حسابي)
- Profile details
- Medical profile (allergies, conditions)
- Saved addresses
- Payment methods
- Notification preferences
- Language toggle (AR/EN)
- Privacy settings
- Loyalty points (Phase 2)
- Help and Support
- About / Terms / Privacy Policy
- Log out

---

### Key Screens — User App

| Screen | Purpose |
|---|---|
| Onboarding / Welcome | Brand introduction, sign up / log in |
| OTP Verification | Phone number verification |
| Home | Discovery and personalization hub |
| Category Listing | Browse by category |
| Search Results | Product search with filters |
| Product Detail | Full product information, add to cart |
| Cart | Review items, apply coupon |
| Checkout | Address, delivery, payment |
| Order Confirmation | Success screen with order ID |
| Order Detail | Tracking and status |
| Prescription Upload | Camera or file picker upload |
| Prescription Review Status | Pending / Approved / Rejected status |
| Pharmacist Message | Chat thread (Phase 2) |
| Profile | Personal details |
| Medical Profile | Allergies, conditions, declarations |
| Saved Prescriptions | Library of uploaded prescriptions |
| Notifications Center | All in-app notifications |
| Help Center | FAQ and support ticket |
| Article Detail (Phase 2) | Health education content |

---

## 10.2 Pharmacist Dashboard Navigation

### Sidebar Navigation
```
[ Dashboard Overview ]
[ Prescription Queue ]
[ Active Orders ]
[ Order History ]
[ Consultations (Phase 2) ]
[ My Activity Log ]
[ Account Settings ]
```

### Dashboard Overview
- Live queue count
- Queue items requiring attention (oldest first)
- My stats today: reviewed, approved, rejected, held

### Prescription Queue
- Table/list of pending prescriptions
- Sort and filter tools
- Quick-action buttons per item (open, approve, reject, hold)

### Active Orders
- Orders currently in "Approved" or "Packing" state that this pharmacist approved
- View details, add notes, flag for attention

### Order History
- All past prescription reviews (own)
- Filterable by date, decision type

### My Activity Log
- Personal performance metrics
- Review time trends
- Approval/rejection breakdown

---

## 10.3 Admin Dashboard Navigation

### Top-Level Sidebar Navigation
```
[ Overview ]
[ Orders ]
[ Prescriptions ]
[ Users ]
[ Pharmacists ]
[ Catalog ]
  └ Products
  └ Categories
  └ Brands
  └ Bundles (Phase 2)
[ Inventory ]
  └ Stock Monitor
  └ Sync Logs
  └ Reconciliation
[ Content ]
  └ Banners
  └ Collections
  └ Articles (Phase 2)
  └ FAQs
  └ Policies
[ Promotions ]
  └ Coupons
  └ Campaigns
  └ Loyalty (Phase 2)
[ Analytics ]
  └ Sales
  └ Customers
  └ Products
  └ Pharmacists
  └ Inventory
  └ Campaigns
[ Settings ]
  └ Delivery Zones
  └ Payments
  └ Notifications
  └ Taxes
  └ API & Integrations
  └ Roles & Permissions
  └ System Settings
[ Audit Logs ]
```

---

# 11. Database and Data Model

## Overview

The database uses a relational structure (PostgreSQL recommended). All tables include `created_at`, `updated_at`, and `deleted_at` (soft delete) fields unless noted.

---

## 11.1 users

**Purpose:** Stores all registered customers.

| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| phone | VARCHAR(20) | Unique, indexed, primary identifier |
| email | VARCHAR(255) | Unique, nullable |
| password_hash | VARCHAR(255) | Bcrypt hashed |
| first_name_ar | VARCHAR(100) | Arabic first name |
| last_name_ar | VARCHAR(100) | Arabic last name |
| first_name_en | VARCHAR(100) | Nullable |
| last_name_en | VARCHAR(100) | Nullable |
| date_of_birth | DATE | For age verification and content filtering |
| language_preference | ENUM(ar, en) | Default: ar |
| is_active | BOOLEAN | Default: true |
| is_verified | BOOLEAN | Phone OTP verified |
| account_flags | JSONB | Flagging notes from admin |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |
| deleted_at | TIMESTAMP | Soft delete |

**Relationships:** One-to-one with `user_profiles`, one-to-many with `orders`, `prescriptions`, `addresses`, `notifications`

---

## 11.2 user_profiles

**Purpose:** Extended health and privacy profile linked to a user.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → users.id |
| allergies | TEXT[] | Array of allergy strings |
| medical_notes | TEXT | Encrypted at rest |
| chronic_conditions | TEXT[] | Self-declared condition tags |
| pregnancy_status | ENUM(not_pregnant, pregnant, breastfeeding, unknown) | |
| national_id | VARCHAR(20) | Encrypted, nullable |
| national_id_verified | BOOLEAN | |
| profile_photo_url | VARCHAR(500) | Nullable |

---

## 11.3 pharmacists

**Purpose:** Pharmacist accounts managed by admin.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| email | VARCHAR(255) | Unique |
| password_hash | VARCHAR(255) | |
| full_name_ar | VARCHAR(200) | |
| full_name_en | VARCHAR(200) | |
| phone | VARCHAR(20) | |
| license_number | VARCHAR(100) | |
| license_expiry_date | DATE | |
| is_active | BOOLEAN | |
| shift_id | UUID | FK → shifts.id (Phase 2) |
| created_by_admin_id | UUID | FK → admins.id |

---

## 11.4 admins

**Purpose:** Admin accounts with configurable role assignments.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| email | VARCHAR(255) | Unique |
| password_hash | VARCHAR(255) | |
| full_name | VARCHAR(200) | |
| role_id | UUID | FK → roles.id |
| is_active | BOOLEAN | |
| two_factor_enabled | BOOLEAN | |
| created_at | TIMESTAMP | |

---

## 11.5 roles

**Purpose:** Role definitions for RBAC.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | VARCHAR(100) | e.g., super_admin, catalog_admin, ops_admin |
| description | TEXT | |
| is_system | BOOLEAN | System roles cannot be deleted |

**Relationships:** One-to-many with `permissions` via `role_permissions`

---

## 11.6 permissions

**Purpose:** Granular permission definitions.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| key | VARCHAR(200) | e.g., orders.view, products.edit, users.disable |
| description | TEXT | |
| module | VARCHAR(100) | e.g., orders, products, users |

## role_permissions (join table)

| Field | Type |
|---|---|
| role_id | UUID |
| permission_id | UUID |

---

## 11.7 products

**Purpose:** Master product catalog.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| sku | VARCHAR(100) | Unique, must match POS SKU |
| name_ar | VARCHAR(300) | Required |
| name_en | VARCHAR(300) | Nullable |
| short_description_ar | TEXT | |
| short_description_en | TEXT | |
| full_description_ar | TEXT | |
| full_description_en | TEXT | |
| category_id | UUID | FK → categories.id |
| brand_id | UUID | FK → brands.id |
| price | DECIMAL(10,2) | VAT-exclusive storage |
| sale_price | DECIMAL(10,2) | Nullable |
| vat_applicable | BOOLEAN | |
| requires_prescription | BOOLEAN | |
| pregnancy_safety | ENUM(safe, consult, avoid, unknown) | |
| breastfeeding_safety | ENUM(safe, consult, avoid, unknown) | |
| age_restriction | ENUM(none, 18_plus, consult) | |
| condition_tags | TEXT[] | For filtering by health condition |
| pharmacist_note | TEXT | Admin-curated guidance |
| is_active | BOOLEAN | |
| images | JSONB | Array of image URLs and display order |
| barcode | VARCHAR(100) | Nullable |
| storage_instructions | TEXT | |

---

## 11.8 categories

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name_ar | VARCHAR(200) | |
| name_en | VARCHAR(200) | |
| parent_id | UUID | Nullable, FK self-reference for subcategories |
| icon_url | VARCHAR(500) | |
| display_order | INTEGER | |
| is_active | BOOLEAN | |

---

## 11.9 product_variants (Phase 2)

**Purpose:** For products with multiple variants (e.g., 30-tablet vs. 60-tablet pack).

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| product_id | UUID | FK → products.id |
| sku | VARCHAR(100) | Unique, must match POS SKU |
| variant_label_ar | VARCHAR(200) | e.g., "30 قرص" |
| variant_label_en | VARCHAR(200) | |
| price | DECIMAL(10,2) | |
| is_active | BOOLEAN | |

---

## 11.10 inventory

**Purpose:** Current stock levels, synced from POS.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| sku | VARCHAR(100) | FK → products.sku |
| quantity | INTEGER | |
| manual_override | BOOLEAN | True if admin has overridden |
| manual_override_quantity | INTEGER | Nullable |
| manual_override_by | UUID | FK → admins.id |
| last_synced_at | TIMESTAMP | |
| expiry_date | DATE | Nullable |
| batch_number | VARCHAR(100) | Nullable |
| location | VARCHAR(100) | Branch identifier (Phase 4) |

---

## 11.11 stock_sync_logs

**Purpose:** Log of every sync event between POS and app.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| sync_type | ENUM(stock, price, product, order, full) | |
| direction | ENUM(inbound, outbound) | |
| status | ENUM(success, failed, partial) | |
| records_processed | INTEGER | |
| records_failed | INTEGER | |
| error_details | JSONB | Array of error objects |
| triggered_by | ENUM(scheduler, webhook, manual, admin) | |
| triggered_by_admin_id | UUID | Nullable |
| started_at | TIMESTAMP | |
| completed_at | TIMESTAMP | |

---

## 11.12 prescriptions

**Purpose:** Prescription documents uploaded by users.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → users.id |
| file_url | VARCHAR(500) | Encrypted storage URL |
| file_type | ENUM(jpg, png, pdf) | |
| upload_date | TIMESTAMP | |
| expiry_date | DATE | Nullable — detected or entered manually |
| status | ENUM(pending_review, approved, rejected, expired) | |
| last_used_order_id | UUID | Nullable |

---

## 11.13 prescription_reviews

**Purpose:** Records pharmacist review decisions.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| prescription_id | UUID | FK → prescriptions.id |
| order_id | UUID | FK → orders.id |
| pharmacist_id | UUID | FK → pharmacists.id |
| decision | ENUM(approved, rejected, held, substituted, escalated) | |
| rejection_reason | VARCHAR(500) | Nullable |
| patient_note | TEXT | Visible to patient |
| internal_note | TEXT | Admin-visible only |
| reviewed_at | TIMESTAMP | |

---

## 11.14 carts

**Purpose:** Persistent shopping cart per user.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → users.id, Unique |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## cart_items

| Field | Type |
|---|---|
| id | UUID |
| cart_id | UUID |
| product_id | UUID |
| quantity | INTEGER |
| added_at | TIMESTAMP |

---

## 11.15 orders

**Purpose:** Core order record.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| order_number | VARCHAR(50) | Human-readable, e.g., ORD-20260309-001 |
| user_id | UUID | FK → users.id |
| status | ENUM(placed, pending_review, approved, packing, ready_for_courier, out_for_delivery, delivered, cancelled, refund_requested, refunded) | |
| order_type | ENUM(otc, prescription, mixed) | |
| delivery_address_id | UUID | FK → addresses.id |
| delivery_type | ENUM(standard, express, scheduled) | |
| delivery_fee | DECIMAL(8,2) | |
| subtotal | DECIMAL(10,2) | |
| discount_amount | DECIMAL(10,2) | |
| vat_amount | DECIMAL(10,2) | |
| total | DECIMAL(10,2) | |
| promo_code_id | UUID | Nullable |
| payment_id | UUID | FK → payments.id |
| customer_note | TEXT | |
| assigned_pharmacist_id | UUID | Nullable |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## order_items

| Field | Type |
|---|---|
| id | UUID |
| order_id | UUID |
| product_id | UUID |
| sku | VARCHAR(100) |
| quantity | INTEGER |
| unit_price | DECIMAL(10,2) |
| total_price | DECIMAL(10,2) |
| requires_prescription | BOOLEAN |
| prescription_id | UUID (nullable) |

## order_status_history

| Field | Type |
|---|---|
| id | UUID |
| order_id | UUID |
| from_status | VARCHAR(50) |
| to_status | VARCHAR(50) |
| changed_by_role | ENUM(user, pharmacist, admin, system) |
| changed_by_id | UUID |
| reason | TEXT |
| timestamp | TIMESTAMP |

---

## 11.16 payments

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| order_id | UUID | FK → orders.id |
| amount | DECIMAL(10,2) | |
| currency | VARCHAR(3) | SAR |
| method | ENUM(card, stc_pay, apple_pay, cod, mada) | |
| gateway | VARCHAR(100) | e.g., Moyasar, HyperPay |
| gateway_transaction_id | VARCHAR(300) | |
| status | ENUM(pending, captured, failed, refunded, partially_refunded) | |
| paid_at | TIMESTAMP | |
| refunded_at | TIMESTAMP | |
| refund_amount | DECIMAL(10,2) | |

---

## 11.17 addresses

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → users.id |
| label | VARCHAR(100) | e.g., Home, Work |
| recipient_name | VARCHAR(200) | |
| phone | VARCHAR(20) | |
| city | VARCHAR(100) | |
| district | VARCHAR(100) | |
| street | VARCHAR(300) | |
| building_number | VARCHAR(50) | |
| apartment_number | VARCHAR(50) | |
| additional_info | TEXT | |
| is_default | BOOLEAN | |
| delivery_zone_id | UUID | FK → delivery_zones.id |

---

## 11.18 notifications

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| user_id | UUID | FK → users.id or pharmacists.id or admins.id |
| recipient_type | ENUM(user, pharmacist, admin) | |
| type | VARCHAR(100) | e.g., order_placed, prescription_approved, low_stock |
| title_ar | VARCHAR(300) | |
| title_en | VARCHAR(300) | |
| body_ar | TEXT | |
| body_en | TEXT | |
| channel | ENUM(push, sms, email, in_app) | |
| is_read | BOOLEAN | |
| reference_id | UUID | Nullable — linked order/prescription ID |
| reference_type | VARCHAR(50) | e.g., order, prescription |
| sent_at | TIMESTAMP | |
| read_at | TIMESTAMP | |

---

## 11.19 chats (Phase 2)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| order_id | UUID | FK → orders.id |
| user_id | UUID | |
| pharmacist_id | UUID | |
| status | ENUM(open, resolved) | |
| created_at | TIMESTAMP | |
| resolved_at | TIMESTAMP | |

## messages

| Field | Type |
|---|---|
| id | UUID |
| chat_id | UUID |
| sender_type | ENUM(user, pharmacist) |
| sender_id | UUID |
| body | TEXT |
| attachment_url | VARCHAR(500) |
| is_read | BOOLEAN |
| sent_at | TIMESTAMP |

---

## 11.20 promotions

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| code | VARCHAR(50) | Unique |
| type | ENUM(percentage, fixed_amount, free_delivery) | |
| value | DECIMAL(8,2) | |
| min_order_value | DECIMAL(8,2) | |
| max_uses_total | INTEGER | |
| max_uses_per_user | INTEGER | |
| used_count | INTEGER | |
| product_ids | UUID[] | Nullable — restrict to specific products |
| category_ids | UUID[] | Nullable |
| valid_from | TIMESTAMP | |
| valid_until | TIMESTAMP | |
| is_active | BOOLEAN | |
| created_by | UUID | FK → admins.id |

---

## 11.21 articles (Phase 2)

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| title_ar | VARCHAR(500) | |
| title_en | VARCHAR(500) | |
| body_ar | TEXT | |
| body_en | TEXT | |
| category | VARCHAR(100) | e.g., pregnancy, chronic_conditions |
| life_stage_tags | TEXT[] | |
| health_tags | TEXT[] | |
| status | ENUM(draft, published, archived) | |
| author | VARCHAR(200) | |
| medical_review_by | VARCHAR(200) | |
| published_at | TIMESTAMP | |
| created_by | UUID | FK → admins.id |

---

## 11.22 audit_logs

**Purpose:** Immutable record of all significant system actions.

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| actor_type | ENUM(user, pharmacist, admin, system) | |
| actor_id | UUID | |
| action | VARCHAR(200) | e.g., order.status_override, user.disable |
| entity_type | VARCHAR(100) | e.g., order, user, product |
| entity_id | UUID | |
| before_value | JSONB | Snapshot before change |
| after_value | JSONB | Snapshot after change |
| ip_address | VARCHAR(45) | |
| user_agent | TEXT | |
| timestamp | TIMESTAMP | Non-nullable, indexed |

---

## 11.23 api_integrations

| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | VARCHAR(200) | e.g., "Main POS", "SMS Gateway" |
| type | ENUM(pos, sms, payment, analytics, other) | |
| base_url | VARCHAR(500) | |
| api_key_encrypted | TEXT | Encrypted at rest |
| webhook_secret_encrypted | TEXT | |
| is_active | BOOLEAN | |
| last_health_check | TIMESTAMP | |
| health_status | ENUM(healthy, degraded, down) | |
| config | JSONB | Additional config parameters |

---

# 12. Recommended Tech Architecture

## 12.1 Technology Stack

### Mobile App
| Layer | Recommendation | Reason |
|---|---|---|
| Framework | React Native (Expo managed workflow) | Single codebase for iOS and Android; large community; Arabic/RTL support; fast development for MVP |
| UI Library | Custom component library + NativeWind (Tailwind for RN) | Consistent design system, RTL compatible |
| State Management | Zustand + React Query | Lightweight, optimized for server state + local state |
| Navigation | React Navigation v6 | Industry standard for React Native |
| Push Notifications | Firebase Cloud Messaging (FCM) | iOS and Android push support |
| Biometric Auth | Expo LocalAuthentication | Face ID / fingerprint |
| Payments | Moyasar SDK or HyperPay SDK | Leading Saudi payment gateways with STC Pay and Mada support |
| File Upload | Expo Image Picker + Expo Document Picker | Prescription photo/PDF upload |
| Real-time (Phase 2) | Socket.io client | For live chat |

### Admin and Pharmacist Dashboards
| Layer | Recommendation |
|---|---|
| Framework | Next.js 14 (React, TypeScript) |
| UI Library | shadcn/ui + Tailwind CSS |
| State Management | TanStack Query (React Query) |
| Charts/Analytics | Recharts or Chart.js |
| Tables | TanStack Table |
| Auth | NextAuth.js with custom credentials provider |
| RTL Support | Tailwind RTL plugin |

### Backend API
| Layer | Recommendation | Reason |
|---|---|---|
| Framework | Node.js + NestJS (TypeScript) | Modular, scalable, dependency injection, strong TypeScript support |
| ORM | Prisma | Type-safe DB access, excellent PostgreSQL support |
| API Pattern | REST (MVP); consider GraphQL for complex queries in Phase 3 | REST is simpler to implement, debug, and document for MVP |
| Authentication | JWT (access + refresh tokens) + Passport.js | Standard, well-supported |
| Validation | class-validator + class-transformer | Built into NestJS ecosystem |

### Database
| Component | Choice | Reason |
|---|---|---|
| Primary DB | PostgreSQL 15+ | Relational integrity, JSONB for flexible fields, strong encryption options |
| Caching | Redis 7 | Session storage, queue, pub/sub for real-time stock, API response caching |
| Search | PostgreSQL full-text search (MVP); Elasticsearch (Phase 3 for advanced Arabic search) | Arabic FTS in Postgres is sufficient for MVP; Elasticsearch adds morphological Arabic analysis |

### Queue / Background Jobs
| Component | Choice |
|---|---|
| Job Queue | BullMQ (Redis-backed) |
| Scheduled Jobs | BullMQ Schedulers (cron-based) |
| Job Monitoring | Bull Dashboard (admin-visible) |

### File Storage
| Component | Choice | Reason |
|---|---|---|
| Prescription files | AWS S3 with server-side encryption (SSE-S3 or SSE-KMS) | Secure, scalable, access-controlled; pre-signed URLs for secure file access |
| Product images | AWS S3 + CloudFront CDN | Fast image delivery globally |
| Document access | Pre-signed URLs with 15-minute expiry | Prevents unauthorized access to prescription files |

### Notifications
| Channel | Service |
|---|---|
| SMS | Unifonic or Taqnyat (Saudi-based, CITC-compliant) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Email | Amazon SES |
| In-app | Internal notifications table + WebSocket push (Phase 2) |

### Analytics
| Layer | Service |
|---|---|
| Business analytics (internal) | Custom charts in admin dashboard (Recharts) |
| Product/behavioral analytics | Mixpanel or Amplitude (privacy settings must align with PDPL) |
| Error tracking | Sentry |
| Performance monitoring | Datadog or AWS CloudWatch |

### Infrastructure
| Component | Choice |
|---|---|
| Cloud Provider | AWS (Bahrain region: me-south-1) — keeps data in KSA region |
| Container | Docker + ECS Fargate (MVP); Kubernetes (Phase 4+) |
| CI/CD | GitHub Actions |
| Reverse Proxy | AWS ALB + Nginx |
| Secrets Management | AWS Secrets Manager |
| VPC | Private subnets for DB and backend; public subnets for load balancer only |

---

## 12.2 Architecture Pattern Recommendation

### Recommendation: Modular Monolith for MVP → Selective Microservices for Phase 4

**Modular Monolith (MVP):**
The NestJS backend is structured as a monolith with distinct modules:
- `AuthModule`
- `UsersModule`
- `PharmacistsModule`
- `ProductsModule`
- `OrdersModule`
- `PrescriptionsModule`
- `InventoryModule`
- `SyncModule` (POS integration)
- `NotificationsModule`
- `PromotionsModule`
- `AnalyticsModule`
- `AdminModule`
- `ContentModule`

Each module owns its own services, controllers, and domain logic. Modules communicate via internal service injection — NOT via HTTP.

**Why this beats microservices for MVP:**
- Avoids distributed systems complexity (network failures, service discovery, distributed tracing) before product-market fit
- Single deployment, single database — simpler ops for a small team
- Modules remain loosely coupled by design, making future extraction to microservices straightforward
- PostgreSQL can handle the load comfortably well into Phase 3 (millions of users)

**Migration path to microservices (Phase 4):**
When multi-branch, high scale, or multi-team development requires it:
1. Extract `SyncModule` → standalone Inventory Sync Service (first candidate, already event-driven)
2. Extract `NotificationsModule` → standalone Notification Service
3. Extract `AnalyticsModule` → separate read-replica-based analytics service
4. Core order/user/product modules remain in monolith until team/scale demands further split

---

## 12.3 High-Level Architecture Diagram (Described)

```
[iOS App] [Android App]
       ↓         ↓
   [AWS ALB / API Gateway]
          ↓
   [NestJS API Monolith — ECS Fargate]
     ├── Auth Module
     ├── Users Module
     ├── Orders Module
     ├── Prescriptions Module
     ├── Products Module
     ├── Inventory/Sync Module ←→ [POS API (External)]
     ├── Notifications Module ←→ [FCM / SMS / SES]
     └── Admin/Analytics Module
          ↓
   [PostgreSQL — RDS (Private Subnet)]
   [Redis — ElastiCache (Private Subnet)]
   [S3 — Prescription Storage (Private + Pre-signed URLs)]
   [S3 + CloudFront — Product Images (Public CDN)]
          ↓
[Admin Dashboard — Next.js — Vercel / ECS]
[Pharmacist Dashboard — same Next.js app, different route/role]
```

---

# 13. Security, Privacy, and Compliance

## 13.1 Authentication Security

- **Password storage:** Bcrypt with cost factor ≥ 12
- **JWT tokens:** RS256 signed (asymmetric keys); stored in httpOnly cookies for web; secure storage (Keychain/Keystore) for mobile
- **Access token expiry:** 15 minutes
- **Refresh token expiry:** 30 days, rotated on every use
- **OTP security:** 6-digit, 90-second TTL, rate-limited (5 attempts per hour per phone number), HMAC-based generation
- **2FA for pharmacists and admins:** TOTP (Google Authenticator compatible) or SMS OTP; enforced, not optional
- **Brute force protection:** Account lockout after 5 failed login attempts (15-minute lockout); rate limiting on all auth endpoints (Express Rate Limit / NestJS Throttler)

---

## 13.2 Role-Based Access Control

- All API endpoints protected by JWT authentication middleware
- Role and permission checks applied at controller level via guards
- Permission keys validated against user's role at runtime
- Pharmacists cannot call admin-scoped endpoints; validation at API level, not just frontend
- Any unauthorized access attempt is logged in audit logs and triggers an alert if repeated

---

## 13.3 Encryption

| Data | Encryption Method |
|---|---|
| Passwords | Bcrypt (one-way hash) |
| Data in transit | TLS 1.2+ enforced on all endpoints; HSTS headers on web |
| Prescription files at rest | AES-256 (AWS SSE-KMS) on S3 |
| Sensitive profile fields (national ID, medical notes) | Field-level encryption using AES-256 in application layer before DB storage |
| Database at rest | AWS RDS encrypted volumes |
| Payment data | Never stored locally; tokenized by payment gateway (PCI compliance delegated to gateway) |
| API keys in admin settings | Encrypted using KMS-backed key before storing in database |
| Redis cache | Sensitive data not cached in plaintext; only reference IDs cached |

---

## 13.4 Prescription Privacy

- Prescription images stored in private S3 bucket — no public URL
- Access via pre-signed URL with 15-minute expiry, generated on demand
- Only the pharmacist reviewing the linked order and admins can request a pre-signed URL
- Pre-signed URL generation logged in audit log
- User can delete their prescription from their library (soft delete; full deletion after data retention period — must be validated with compliance advisor)

---

## 13.5 Audit Trail

- All state-changing actions are written to `audit_logs` table (append-only)
- Audit log includes: actor, action, before/after state, IP, timestamp
- Audit log cannot be edited or deleted via application; database-level write protection
- Admin can view but not delete audit logs
- Retention period for audit logs: minimum 7 years (must be validated with compliance advisor for Saudi healthcare records requirements)
- Automated alerting for sensitive audit events (role elevation, bulk data export, payment gateway config change)

---

## 13.6 Consent Management

- Explicit opt-in for Terms of Service and Privacy Policy at signup (no pre-checked boxes)
- Separate opt-in for marketing communications
- Health profile fields (allergies, conditions, pregnancy status) are voluntary
- Users can withdraw consent: account deletion request available in settings
- Data portability: users can request full data export (JSON format) — PDPL Article 4 compliance
- Consent timestamp and version recorded at account creation and on ToS updates

---

## 13.7 Data Retention

- Must be validated with Saudi PDPL and healthcare regulations compliance advisor
- Recommended baseline:
  - Active user data: retained while account is active
  - Deleted account data: 30-day recovery window, then anonymized
  - Prescription records: minimum 7 years
  - Payment records: minimum 7 years
  - Audit logs: minimum 7 years
  - Chat/communication logs: minimum 5 years
  - Promotional/marketing data: purged after 2 years of inactivity

---

## 13.8 Secure File Uploads

- Client-side: file type validation (whitelist: jpg, png, pdf) and size limit (10MB) before upload
- Server-side: re-validate MIME type from binary signature (not just extension)
- Virus/malware scan: AWS Macie or ClamAV scan before file is accessible
- No executable file types permitted under any circumstance
- Prescription files uploaded to isolated S3 prefix with strict bucket policy

---

## 13.9 Session Management

- Mobile: JWT stored in platform secure storage (iOS Keychain, Android Keystore)
- Web (admin/pharmacist): JWT stored in httpOnly secure cookie (not localStorage)
- Session invalidation: user can force logout all sessions from Account settings
- Admin action: admin can force-revoke all sessions for any user
- Concurrent session limit: configurable (default: 3 concurrent devices for users)

---

## 13.10 Fraud Prevention

- Velocity checks: same user placing >5 orders in 10 minutes triggers a flag
- Address mismatch detection: billing address vs. delivery address discrepancy flagging
- New device + high-value order: requires additional OTP verification
- Prescription fraud: pharmacist review serves as primary control; admin can flag accounts; unusual patterns escalated
- Payment fraud: delegated to payment gateway fraud detection; additional layer: order value anomaly detection

---

## 13.11 Payment Security

- PCI DSS compliance delegated to payment gateway (Moyasar / HyperPay are PCI-DSS Level 1 certified)
- No card numbers, CVVs, or full PAN stored in the app's database
- Payment gateway tokenization used for saved cards
- 3D Secure (3DS2) enforced for card payments above a configurable threshold

---

## 13.12 Compliance Considerations

**The following must be validated with a Saudi-qualified legal and compliance advisor before platform launch:**

| Area | Compliance Framework | Action Required |
|---|---|---|
| Personal data protection | Saudi PDPL (Personal Data Protection Law) — NDMO | Privacy policy, consent model, data retention, data portability, breach notification procedures |
| E-pharmacy operations | SFDA (Saudi Food and Drug Authority) e-pharmacy regulations | E-pharmacy license, prescription handling requirements, dispensing rules, controlled substances policy |
| E-commerce | Saudi ECZA (E-Commerce Law) | Consumer rights, return policy, mandatory disclosures |
| Payment processing | SAMA (Saudi Central Bank) e-payments regulations | Licensed payment gateway, AML/KYC where applicable |
| Telecom/SMS | CITC (Communications and Information Technology Commission) | SMS provider must be CITC-licensed; consent for marketing messages |
| Healthcare data | Ministry of Health regulations | Health data handling, pharmacist licensing verification, prescription validity rules |
| VAT | ZATCA (Zakat, Tax and Customs Authority) | E-invoicing compliance, VAT display, tax reporting |

---

# 14. Notifications and Communication Plan

## 14.1 Notification Types and Rules

### User Notifications

| Trigger | Recipient | Channel | Message Example |
|---|---|---|---|
| Order placed | User | Push + SMS | "تم استلام طلبك رقم #ORD-XXX بنجاح." |
| Prescription pending review | User | Push + SMS | "وصفتك قيد المراجعة من قِبل الصيدلانية." |
| Prescription approved | User | Push + SMS | "تمت الموافقة على وصفتك. جاري تحضير طلبك." |
| Prescription rejected | User | Push + SMS | "لم يتم قبول وصفتك. السبب: [reason]" |
| Prescription held | User | Push | "الصيدلانية تحتاج إلى مزيد من المعلومات حول وصفتك." |
| Substitution proposed | User | Push + SMS | "اقترحت الصيدلانية بديلاً. اضغط للمراجعة." |
| Order packing | User | Push | "جاري تعبئة طلبك." |
| Out for delivery | User | Push + SMS | "طلبك في الطريق إليك." |
| Delivered | User | Push + SMS | "تم تسليم طلبك بنجاح." |
| Order cancelled | User | Push + SMS | "تم إلغاء طلبك. سيتم استرداد المبلغ خلال X أيام." |
| Refund processed | User | Push + SMS | "تم استرداد مبلغ X ريال إلى طريقة الدفع الأصلية." |
| Back in stock | User | Push | "[Product] متوفر الآن. اضغط للطلب." |
| Refill reminder (Phase 2) | User | Push + SMS | "حان وقت تجديد [Product]." |
| Promo / sale (opt-in) | User | Push | "عرض خاص! خصم 20% على [category]." |
| Pharmacist message (Phase 2) | User | Push | "ردّت الصيدلانية على استفسارك." |
| Account security alert | User | SMS | "تم تسجيل الدخول إلى حسابك من جهاز جديد." |

### Pharmacist Notifications

| Trigger | Recipient | Channel | Message Example |
|---|---|---|---|
| New prescription in queue | Pharmacist | Push (app) + Email | "وصفة جديدة تنتظر مراجعتك. رقم الطلب: #ORD-XXX" |
| Patient responded to hold | Pharmacist | Push + Email | "ردّت العميلة على الطلب المعلق. رقم الطلب: #ORD-XXX" |
| Patient accepted substitution | Pharmacist | Push | "وافقت العميلة على البديل المقترح." |
| Patient declined substitution | Pharmacist | Push | "رفضت العميلة البديل المقترح. يرجى المراجعة." |
| Admin assigned order | Pharmacist | Push + Email | "تم تكليفك بمراجعة طلب جديد." |
| License expiry approaching | Pharmacist | Email | "رخصتك المهنية ستنتهي خلال 30 يوماً." |

### Admin Notifications

| Trigger | Recipient | Channel | Message Example |
|---|---|---|---|
| Order escalated by pharmacist | Admin | Email + In-dashboard alert | "Order #ORD-XXX escalated by pharmacist. Review required." |
| Stock below threshold | Admin | Email + In-dashboard | "Low stock alert: [Product] has only X units remaining." |
| Sync failure (3+ consecutive) | Admin | Email + SMS | "ALERT: POS sync has failed 3 times. Manual action required." |
| SKU mismatch detected | Admin | Email + In-dashboard | "SKU mismatch detected for [SKU]. Sync paused for this product." |
| New support ticket | Admin | Email | "New support ticket #TKT-XXX from [customer]." |
| Pharmacist license expiry | Admin | Email | "Pharmacist [name] license expires in 30 days." |
| Sensitive action alert | Admin (Super) | Email | "SECURITY: Role change detected — [user] promoted to admin by [actor]." |
| Failed login spike | Admin | Email | "Unusual login failure rate detected from IP [x.x.x.x]." |
| Daily sales summary | Admin | Email | "Daily report: X orders, SAR X revenue." |

---

## 14.2 Notification Infrastructure

### SMS
- Provider: Unifonic or Taqnyat (Saudi-based, CITC-licensed)
- Sender ID: registered Arabic-friendly sender ID (e.g., "Estrogen")
- SMS template variables: `{{customer_name}}`, `{{order_id}}`, `{{product_name}}`, `{{reason}}`
- Dual-language: Arabic SMS for Arabic-preference users; English for English-preference users
- Arabic SMS length: 70 characters per segment (Arabic encoding); optimize templates to fit 1 segment

### Push Notifications
- Firebase Cloud Messaging (FCM) for both iOS and Android
- Notification types: transactional (high priority, always delivered) and promotional (normal priority, user opt-in)
- iOS: APNs via FCM; requires proper provisioning profile configuration
- Deep linking: push notifications deep-link to relevant screen (order detail, prescription status, product page)

### Email
- Provider: Amazon SES (me-south-1 region)
- From address: noreply@estrogenpharmacy.sa (domain must be DKIM/SPF configured)
- Templates: HTML + plain text fallback, Arabic RTL design
- Transactional emails: order confirmations, receipts, account security alerts
- Marketing emails: opt-in only (separate subscription list); unsubscribe link mandatory

### In-App Notification Center
- Bell icon in header shows unread count badge
- Notification list with: title, body, timestamp, read/unread state, deep link
- Mark all as read button
- Paginated list (last 90 days)
- Notifications auto-expire and are deleted after 90 days

### Admin Alert Channels
- In-dashboard alert panel (real-time, WebSocket-pushed)
- Email for all critical alerts
- SMS for system-level critical failures (sync down, security events)
- Slack/Teams integration (Phase 2) for ops team real-time alerts
