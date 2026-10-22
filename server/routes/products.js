const express = require("express");
const db = require("../db");
const { CATEGORIES } = require("../seed");
const catalog = require("../catalog");

const router = express.Router();

function parseList(value) {
  return String(value || "").split(",").map((row) => row.trim()).filter(Boolean);
}

function sortProducts(rows, sort) {
  const copy = rows.slice();
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort((a, b) => Number(b.rating) - Number(a.rating));
    case "popular":
      return copy.sort((a, b) => Number(b.reviews) - Number(a.reviews));
    default:
      return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

async function liveProducts() {
  const rows = await db.all("products");
  return rows.filter((row) => row.active !== false);
}

router.get("/", async (req, res, next) => {
  try {
    const rows = await liveProducts();
    const categories = parseList(req.query.category);
    const origins = parseList(req.query.origin);
    const sizes = parseList(req.query.size);
    const feature = String(req.query.feature || "").toLowerCase();
    const q = String(req.query.q || "").trim().toLowerCase();
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;

    let filtered = rows;
    if (categories.length) filtered = filtered.filter((row) => categories.includes(row.category));
    if (origins.length) filtered = filtered.filter((row) => origins.includes(row.origin));
    if (sizes.length) {
      filtered = filtered.filter((row) => (row.variants || []).some((variant) => sizes.includes(variant.size) && variant.stock > 0));
    }
    if (feature === "new") filtered = filtered.filter((row) => (row.tags || []).includes("New In"));
    if (feature === "best") filtered = filtered.filter((row) => (row.tags || []).includes("Best Seller"));
    if (feature === "sale") filtered = filtered.filter((row) => Number(row.compareAt) > Number(row.price));
    if (minPrice !== null) filtered = filtered.filter((row) => row.price >= minPrice);
    if (maxPrice !== null) filtered = filtered.filter((row) => row.price <= maxPrice);
    if (q) {
      filtered = filtered.filter((row) => {
        const haystack = [row.name, row.categoryLabel, row.origin, row.description, row.material].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = sortProducts(filtered, req.query.sort);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const total = sorted.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const slice = sorted.slice((page - 1) * limit, page * limit);

    const priceValues = rows.map((row) => Number(row.price));
    const sizeSet = [];
    rows.forEach((row) => (row.variants || []).forEach((variant) => {
      if (!sizeSet.includes(variant.size)) sizeSet.push(variant.size);
    }));

    res.json({
      products: slice,
      total,
      page,
      pages,
      facets: {
        categories: CATEGORIES.map((cat) => ({
          slug: cat.slug,
          label: cat.label,
          count: rows.filter((row) => row.category === cat.slug).length
        })),
        origins: ["Turkey", "China"].map((origin) => ({
          name: origin,
          count: rows.filter((row) => row.origin === origin).length
        })),
        sizes: sizeSet,
        price: {
          min: priceValues.length ? Math.min(...priceValues) : 0,
          max: priceValues.length ? Math.max(...priceValues) : 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

function sampleReviews(product) {
  const first = [
    ["Adaeze O.", "The finishing is exactly as described. Packaging arrived clean and the fit was true to size."],
    ["Tunde A.", "Ordered on Monday and it reached me in Lekki on Wednesday. Quality feels well above the price."],
    ["Chiamaka N.", "This is my second order from Star Gold and the consistency is what keeps me coming back."],
    ["Ibrahim S.", "Colour matches the photos. I sized up and it drapes beautifully."]
  ];
  const count = Math.min(3, Math.max(1, Math.round(Number(product.reviews || 0) / 20)));
  return first.slice(0, count).map((row, index) => ({
    name: row[0],
    rating: index === 2 ? 4 : 5,
    text: row[1],
    date: new Date(Date.now() - (index + 2) * 604800000).toISOString().slice(0, 10)
  }));
}

router.get("/:id", async (req, res, next) => {
  try {
    const product = await db.get("products", req.params.id);
    if (!product || product.active === false) return res.status(404).json({ error: "Product not found." });
    const rows = await liveProducts();
    const related = rows
      .filter((row) => row.id !== product.id && row.category === product.category)
      .slice(0, 4);
    const fill = rows.filter((row) => row.id !== product.id && row.category !== product.category).slice(0, 4 - related.length);
    res.json({ product, related: related.concat(fill), reviews: sampleReviews(product) });
  } catch (err) {
    next(err);
  }
});

router.post("/quote", async (req, res, next) => {
  try {
    const products = await db.all("products");
    const raw = Array.isArray(req.body.items) ? req.body.items : [];
    const { resolved, problems } = catalog.resolveItems(products, raw);
    const totals = catalog.totals(resolved, req.body.promo);
    res.json({ items: resolved, totals, problems });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
