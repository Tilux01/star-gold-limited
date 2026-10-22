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

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/misc"));

app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint not found." }));

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, { extensions: ["html"], maxAge: "1h" }));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (path.extname(req.path)) return res.status(404).send("Not found");
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

start();
