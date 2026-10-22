const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { optionalAuth } = require("../auth");

const router = express.Router();
const SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4300}`).replace(/\/$/, "");

async function finalize(order, reference, channel) {
  if (order.payment && order.payment.status === "paid") {
    return db.update("orders", order.id, {
      payment: Object.assign({}, order.payment, { status: "paid", reference, channel }),
      updatedAt: new Date().toISOString()
    });
  }
  for (const line of order.items || []) {
    const product = await db.get("products", line.productId);
    if (!product) continue;
    const variants = (product.variants || []).map((variant) => {
      if (variant.id !== line.variantId) return variant;
      return Object.assign({}, variant, { stock: Math.max(0, Number(variant.stock || 0) - line.quantity) });
    });
    await db.update("products", product.id, { variants });
  }
  return db.update("orders", order.id, {
    status: "paid",
    payment: Object.assign({}, order.payment, { status: "paid", reference, channel: channel || "paystack", paidAt: new Date().toISOString() }),
    updatedAt: new Date().toISOString()
  });
}

router.post("/initialize", optionalAuth, async (req, res, next) => {
  try {
    const order = await db.get("orders", req.body.orderId);
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (order.userId && (!req.user || req.user.id !== order.userId)) {
      return res.status(403).json({ error: "This order belongs to another account." });
    }
    if (order.payment && order.payment.status === "paid") {
      return res.status(409).json({ error: "This order has already been paid." });
    }
    const reference = order.payment.reference || `SGPAY-${Date.now()}`;
    if (!SECRET) {
      await db.update("orders", order.id, { payment: Object.assign({}, order.payment, { reference }) });
      return res.json({ mode: "test", reference, amount: order.total });
    }
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: order.customer.email,
        amount: Math.round(order.total * 100),
        reference,
        currency: "NGN",
        callback_url: `${PUBLIC_URL}/order.html?id=${order.id}`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer.name
        }
      })
    });
    const payload = await response.json();
    if (!payload.status) return res.status(502).json({ error: payload.message || "Payment could not be started." });
    await db.update("orders", order.id, {
      payment: Object.assign({}, order.payment, { reference, authorizationUrl: payload.data.authorization_url })
    });
    res.json({ mode: "live", reference, authorizationUrl: payload.data.authorization_url, publicKey: process.env.PAYSTACK_PUBLIC_KEY || "" });
  } catch (err) {
    next(err);
  }
});

router.post("/mark-paid", async (req, res, next) => {
  try {
    const reference = String(req.body.reference || "");
    const rows = await db.find("orders", (row) => row.payment && row.payment.reference === reference);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "No order matches that reference." });
    if (SECRET) return res.status(403).json({ error: "Live payments must be confirmed by Paystack." });
    const updated = await finalize(order, reference, "test");
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/verify/:reference", async (req, res, next) => {
  try {
    const reference = req.params.reference;
    const rows = await db.find("orders", (row) => row.payment && row.payment.reference === reference);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: "No order matches that reference." });
    if (!SECRET) return res.json({ status: order.payment.status, order });
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${SECRET}` }
    });
    const payload = await response.json();
    if (!payload.status) return res.status(502).json({ error: payload.message || "Could not verify payment." });
    const data = payload.data;
    if (data.status === "success" && Math.round(Number(data.amount)) >= Math.round(order.total * 100)) {
      const updated = await finalize(order, reference, data.channel);
      return res.json({ status: "paid", order: updated });
    }
    res.json({ status: data.status || "pending", order });
  } catch (err) {
    next(err);
  }
});

router.post("/webhook", express.json({ type: "*/*" }), async (req, res, next) => {
  try {
    if (!SECRET) return res.sendStatus(200);
    const signature = req.headers["x-paystack-signature"];
    const hash = crypto.createHmac("sha512", SECRET).update(JSON.stringify(req.body)).digest("hex");
    if (hash !== signature) return res.sendStatus(401);
    const event = req.body;
    if (event && event.event === "charge.success") {
      const reference = event.data.reference;
      const rows = await db.find("orders", (row) => row.payment && row.payment.reference === reference);
      if (rows[0]) await finalize(rows[0], reference, event.data.channel);
    }
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
