(function () {
  const U = SG.UI;
  const money = SG.money;
  const cart = SG.cart;
  let quote = null;
  let cfg = { paystack: false, whatsapp: "2348063494273", shipping: 4500, threshold: 150000, express: 9500 };
  const el = (id) => document.getElementById(id);

  function promo() { return localStorage.getItem("sg.promo") || ""; }

  function itemRow(it) {
    const src = it.image ? (U && U.thumb ? U.thumb(it.image, 120) : it.image) : '';
    const img = src ? '<img src="' + src + '" alt="" loading="lazy" decoding="async">' : '';
    return '<div class="sum-item">' + img + '<div><p>' + it.name + '</p><span>' + (it.size || "") + ' / ' + (it.color || "") + ' x ' + it.quantity + '</span></div><strong>' + money(it.lineTotal) + '</strong></div>';
  }

  function paint() {
    if (!quote) return;
    const t = quote.totals;
    el("summaryItems").innerHTML = quote.items.map(itemRow).join("");
    const express = document.querySelector('input[name="shipping"]:checked').value === "express";
    const shipping = express ? cfg.express : t.shipping;
    const total = t.subtotal - t.discount + shipping;
    el("summaryRows").innerHTML =
      '<div class="sum-row"><span>Subtotal</span><strong>' + money(t.subtotal) + '</strong></div>' +
      (t.discount ? '<div class="sum-row sum-row--credit"><span>Discount (' + t.promo + ')</span><strong>-' + money(t.discount) + '</strong></div>' : '') +
      '<div class="sum-row"><span>Delivery</span><strong>' + (shipping ? money(shipping) : "Free") + '</strong></div>';
    el("sumTotal").textContent = money(total);
    el("shipStdLabel").textContent = t.shipping ? money(t.shipping) : "Free";
    el("shipNote").textContent = t.subtotal >= cfg.threshold ? "You have unlocked free standard delivery." : "Add " + money(cfg.threshold - t.subtotal) + " to unlock free delivery.";
    el("shipBar").style.width = Math.min(100, Math.round((t.subtotal / cfg.threshold) * 100)) + "%";
    window.sgTotal = total;
  }

  async function loadQuote() {
    const items = cart.all().map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty }));
    if (!items.length) { location.replace("/cart.html"); return; }
    quote = await SG.api.post("/products/quote", { items: items, promo: promo() });
    paint();
  }

  function prefill() {
    const user = SG.auth.user();
    const saved = JSON.parse(localStorage.getItem("sg.address") || "null") || {};
    const src = Object.assign({}, user || {}, saved);
    const f = el("checkoutForm");
    if (!src.name && !src.email) return;
    const set = (n, v) => { if (v && f.elements[n]) f.elements[n].value = v; };
    set("name", src.name || (SG.auth.user() || {}).name);
    set("email", src.email);
    set("phone", src.phone);
    set("address", src.address);
    set("city", src.city);
    if (src.state) f.elements.state.value = src.state;
  }

  async function submit(e) {
    e.preventDefault();
    const f = e.currentTarget;
    const v = (n) => (f.elements[n] ? String(f.elements[n].value).trim() : "");
    const required = { name: "full name", email: "email address", phone: "phone number", address: "delivery address", city: "city" };
    for (const key in required) {
      if (!v(key)) { SG.UI.toast("Please add your " + required[key] + ".", "error"); f.elements[key].focus(); return; }
    }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v("email"))) { SG.UI.toast("That email address looks off.", "error"); return; }
    if (f.elements.terms && !f.elements.terms.checked) { SG.UI.toast("Please accept the terms to continue.", "error"); return; }
    if (!quote || !quote.items.length) { SG.UI.toast("Your bag is empty.", "error"); return; }
    const btn = el("placeOrderBtn");
    btn.disabled = true; btn.textContent = "Placing order...";
    try {
      const payload = {
        items: cart.all().map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
        customer: { name: v("name"), email: v("email"), phone: v("phone"), address: v("address"), city: v("city"), state: v("state"), notes: v("notes") },
        shipping: f.querySelector('input[name="shipping"]:checked').value,
        promo: promo(),
        payment: f.querySelector('input[name="payment"]:checked').value
      };
      localStorage.setItem("sg.address", JSON.stringify(payload.customer));
      const res = await SG.api.post("/orders", payload);
      const order = res.order;
      localStorage.setItem("sg.lastOrder", JSON.stringify({ id: order.id, number: order.orderNumber, ref: order.payment.reference }));
      SG.cart.clear();
      localStorage.removeItem("sg.promo");
      if (order.payment.provider === "transfer") { location.href = "/order.html?ref=" + encodeURIComponent(order.payment.reference); return; }
      const init = await SG.api.post("/payments/initialize", { orderId: order.id });
      if (init.mock || init.mode === "test") { await SG.api.post("/payments/mark-paid", { reference: init.reference }); }
      else { location.href = init.authorization_url; return; }
      location.href = "/order.html?ref=" + encodeURIComponent(init.reference || order.payment.reference);
    } catch (err) {
      SG.UI.toast(err.message || "We could not place that order.", "error");
      btn.disabled = false; btn.textContent = "Place order";
    }
  }

  function init() {
    document.querySelectorAll('input[name="shipping"]').forEach((r) => r.addEventListener("change", paint));
    el("checkoutForm").addEventListener("submit", submit);
    prefill();
    loadQuote().catch((err) => SG.UI.toast(err.message, "error"));
  }

  document.addEventListener("DOMContentLoaded", () => { SG.UI.mount(); init(); });
})();
