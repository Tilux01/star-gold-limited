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
    const items = SG.cart.all();
    if (!items.length) {
      if (layout) layout.hidden = true;
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = `
          <div class="cart-empty" style="text-align:center;padding:72px 20px">
            ${U.icon ? U.icon('bag', 44) : ''}
            <h2 style="font-family:var(--font-display);font-size:2rem;margin:16px 0 8px">Your bag is empty</h2>
            <p style="color:var(--ink-soft);max-width:380px;margin:0 auto 24px">Explore our curated collections of luxury silks, fine tailoring, and iconic pieces.</p>
            <a class="btn btn--dark" href="/shop.html">Explore Collection</a>
          </div>
        `;
      }
      return;
    }
    if (layout) layout.hidden = false;
    if (empty) empty.hidden = true;
    try {
      quote = await SG.api.post('/products/quote', { items: payload(), promo: promo() });
    } catch (e) {
      U.toast('We could not load your bag. Check your connection.', 'error');
      return;
    }
    render();
  }

  function render(){
    if (!quote || !quote.items || !quote.items.length) {
      refresh();
      return;
    }
    const allCart = SG.cart.all();
    rows.innerHTML = quote.items.map((it, idx) => {
      const raw = allCart[idx] || allCart.find(c => c.productId === it.productId) || it;
      const key = SG.cart.key ? SG.cart.key(raw) : (it.productId + '::' + (it.variantId || 'default'));
      return `
      <div class="cart-row" data-key="${key}" data-id="${it.productId}" data-v="${it.variantId || ''}">
        <a class="cart-row__media" href="/product.html?p=${it.slug || it.productId}"><img src="${U.thumb ? U.thumb(it.image, 160) : it.image}" alt="${it.name}" loading="lazy" decoding="async"></a>
        <div class="cart-row__info">
          <a class="cart-row__name" href="/product.html?p=${it.slug || it.productId}">${it.name}</a>
          <span class="cart-row__meta">${it.size || ''}${it.size && it.color ? ' / ' : ''}${it.color || ''}</span>
          <div class="qty" data-line="${key}">
            <button type="button" data-step="-1" aria-label="Decrease">${U.icon('minus', 14)}</button>
            <span>${it.quantity}</span>
            <button type="button" data-step="1" aria-label="Increase">${U.icon('plus', 14)}</button>
          </div>
        </div>
        <span class="cart-row__price">${SG.money(it.lineTotal)}</span>
        <button class="remove-btn" type="button" data-remove-line="${key}" data-cart-page-remove aria-label="Remove">${U.icon('trash', 16)}</button>
      </div>`;
    }).join('');
    paint(quote.totals);
  }

  function paint(t){
    if (!t) return;
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

  function setQty(id, vid, delta, key) {
    if (SG.cart.changeQty) {
      SG.cart.changeQty(key || vid, delta, id);
    } else {
      const items = SG.cart.all();
      const line = items.find((i) => i.productId === id && (!vid || i.variantId === vid || vid === 'default'));
      if (line) {
        line.qty = Math.max(1, Math.min(20, line.qty + delta));
        SG.cart.save(items);
      }
    }
    refresh();
  }

  function removeLine(id, vid, key) {
    if (SG.cart.remove) {
      SG.cart.remove(key || vid, id);
    } else {
      SG.cart.save(SG.cart.all().filter((i) => !(i.productId === id && (!vid || i.variantId === vid || vid === 'default'))));
    }
    if (!SG.cart.all().length) localStorage.removeItem(promoKey);
    refresh();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (SG.UI && SG.UI.mount) SG.UI.mount();
    refresh();
  });

  window.addEventListener('sg:cart', () => {
    refresh();
  });

  document.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (step) {
      e.preventDefault();
      const row = step.closest('.cart-row');
      if (!row) return;
      const key = row.dataset.key;
      const id = row.dataset.id;
      const vid = row.dataset.v;
      const delta = Number(step.dataset.step) || 0;
      setQty(id, vid, delta, key);
      return;
    }
    const rm = e.target.closest('[data-cart-page-remove], [data-remove-line], .remove-btn');
    if (rm && rm.closest('.cart-row')) {
      e.preventDefault();
      const row = rm.closest('.cart-row');
      const key = rm.dataset.removeLine || row.dataset.key;
      const id = row.dataset.id;
      const vid = row.dataset.v;
      removeLine(id, vid, key);
      return;
    }
    const apply = e.target.closest('#applyPromo, #promoForm button[type="submit"]');
    if (apply) {
      e.preventDefault();
      const input = document.getElementById('promoInput');
      if (input) {
        localStorage.setItem(promoKey, (input.value || '').trim().toUpperCase());
      }
      refresh();
      return;
    }
    const clear = e.target.closest('#clearCart');
    if (clear) {
      e.preventDefault();
      SG.cart.clear();
      localStorage.removeItem(promoKey);
      refresh();
      return;
    }
  });

  const promoForm = document.getElementById('promoForm');
  if (promoForm) {
    promoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('promoInput');
      if (input) {
        localStorage.setItem(promoKey, (input.value || '').trim().toUpperCase());
      }
      refresh();
    });
  }
})();
