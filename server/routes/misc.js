const express = require("express");
const db = require("../db");
const settings = require("../settings");
const categories = require("../categories");
const promos = require("../promos");

const router = express.Router();


router.get("/config", async (req, res, next) => {
  try {
    const store = await settings.read();
    const cats = await categories.live();
    const codes = await promos.map();
    res.json({
      brand: store.brand,
      currency: "NGN",
      whatsapp: store.whatsapp,
      freeShippingThreshold: store.freeShippingThreshold,
      shippingFee: store.shippingFee,
      bank: store.bank,
      paymentMode: process.env.PAYSTACK_SECRET_KEY ? "paystack" : "test",
      database: db.driver,
      supportEmail: store.supportEmail,
      address: store.address,
      hours: store.hours,
      phone: store.phone,
      instagram: store.instagram,
      announcement: store.announcement,
      categories: cats.map((cat) => ({ slug: cat.slug, label: cat.label, image: cat.image || "", blurb: cat.blurb || "" })),
      promos: Object.keys(codes).map((code) => ({ code, label: codes[code].label }))
    });
  } catch (err) {
    next(err);
  }
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
router.get("/health", async (req, res) => {
  const out = { driver: db.driver };
  try { await db.all("products"); } catch (e) { out.error = e.message; out.code = e.code; }
  try { await require("../firebase").check(); } catch (e) { out.fb = e.message; }
  res.json(out);
});
