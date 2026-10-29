(function () {
  const U = SG.UI, api = SG.api;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const slug = params.get('p') || params.get('id');
  const state = { p: null, size: '', color: '', qty: 1, img: 0 };

  function money(n) { return U.money(n); }

  function normalizeProduct(p) {
    if (!p) return null;
    const variants = Array.isArray(p.variants) && p.variants.length > 0
      ? p.variants
      : [{ id: 'v-default', size: 'Standard', color: 'Standard', stock: p.stock !== undefined ? p.stock : 10 }];
    const images = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : ['/assets/placeholder.svg'];
    return Object.assign({}, p, { variants: variants, images: images });
  }

  function findVariant() {
    if (!state.p) return null;
    return state.p.variants.find(v => (!state.size || v.size === state.size) && (!state.color || v.color === state.color))
      || state.p.variants.find(v => v.size === state.size)
      || state.p.variants[0]
      || null;
  }

  function stockFor() {
    if (!state.p) return 0;
    if (!state.size) return state.p.variants.reduce((a, v) => a + (v.stock || 0), 0);
    return state.p.variants.filter(v => v.size === state.size).reduce((a, v) => a + (v.stock || 0), 0);
  }

  function applyProduct(p) {
    state.p = normalizeProduct(p);
    const variants = state.p.variants;
    if (!state.size) {
      state.size = variants.find(v => (v.stock || 0) > 0)?.size || variants[0].size || 'Standard';
    }
    if (!state.color) {
      state.color = variants.find(v => (v.stock || 0) > 0)?.color || variants[0].color || 'Standard';
    }
    document.title = state.p.name + ' | Star Gold Limited';
    const crumb = $('#crumbName');
    if (crumb) crumb.textContent = state.p.name;
    renderGallery();
    renderInfo();
  }

  function renderGallery() {
    const p = state.p;
    if (!p) return;
    const wrap = $('#galleryMainWrap');
    if (wrap) wrap.classList.remove('skeleton');
    const mainImg = $('#galleryMain');
    if (mainImg) {
      mainImg.src = p.images[0] || '/assets/placeholder.svg';
      mainImg.alt = p.name;
      mainImg.decoding = 'async';
      mainImg.style.opacity = '1';
    }
    const badgesEl = $('#galleryBadges');
    if (badgesEl) badgesEl.innerHTML = U.badges(p);

    if (p.video) {
      const v = document.createElement("video");
      v.src = p.video; v.controls = true; v.playsInline = true; v.className = "pdp-video";
      const main = document.querySelector(".gallery__main");
      if (main && !main.querySelector("video")) main.prepend(v);
    }

    const thumbsEl = $('#galleryThumbs');
    if (thumbsEl) {
      thumbsEl.innerHTML = p.images.map((src, i) =>
        `<button class="thumb${i === state.img ? ' is-active' : ''}" data-img="${i}" type="button"><img src="${src}" alt="${p.name} view ${i + 1}" loading="lazy" decoding="async"></button>`
      ).join('');
      thumbsEl.querySelectorAll('[data-img]').forEach(b => b.addEventListener('click', () => {
        state.img = Number(b.dataset.img);
        if (mainImg) mainImg.src = p.images[state.img];
        thumbsEl.querySelectorAll('[data-img]').forEach(x => x.classList.toggle('is-active', x === b));
      }));
    }
  }

  function renderInfo() {
    const p = state.p;
    if (!p) return;
    const off = p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;
    const sizes = [...new Set(p.variants.map(v => v.size))];
    const colors = [...new Set(p.variants.map(v => v.color))];
    const catLabel = p.categoryLabel || p.category || 'Collection';
    const origin = p.origin || 'Import';

    $('#pdpInfo').innerHTML = `
      <span class="pdp__cat">${catLabel} <span class="dot-sep"></span> Sourced from ${origin}</span>
      <h1 class="pdp__title">${p.name}</h1>
      <div class="pdp__row">
        <span class="pdp__price">${money(p.price)}</span>
        ${p.compareAt && p.compareAt > p.price ? `<span class="pdp__was">${money(p.compareAt)}</span><span class="pdp__save">Save ${off}%</span>` : ''}
      </div>
      <div class="pdp__rating">${U.stars(p.rating || 4.8)} <strong>${(p.rating || 4.8).toFixed(1)}</strong> <span>${p.reviewsCount || 12} reviews</span></div>
      <p class="pdp__desc">${p.description || 'Crafted with signature Star Gold tailoring and premium imported fabric.'}</p>
      <div class="pdp__divider"></div>
      <div class="opt-block">
        <div class="opt-head"><span>Size</span><button class="link-gold" type="button" id="sizeGuideBtn">Size guide</button></div>
        <div class="sizes" id="sizesBox">${sizes.map(s => `<button class="size-opt${s === state.size ? ' is-active' : ''}" data-size="${s}" type="button">${s}</button>`).join('')}</div>
      </div>
      <div class="opt-block">
        <div class="opt-head"><span>Colour</span><span class="opt-value" id="colorName">${state.color}</span></div>
        <div class="colors" id="colorsBox">${colors.map(c => `<button class="color-opt${c === state.color ? ' is-active' : ''}" data-color="${c}" title="${c}" style="--sw:${U.swatchColor(c)}" type="button"><span style="background:${U.swatchColor(c)}"></span></button>`).join('')}</div>
      </div>
      <div class="stock-line" id="stockLine"></div>
      <div class="buy-row">
        <div class="qty"><button type="button" data-q="-1">${U.icon('minus', 14)}</button><span id="qtyVal">${state.qty}</span><button type="button" data-q="1">${U.icon('plus', 14)}</button></div>
        <button class="btn btn--dark" id="addBtn" type="button">Add to bag</button>
      </div>
      <button class="btn btn--gold btn--block" id="buyBtn" type="button">Buy it now</button>
      <p class="pdp__note">${U.icon('truck', 16)} Complimentary delivery nationwide on orders over ${money(150000)}. Lagos delivery within 24 to 48 hours.</p>
      <div class="pdp__perks">
        <div class="perk">${U.icon('shield', 18)}<span>Authenticity checked</span></div>
        <div class="perk">${U.icon('refresh', 18)}<span>7 day exchange</span></div>
        <div class="perk">${U.icon('card', 18)}<span>Secure card payment</span></div>
      </div>`;
    paintStock();
    wireOptions();
  }

  function paintStock() {
    const s = stockFor();
    const el = $('#stockLine');
    if (el) {
      el.innerHTML = `<span class="stock-dot${s <= 3 ? ' stock-dot--low' : ''}"></span>${s > 3 ? 'In stock, ready to ship' : s > 0 ? 'Only ' + s + ' left in this size' : 'Currently sold out in this size'}`;
    }
    const addBtn = $('#addBtn');
    if (addBtn) addBtn.disabled = s === 0;
    const buyBtn = $('#buyBtn');
    if (buyBtn) buyBtn.disabled = s === 0;
  }

  function wireOptions() {
    const p = state.p;
    if (!p) return;
    const sizesBox = $('#sizesBox');
    if (sizesBox) {
      sizesBox.addEventListener('click', e => {
        const b = e.target.closest('[data-size]');
        if (!b) return;
        state.size = b.dataset.size;
        sizesBox.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('is-active', x === b));
        paintStock();
      });
    }
    const colorsBox = $('#colorsBox');
    if (colorsBox) {
      colorsBox.addEventListener('click', e => {
        const b = e.target.closest('[data-color]');
        if (!b) return;
        state.color = b.dataset.color;
        const colorName = $('#colorName');
        if (colorName) colorName.textContent = state.color;
        colorsBox.querySelectorAll('[data-color]').forEach(x => x.classList.toggle('is-active', x === b));
        paintStock();
      });
    }
    document.querySelectorAll('[data-q]').forEach(b => b.addEventListener('click', () => {
      state.qty = Math.min(10, Math.max(1, state.qty + Number(b.dataset.q)));
      const qVal = $('#qtyVal');
      if (qVal) qVal.textContent = state.qty;
    }));
    const add = (redirect) => () => {
      const v = findVariant();
      if (!v || (v.stock !== undefined && v.stock <= 0)) {
        SG.UI.toast('That option is currently sold out. Please pick another size.', 'warn');
        return;
      }
      SG.cart.add(p, v, state.qty);
      if (redirect) location.href = '/checkout.html';
      else SG.UI.openCart();
    };
    const addBtn = $('#addBtn');
    if (addBtn) addBtn.addEventListener('click', add(false));
    const buyBtn = $('#buyBtn');
    if (buyBtn) buyBtn.addEventListener('click', add(true));
    const guideBtn = $('#sizeGuideBtn');
    if (guideBtn) guideBtn.addEventListener('click', () => SG.UI.toast('Sizing: true to size. Between sizes? Take the larger one.', 'info'));
    document.querySelectorAll('.accordion__head').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('is-open')));
    if ($('#accDetails') && Array.isArray(p.details)) {
      $('#accDetails').innerHTML = '<ul>' + p.details.map(d => `<li>${d}</li>`).join('') + '</ul>';
    }
  }

  function renderRelated(list) {
    const grid = $('#relatedGrid');
    if (grid && Array.isArray(list) && list.length > 0) {
      grid.innerHTML = list.map(p => U.card(p)).join('');
    }
  }

  function renderReviews(rv) {
    const p = state.p;
    if (!p) return;
    const grid = $('#relatedGrid');
    const host = grid ? grid.closest('section') : null;
    if (!host || document.querySelector('.reviews')) return;
    const list = Array.isArray(rv) && rv.length > 0 ? rv : (p.reviews || []);
    const rating = p.rating || 4.8;
    const count = p.reviewsCount || list.length || 12;
    const sec = document.createElement('div');
    sec.className = 'reviews';
    sec.innerHTML = `<div class="reviews__score"><span class="eyebrow">Reviews</span><strong>${rating.toFixed(1)}</strong>
        <div class="review__stars">${U.stars(rating)}</div>
        <span class="muted tiny">${count} verified buyers</span></div>
      <div class="reviews__list">${list.map(r => `<article class="review">
        <div class="review__head"><div class="review__who"><span class="review__avatar">${(r.name || 'SG').slice(0, 2).toUpperCase()}</span><div><div class="review__name">${r.name || 'Verified Buyer'}</div><div class="review__date">${r.date || 'Recent'}</div></div></div>
        <div class="review__stars">${U.stars(r.rating || 5)}</div></div><p>${r.text || 'Exceptional quality and fit.'}</p></article>`).join('')}</div>`;
    host.parentElement.insertBefore(sec, host);
  }

  async function load() {
    if (!slug) { location.replace('/shop.html'); return; }

    // Instant paint from cache if available (0ms load time)
    const cached = api.getCachedProduct(slug);
    if (cached) {
      applyProduct(cached);
    }

    try {
      const data = await api.get('/products/' + encodeURIComponent(slug));
      if (!data || !data.product) throw new Error('Product not found');
      applyProduct(data.product);
      renderRelated(data.related || []);
      renderReviews(data.reviews || []);
    } catch (err) {
      if (!state.p) {
        const info = $('#pdpInfo');
        if (info) info.innerHTML = '<div class="empty-state">This piece is no longer available. <a class="link-gold" href="/shop.html">Browse the collection</a></div>';
        const wrap = $('#galleryMainWrap');
        if (wrap) wrap.classList.remove('skeleton');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
