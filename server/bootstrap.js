const db = require("./db");
const seed = require("./seed");
const categories = require("./categories");
const promos = require("./promos");
const settings = require("./settings");

async function run() {
  await seed.run();
  await categories.ensure();
  await promos.ensure();
  await settings.ensure();
  const [products, orders, users] = await Promise.all([db.count("products"), db.count("orders"), db.count("users")]);
  return { products, orders, users };
}

module.exports = { run };
