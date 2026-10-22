# Star Gold Limited - Build Plan

## Stack

- Node 24 + Express API
- Firebase Firestore through firebase-admin when credentials exist, local JSON store otherwise
- JWT auth with bcrypt password hashing
- Paystack initialize, verify and webhook, plus test mode fallback
- Multer uploads with optional cloud storage
- Vanilla JS frontend, shared design system in css/app.css and css/pages.css

## Data model

- users: name, email, passwordHash, phone, role, addresses, createdAt
- products: name, slug, category, origin, price, compareAt, images, sizes, colors, variants, stock, rating, reviews, badge, flags
- orders: orderNumber, userId, items, totals, customer, shippingMethod, payment, status, timestamps
- subscribers, messages

## API

Auth: POST /api/auth/register, POST /api/auth/login, GET and PATCH /api/auth/me.

Catalog: GET /api/products with q, category, origin, size, price, feature, sort, page. GET /api/products/:slug. POST /api/products/quote.

Orders: POST /api/orders, GET /api/orders/mine, GET /api/orders/lookup?ref=, GET /api/orders/:id.

Payments: POST /api/payments/initialize, GET /api/payments/verify/:ref, POST /api/payments/mark-paid, POST /api/payments/webhook.

Admin: GET /api/admin/summary, products CRUD, upload, orders list and status update, customers.

## Execution sequence (completed)

1. Read requirements, map design blueprint from the reference layout.
2. Database layer with Firebase and local fallback.
3. Auth, catalog, orders, payments, admin routes.
4. Seed 24 products across 8 categories, 2 origins, admin account.
5. Design system CSS, shared chrome (header, footer, drawer, search, quick view).
6. Landing page sections: hero slider, marquee, categories, new arrivals tabs, bento promos, best seller rail, editorial, origin split, lookbook, reviews, metrics, FAQ, newsletter, contact strip.
7. Shop filters, product detail with variants, cart with promo codes, checkout, Paystack, order confirmation, WhatsApp handoff.
8. Account area with orders, profile, addresses, wishlist.
9. Admin dashboard with stats, product CRUD, uploads, order management.
10. End to end tests with a headless browser, fix console errors.

