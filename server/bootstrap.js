const db = require("./db");
const seed = require("./seed");

async function run() {
  await seed.run();
  const [products, orders, users] = await Promise.all([db.count("products"), db.count("orders"), db.count("users")]);
  return { products, orders, users };
}

module.exports = { run };
