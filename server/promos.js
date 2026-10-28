const db = require("./db");
const { PROMOS } = require("./catalog");

function shape(row) {
  const code = String(row.code || row.id || "").toUpperCase();
  if (!code) return null;
  return {
    code,
    type: ["percent", "fixed", "shipping"].includes(row.type) ? row.type : "percent",
    value: Number(row.value || 0),
    label: row.label || "",
    minSpend: Number(row.minSpend || 0),
    active: row.active !== false,
    expiresAt: row.expiresAt || "",
    usage: Number(row.usage || 0)
  };
}

async function rows() {
  let list = [];
  try {
    list = await db.all("promos");
  } catch (err) {
    list = [];
  }
  return list.map(shape).filter(Boolean);
}

function labelFor(promo) {
  if (promo.type === "percent") return `${promo.value}% off`;
  if (promo.type === "fixed") return `NGN ${Number(promo.value).toLocaleString("en-NG")} off`;
  return "Free delivery";
}

async function map() {
  const out = {};
  Object.keys(PROMOS).forEach((code) => {
    out[code] = Object.assign({}, PROMOS[code], { code, active: true, minSpend: 0 });
  });
  const list = await rows();
  list.forEach((promo) => {
    if (!promo.active) {
      delete out[promo.code];
      return;
    }
    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      delete out[promo.code];
      return;
    }
    out[promo.code] = Object.assign({}, promo, { label: promo.label || labelFor(promo) });
  });
  return out;
}

async function ensure() {
  const list = await rows();
  if (list.length) return list;
  const seeded = Object.keys(PROMOS).map((code, index) => Object.assign({ code, active: true, minSpend: 0, usage: 0, sortOrder: index + 1, label: PROMOS[code].label, type: PROMOS[code].type, value: PROMOS[code].value }, { id: code }));
  for (const promo of seeded) await db.createWithId("promos", promo.code, promo);
  return seeded;
}

module.exports = { rows, map, ensure, shape, labelFor };
