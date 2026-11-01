# Backend plan: Veenu Mehandi store

Prepared 29 Oct 2026 for Disha (Web Foundry). Figures marked "(source)" were read from the provider's own page on this date; confirm them when you sign up, because gateway offers change often.

## 1. Why the site was static, and why that must change now

I built it static because the quotation promised "UPI / payment link" and "WhatsApp/Email order notifications" and the deadline was 2 days. A static site costs nothing to host and cannot break. There was no technical rule forcing it. The limits were written in the README: the site cannot see whether a UPI payment arrived and cannot send anything to customers by itself.

Veenu's voice notes now ask for exactly the things a static site cannot do:

| What Veenu said | What it needs |
|---|---|
| "No WhatsApp for orders. I want confirmation from the website that an order came" | Orders stored on a server, shown in an admin screen |
| "Tracking ID should go automatically to the customer's email or number" | A server that sends email/SMS when she enters a tracking ID |
| "I want to save the time spent sending tracking and re-checking" | Payment confirmed automatically, no screenshots |
| "If this is not done, there is no benefit for me" | This is a hard requirement, not a nice-to-have |

So yes, a backend is now needed.

## 2. Target architecture

```
Customer browser (current static site)
   |  1. POST /api/orders  (items + address only; server recomputes prices and shipping)
   v
Backend API (Node.js + Express)  <---->  Database (SQLite or PostgreSQL)
   |  2. create gateway order
   v
Payment gateway (Razorpay or Cashfree)  -- UPI / cards / netbanking -->  customer pays
   |  3. webhook "payment captured" (signed)
   v
Backend: mark order PAID  ->  email customer "Order confirmed"  ->  email Veenu "New order"
   |
Veenu opens Admin page -> sees order -> packs -> enters courier + tracking ID
   v
Backend emails (and optionally SMS) the customer the tracking ID
```

The website pages stay as they are. Only checkout changes (it calls the API and opens the gateway's payment window instead of showing a QR code).

## 3. Components and options

| Part | Recommended | Alternatives | Notes |
|---|---|---|---|
| Server | Node.js + Express | Next.js API routes | Same language as the front end |
| Database | SQLite file to start | PostgreSQL / Supabase | SQLite is enough for a small shop and easy to back up |
| Hosting | A small VPS (you already run one for another client project) | Render, Railway, Fly.io | Needs HTTPS and daily DB backup |
| Payments | Razorpay | Cashfree, PhonePe PG, PayU | Webhook is the source of truth, never the browser |
| Email | Resend (free: 3,000/month, 100/day, 3 domains) (source) | SMTP, Brevo, Amazon SES | Sending from `orders@her-domain` needs her domain's DNS records |
| SMS | Optional later | Fast2SMS, MSG91 | India requires DLT registration (see section 8) |
| Tracking | Veenu types the courier + tracking ID | Shiprocket/courier API to automate | Start manual-entry, email is automatic |
| Admin | Simple password-protected page in the same server | Full dashboard later | See section 6 |

## 4. Order flow in detail

1. Customer fills the form. Browser sends only product ids, variants, quantities, name, phone, email, address.
2. Server looks up prices and weights from its own product table and computes subtotal, shipping (Rs 70 per started kg) and total. **It never trusts totals sent by the browser.**
3. Server saves the order as `PENDING_PAYMENT`, creates a gateway order for that exact amount, returns the gateway order id.
4. Browser opens the gateway payment window. Customer pays by UPI/card.
5. Gateway calls `POST /api/payments/webhook`. Server verifies the signature (HMAC with the webhook secret) before doing anything, marks the order `PAID`, stores the payment id.
6. Server sends the confirmation email to the customer and the new-order email to Veenu.
7. Veenu opens the admin page, sees PAID orders, packs them, enters courier name + tracking ID, presses "Shipped". Status becomes `SHIPPED` and the customer is emailed the tracking ID.
8. Unpaid orders older than a set time are marked `EXPIRED` automatically.

## 5. Data model

- `products` (id, name, category, description, video_url, active)
- `variants` (id, product_id, label, price, weight_g, stock, active)
- `orders` (id, public_id like VM-261029-AB12, status, name, phone, email, address fields, subtotal, shipping, total, gateway_order_id, gateway_payment_id, created_at, paid_at)
- `order_items` (order_id, product name, variant label, unit price, qty), copied at order time so later price changes do not alter old orders
- `shipments` (order_id, courier, tracking_id, tracking_url, shipped_at, email_sent_at)
- `admins` (email, password hash)
- `events` (order_id, type, payload, time), an audit trail of webhooks and status changes

Order status: PENDING_PAYMENT -> PAID -> PACKED -> SHIPPED -> DELIVERED, plus EXPIRED, CANCELLED, REFUNDED.

## 6. API and admin

Public: `GET /api/products`, `POST /api/orders`, `POST /api/payments/webhook`, `GET /api/orders/:publicId?phone=...` (customer status page).
Admin (login required): `POST /api/admin/login`, `GET /api/admin/orders?status=`, `PATCH /api/admin/orders/:id` (status, courier, tracking ID), `POST /api/admin/orders/:id/resend-email`, product and price editing (phase 2).

Admin screen for Veenu: today's orders list, order detail with address and items, a print-friendly packing slip, a "Shipped" form with courier + tracking ID, export to CSV.

## 7. Security checklist

- Recompute every price on the server; ignore any total from the browser.
- Verify the gateway webhook signature on the raw request body; make the handler idempotent (a repeated webhook must not email twice).
- Keep API keys and secrets in environment variables, never in the website files.
- Admin password hashed (argon2/bcrypt), login rate limiting, HTTPS only, secure cookies.
- Validate and limit all inputs; rate-limit order creation to stop spam.
- Daily automatic database backup stored off the server.
- Customer data (phone, address) only in the database; privacy page already says so.

## 8. Costs

Payment gateway (per transaction):
- Razorpay standard: 2% platform fee + 18% GST on that fee (about 2.36% in total) on UPI, cards, netbanking and wallets; no setup or annual fee; settlement about T+2. Merchants activating on or after 1 July 2026 may get 0% platform fee up to Rs 5 lakh of sales or 90 days, plus a Rs 199 KYC fee and GST (source: Razorpay pricing blog).
- Cashfree: zero setup fee; 1.95% on domestic cards; a festive offer gives new merchants (signed up on or after 21 July 2026) no platform fee on the first Rs 20 lakh of sales, GST still applies; the page did not state a clear UPI rate (source: Cashfree pricing page).
- UPI rule from 15 Oct 2026: a 0.4% merchant fee on UPI payments above Rs 2,000 (capped at Rs 300); payments up to Rs 2,000 are free; small merchants receiving up to Rs 1 lakh a month through UPI QR codes are exempt (source: Motilal Oswal article). This is separate from the gateway's own fee. Most of Veenu's orders will be under Rs 2,000.
- Taking UPI straight to her own UPI ID (today's setup) has no gateway fee, but cannot confirm payments automatically.

Other:
- Email: free tier is enough at the start (3,000 a month). Paid plans start at $20 a month for 50,000 (source: Resend pricing).
- SMS (optional): India needs DLT registration of the business, a sender ID and approved message templates. The page I read quotes a one-time Rs 5,900 to 10,000 plus annual renewal and 1 to 3 weeks to set up, but is not an official source. I could not confirm a current per-SMS rate. Start with email only.
- WhatsApp automatic messages need the WhatsApp Business API through a provider and approved templates; costs vary. Not recommended for phase 1.
- Hosting: your existing VPS, or a small paid server. Domain is needed for sending email from her own address.

## 9. Recommended build order (my estimates)

Phase 1, about 3 to 4 working days: database, order API with server-side pricing, Razorpay in test mode, webhook, confirmation emails, admin login, orders list, shipped form with tracking-ID email.
Phase 2, about 2 to 3 days: product/price/stock editing in admin, order search and CSV export, customer order-status page, abandoned-order expiry.
Phase 3, optional: SMS, courier/Shiprocket tracking API, discounts, customer accounts.

## 10. What is needed from Veenu

- Razorpay or Cashfree account with KYC completed: PAN, bank account, business details, and public policy pages (the site already has shipping/returns and privacy/terms). Test keys are available immediately; live keys come after KYC approval.
- Her domain, for the website and for sending email from her own address.
- Final price list with categories and all product weights with packing.
- Logo file and brand colours.

## 11. Business note

The quotation (Rs 10,000 for the store) promised UPI/payment-link checkout and WhatsApp/email order notifications. An order system with payment verification, admin screen and automatic tracking emails is a bigger scope, and the admin panel was listed as a future add-on. It also brings ongoing work (server, backups, gateway issues). Agree scope, price and what the monthly Rs 2,000 covers with Veenu before starting.

## 12. What is live right now (interim)

No backend. Customer pays by UPI, enters the 12-digit transaction ID, and the order is emailed to Veenu with that ID; the customer gets a confirmation email. Veenu checks the payment in her UPI app and emails tracking details by hand.
