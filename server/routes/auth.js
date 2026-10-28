const express = require("express");
const db = require("../db");
const firebase = require("../firebase");
const { signToken, requireAuth, publicUser } = require("../auth");

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "admin@stargoldlimited.com").toLowerCase();

const clean = (value) => String(value == null ? "" : value).trim();

function baseline(uid, email, name) {
  return {
    id: uid,
    email,
    name: name || email.split("@")[0],
    phone: "",
    role: email === ADMIN_EMAIL ? "admin" : "customer",
    addresses: [],
    createdAt: new Date().toISOString()
  };
}

async function resolveUser(fbUser) {
  const uid = fbUser.localId;
  const email = clean(fbUser.email).toLowerCase();
  const display = clean(fbUser.displayName);

  let record = null;
  try {
    record = await db.get("users", uid);
  } catch (err) {
    return baseline(uid, email, display);
  }

  if (record) {
    const patch = {};
    if (display && !record.name) patch.name = display;
    if (email && record.email !== email) patch.email = email;
    if (!record.role) patch.role = email === ADMIN_EMAIL ? "admin" : "customer";
    if (Object.keys(patch).length) {
      try {
        record = await db.update("users", uid, patch);
      } catch (err) {}
    }
    return record;
  }

  const fresh = baseline(uid, email, display);
  try {
    const legacy = await db.find("users", (row) => row.email === email && row.id !== uid);
    if (legacy.length) {
      const old = legacy[0];
      const merged = Object.assign({}, fresh, old, { id: uid, email });
      await db.remove("users", old.id);
      return await db.createWithId("users", uid, merged);
    }
    return await db.createWithId("users", uid, fresh);
  } catch (err) {
    return fresh;
  }
}

function failure(res, err, fallback) {
  const status = err && err.status ? err.status : 400;
  const message = err && err.expose ? err.message : fallback;
  return res.status(status).json({ error: message });
}

router.post("/register", async (req, res, next) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    const phone = clean(req.body.phone);

    if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 6) return res.status(400).json({ error: "Use a password with at least 6 characters." });

    let account;
    try {
      account = await firebase.signUp(email, password, name);
    } catch (err) {
      if (err.code === "EMAIL_EXISTS") {
        return res.status(409).json({ error: "An account with that email already exists." });
      }
      return failure(res, err, "We could not create your account right now.");
    }

    const user = await resolveUser(Object.assign({}, account, { displayName: name }));
    if (phone) {
      try {
        user.phone = phone;
        await db.update("users", user.id, { phone });
      } catch (err) {}
    }
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password || "");
    if (!EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ error: "Enter your email and password." });
    }

    let account;
    try {
      account = await firebase.signIn(email, password);
    } catch (err) {
      if (["INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND", "INVALID_PASSWORD", "INVALID_EMAIL"].includes(err.code)) {
        return res.status(401).json({ error: "That email and password do not match." });
      }
      return failure(res, err, "Sign in is unavailable right now.");
    }

    const user = await resolveUser(account);
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
    if (req.body.name !== undefined) {
      const name = clean(req.body.name);
      if (name.length < 2) return res.status(400).json({ error: "Enter your full name." });
      patch.name = name;
    }
    if (req.body.phone !== undefined) patch.phone = clean(req.body.phone);
    if (req.body.addresses !== undefined && Array.isArray(req.body.addresses)) {
      patch.addresses = req.body.addresses.slice(0, 6).map((item) => ({
        label: clean(item.label).slice(0, 40) || "Address",
        line1: clean(item.line1).slice(0, 160),
        line2: clean(item.line2).slice(0, 160),
        city: clean(item.city).slice(0, 80),
        state: clean(item.state).slice(0, 80),
        phone: clean(item.phone).slice(0, 40)
      })).filter((item) => item.line1);
    }
    if (req.body.newsletter !== undefined) patch.newsletter = Boolean(req.body.newsletter);

    const email = clean(req.body.email).toLowerCase();
    if (email && email !== req.user.email) {
      const password = String(req.body.password || "");
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
      if (!password) return res.status(400).json({ error: "Enter your password to change your email." });
      if (req.user.email) {
        try {
          const session = await firebase.signIn(req.user.email, password);
          await firebase.updateAccount(session.idToken, { email });
        } catch (err) {
          return failure(res, err, "We could not update your email address.");
        }
      }
      patch.email = email;
    }

    if (!Object.keys(patch).length) return res.json({ user: publicUser(req.user) });

    const updated = await db.update("users", req.user.id, patch);
    res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});
router.post("/password", requireAuth, async (req, res, next) => {
  try {
    const current = String(req.body.currentPassword || req.body.current || "");
    const next_ = String(req.body.newPassword || req.body.password || "");
    if (!current) return res.status(400).json({ error: "Enter your current password." });
    if (next_.length < 6) return res.status(400).json({ error: "Use a password with at least 6 characters." });

    let session;
    try {
      session = await firebase.signIn(req.user.email, current);
    } catch (err) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
    try {
      await firebase.updateAccount(session.idToken, { password: next_ });
    } catch (err) {
      return failure(res, err, "We could not update your password right now.");
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/forgot", async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
  try {
    await firebase.sendResetEmail(email);
  } catch (err) {}
  res.json({ ok: true });
});

router.post("/reset", async (req, res) => {
  const code = clean(req.body.oobCode || req.body.code);
  const password = String(req.body.password || req.body.newPassword || "");
  if (!code) return res.status(400).json({ error: "This reset link is not valid." });
  if (password.length < 6) return res.status(400).json({ error: "Use a password with at least 6 characters." });
  try {
    await firebase.resetPassword(code, password);
  } catch (err) {
    return res.status(400).json({ error: "This reset link has expired. Request a new one." });
  }
  res.json({ ok: true });
});

module.exports = router;
