# Estrogen Pharmacy — Specification Part 4
## Sections 15–20: UX Guidelines, MVP, Roadmap, KPIs, Risks, Build Plan

---

# 15. UX/UI Guidelines

## 15.1 Design Philosophy

The Estrogen Pharmacy interface must communicate four qualities simultaneously:
1. **Medical trustworthiness** — this is a healthcare product; it must feel credible
2. **Feminine warmth** — not clinical or cold; welcoming and empathetic
3. **Privacy and safety** — the design must visually reinforce discretion
4. **Simplicity and accessibility** — usable by a 15-year-old and a 70-year-old

---

## 15.2 Arabic-First Layout and RTL

- All UI is designed in Right-to-Left (RTL) layout by default
- Arabic is the primary language for all labels, buttons, headings, and navigation
- English text appears as a secondary label (smaller, subtitle-level) on product names and categories
- Language toggle (AR/EN) is accessible from the Account tab and persists across sessions
- Font choice for Arabic: **IBM Plex Arabic** or **Cairo** — both support Arabic fully, have clean numerals, and maintain readability at all sizes
- All icon directionality follows RTL convention (e.g., back arrow points right → in RTL)
- Currency: SAR displayed as "ر.س" in Arabic context; "SAR" in English context
- Date format: Hijri calendar as primary option with Gregorian in parentheses (configurable)
- Number formatting: Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) in Arabic mode; Western numerals in English mode

---

## 15.3 Color System

| Color Role | Color | Usage |
|---|---|---|
| Primary Brand | Deep Rose / Dusty Mauve `#B06080` | Primary buttons, active tabs, brand accents |
| Primary Dark | Dark Plum `#6D2C4A` | Headers, high-emphasis text on light bg |
| Secondary | Warm Cream `#FAF3EC` | Page backgrounds, card backgrounds |
| Accent | Sage Green `#7BAE8C` | Success states, "approved" indicators, positive feedback |
| Warning | Amber `#E8A831` | Low stock, hold status, alerts |
| Danger/Error | Warm Red `#C0392B` | Out of stock, rejected prescription, destructive actions |
| Neutral Dark | Charcoal `#2C2C2C` | Body text |
| Neutral Mid | Stone `#8C8C8C` | Placeholder text, secondary labels |
| Neutral Light | Light Gray `#F0EBE8` | Dividers, inactive elements |
| White | Pure White `#FFFFFF` | Cards, modal backgrounds |

**Contrast ratios must meet WCAG AA minimum (4.5:1 for normal text, 3:1 for large text).** All color choices must be validated in both light mode and dark mode (Phase 2).

---

## 15.4 Typography

| Element | Font | Size | Weight |
|---|---|---|---|
| Page Title (AR) | Cairo | 22px | 700 Bold |
| Section Heading (AR) | Cairo | 18px | 600 SemiBold |
| Body Text (AR) | IBM Plex Arabic | 16px | 400 Regular |
| Caption / Label (AR) | IBM Plex Arabic | 13px | 400 Regular |
| Button Text (AR) | Cairo | 16px | 600 SemiBold |
| Price | Cairo | 18px | 700 Bold |
| Product Name | Cairo | 16px | 600 |
| English subtitles | Inter | 13px | 400 |

Minimum readable font size: **14px** — never smaller for any user-facing content.

---

## 15.5 Accessible Design for All Ages

### General Accessibility
- Minimum touch target size: 44×44pt (Apple HIG standard)
- Sufficient padding between interactive elements to prevent accidental taps
- Screen reader support: all elements have accessible labels (AccessibilityLabel in React Native)
- Color is never the only means of communicating information (always include an icon or text label)
- Loading states are always indicated (skeleton screens, not blank screens)

### Elderly-Friendly Considerations
- Large text mode: accessible via system settings (iOS and Android dynamic type support)
- High contrast mode compatibility
- Extra-large tap targets for primary actions on checkout and order confirmation screens
- Simplified reorder flow: "Order again" is a prominent, single-tap action from order history
- Avoid dense information screens — one action per screen where possible for critical flows
- Error messages written in plain, simple Arabic — no technical jargon

### Teen-Friendly Considerations
- Familiar visual patterns (similar to apps they already use)
- Encouraging, non-judgmental tone for sensitive product categories
- No complex medical terminology on product cards — simple common name first, scientific name secondary

---

## 15.6 Onboarding UX

- Maximum 4 steps for signup (phone → OTP → name → password)
- Progress indicator shown throughout
- Skip optional steps: health profile setup can be completed later
- On first app open: two-screen introduction (brand story + value proposition) → sign up CTA
- Guest browsing is possible immediately — no forced registration wall at app open
- Permission requests (notifications, biometrics) asked after first successful order, not on app open

---

## 15.7 Product Page UX

- Image gallery at top (swipeable, full-screen tap to expand)
- Product name in bold Arabic, English name in lighter secondary style
- Price prominently displayed; sale price shows original price struck through
- "Requires Prescription" badge: rose-colored with lock icon
- Stock status indicator: clear color-coded badge
- Pregnancy/breastfeeding safety indicator: clear icon + label
- "Add to Cart" button: full-width, high-contrast, positioned above fold
- Long description in collapsible "Read More" section to avoid overwhelming users
- Safety warnings in amber-colored callout box — cannot be missed

---

## 15.8 Prescription Upload UX

- Full-screen dedicated upload screen with clear instructions in Arabic
- Two upload options:
  1. **Camera icon:** Opens camera directly for photographing prescription
  2. **File icon:** Opens document/image picker for existing files
- On upload: preview shown immediately with zoom capability
- Tips shown alongside: "Make sure all text is readable", "Include the doctor's stamp"
- Clear error states: "Image too small", "File format not supported"
- Progress indicator during upload
- Confirmation screen before submitting: "Are you sure this prescription is clear and complete?"

---

## 15.9 Checkout UX

- Linear, single-direction flow (no back-and-forth required)
- Order summary always visible as a collapsible panel at the bottom
- Address selection is a full-screen sheet (not a small dropdown)
- Payment method selection shows icons + labels (not just text)
- Final confirmation screen shows full order summary before "Place Order" tap
- "Place Order" button: extra-large, rose primary color, placed at bottom of screen
- Loading state on "Place Order" to prevent double-tap
- Success screen: celebratory but restrained; includes order number, estimated delivery time, "Continue Shopping" CTA

---

## 15.10 Privacy-Focused UX Patterns

- No product names or category names visible on order notification previews (replace with "Your order from Estrogen Pharmacy")
- App lock: face ID / PIN required to open app (configurable)
- Prescription tab requires biometric re-authentication if device was inactive for >10 minutes
- Cart is private — not synced to marketing analytics tools
- "What information do we have about you?" link accessible from profile settings
- Clear, jargon-free privacy policy in Arabic — summarized in bullet points before the legal text

---

## 15.11 Low-Friction Repeat Order Experience

- "Reorder" appears prominently on every past order card
- Previous order is pre-filled in cart — user only taps "Reorder" and "Place Order"
- Saved address pre-selected by default
- Saved payment method pre-selected by default
- Estimated delivery time shown before final tap

---

## 15.12 Medication Warning UX

- All medication warnings shown in amber callout box on product page and in cart
- Pregnancy/breastfeeding warnings: shown at add-to-cart if pregnancy status is active in profile
- Out-of-stock: product card grayed out, "Out of Stock" badge, "Notify Me" CTA replaces "Add to Cart"
- Prescription required: product card shows lock badge; "Add to Cart" is replaced with "Requires Prescription — Add and Upload"
- Age-restricted products: hidden from users under 18 based on date of birth (if declared)

---

# 16. MVP Definition

## 16.1 Must-Have (MVP — Phase 1)

These features must be built and working before launch:

| Feature | Description |
|---|---|
| User registration and login | Phone OTP signup, password login, biometric login |
| User profile | Name, DOB, allergies, medical notes |
| Product catalog | Full category browsing, search, filters |
| Product detail pages | Arabic-first, images, safety info, price, stock status |
| Cart and checkout | Add to cart, promo code, delivery address, payment |
| OTC order flow | Place OTC order, receive confirmation |
| Prescription upload | Upload image/PDF at checkout |
| Prescription review (pharmacist) | Approve / reject / hold flow |
| Pharmacist dashboard | Queue management, review flow, notes |
| Admin dashboard | User management, order management, catalog management |
| POS inventory sync (basic) | Scheduled stock sync (polling, every 5 min) |
| Order status tracking | Status updates in app + SMS/push notifications |
| Payment processing | Card, STC Pay, Apple Pay |
| Discreet packaging option | User-selectable at checkout |
| SMS and push notifications | All transactional notification types |
| Arabic-first UI | Full RTL layout, Arabic-primary language |
| English secondary language | Language toggle, dual-language product content |
| Sync error logging | Admin can view sync failures |
| Support ticket (basic) | User can submit a ticket; admin receives it |
| Admin analytics (basic) | Sales summary, order count, product performance |
| Low stock alerts | Admin notified when stock drops below threshold |
| Secure file storage | Prescription files on encrypted S3 |
| Audit logging | All admin and pharmacist actions logged |
| Saudi payment gateways | Moyasar or HyperPay integration |

---

## 16.2 Nice-to-Have (Phase 2 — target within 3–6 months post-MVP)

| Feature | Description |
|---|---|
| In-app pharmacist chat | Messaging within order context |
| Refill reminders | User-set reminder schedule |
| Health education content | Articles and guides library |
| Express / scheduled delivery | Additional delivery modes |
| Reorder shortcuts | One-tap reorder from home screen |
| Loyalty points | Earn and redeem points |
| Referral program | Refer a friend for reward |
| Product ratings/reviews | User ratings on purchased products |
| Back-in-stock notifications | User registers for restock alerts |
| Enhanced analytics | Cohort analysis, retention, funnel |
| Pharmacist shift management | Shift-based queue assignment |
| Dark mode | iOS and Android dark theme support |
| Notification preferences granularity | Per-notification-type opt-in/out |
| Admin coupon campaign analytics | Detailed promo performance reporting |

---

## 16.3 Out of Scope (Phase 3+ or Not Planned)

| Feature | Reason |
|---|---|
| Telemedicine / video consultation | Regulatory complexity; significant separate product |
| Multi-branch inventory | Multi-branch ops require separate infrastructure |
| Family / caregiver accounts | Legal complexity of third-party ordering; Phase 3 |
| Subscription bundles | Business model validation needed first |
| AI product recommendations | Requires sufficient data volume |
| Arabic voice search | Platform maturity required |
| IoT / wearable integration | Outside pharmacy scope |
| Social features (community, forums) | Not aligned with privacy-first brand |
| Prescription home collection | Courier model complexity |
| Pharmacy POS building (custom) | Use existing POS with API integration |
| Insurance claims processing | Requires separate regulatory framework |

---

# 17. Roadmap by Phase

## Phase 1: MVP (Months 1–4)

**Business Goal:** Launch a functional, compliant pharmacy delivery app in Saudi Arabia that enables women to order OTC and prescription products with privacy and confidence.

**Technical Goal:** Deploy a stable, secure monolith on AWS (Bahrain region) with POS stock sync, pharmacist review workflow, and admin control panel.

### Major Features
- User app (iOS + Android): full OTC and prescription ordering flow
- Pharmacist dashboard: prescription review queue
- Admin dashboard: catalog, order, user, and inventory management
- POS integration: scheduled stock sync (polling)
- Notifications: SMS + push for all transactional events
- Payment: card + STC Pay + Apple Pay
- Arabic RTL first interface
- Basic analytics: sales dashboard in admin
- Discreet packaging
- Secure prescription file storage
- Audit logging
- SFDA/PDPL baseline compliance measures (must be validated with compliance advisor)

### KPI Targets for Phase 1
- App store approved and live (iOS App Store + Google Play)
- 500 registered users in first month
- First 100 successful orders
- Prescription review SLA: < 2 hours
- POS sync success rate: > 95%

---

## Phase 2: Operational Maturity (Months 5–9)

**Business Goal:** Improve retention, delight users with premium features, and build operational efficiency for the pharmacy team.

**Technical Goal:** Add real-time communication, enhanced sync reliability, and expanded analytics.

### Major Features
- In-app pharmacist chat (order-linked messaging)
- Refill reminder system (user-set + pattern-detected)
- Health education content library (articles, FAQs)
- Express and scheduled delivery options
- Loyalty points program (earn on purchase, redeem at checkout)
- Referral program
- Pharmacist shift management and queue assignment
- Enhanced admin analytics (cohort, funnel, pharmacist performance)
- Webhook support for POS sync (real-time stock updates)
- Back-in-stock notification system
- Product ratings and reviews
- SMS sender ID fully registered
- Dark mode (mobile app)
- Admin Slack/Teams integration for ops alerts
- Support ticket SLA management

### KPI Targets for Phase 2
- 30-day retention rate: > 40%
- Repeat purchase rate: > 35%
- Pharmacist chat response time: < 30 minutes
- Refill reminder engagement rate: > 50% of reminded users reorder
- Loyalty program: > 20% of orders include points redemption

---

## Phase 3: Advanced Personalization (Months 10–16)

**Business Goal:** Become the default women's pharmacy app in KSA by delivering personalized, life-stage-aware experiences and high-value health services.

**Technical Goal:** Introduce ML-based personalization, family account model, and subscription features.

### Major Features
- Family / caregiver account model (with consent and delegation)
- Subscription wellness bundles (monthly curated product boxes)
- AI-based product recommendations (trained on purchase history and health profile)
- Advanced Arabic search (Elasticsearch with Arabic morphological analysis)
- Personalized homepage per user segment (age group, health tags)
- Pregnancy and postpartum tracking integration (week-by-week content)
- Consultation booking with pharmacist (paid or included in subscription)
- Chronic condition management tools (medication tracker, refill calendar)
- Multi-language expansion consideration (Urdu for South Asian expat community)
- PDPL audit readiness: data subject request workflow automation

### KPI Targets for Phase 3
- Subscription adoption: > 5% of active users
- Recommendation click-through: > 15%
- Family account adoption: > 10% of users
- Average basket size increase: > 25% vs. Phase 1 baseline

---

## Phase 4: Scale and Expansion (Months 17+)

**Business Goal:** Expand to multiple pharmacy branches, launch B2B offerings (corporate wellness), and pursue regional expansion (GCC).

**Technical Goal:** Extract high-load services to microservices, deploy multi-region, implement Kubernetes orchestration.

### Major Features
- Multi-branch inventory management (branch-level stock, routing logic)
- B2B portal: corporate health programs for female employees
- Regional expansion: UAE, Bahrain (compliance per country must be separately validated)
- Telemedicine integration (licensed telehealth partner)
- Insurance claims processing (must be validated per insurer agreements)
- Advanced fraud detection (ML-based anomaly detection)
- Inventory Sync Service extracted to standalone microservice
- Notification Service extracted to standalone microservice
- Multi-region AWS deployment (potential addition of Riyadh/Jeddah edge)
- White-label option for other women's health brands

### KPI Targets for Phase 4
- Multi-branch: 3+ branches integrated
- B2B: 10+ corporate clients
- International: 1 GCC market live
- Platform uptime SLA: 99.9%

---

# 18. KPIs and Success Metrics

## 18.1 Acquisition Metrics

| Metric | Description | Target (End of Phase 1) |
|---|---|---|
| App Downloads | iOS + Android combined | 2,000 in Month 1 |
| Registered Users | Completed signup with OTP verification | 500 in Month 1 |
| Signup Conversion Rate | Downloads → registrations | > 25% |
| Cost per Acquisition | Marketing spend ÷ new registered users | < SAR 25 |

---

## 18.2 Activation Metrics

| Metric | Description | Target |
|---|---|---|
| First Purchase Rate | Registered users who place at least 1 order within 7 days | > 30% |
| First Order Completion Rate | Orders started vs. completed | > 70% |
| Cart Abandonment Rate | Carts created but not checked out | < 40% |
| Prescription Upload Rate | Prescription orders started vs. prescription uploaded | > 80% |

---

## 18.3 Retention and Engagement Metrics

| Metric | Description | Target |
|---|---|---|
| 30-Day Retention Rate | Users who make a purchase in Month 1 and return in Month 2 | > 35% |
| 90-Day Retention Rate | Users active 3 months after registration | > 25% |
| Repeat Purchase Rate | Users placing 2+ orders within 90 days | > 40% |
| Average Orders per User per Month | Total orders ÷ active users | > 1.5 |
| Reorder Rate | Percentage of orders that are reorders | > 30% |
| App Session Frequency | Average sessions per active user per week | > 2 |

---

## 18.4 Order and Operations Metrics

| Metric | Description | Target |
|---|---|---|
| Average Basket Size | Total order value ÷ number of orders | > SAR 120 |
| Order Fulfillment Time | Order placed → delivered (standard) | < 4 hours (in operating zone) |
| Prescription Review SLA | Prescription submitted → pharmacist decision | < 2 hours during operating hours |
| Pharmacist Response Time | Message sent → pharmacist reply (Phase 2) | < 30 minutes |
| Order Cancellation Rate | Cancelled orders ÷ total orders | < 5% |
| Return/Refund Rate | Return requests ÷ total delivered orders | < 3% |
| Out-of-Stock Incident Rate | Orders blocked or abandoned due to OOS | < 2% |
| Delivery Success Rate | Successfully delivered ÷ attempted deliveries | > 97% |

---

## 18.5 Inventory and Sync Metrics

| Metric | Description | Target |
|---|---|---|
| POS Sync Success Rate | Successful syncs ÷ total sync attempts | > 98% |
| Average Sync Lag | Time between POS stock change and app stock update | < 5 minutes |
| SKU Mismatch Count | Number of products with SKU mismatches | 0 (immediate resolution) |
| Oversell Incidents | Orders placed for items actually OOS | < 0.5% of orders |
| Manual Override Rate | Stock manually overridden by admin ÷ total SKUs | < 2% at any time |

---

## 18.6 Pharmacist Performance Metrics

| Metric | Description | Target |
|---|---|---|
| Average Review Time | Prescription received → decision timestamp | < 45 minutes |
| Approval Rate | Approved prescriptions ÷ total reviewed | Tracked (baseline TBD) |
| Rejection Rate | Rejected ÷ total reviewed | Tracked |
| Escalation Rate | Escalated ÷ total reviewed | < 2% |
| Queue Backlog | Prescriptions awaiting review older than 2 hours | 0 during operating hours |

---

## 18.7 Financial Metrics

| Metric | Description | Target |
|---|---|---|
| Monthly Recurring Revenue | Predictable monthly revenue | Growth trajectory |
| Gross Margin | Revenue minus COGS | > 30% (product-dependent) |
| Delivery Revenue | Delivery fees collected | Tracks against delivery cost |
| Promotion ROI | Revenue attributable to promotions ÷ promotion cost | > 3x |
| Lifetime Value (LTV) | Average revenue per user over 12 months | Target > SAR 600 |

---

## 18.8 Support and Quality Metrics

| Metric | Description | Target |
|---|---|---|
| Support Ticket Volume | Tickets per 100 orders | < 3 |
| First Response Time | Ticket submitted → first admin response | < 4 hours (business hours) |
| Resolution Time | Ticket submitted → resolved | < 24 hours |
| Customer Satisfaction (CSAT) | Post-interaction rating | > 4.2 / 5 |
| App Store Rating | iOS + Android store ratings | > 4.4 / 5 |

---

# 19. Risks and Mitigations

## 19.1 Product and Business Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Regulatory non-compliance (SFDA)** | Medium | Critical | Engage Saudi-licensed legal/pharmacy compliance advisor before launch; build compliance as a day-1 requirement, not afterthought |
| **Prescription handling violations** | Medium | Critical | All prescription orders reviewed by licensed pharmacist; no automated approval; compliance advisor reviews workflow |
| **Low user adoption** | Medium | High | Pre-launch waitlist; partner with OB/GYN clinics and women's wellness communities; social media targeting; free delivery for first order |
| **Poor elderly usability** | Medium | Medium | User testing with 55+ women during beta; adjustable text size; simple flows; family-assisted onboarding option |
| **Notification fatigue** | Medium | Medium | Granular opt-in per notification type; transactional-only by default; no marketing notifications without explicit opt-in |
| **Privacy concerns causing abandonment** | Low-Medium | High | Clear, simple privacy policy in Arabic; no advertising data use; encrypted prescription storage; "What do we have on you?" accessible in settings |

---

## 19.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **POS API instability** | Medium | High | Middleware buffer + retry queue; last-known-good stock maintained; admin alerted; stock update delay tolerated up to 15 minutes |
| **Stock mismatch / overselling** | Medium | Medium | Real-time stock check at checkout (not only at add-to-cart); reserve stock on cart add (Phase 2); clear out-of-stock messaging |
| **SKU mismatch between app and POS** | Medium | Medium | SKU validation during product import; mismatch alert dashboard; sync paused per SKU until resolved |
| **Prescription file security breach** | Low | Critical | Encrypted S3 storage; pre-signed URLs (15-min expiry); access logging; penetration testing before launch |
| **Payment gateway downtime** | Low | High | Support 2+ payment methods; graceful failure message; retry logic for payment confirmation |
| **App performance in poor network** | Medium | Medium | Offline-friendly catalog browsing (cached product list); retry on connectivity restore for cart and order |
| **Database performance under load** | Low (MVP scale) | Medium | Proper indexing (all FK and search fields); Redis caching for product catalog; connection pooling; read replicas for analytics (Phase 3) |
| **Push notification delivery failures** | Low-Medium | Medium | SMS as fallback for critical transactional notifications; delivery tracking for push; fallback to in-app notification center |

---

## 19.3 Operational Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Delayed prescription approvals** | Medium | High | SLA monitoring (queue age alerts); staffing levels tied to order volume; shift system (Phase 2); admin override for urgent cases |
| **Wrong product substitution** | Low | Critical | Substitution requires patient explicit acceptance; pharmacist must record clinical reason; substitution pairs pre-approved by admin in catalog; all substitutions logged in audit |
| **Fulfillment errors (wrong item shipped)** | Low-Medium | Medium | Packing checklist tool (Phase 2); barcode scan verification at packing; return/refund fast-track for wrong items |
| **Courier reliability** | Medium | Medium | Multi-courier fallback; delivery SLA tracking; automated failed delivery retry notification |
| **Fraud / fake prescriptions** | Low-Medium | High | Pharmacist manual review is primary control; flag for unusual patterns; admin can lock account pending investigation; SFDA reporting procedure |
| **Duplicate orders (double-tap)** | Low | Medium | Idempotency key on order creation API; debounced "Place Order" button on frontend |
| **Expired medication dispatch** | Low | Critical | POS tracks expiry per batch; low-expiry alert (30 days before expiry); expired items auto-excluded from order eligibility |

---

## 19.4 User Experience Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Prescription upload friction causing drop-off** | Medium | High | Simplified upload UX; camera shortcut; visible progress indicators; allow saving prescription for later reuse |
| **Checkout abandonment due to payment issues** | Medium | Medium | Multiple payment methods; graceful error messages; payment retry option |
| **Language confusion (Arabic/English product names)** | Low | Medium | Dual-name display on all product cards; search supports both Arabic and English |
| **Misunderstanding of pharmacist review timeline** | Medium | Medium | Clear expected review time communicated at prescription submission; notification on any status change |

---

# 20. Final Recommended Build Plan

## 20.1 Recommended MVP Launch Strategy

**Launch in 3 stages:**

### Stage 1: Closed Beta (Month 3)
- Invite 50–100 beta users (family, friends, healthcare network)
- Full app functional but not publicly listed on app stores
- Focus on: prescription flow, payment, delivery, pharmacist workflow
- Gather structured feedback (Arabic-language survey)
- Fix critical bugs before open beta

### Stage 2: Open Beta (Month 4)
- App listed on App Store and Google Play (may mark as "beta")
- Limited marketing (word of mouth, social, waitlist invites)
- Operations team on standby for manual issue resolution
- Monitor sync error rate, prescription approval SLA, delivery success rate

### Stage 3: Public Launch
- App fully public; remove beta label
- Launch campaign: social media (Instagram, Snapchat, TikTok — primary channels for Saudi women)
- Influencer partnerships with women's health voices in KSA
- First-order promotion: free delivery on first order
- PR: women-first pharmacy narrative, privacy focus, Vision 2030 alignment

---

## 20.2 Recommended Team Structure

### Core MVP Team

| Role | Count | Responsibility |
|---|---|---|
| Product Manager | 1 | Requirements, prioritization, stakeholder coordination |
| UI/UX Designer | 1 | Arabic RTL design, user flows, design system |
| Mobile Developer (React Native) | 2 | iOS + Android app |
| Backend Developer (NestJS) | 2 | API, database, business logic, integrations |
| Frontend Developer (Next.js) | 1 | Admin and pharmacist dashboards |
| DevOps/Infrastructure | 1 (part-time or contractor) | AWS, CI/CD, security hardening |
| QA Engineer | 1 | Testing, regression, Arabic locale testing |
| Pharmacy Operations Lead | 1 | Pharmacist workflow, compliance advisor coordination |
| Licensed Pharmacist(s) | 1–2 | On-staff for prescription review |
| Legal/Compliance Advisor | 1 (external) | SFDA, PDPL, e-commerce compliance |

### Phase 2 Additions
- Customer Support Specialist ×2 (Arabic-fluent)
- Marketing/Growth Manager ×1
- Backend Developer ×1 (scaling features)
- Data Analyst ×1

---

## 20.3 Recommended Development Sequence

### Sprint 0 (Week 1–2): Foundation
- AWS infrastructure setup (VPC, RDS, Redis, S3, ECS)
- GitHub repo, CI/CD pipeline (GitHub Actions)
- Database schema creation (Prisma migrations)
- Authentication service (register, OTP, login, JWT)
- React Native boilerplate with Arabic RTL config

### Sprint 1 (Week 3–4): Core Catalog
- Product catalog API (CRUD)
- Category API
- Mobile: home screen, category listing, product detail screen
- Admin: product and category management UI

### Sprint 2 (Week 5–6): Cart and Checkout
- Cart API (add, remove, update, persist)
- Delivery zone configuration
- Checkout API (validate cart, apply promo, calculate totals)
- Payment gateway integration (Moyasar / HyperPay)
- Mobile: cart screen, checkout flow, order confirmation

### Sprint 3 (Week 7–8): Orders and Prescriptions
- Order API (create, status machine, history)
- Prescription upload (S3 + metadata)
- Prescription review API
- Pharmacist dashboard: queue, review flow, approval/rejection
- Mobile: order history, order detail, prescription upload

### Sprint 4 (Week 9–10): POS Integration
- Middleware sync module (scheduled polling)
- Inventory API
- Sync log API
- Admin: stock monitoring dashboard, sync log viewer
- Admin: low stock alert configuration

### Sprint 5 (Week 11–12): Notifications and Admin
- SMS integration (Unifonic/Taqnyat)
- FCM push integration
- Email integration (Amazon SES)
- All transactional notification templates (Arabic + English)
- Admin: full order management
- Admin: user management

### Sprint 6 (Week 13–14): Security and Hardening
- Audit logging (all actions)
- Rate limiting and brute force protection
- 2FA for admin and pharmacist
- Penetration testing (external pen test firm)
- PDPL baseline compliance review
- App store submission preparation

### Sprint 7 (Week 15–16): Beta and Launch Prep
- Closed beta with 50–100 users
- Bug fixing from beta feedback
- Performance testing (load test API with k6)
- App store review submission
- Admin and pharmacist onboarding documentation

---

## 20.4 Recommended Integration Priority

| Integration | Priority | Phase |
|---|---|---|
| Payment gateway (Moyasar/HyperPay) | Critical | MVP |
| SMS gateway (Unifonic/Taqnyat) | Critical | MVP |
| Firebase Cloud Messaging | Critical | MVP |
| AWS S3 (prescription storage) | Critical | MVP |
| POS stock sync (polling) | Critical | MVP |
| Amazon SES (email) | High | MVP |
| POS webhook sync (real-time) | High | Phase 2 |
| In-app chat (Socket.io) | Medium | Phase 2 |
| Mixpanel / Amplitude (analytics) | Medium | Phase 2 |
| Sentry (error monitoring) | High | MVP |
| Elasticsearch (advanced search) | Low | Phase 3 |
| Telemedicine partner API | Low | Phase 4 |

---

## 20.5 Recommended Governance Model

### User Access Governance
- Self-registration; no admin approval required for standard accounts
- Prescription product access gated by pharmacist review (no automated bypass)
- Account flags require admin review before account suspension
- User data export requests fulfilled within 30 days (PDPL)
- Account deletion processed within 30 days

### Pharmacist Access Governance
- Pharmacist accounts created only by admin — no self-registration
- License number recorded and verified by admin before account activation
- License expiry monitored; 30-day warning; automatic suspension if expired
- All prescription review actions logged with pharmacist ID
- Pharmacist activity reviewed by pharmacy operations lead monthly
- Queue assignment by admin or shift system — pharmacists cannot self-assign

### Admin Access Governance
- Super Admin role: 1–2 designated individuals maximum
- Role-based admin sub-roles for catalog, operations, finance
- All admin actions logged in audit trail
- Admin account creation requires approval of existing super admin
- Quarterly access review: super admin reviews all active admin and pharmacist accounts
- 2FA enforced for all admin accounts — no exceptions
- New device login requires re-verification — always

### Permission Change Governance
- Any role elevation (user → admin, or pharmacist → admin) triggers automated email alert to super admin and is logged
- Permission changes require a mandatory reason field (audit logged)
- No self-elevation of permissions is technically possible (permission checked server-side, not client-side)

---

## 20.6 Final Summary: How to Build Estrogen Pharmacy

**Build it as a modular monolith first.** The NestJS backend cleanly separates concerns into modules — auth, orders, prescriptions, inventory, notifications, admin — without the operational overhead of microservices. This is the right architecture for a team of 6–8 engineers building an MVP that needs to launch within 4 months.

**Make security and privacy day-1 requirements, not day-90 fixes.** Saudi PDPL and SFDA compliance must be woven into the architecture from the start. Encrypted prescription files, audit logs, consent records, and role-based access are not features — they are foundational requirements. Engage a local compliance advisor in Month 1, not Month 4.

**Arabic-first is a genuine product differentiator.** Not a translation layer. The UX must be designed in Arabic from the first wireframe. RTL layouts, Arabic typography, Hijri date support, Eastern Arabic numerals, and culturally appropriate language are core to winning women in Saudi Arabia.

**The POS integration is a business-critical dependency.** Build the middleware sync module as a resilient, queue-backed service from the start. Stock mismatch is the #1 operational risk for a pharmacy platform. The polling + webhook hybrid architecture, with retry queues and admin visibility, is the right choice for MVP reliability.

**The pharmacist workflow must be operationally realistic.** Prescription review is a regulatory requirement, not a feature option. The pharmacist queue, review flow, SLA monitoring, and escalation path must be fully functional at launch. Under-investing here creates legal and safety risk.

**Privacy is not just a feature — it is the brand.** Discreet packaging, encrypted prescription storage, no-advertising-use-of-health-data, biometric app lock, and a clear Arabic privacy policy are the product's core promise to Saudi women. Every product decision should be evaluated through the lens of: "Does this make our users feel safer and more respected?"

**Build lean, launch fast, iterate based on real Saudi women's feedback.** The target audience is underserved and eager for this product. A functional, trustworthy MVP that solves the core use case — private, convenient, Arabic-first pharmacy delivery — is more valuable than a feature-complete product that launches 12 months late. Launch Phase 1. Learn. Build Phase 2 with data.

---

*End of Estrogen Pharmacy Complete Product Specification*
*Version 1.0 — March 2026*
*All regulatory and compliance items marked must be validated with a Saudi-qualified legal, pharmacy, and data protection compliance advisor before platform launch.*
