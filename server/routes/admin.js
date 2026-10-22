const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth, requireAdmin } = require("../auth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, done) => done(null, uploadDir),
  filename: (req, file, done) => {
    const ext = (path.extname(file.originalname) || ".jpg").toLowerCase();
    done(null, `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, done) => {
    if (!/^image\/(jpeg|png|webp|avif|jpg)$/.test(file.mimetype)) {
      return done(new Error("Only JPG, PNG, WEBP or AVIF images are allowed."));
    }
    done(null, true);
  }
});

router.use(requireAuth, requireAdmin);

router.get("/summary", async (req, res, next) => {
  try {
    const orders = await db.all("orders");
    const products = await db.all("products");
    const users = await db.find("users", (row) => row.role !== "admin");
    const paid = orders.filter((row) => row.payment && row.payment.status === "paid");
    const revenue = paid.reduce((sum, row) => sum + Number(row.total || 0), 0);
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(Date.now() - i * 86400000);
      const key = day.toISOString().slice(0, 10);
      const value = paid
        .filter((row) => String(row.createdAt).slice(0, 10) === key)
        .reduce((sum, row) => sum + Number(row.total || 0), 0);
      days.push({ date: key, label: day.toLocaleDateString("en-GB", { weekday: "short" }), revenue: value });
    }
    const sold = {};
    paid.forEach((row) => (row.items || []).forEach((line) => {
      sold[line.productId] = (sold[line.productId] || 0) + line.quantity;
    }));
    const topProducts = Object.keys(sold)
      .map((id) => {
        const product = products.find((row) => row.id === id);
        return { id, name: product ? product.name : id, image: product ? product.images[0] : "", sold: sold[id] };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
    const lowStock = [];
    products.forEach((product) => (product.variants || []).forEach((variant) => {
      if (Number(variant.stock) <= 2) lowStock.push({ id: product.id, name: product.name, size: variant.size, color: variant.color, stock: variant.stock });
    }));
    const recent = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    res.json({
      revenue,
      orders: orders.length,
      paidOrders: paid.length,
      pending: orders.filter((row) => row.status === "pending").length,
      customers: users.length,
      products: products.length,
      averageOrder: paid.length ? Math.round(revenue / paid.length) : 0,
      series: days,
      topProducts,
      lowStock: lowStock.slice(0, 6),
      lowStockCount: lowStock.length,
      recent
    });
  } catch (err) {
    next(err);
  }
});

router.get("/orders", async (req, res, next) => {
  try {
    const status = String(req.query.status || "");
    const q = String(req.query.q || "").toLowerCase().trim();
    let rows = await db.all("orders");
    if (status) rows = rows.filter((row) => row.status === status);
    if (q) {
      rows = rows.filter((row) => [row.orderNumber, row.customer.name, row.customer.phone, row.customer.email].join(" ").toLowerCase().includes(q));
    }
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ orders: rows });
  } catch (err) {
    next(err);
  }
});

router.patch("/orders/:id", async (req, res, next) => {
  try {
    const allowed = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
    const status = String(req.body.status || "");
    if (!allowed.includes(status)) return res.status(400).json({ error: "Unknown order status." });
    const updated = await db.update("orders", req.params.id, { status, updatedAt: new Date().toISOString() });
    if (!updated) return res.status(404).json({ error: "Order not found." });
    res.json({ order: updated });
  } catch (err) {
    next(err);
  }
});

router.get("/products", async (req, res, next) => {
  try {
    const rows = await db.all("products");
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ products: rows });
  } catch (err) {
    next(err);
  }
});

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeBody(body, existing) {
  const base = existing || {};
  const name = String(body.name !== undefined ? body.name : base.name || "").trim();
  const variants = Array.isArray(body.variants)
    ? body.variants.map((variant, index) => ({
        id: variant.id || `v-${Date.now()}-${index}`,
        size: String(variant.size || "One Size").trim(),
        color: String(variant.color || "Default").trim(),
        stock: Math.max(0, parseInt(variant.stock, 10) || 0)
      }))
    : base.variants || [];
  return {
    name,
    slug: base.slug || slugify(name),
    category: body.category !== undefined ? body.category : base.category,
    categoryLabel: body.categoryLabel !== undefined ? body.categoryLabel : base.categoryLabel,
    origin: body.origin !== undefined ? body.origin : base.origin,
    price: Number(body.price !== undefined ? body.price : base.price || 0),
    compareAt: Number(body.compareAt !== undefined ? body.compareAt : base.compareAt || 0),
    badge: body.badge !== undefined ? String(body.badge) : base.badge || "",
    rating: Number(body.rating !== undefined ? body.rating : base.rating || 5),
    reviews: Number(body.reviews !== undefined ? body.reviews : base.reviews || 0),
    description: body.description !== undefined ? String(body.description) : base.description || "",
    details: Array.isArray(body.details) ? body.details.map((row) => String(row)) : base.details || [],
    material: body.material !== undefined ? String(body.material) : base.material || "",
    images: Array.isArray(body.images) && body.images.length ? body.images : base.images || [],
    variants,
    tags: Array.isArray(body.tags) ? body.tags : base.tags || [],
    active: body.active !== undefined ? Boolean(body.active) : base.active !== false,
    featured: body.featured !== undefined ? Boolean(body.featured) : base.featured || false
  };
}

router.post("/products", async (req, res, next) => {
  try {
    const data = normalizeBody(req.body);
    if (!data.name) return res.status(400).json({ error: "Product name is required." });
    if (!data.category) return res.status(400).json({ error: "Choose a category." });
    if (!data.price) return res.status(400).json({ error: "Enter a price." });
    if (!data.images.length) return res.status(400).json({ error: "Add at least one image." });
    const id = req.body.id ? slugify(req.body.id) : `${data.slug}-${Math.floor(Math.random() * 900 + 100)}`;
    data.createdAt = new Date().toISOString();
    const saved = await db.createWithId("products", id, data);
    res.status(201).json({ product: saved });
  } catch (err) {
    next(err);
  }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const existing = await db.get("products", req.params.id);
    if (!existing) return res.status(404).json({ error: "Product not found." });
    const data = normalizeBody(req.body, existing);
    const updated = await db.update("products", req.params.id, data);
    res.json({ product: updated });
  } catch (err) {
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

async function cloudinaryUpload(file) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash("sha1").update(`folder=stargold&timestamp=${timestamp}${secret}`).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(file.path)], { type: file.mimetype }), file.filename);
  form.append("api_key", key);
  form.append("timestamp", String(timestamp));
  form.append("folder", "stargold");
  form.append("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  const payload = await response.json();
  return payload.secure_url || null;
}

router.post("/upload", upload.array("images", 6), async (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: "No image received." });
    const urls = [];
    for (const file of files) {
      let url = null;
      try {
        url = await cloudinaryUpload(file);
      } catch (err) {
        url = null;
      }
      if (url) {
        fs.unlink(file.path, () => {});
      } else {
        url = `/uploads/${file.filename}`;
      }
      urls.push(url);
    }
    res.json({ urls });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
