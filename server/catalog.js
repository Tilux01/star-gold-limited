const FREE_SHIPPING_THRESHOLD = Number(process.env.FREE_SHIPPING_THRESHOLD || 150000);
const SHIPPING_FEE = Number(process.env.SHIPPING_FEE || 4500);

const PROMOS = {
  GOLD10: { type: "percent", value: 10, label: "10% off" },
  WELCOME5: { type: "percent", value: 5, label: "5% off" },
  FREESHIP: { type: "shipping", value: 0, label: "Free delivery" }
};

function money(value) {
  return `NGN ${Number(value || 0).toLocaleString("en-NG")}`;
}

function resolveItems(products, items) {
  const problems = [];
  const resolved = [];
  for (const raw of items) {
    const product = products.find((row) => row.id === raw.productId);
    if (!product) {
      problems.push("One of the items is no longer available.");
      continue;
    }
    if (product.active === false) {
      problems.push(`${product.name} is no longer available.`);
      continue;
    }
    let variant = (product.variants || []).find((row) => row.id === raw.variantId);
    if (!variant) {
      if (!product.variants || !product.variants.length) {
        variant = { id: raw.variantId || "default", size: "Standard", color: "Standard", stock: product.stock !== undefined ? product.stock : 10 };
      } else {
        problems.push(`Select an available option for ${product.name}.`);
        continue;
      }
    }
    const quantity = Math.max(1, Math.min(20, parseInt(raw.quantity, 10) || 1));
    if (Number(variant.stock || 0) < quantity) {
      problems.push(`${product.name} (${variant.size}) only has ${variant.stock || 0} left.`);
      continue;
    }
    resolved.push({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      category: product.categoryLabel,
      origin: product.origin,
      image: (product.images || [])[0] || "",
      size: variant.size,
      color: variant.color,
      price: Number(product.price),
      quantity,
      lineTotal: Number(product.price) * quantity
    });
  }
  return { resolved, problems };
}

function totals(lines, promoCode, promoMap, config) {
  const store = config || {};
  const freeAt = Number(store.freeShippingThreshold !== undefined ? store.freeShippingThreshold : FREE_SHIPPING_THRESHOLD);
  const fee = Number(store.shippingFee !== undefined ? store.shippingFee : SHIPPING_FEE);
  const source = promoMap && Object.keys(promoMap).length ? promoMap : PROMOS;
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const code = String(promoCode || "").trim().toUpperCase();
  let promo = code && source[code] ? Object.assign({ code }, source[code]) : null;
  if (promo && Number(promo.minSpend || 0) > subtotal) promo = null;
  let discount = 0;
  let shipping = subtotal >= freeAt ? 0 : fee;
  if (promo && promo.type === "percent") discount = Math.round(subtotal * (promo.value / 100));
  if (promo && promo.type === "fixed") discount = Math.min(subtotal, Number(promo.value || 0));
  if (promo && promo.type === "shipping") shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total, promo: promo ? promo.code : "", promoLabel: promo ? (promo.label || "") : "" };
}

function orderNumber() {
  const stamp = new Date();
  const y = String(stamp.getFullYear()).slice(2);
  const m = String(stamp.getMonth() + 1).padStart(2, "0");
  const d = String(stamp.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `SG-${y}${m}${d}-${rand}`;
}

function whatsappMessage(order) {
  const lines = [];
  lines.push("Hello Star Gold Limited, I just placed an order!");
  lines.push("");
  lines.push(`Order ID: #${order.orderNumber}`);
  lines.push(`Total Paid: ${money(order.total)}`);
  lines.push("");
  (order.items || []).forEach((line) => {
    lines.push(`- ${line.quantity} x ${line.name} (${line.size} / ${line.color}) ${money(line.lineTotal)}`);
  });
  lines.push("");
  lines.push(`Name: ${order.customer.name}`);
  lines.push(`Phone: ${order.customer.phone}`);
  lines.push(`Address: ${order.customer.address}, ${order.customer.city}, ${order.customer.state}`);
  lines.push(`Reference: ${(order.payment||{}).reference||"-"}`);
  lines.push(`Payment: ${order.payment && order.payment.status === "paid" ? "Paid" : "Pending"}`);
  lines.push("");lines.push("Please confirm delivery timeline!");return lines.join("\n");
}

module.exports = {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  PROMOS,
  money,
  resolveItems,
  totals,
  orderNumber,
  whatsappMessage
};
