const express = require("express");
const db = require("../db");
const { optionalAuth, requireAuth } = require("../auth");
const { resolveItems, totals, orderNumber, whatsappMessage } = require("../catalog");
const promos = require("../promos");
const settings = require("../settings");

const router = express.Router();

function clean(value) {
  return String(value === undefined || value === null ? "" : value).trim();
}

router.post("/", optionalAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return res.status(400).json({ error: "Your bag is empty." });
    const customer = body.customer || {};
    const required = ["name", "email", "phone", "address", "city", "state"];
    const missing = required.filter((field) => !clean(customer[field]));
    if (missing.length) return res.status(400).json({ error: `Please complete: ${missing.join(", ")}.` });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(customer.email))) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (clean(customer.phone).replace(/[^0-9]/g, "").length < 7) {
      return res.status(400).json({ error: "Enter a valid phone number." });
    }

    const products = await db.all("products");
    const { resolved, problems } = resolveItems(products, items);
    if (problems.length) return res.status(409).json({ error: problems[0], problems });
    const sums = totals(resolved, body.promo, await promos.map(), await settings.read());

    const order = {
      orderNumber: orderNumber(),
      userId: req.user ? req.user.id : null,
      items: resolved,
      customer: {
        name: clean(customer.name),
        email: clean(customer.email).toLowerCase(),
        phone: clean(customer.phone),
        address: clean(customer.address),
        city: clean(customer.city),
        state: clean(customer.state),
        notes: clean(customer.notes)
      },
      subtotal: sums.subtotal,
      discount: sums.discount,
      shipping: body.shipping === "express" ? 9500 : sums.shipping,
      shippingMethod: body.shipping === "express" ? "express" : "standard",
      total: body.shipping === "express" ? sums.subtotal - sums.discount + 9500 : sums.total,
      promo: sums.promo,
      currency: "NGN",
      status: "pending",
      payment: { provider: body.payment === "transfer" ? "transfer" : (process.env.PAYSTACK_SECRET_KEY ? "paystack" : "test"), status: "pending", reference: `SGPAY-${Date.now()}-${Math.floor(Math.random() * 1000)}` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await db.create("orders", order);
    res.status(201).json({
      order: saved,
      whatsapp: buildWhatsapp(saved),
      paymentMode: process.env.PAYSTACK_SECRET_KEY ? "live" : "test"
    });
  } catch (err) {
    next(err);
  }
});

function buildWhatsapp(order) {
  const number = (process.env.WHATSAPP_NUMBER || "2348063494273").replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessage(order))}`;
}

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const rows = await db.find("orders", (row) => row.userId === req.user.id);
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/lookup", async (req, res, next) => {
  try {
    const ref = String(req.query.ref || "").trim();
    if (!ref) return res.status(400).json({ error: "Reference is required." });
    const rows = await db.all("orders");
    const order = rows.find((o) => o.payment && o.payment.reference === ref);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json({ order, whatsapp: buildWhatsapp(order) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const order = await db.get("orders", req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    const isOwner = req.user && order.userId === req.user.id;
    const isAdmin = req.user && req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "You cannot view this order." });
    res.json({ order, whatsapp: buildWhatsapp(order) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
module.exports.buildWhatsapp = buildWhatsapp;
