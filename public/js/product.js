(function () {
  const U = SG.UI, api = SG.api;
  const $ = (s) => document.querySelector(s);
  const slug = new URLSearchParams(location.search).get('p') || new URLSearchParams(location.search).get('id');
  const state = { p: null, size: '', color: '', qty: 1, img: 0 };
  function money(n) { return U.money(n); }
  function findVariant() {
    if (!state.p) return null;
    return state.p.variants.find(v => (!state.size || v.size === state.size) && (!state.color || v.color === state.color && v.size === state.size)) || state.p.variants.find(v => v.size === state.size) || null;
  }
  function stockFor() {
    if (!state.p) return 0;
    if (!state.size) return state.p.variants.reduce((a, v) => a + v.stock, 0);
    return state.p.variants.filter(v => v.size === state.size).reduce((a, v) => a + v.stock, 0);
  }
  function init() {
    if (!slug) { location.replace('/shop.html'); return; }
    api.get('/products/' + encodeURIComponent(slug)).then(d => {
      state.p = d.product;
      state.size = state.p.variants.find(v => v.stock > 0)?.size || state.p.variants[0].size;
      state.color = state.p.variants.find(v => v.stock > 0)?.color || state.p.variants[0].color;
      document.title = state.p.name + ' | Star Gold Limited';
      $('#crumbName').textContent = state.p.name;
      renderGallery();
      renderInfo();
      renderRelated(d.related || []);
      renderReviews(d.reviews || []);
    }).catch(() => { $('#pdpInfo').innerHTML = '<div class="empty-state">This piece is no longer available. <a class="link-gold" href="/shop.html">Browse the collection</a></div>'; });
  }
  function renderGallery() {
    const p = state.p;
    $('#galleryMain').src = p.images[0];
    $('#galleryMain').alt = p.name;
    $('#galleryBadges').innerHTML = U.badges(p);
    $('#galleryThumbs').innerHTML = p.images.map((src, i) =>
      `<button class="thumb${i === 0 ? ' is-active' : ''}" data-img="${i}"><img src="${src}" alt="${p.name} view ${i + 1}"></button>`
    ).join('');
    document.querySelectorAll('[data-img]').forEach(b => b.addEventListener('click', () => {
      state.img = Number(b.dataset.img);
      $('#galleryMain').src = p.images[state.img];
      document.querySelectorAll('[data-img]').forEach(x => x.classList.toggle('is-active', x === b));
    }));
  }
  function renderInfo() {
    const p = state.p;
    const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const sizes = [...new Set(p.variants.map(v => v.size))];
    const colors = [...new Set(p.variants.map(v => v.color))];
    $('#pdpInfo').innerHTML = `
      <span class="pdp__cat">${p.categoryLabel} <span class="dot-sep"></span> Sourced from ${p.origin}</span>
      <h1 class="pdp__title">${p.name}</h1>
      <div class="pdp__row">
        <span class="pdp__price">${money(p.price)}</span>
        ${p.compareAt ? `<span class="pdp__was">${money(p.compareAt)}</span><span class="pdp__save">Save ${off}%</span>` : ''}
      </div>
      <div class="pdp__rating">${U.stars(p.rating)} <strong>${p.rating.toFixed(1)}</strong> <span>${p.reviewsCount} reviews</span></div>
      <p class="pdp__desc">${p.description}</p>
      <div class="pdp__divider"></div>
      <div class="opt-block">
        <div class="opt-head"><span>Size</span><button class="link-gold" type="button" id="sizeGuideBtn">Size guide</button></div>
        <div class="sizes" id="sizesBox">${sizes.map(s => `<button class="size-opt${s === state.size ? ' is-active' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
      </div>
      <div class="opt-block">
        <div class="opt-head"><span>Colour</span><span class="opt-value" id="colorName">${state.color}</span></div>
        <div class="colors" id="colorsBox">${colors.map(c => `<button class="color-opt${c === state.color ? ' is-active' : ''}" data-color="${c}" title="${c}" style="--sw:${U.swatchColor(c)}"><span style="background:${U.swatchColor(c)}"></span></button>`).join('')}</div>
      </div>
      <div class="stock-line" id="stockLine"></div>
      <div class="buy-row">
        <div class="qty"><button type="button" data-q="-1">${U.icon('minus', 14)}</button><span id="qtyVal">1</span><button type="button" data-q="1">${U.icon('plus', 14)}</button></div>
        <button class="btn btn--dark" id="addBtn">Add to bag</button>
      </div>
      <button class="btn btn--gold btn--block" id="buyBtn">Buy it now</button>
      <p class="pdp__note">${U.icon('truck', 16)} Complimentary delivery nationwide on orders over ${money(150000)}. Lagos delivery within 24 to 48 hours.</p>
      <div class="pdp__perks">
        <div class="perk">${U.icon('shield', 18)}<span>Authenticity checked</span></div>
        <div class="perk">${U.icon('refresh', 18)}<span>7 day exchange</span></div>
        <div class="perk">${U.icon('credit-card', 18)}<span>Secure card payment</span></div>
      </div>`;
    paintStock();
    wireOptions();
  }
  function paintStock() {
    const s = stockFor();
    const el = $('#stockLine');
    el.innerHTML = `<span class="stock-dot${s <= 3 ? ' stock-dot--low' : ''}"></span>${s > 3 ? 'In stock, ready to ship' : s > 0 ? 'Only ' + s + ' left in this size' : 'Currently sold out in this size'}`;
    $('#addBtn').disabled = s === 0;
    $('#buyBtn').disabled = s === 0;
  }
  function wireOptions() {
    const p = state.p;
    $('#sizesBox').addEventListener('click', e => {
      const b = e.target.closest('[data-size]');
      if (!b) return;
      state.size = b.dataset.size;
      document.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('is-active', x === b));
      paintStock();
    });
    $('#colorsBox').addEventListener('click', e => {
      const b = e.target.closest('[data-color]');
      if (!b) return;
      state.color = b.dataset.color;
      $('#colorName').textContent = state.color;
      document.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('is-active', x === b));
      paintStock();
    });
    document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      state.qty = Math.min(10, Math.max(1, state.qty + Number(b.dataset.q)));
      $('#qtyVal').textContent = state.qty;
    }));
    const add = (redirect) => () => {
      const v = findVariant();
      if (!v || v.stock <= 0) { SG.UI.toast('That combination is sold out. Pick another size.', 'warn'); return; }
      SG.cart.add(p, v, state.qty);
      if (redirect) location.href = '/checkout.html';
      else SG.UI.openCart();
    };
    $('#addBtn').addEventListener('click', add(false));
    $('#buyBtn').addEventListener('click', add(true));
    $('#sizeGuideBtn').addEventListener('click', () => SG.UI.toast('Sizing: true to size. Between sizes? Take the larger one.', 'info'));
    document.querySelectorAll('.accordion__head').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('is-open')));
    if ($('#accDetails')) $('#accDetails').innerHTML = '<ul>' + p.details.map(d => `<li>${d}</li>`).join('') + '</ul>';
  }
  function renderRelated(list) {
    $('#relatedGrid').innerHTML = list.map(p => U.card(p)).join('');
  }
  function renderReviews() {
    const p = state.p;
    const host = $('#relatedGrid').closest('section');
    const rv = p.reviews || [];
    const sec = document.createElement('div');
    sec.className = 'reviews';
    sec.innerHTML = `<div class="reviews__score"><span class="eyebrow">Reviews</span><strong>${p.rating.toFixed(1)}</strong>
        <div class="review__stars">${U.stars(p.rating)}</div>
        <span class="muted tiny">${p.reviewsCount} verified buyers</span></div>
      <div class="reviews__list">${rv.map(r => `<article class="review">
        <div class="review__head"><div class="review__who"><span class="review__avatar">${r.name.slice(0, 2).toUpperCase()}</span><div><div class="review__name">${r.name}</div><div class="review__date">${r.date}</div></div></div>
        <div class="review__stars">${U.stars(r.rating)}</div></div><p>${r.text}</p></article>`).join('')}</div>`;
    host.parentElement.insertBefore(sec, host);
  }
  function findVariant() {
    return state.p.variants.find(v => v.size === state.size && v.color === state.color) || null;
  }
  function stockFor() {
    return state.p.variants.filter(v => (!state.size || v.size === state.size) && (!state.color || v.color === state.color)).reduce((n, v) => n + v.stock, 0);
  }
  async function load() {
    const slug = new URLSearchParams(location.search).get('p') || 'heritage-selvedge-straight-jeans';
    try {
      const data = await SG.api.get('/products/' + encodeURIComponent(slug));
      state.p = data.product;
      const colors = [...new Set(state.p.variants.map(v => v.color))];
      state.color = colors[0];
      state.size = (state.p.variants.find(v => v.stock > 0) || state.p.variants[0]).size;
      document.title = state.p.name + ' | Star Gold Limited';
      renderGallery(); renderInfo();
      renderRelated(data.related); renderReviews();
    } catch (err) { SG.UI.toast(err.message, 'err'); }
  }
  document.addEventListener('DOMContentLoaded', () => { SG.UI.mount(); load(); });
})();
