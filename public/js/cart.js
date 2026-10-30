(function(){
  const U = SG.UI;
  let quote = null;
  const rows = document.getElementById('cartRows');
  const layout = document.getElementById('cartLayout');
  const empty = document.getElementById('cartEmpty');
  const promoKey = 'sg.promo.v1';

  function promo(){ return localStorage.getItem(promoKey) || ''; }

  function payload(){
    return SG.cart.all().map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty }));
  }

  async function refresh(){
    if (!SG.cart.all().length) { layout.hidden = true; empty.hidden = false; return; }
    layout.hidden = false; empty.hidden = true;
    try { quote = await SG.api.post('/products/quote', { items: payload(), promo: promo() }); }
    catch (e) { U.toast('We could not load your bag. Check your connection.', 'error'); return; }
    render();
  }

  function render(){
    rows.innerHTML = quote.items.map(it => `
      <div class="cart-row" data-id="${it.productId}" data-v="${it.variantId}">
        <a class="cart-row__media" href="/product.html?p=${it.slug || it.productId}"><img src="${U.thumb ? U.thumb(it.image, 160) : it.image}" alt="${it.name}" loading="lazy" decoding="async"></a>
        <div class="cart-row__info">
          <a class="cart-row__name" href="/product.html?p=${it.slug || it.productId}">${it.name}</a>
          <span class="cart-row__meta">${it.size || ''}${it.size && it.color ? ' / ' : ''}${it.color || ''}</span>
          <div class="qty">
            <button type="button" data-step="-1" aria-label="Decrease">${U.icon('minus', 14)}</button>
            <span>${it.quantity}</span>
            <button type="button" data-step="1" aria-label="Increase">${U.icon('plus', 14)}</button>
          </div>
        </div>
        <span class="cart-row__price">${SG.money(it.lineTotal)}</span>
        <button class="remove-btn" type="button" data-remove aria-label="Remove">${U.icon('trash', 16)}</button>
      </div>`).join('');
    paint(quote.totals);
  }

  function paint(t){
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('sumSubtotal', SG.money(t.subtotal));
    set('sumShipping', t.shipping ? SG.money(t.shipping) : 'Free');
    set('sumDiscount', t.discount ? '-' + SG.money(t.discount) : SG.money(0));
    set('sumTotal', SG.money(t.total));
    const discRow = document.getElementById('discountRow');
    if (discRow) discRow.hidden = !t.discount;
    const bar = document.getElementById('shipBar');
    if (bar) bar.style.width = Math.min(100, Math.round((t.subtotal / 150000) * 100)) + '%';
    set('shipNote', t.shipping ? 'Add ' + SG.money(150000 - t.subtotal) + ' for complimentary delivery.' : 'Complimentary delivery unlocked.');
    const chip = document.getElementById('promoChip');
    if (chip) { chip.hidden = !t.promo; chip.textContent = t.promo ? 'Code ' + t.promo + ' applied' : ''; }
  }
  function setQty(id, vid, delta) {
    const items = SG.cart.all();
    const line = items.find((i) => i.productId === id && i.variantId === vid);
    if (!line) return;
    line.qty = Math.max(1, Math.min(20, line.qty + delta));
    SG.cart.save(items);
    refresh();
  }

  function load() {
    refresh();
  }

  function persist(items) {
    SG.cart.save(items);
  }

  document.addEventListener('DOMContentLoaded', () => {
    SG.UI.mount();
    load();
  });

  function removeLine(id, vid) {
    SG.cart.save(SG.cart.all().filter((i) => !(i.productId === id && i.variantId === vid)));
    if (!SG.cart.all().length) localStorage.removeItem(promoKey);
    refresh();
  }

  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) {
      const row = step.closest('.cart-row');
      setQty(row.dataset.id, row.dataset.v, Number(step.dataset.step));
      return;
    }
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      const row = rm.closest('.cart-row');
      removeLine(row.dataset.id, row.dataset.v);
      return;
    }
    const apply = e.target.closest('#applyPromo');
    if (apply) {
      const input = document.getElementById('promoInput');
      localStorage.setItem(promoKey, (input.value || '').trim().toUpperCase());
      refresh();
    }
    const clear = e.target.closest('#clearCart');
    if (clear) {
      SG.cart.clear();
      localStorage.removeItem(promoKey);
      refresh();
    }
  });
})();
