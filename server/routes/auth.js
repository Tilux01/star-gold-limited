const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { signToken, requireAuth, publicUser } = require("../auth");

const router = express.Router();

function clean(value) {
  return String(value || "").trim();
}

router.post("/register", async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    const existing = await db.find("users", (row) => row.email === email);
    if (existing.length) return res.status(409).json({ error: "An account with that email already exists." });
    const user = await db.create("users", {
      name,
      email,
      phone: clean(req.body.phone),
      passwordHash: bcrypt.hashSync(password, 10),
      role: "customer",
      addresses: [],
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const rows = await db.find("users", (row) => row.email === email);
    const user = rows[0];
    if (!user || !bcrypt.compareSync(password, user.passwordHash || "")) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const patch = {};
    ["name", "phone"].forEach((field) => {
      if (req.body[field] !== undefined) patch[field] = clean(req.body[field]);
    });
    if (req.body.email !== undefined) {
      const email = clean(req.body.email).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
      const others = await db.find("users", (row) => row.email === email && row.id !== req.user.id);
      if (others.length) return res.status(409).json({ error: "That email is already in use." });
      patch.email = email;
    }
    if (Array.isArray(req.body.addresses)) {
      patch.addresses = req.body.addresses.slice(0, 8).map((address, index) => ({
        id: address.id || `addr-${Date.now()}-${index}`,
        label: clean(address.label) || "Address",
        name: clean(address.name),
        phone: clean(address.phone),
        address: clean(address.address),
        city: clean(address.city),
        state: clean(address.state)
      }));
    }
    const updated = await db.update("users", req.user.id, patch);
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

router.post("/password", requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body.currentPassword || "");
    const next_ = String(req.body.newPassword || "");
    if (!bcrypt.compareSync(current, req.user.passwordHash || "")) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    if (next_.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });
    await db.update("users", req.user.id, { passwordHash: bcrypt.hashSync(next_, 10) });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
