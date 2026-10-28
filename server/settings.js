const db = require("./db");
const { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } = require("./catalog");

const DEFAULTS = {
  id: "store",
  brand: "Star Gold Limited",
  tagline: "Luxury fashion, tailored in Lagos",
  whatsapp: process.env.WHATSAPP_NUMBER || "2348063494273",
  supportEmail: process.env.SUPPORT_EMAIL || "hello@stargoldlimited.com",
  phone: process.env.STORE_PHONE || "+234 806 349 4273",
  address: process.env.STORE_ADDRESS || "Lekki Phase 1, Lagos, Nigeria",
  hours: "Mon to Sat, 9am to 7pm",
  instagram: "stargoldlimited",
  currency: "NGN",
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  shippingNote: "Lagos same day, nationwide in 2 to 4 days",
  announcement: "Complimentary delivery on orders above NGN 150,000",
  paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
  bankName: "Guaranty Trust Bank",
  bankAccount: "0123456789",
  bankAccountName: "Star Gold Limited"
};

async function read() {
  let saved = null;
  try {
    saved = await db.get("settings", "store");
  } catch (err) {
    saved = null;
  }
  return Object.assign({}, DEFAULTS, saved || {});
}

async function save(patch) {
  const current = await read();
  const next = Object.assign({}, current, patch || {}, { id: "store" });
  const existing = await db.get("settings", "store").catch(() => null);
  if (existing) await db.update("settings", "store", next);
  else await db.createWithId("settings", "store", next);
  return next;
}

async function ensure() { const row = await db.get("settings", "store").catch(() => null); if (!row) await save({}); }

module.exports = { DEFAULTS, read, save, ensure };
