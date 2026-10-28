const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../db");
const categories = require("../categories");
const settings = require("../settings");
const promoStore = require("../promos");
const { requireAuth, requireAdmin } = require("../auth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    const ok = /[.](jpe?g|png|webp|avif|gif|heic|mp4|mov|webm|m4v)$/i.test(file.originalname) || /^(image|video)[/]/.test(file.mimetype);
    if (!ok) return done(new Error("Only JPG, PNG, WEBP, AVIF, GIF, MP4, MOV or WEBM files are allowed."));
    done(null, true);
  }
});

router.use(requireAuth, requireAdmin);

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return String(value).split(/\r?\n|,/).map((row) => row.trim()).filter(Boolean);
}

async function cloudinaryUpload(file) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  const folder = "star-gold";
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "upload");
  form.append("api_key", key);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.secure_url) throw new Error(data.error && data.error.message ? data.error.message : "Cloud upload failed.");
  return {
    url: data.secure_url,
    publicId: data.public_id,
    kind: String(data.resource_type) === "video" ? "video" : "image",
    bytes: data.bytes || file.size,
    format: data.format || ""
  };
}

function localUpload(file) {
  const ext = (path.extname(file.originalname) || "").toLowerCase() || (file.mimetype.startsWith("video") ? ".mp4" : ".jpg");
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  fs.writeFileSync(path.join(uploadDir, name), file.buffer);
  return {
    url: `/uploads/${name}`,
    publicId: "",
    kind: file.mimetype.startsWith("video") ? "video" : "image",
    bytes: file.size,
    format: ext.replace(".", "")
  };
}

async function storeFile(file) {
async function catboxUpload(file) {
  const form = new FormData();
  form.append("reqtype", "fileupload");
  form.append("fileToUpload", new Blob([file.buffer], { type: file.mimetype }), file.originalname || "upload");
  const res = await fetch("https://catbox.moe/user/api.php", { method: "POST", body: form });
  const text = (await res.text()).trim();
  if (!res.ok || !text.startsWith("https://")) throw new Error("catbox failed");
  return { url: text, publicId: "", kind: file.mimetype.startsWith("video") ? "video" : "image", bytes: file.size, format: (path.extname(file.originalname) || "").replace(".", "") };
}

  let stored = null;
  try {
    stored = await cloudinaryUpload(file);
  } catch (err) {
    stored = null;
  }
  if (!stored) {
    try { stored = await catboxUpload(file); } catch (err) { stored = localUpload(file); }
  }
  const record = {
    id: `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
    url: stored.url,
    publicId: stored.publicId,
    kind: stored.kind,
    bytes: stored.bytes,
    format: stored.format,
    name: file.originalname || "",
    createdAt: new Date().toISOString()
  };
  await db.create("media", record);
  return record;
}

router.post("/upload", upload.array("files", 10), async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: "No file received." });
    const saved = [];
    for (const file of files) saved.push(await storeFile(file));
    res.json({
      urls: saved.filter((row) => row.kind === "image").map((row) => row.url),
      videos: saved.filter((row) => row.kind === "video").map((row) => row.url),
      files: saved,
      assets: saved
    });
  } catch (err) {
    next(err);
  }
});

router.post("/upload/:kind", upload.array("files", 10), async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: "No file received." });
    const saved = [];
    for (const file of files) saved.push(await storeFile(file));
    res.json({ urls: saved.filter((row) => row.kind === "image").map((row) => row.url), videos: saved.filter((row) => row.kind === "video").map((row) => row.url), files: saved, assets: saved });
  } catch (err) {
    next(err);
  }
});

router.get("/media", async (req, res, next) => {
  try {
    const rows = await db.all("media");
    rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    res.json({ media: rows });
  } catch (err) {
    next(err);
  }
});

router.delete("/media/:id", async (req, res, next) => {
  try {
    const row = await db.get("media", req.params.id);
    if (!row) return res.status(404).json({ error: "File not found." });
    if (row.publicId) {
      const cloud = process.env.CLOUDINARY_CLOUD_NAME;
      const key = process.env.CLOUDINARY_API_KEY;
      const secret = process.env.CLOUDINARY_API_SECRET;
      if (cloud && key && secret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = crypto.createHash("sha1").update(`public_id=${row.publicId}&timestamp=${timestamp}${secret}`).digest("hex");
        const form = new FormData();
        form.append("public_id", row.publicId);
        form.append("api_key", key);
        form.append("timestamp", String(timestamp));
        form.append("signature", signature);
        await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${row.kind === "video" ? "video" : "image"}/destroy`, { method: "POST", body: form }).catch(() => null);
      }
    } else if (String(row.url || "").startsWith("/uploads/")) {
      fs.promises.unlink(path.join(uploadDir, path.basename(row.url))).catch(() => null);
    }
    await db.remove("media", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const [products, orders, users, subs, msgs] = await Promise.all([
      db.all("products"),
      db.all("orders"),
      db.all("users"),
      db.all("subscribers"),
      db.all("messages")
    ]);
    const paid = orders.filter((row) => ["paid", "shipped", "completed", "delivered"].includes(row.status));
    const revenue = paid.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const units = {};
    for (const order of paid) {
      for (const item of order.items || []) {
        const key = item.name || item.id;
        if (!units[key]) units[key] = { name: key, units: 0, revenue: 0 };
        units[key].units += Number(item.qty || 1);
        units[key].revenue += Number(item.price || 0) * Number(item.qty || 1);
      }
    }
    const top = Object.values(units).sort((a, b) => b.units - a.units).slice(0, 5);
    const series = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const dayOrders = paid.filter((row) => {
        const at = new Date(row.createdAt || row.paidAt || Date.now());
        return at >= day && at < next;
      });
      series.push({
        label: day.toLocaleDateString("en-GB", { weekday: "short" }),
        date: day.toISOString().slice(0, 10),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, row) => sum + Number(row.total || 0), 0)
      });
    }
    const recent = orders
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 6)
      .map((row) => ({ id: row.id, customer: row.customer && row.customer.name, total: row.total, status: row.status, createdAt: row.createdAt, items: (row.items || []).length }));
    res.json({
      revenue,
      paidOrders: paid.length,
      totalOrders: orders.length,
      hidden: products.filter((r) => r.active === false).length,
      total: revenue,
      orders: orders.length,
      orderCount: orders.length,
      customers: users.filter((row) => row.role !== "admin").length,
      products: products.length,
      subscribers: subs.length,
      messages: msgs.filter((row) => row.status !== "handled").length,
      pending: orders.filter((row) => row.status === "pending").length,
      lowStock: products.filter((row) => Number(row.stock || 0) <= 4).map((row) => ({ id: row.id, name: row.name, category: row.category, stock: Number(row.stock || 0) })).slice(0, 8),
      low: products.filter((row) => Number(row.stock || 0) <= 4).map((row) => ({ id: row.id, name: row.name, category: row.category, stock: Number(row.stock || 0) })).slice(0, 8),
      series,
      top,
      topProducts: top,
      top: top,
      recent
    });
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const rows = await db.all("products");
    rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

function buildProduct(body, existing) {
  const base = existing || {};
  const name = String(body.name || base.name || "").trim();
  if (!name) throw new Error("Product name is required.");
  const price = Number(body.price !== undefined ? body.price : base.price || 0);
  if (!price || price < 1) throw new Error("Price must be greater than zero.");
  const variants = Array.isArray(body.variants)
    ? body.variants
        .map((row, index) => ({
          id: row.id || `v-${Date.now()}-${index}`,
          size: String(row.size || "").trim(),
          color: String(row.color || "").trim(),
          stock: Math.max(0, Number(row.stock || 0))
        }))
        .filter((row) => row.size || row.color)
    : base.variants || [];
  const images = asList(body.images !== undefined ? body.images : base.images);
  const details = asList(body.details !== undefined ? body.details : base.details);
  const tags = asList(body.tags !== undefined ? body.tags : base.tags);
  const stock = variants.length ? variants.reduce((sum, row) => sum + Number(row.stock || 0), 0) : Math.max(0, Number(body.stock !== undefined ? body.stock : base.stock || 0));
  const slug = slugify(body.slug || name) || base.id || `product-${Date.now()}`;
  return {
    ...base,
    name,
    id: base.id || slug,
    slug: base.slug || slug,
    category: String(body.category || base.category || "jeans"),
    price,
    compareAt: body.compareAt ? Number(body.compareAt) : base.compareAt || null,
    description: String(body.description !== undefined ? body.description : base.description || ""),
    material: String(body.material !== undefined ? body.material : base.material || ""),
    origin: String(body.origin !== undefined ? body.origin : base.origin || ""),
    details,
    images,
    video: String(body.video !== undefined ? body.video : base.video || ""),
    videoPoster: String(body.videoPoster !== undefined ? body.videoPoster : base.videoPoster || ""),
    variants,
    stock,
    badge: String(body.badge !== undefined ? body.badge : base.badge || ""),
    tags,
    features: tags,
    rating: Number(body.rating !== undefined ? body.rating : base.rating || 0) || 0,
    reviews: Number(body.reviews !== undefined ? body.reviews : base.reviews || 0) || 0,
    active: body.active !== undefined ? Boolean(body.active) : base.active !== false,
    featured: body.featured !== undefined ? Boolean(body.featured) : Boolean(base.featured),
    sortOrder: Number(body.sortOrder !== undefined ? body.sortOrder : base.sortOrder || 100),
    updatedAt: new Date().toISOString()
  };
}

router.post("/products", async (req, res, next) => {
  try {
    const payload = buildProduct(req.body, null);
    const existing = await db.get("products", payload.id);
    if (existing) return res.status(409).json({ error: "A product with that name already exists." });
    const row = await db.createWithId("products", payload.id, { ...payload, createdAt: new Date().toISOString() });
    res.status(201).json({ product: row });
  } catch (err) {
    if (err.message && err.message.includes("required")) return res.status(400).json({ error: err.message });
    if (err.message && err.message.includes("Price")) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const existing = await db.get("products", req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });
    const payload = buildProduct(req.body, existing);
    const row = await db.update("products", req.params.id, payload);
    res.json({ product: row });
  } catch (err) {
    if (err.message && (err.message.includes("required") || err.message.includes("Price"))) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.delete("/products/:id", async (req, res, next) => {
  try {
    const existing = await db.get("products", req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });
    await db.remove("products", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/products/:id/duplicate", async (req, res, next) => {
  try {
    const existing = await db.get("products", req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });
    const name = `${existing.name} Copy`;
    const payload = buildProduct({ ...existing, name, active: false }, null);
    payload.id = `${payload.slug}-${crypto.randomBytes(2).toString("hex")}`;
    payload.slug = payload.id;
    const row = await db.createWithId("products", payload.id, { ...payload, createdAt: new Date().toISOString() });
    res.status(201).json({ product: row });
  } catch (err) {
    next(err);
  }
});

router.patch("/products/:id/toggle", async (req, res, next) => {
  try {
    const existing = await db.get("products", req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });
    const row = await db.update("products", req.params.id, { active: existing.active === false, updatedAt: new Date().toISOString() });
    res.json({ product: row });
  } catch (err) {
    next(err);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    res.json({ categories: await categories.all() });
  } catch (err) {
    next(err);
  }
});

router.post("/categories", async (req, res, next) => {
  try {
    const label = String(req.body.label || "").trim();
    if (!label) return res.status(400).json({ error: "Category name is required." });
    const slug = slugify(req.body.slug || label);
    const existing = await categories.all();
    if (existing.some((row) => row.slug === slug)) return res.status(409).json({ error: "That category already exists." });
    const row = await db.createWithId("categories", slug, {
      id: slug,
      slug,
      label,
      blurb: String(req.body.blurb || ""),
      image: String(req.body.image || ""),
      sortOrder: Number(req.body.sortOrder || existing.length + 1),
      active: req.body.active !== false
    });
    res.status(201).json({ category: row });
  } catch (err) {
    next(err);
  }
});

router.patch("/categories/:id", async (req, res, next) => {
  try {
    const existing = await categories.find(req.params.id);
    if (!existing) return res.status(404).json({ error: "Category not found." });
    const patch = {};
    if (req.body.label !== undefined) patch.label = String(req.body.label).trim() || existing.label;
    if (req.body.blurb !== undefined) patch.blurb = String(req.body.blurb);
    if (req.body.image !== undefined) patch.image = String(req.body.image);
    if (req.body.sortOrder !== undefined) patch.sortOrder = Number(req.body.sortOrder);
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active);
    const row = await db.update("categories", existing.id || existing.slug, { ...existing, ...patch });
    res.json({ category: row });
  } catch (err) {
    next(err);
  }
});

router.delete("/categories/:id", async (req, res, next) => {
  try {
    const existing = await categories.find(req.params.id);
    if (!existing) return res.status(404).json({ error: "Category not found." });
    const products = await db.all("products");
    if (products.some((row) => row.category === (existing.slug || existing.id))) {
      return res.status(409).json({ error: "Move or delete the products in this category first." });
    }
    await db.remove("categories", existing.id || existing.slug);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/categories/reorder", async (req, res, next) => {
  try {
    const order = asList(req.body.order);
    const rows = await categories.all();
    let index = 1;
    for (const slug of order) {
      const row = rows.find((item) => (item.slug || item.id) === slug);
      if (row) await db.update("categories", row.id || row.slug, { ...row, sortOrder: index++ });
    }
    res.json({ categories: await categories.all() });
  } catch (err) {
    next(err);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const rows = await db.all("orders");
    rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/orders/:id", async (req, res, next) => {
  try {
    const row = await db.get("orders", req.params.id);
    if (!row) return res.status(404).json({ error: "Order not found." });
    res.json({ order: row });
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const row = await db.get("orders", req.params.id);
    if (!row) return res.status(404).json({ error: "Order not found." });
    const patch = {};
    if (req.body.status) patch.status = String(req.body.status);
    if (req.body.paymentStatus) patch.paymentStatus = String(req.body.paymentStatus);
    if (req.body.tracking !== undefined) patch.tracking = String(req.body.tracking);
    if (req.body.adminNote !== undefined) patch.adminNote = String(req.body.adminNote);
    patch.updatedAt = new Date().toISOString();
    const updated = await db.update("orders", req.params.id, { ...row, ...patch });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/orders/:id", async (req, res, next) => {
  try {
    await db.remove("orders", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/customers", async (req, res, next) => {
  try {
    const [users, orders] = await Promise.all([db.all("users"), db.all("orders")]);
    const rows = users
      .filter((user) => user.role !== "admin")
      .map((user) => {
        const mine = orders.filter((order) => order.userId === user.id || (order.customer && order.customer.email && order.customer.email === user.email));
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          createdAt: user.createdAt,
          orders: mine.length,
          spent: mine.filter((order) => ["paid", "shipped", "completed", "delivered"].includes(order.status)).reduce((sum, order) => sum + Number(order.total || 0), 0)
        };
      })
      .sort((a, b) => b.spent - a.spent);
    res.json({ customers: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/promos", async (req, res, next) => {
  try {
    res.json({ promos: await promoStore.rows() });
  } catch (err) {
    next(err);
  }
});

router.post("/promos", async (req, res, next) => {
  try {
    const code = String(req.body.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length < 3) return res.status(400).json({ error: "Promo code needs at least 3 characters." });
    const value = Number(req.body.value || 0);
    if (!value || value <= 0) return res.status(400).json({ error: "Discount value must be greater than zero." });
    const existing = await promoStore.rows();
    if (existing.some((row) => row.code === code)) return res.status(409).json({ error: "That promo code already exists." });
    const row = await db.createWithId("promos", code, {
      id: code,
      code,
      type: req.body.type === "fixed" ? "fixed" : "percent",
      value,
      label: String(req.body.label || `${req.body.type === "fixed" ? "NGN " + value : value + "%"} off`),
      minSpend: Number(req.body.minSpend || 0),
      expiresAt: req.body.expiresAt ? String(req.body.expiresAt) : "",
      active: req.body.active !== false
    });
    res.status(201).json({ promo: row });
  } catch (err) {
    next(err);
  }
});

router.patch("/promos/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id).toUpperCase();
    const existing = await db.get("promos", id);
    if (!existing) return res.status(404).json({ error: "Promo not found." });
    const patch = {};
    if (req.body.value !== undefined) patch.value = Number(req.body.value);
    if (req.body.type !== undefined) patch.type = req.body.type === "fixed" ? "fixed" : "percent";
    if (req.body.label !== undefined) patch.label = String(req.body.label);
    if (req.body.minSpend !== undefined) patch.minSpend = Number(req.body.minSpend);
    if (req.body.expiresAt !== undefined) patch.expiresAt = String(req.body.expiresAt);
    if (req.body.active !== undefined) patch.active = Boolean(req.body.active);
    const row = await db.update("promos", id, { ...existing, ...patch });
    res.json({ promo: row });
  } catch (err) {
    next(err);
  }
});

router.delete("/promos/:id", async (req, res, next) => {
  try {
    await db.remove("promos", String(req.params.id).toUpperCase());
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/subscribers", async (req, res, next) => {
  try {
    res.json({ subscribers: await db.all("subscribers") });
  } catch (err) {
    next(err);
  }
});

router.delete("/subscribers/:id", async (req, res, next) => {
  try {
    await db.remove("subscribers", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/messages", async (req, res, next) => {
  try {
    res.json({ messages: await db.all("messages") });
  } catch (err) {
    next(err);
  }
});

router.patch("/messages/:id", async (req, res, next) => {
  try {
    const row = await db.get("messages", req.params.id);
    if (!row) return res.status(404).json({ error: "Message not found." });
    const updated = await db.update("messages", req.params.id, { ...row, status: req.body.status || "handled" });
    res.json({ message: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/messages/:id", async (req, res, next) => {
  try {
    await db.remove("messages", req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/settings", async (req, res, next) => {
  try {
    res.json({ settings: await settings.read() });
  } catch (err) {
    next(err);
  }
});

router.post("/settings", async (req, res, next) => {
  try {
    const row = await settings.save(req.body || {});
    res.json({ settings: row });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
