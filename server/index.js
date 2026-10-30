require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 4100);

app.use(compression());
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

let bootPromise = null;
function ensureBootstrapped() {
  if (!bootPromise) {
    bootPromise = require("./bootstrap").run().catch((err) => {
      console.warn("Bootstrap warning:", err.message);
    });
  }
  return bootPromise;
}
ensureBootstrapped();

app.use("/api", async (req, res, next) => {
  await ensureBootstrapped();
  next();
});
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/misc"));

app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint not found." }));

const publicDir = path.join(__dirname, "..", "public");

const IMMUTABLE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".mp4", ".webm"]);
const ASSET_EXTS = new Set([".css", ".js"]);

app.use(express.static(publicDir, {
  extensions: ["html"],
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (IMMUTABLE_EXTS.has(ext)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (ASSET_EXTS.has(ext)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    } else if (ext === ".html") {
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    }
  }
}));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (path.extname(req.path)) return res.status(404).send("Not found");
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err.message);
  res.status(status).json({ error: err.message || "Something went wrong." });
});

async function start() {
  await db.all("products");
  const summary = await require("./bootstrap").run();
  app.listen(PORT, () => {
    console.log(`Star Gold Limited running on http://localhost:${PORT}`);
    console.log(`Database driver: ${db.driver}`);
    console.log(`Catalog: ${summary.products} products, ${summary.orders} orders, ${summary.users} accounts`);
  });
}

if (process.env.VERCEL) {
  module.exports = app;
} else {
  start();
}
