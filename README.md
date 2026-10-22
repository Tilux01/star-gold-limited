# Star Gold Limited

Luxury fashion store: Node/Express + Firebase (Firestore) backend, static frontend, Paystack payments, WhatsApp order handoff.

## Run

    npm install
    cp .env.example .env
    npm start

Store: http://localhost:4100
Admin: http://localhost:4100/admin.html

Default admin: admin@stargoldlimited.com / StarGold2024! (change in .env before first run).

## Firebase

Set FIREBASE_SERVICE_ACCOUNT to the service account JSON (single line) or FIREBASE_SERVICE_ACCOUNT_FILE to its path. Without it the server uses the local JSON store in .data/db.json so nothing blocks local development.

## Paystack

Set PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY. Without a secret key checkout runs in test mode: orders are created and marked paid by the local test endpoint, and the UI labels it as test mode.

## Layout

public/ (pages, css, js, assets), server/ (express, routes, catalog, seed, db), .Tilux/ (design blueprint and build plan), .data/ (local database when Firebase is not configured).

## Pages

index, shop, product, cart, checkout, order, account, admin, contact. Every page shares the header, footer, cart drawer, search overlay and quick view from public/js/chrome.js.
