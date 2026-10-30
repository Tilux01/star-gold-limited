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
  searchSuggestions: [
    "Selvedge denim",
    "Satin gown",
    "Poplin shirt",
    "Leather tote",
    "Chelsea boots",
    "Monogram cap"
  ],
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
  const merged = Object.assign({}, DEFAULTS, saved || {});
  if (typeof merged.searchSuggestions === "string") {
    merged.searchSuggestions = merged.searchSuggestions.split(",").map(s => s.trim()).filter(Boolean);
  }
  return merged;
}

async function save(patch) {
  const current = await read();
  const normalized = Object.assign({}, patch || {});
  if (normalized.searchSuggestions !== undefined) {
    if (typeof normalized.searchSuggestions === "string") {
      normalized.searchSuggestions = normalized.searchSuggestions.split(",").map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(normalized.searchSuggestions)) {
      normalized.searchSuggestions = normalized.searchSuggestions.map(s => String(s).trim()).filter(Boolean);
    }
  }
  const next = Object.assign({}, current, normalized, { id: "store" });
  const existing = await db.get("settings", "store").catch(() => null);
  if (existing) await db.update("settings", "store", next);
  else await db.createWithId("settings", "store", next);
  return next;
}

async function ensure() { const row = await db.get("settings", "store").catch(() => null); if (!row) await save({}); }

module.exports = { DEFAULTS, read, save, ensure };
