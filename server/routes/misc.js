const express = require("express");
const db = require("../db");
const { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } = require("../catalog");

const router = express.Router();

router.get("/config", (req, res) => {
  res.json({
    brand: "Star Gold Limited",
    currency: "NGN",
    whatsapp: process.env.WHATSAPP_NUMBER || "2348063494273",
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    shippingFee: SHIPPING_FEE,
    paymentMode: process.env.PAYSTACK_SECRET_KEY ? "paystack" : "test",
    database: db.driver,
    supportEmail: process.env.SUPPORT_EMAIL || "orders@stargoldlimited.com",
    address: process.env.STORE_ADDRESS || "14 Adeola Odeku Street, Victoria Island, Lagos",
    hours: "Mon - Sat, 9:00am to 7:00pm",
    phone: process.env.STORE_PHONE || "+234 806 349 4273"
  });
});

router.post("/newsletter", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    const existing = await db.find("subscribers", (row) => row.email === email);
    if (existing.length) return res.json({ ok: true, message: "You are already on the list." });
    await db.create("subscribers", { email, createdAt: new Date().toISOString(), source: req.body.source || "site" });
    res.status(201).json({ ok: true, message: "You are on the list. Watch your inbox." });
  } catch (err) {
    next(err);
  }
});

router.post("/contact", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim();
    const message = String(req.body.message || "").trim();
    const phone = String(req.body.phone || "").trim();
    if (name.length < 2) return res.status(400).json({ error: "Tell us your name." });
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (message.length < 10) return res.status(400).json({ error: "Your message is a little too short." });
    await db.create("messages", {
      name,
      email,
      phone,
      message,
      subject: String(req.body.subject || "General enquiry"),
      createdAt: new Date().toISOString(),
      handled: false
    });
    res.status(201).json({ ok: true, message: "Your message is with our team. We reply within one business day." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
