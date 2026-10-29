(function(){
  const U = SG.UI;
  const BIZ = SG.BIZ;
  const CATS = [['jeans','Jeans'],['gowns','Gowns'],['shirts','Shirts'],['up-and-down','Up and Down'],['trousers','Trousers'],['caps','Caps'],['shoes','Shoes'],['bags','Bags']];
  function cats(){ return (window.SG && SG.CATS && SG.CATS.length) ? SG.CATS : CATS; }
  const NAV = [
    ['/shop.html?feature=new','New In','new'],
    ['/shop.html','Shop All','shop'],
    ['/index.html#lookbook','Lookbook','lookbook'],
    ['/contact.html','Contact','contact']
  ];
  function catMenuHtml(){
    return '<div class="nav__drop" data-cat-drop>'
      + '<button class="nav__dropbtn" type="button" data-cat-toggle aria-expanded="false" aria-haspopup="true">Categories '+U.icon('chevron-down',13)+'</button>'
      + '<div class="nav__menu" role="menu">'
      + '<div class="nav__menu-col"><span class="nav__menu-label">Shop by category</span>'
      + cats().map(function(c){ return '<a role="menuitem" href="/shop.html?category='+c[0]+'">'+c[1]+'</a>'; }).join('')
      + '</div>'
      + '<div class="nav__menu-col"><span class="nav__menu-label">Shop by origin</span>'
      + '<a role="menuitem" href="/shop.html?origin=Turkey">Turkey Wears</a>'
      + '<a role="menuitem" href="/shop.html?origin=China">Chinese Wears</a>'
      + '<a role="menuitem" href="/shop.html?feature=best">Best Sellers</a>'
      + '<a role="menuitem" href="/shop.html?feature=new">New Arrivals</a>'
      + '</div></div></div>';
  }
  const ANNOUNCE = [
    ['truck','Complimentary delivery on orders above \u20A6150,000'],
    ['package','Sourced in Turkey and China, delivered nationwide'],
    ['shield','Card, bank transfer or WhatsApp checkout']
  ];
  function announceHtml(){
    return '<div class="announce"><div class="container announce__inner">'
      + ANNOUNCE.map(function(a,i){ return '<div class="announce__item'+(i===0?' is-active':'')+'">'+U.icon(a[0],14)+'<span>'+a[1]+'</span></div>'; }).join('')
      + '<div class="announce__nav"><button type="button" data-ann="prev" aria-label="Previous notice">'+U.icon('chevron-left',14)+'</button><button type="button" data-ann="next" aria-label="Next notice">'+U.icon('chevron-right',14)+'</button></div>'
      + '</div></div>';
  }
  function headerHtml(page){
    const link = function(n){
      const key = n[2];
      return '<a href="'+n[0]+'"'+(page===key?' aria-current="page"':'')+'>'+n[1]+'</a>';
    };
    const navHtml = link(NAV[0]) + link(NAV[1]) + catMenuHtml() + NAV.slice(2).map(link).join('');
    return announceHtml()
      + '<header class="site-header" id="siteHeader"><div class="container header__inner">'
      + '<button class="icon-btn burger" type="button" data-mobile-open aria-label="Open menu">'+U.icon('menu',20)+'</button>'
      + '<a class="brand" href="/" aria-label="Star Gold Limited home">'+U.brandMark()+'</a>'
      + '<nav class="nav" aria-label="Primary">'+navHtml+'</nav>'
      + '<div class="header__actions">'
      + '<button class="header__search" type="button" data-search-open>'+U.icon('search',16)+'<span>Search pieces</span></button>'
      + '<a class="icon-btn header__account" href="/account.html" aria-label="Your account">'+U.icon('user',19)+'</a>'
      + '<button class="icon-btn" type="button" data-wishlist-open aria-label="Wishlist">'+U.icon('heart',19)+'<span class="icon-btn__count" id="wishCount" hidden>0</span></button>'
      + '<button class="icon-btn" type="button" data-cart-open aria-label="Your bag">'+U.icon('bag',19)+'<span class="icon-btn__count" id="cartCount" hidden>0</span></button>'
      + '</div></div></header>';
  }
  function mobileNavHtml(page){
    const links = NAV.map(function(n){ return '<a class="mobile-nav__link" href="'+n[0]+'">'+n[1]+U.icon('chevron-right',16)+'</a>'; }).join('');
    return '<div class="mobile-nav" id="mobileNav" aria-hidden="true"><div class="container">'
      + '<div class="mobile-nav__top"><a class="brand" href="/">'+U.brandMark()+'</a><button class="icon-btn" type="button" data-mobile-close aria-label="Close menu">'+U.icon('x',20)+'</button></div>'
      + '<nav class="mobile-nav__links">'+links+'</nav>'
      + '<div class="mobile-nav__group"><span class="mobile-nav__label">Shop by category</span>'
      + '<div class="mobile-nav__chips">'+cats().map(function(c){ return '<a class="chip" href="/shop.html?category='+c[0]+'">'+c[1]+'</a>'; }).join('')
      + '<a class="chip" href="/shop.html?origin=Turkey">Turkey Wears</a><a class="chip" href="/shop.html?origin=China">Chinese Wears</a></div></div>'
      + '<div class="mobile-nav__foot">'
      + '<a class="btn btn--dark btn--block" href="/account.html">'+U.icon('user',16)+' My account</a>'
      + '<a class="btn btn--outline btn--block" href="https://wa.me/'+BIZ.whatsapp+'" target="_blank" rel="noopener">'+U.icon('whatsapp',16)+' Chat with us</a>'
      + '</div></div></div>';
  }
  document.addEventListener('click', function(e){
    const toggle = e.target.closest('[data-cat-toggle]');
    const drop = e.target.closest('[data-cat-drop]');
    document.querySelectorAll('[data-cat-drop].is-open').forEach(function(d){ if(d!==drop){ d.classList.remove('is-open'); const b=d.querySelector('[data-cat-toggle]'); if(b) b.setAttribute('aria-expanded','false'); } });
    if(toggle){ const d=toggle.closest('[data-cat-drop]'); const open=d.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', open?'true':'false'); }
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ document.querySelectorAll('[data-cat-drop].is-open').forEach(function(d){ d.classList.remove('is-open'); }); } });
  window.SGChrome = { headerHtml: headerHtml, mobileNavHtml: mobileNavHtml };
})();

(function(){
  const U = SG.UI;
  const BIZ = SG.BIZ;
  const WA = 'https://wa.me/' + SG.BIZ.whatsapp;
  const CATS = [['jeans','Jeans'],['gowns','Gowns'],['shirts','Shirts'],['up-and-down','Up and Down'],['trousers','Trousers'],['caps','Caps'],['shoes','Shoes'],['bags','Bags']];
  function cats(){ return (window.SG && SG.CATS && SG.CATS.length) ? SG.CATS : CATS; }
  function footerHtml(){
    const catLinks = cats().map(function(c){ return '<li><a href="/shop.html?category='+c[0]+'">'+c[1]+'</a></li>'; }).join('');
    return '<footer class="site-footer"><div class="container"><div class="footer__grid">'
      + '<div class="footer__brand"><a class="brand" href="/">'+U.brandMark()+'</a>'
      + '<p class="footer__slogan">'+BIZ.slogan+'</p>'
      + '<p>Trusted dealers in luxury wears, shoes and bags at Balogun, Lagos Island. Genuine pieces sourced from Turkey and China, delivered nationwide.</p>'
      + '<div class="footer__social">'
      + '<a href="https://wa.me/'+BIZ.whatsapp+'" target="_blank" rel="noopener" aria-label="WhatsApp">'+U.icon('whatsapp',16)+'</a>'
      + '<a href="'+BIZ.instagram+'" target="_blank" rel="noopener" aria-label="Instagram">'+U.icon('instagram',16)+'</a>'
      + '<a href="tel:+2348033876440" aria-label="Call our second line">'+U.icon('phone',16)+'</a>'
      + '</div>'
      + '<div class="footer__contact">'
      + '<a href="tel:+2348063494273">'+U.icon('phone',14)+' '+BIZ.phonePretty+' (sales)</a>'
      + '<a href="tel:+2348033876440">'+U.icon('phone',14)+' '+BIZ.phone2Pretty+' (store)</a>'
      + '<a href="mailto:'+BIZ.email+'">'+U.icon('mail',14)+' '+BIZ.email+'</a>'
      + '<a href="https://maps.google.com/?q=11+Breadfruit+Street+Ajao+Plaza+Balogun+Lagos+Island" target="_blank" rel="noopener">'+U.icon('map-pin',14)+' '+BIZ.shop+', '+BIZ.addressLine+'</a>'
      + '<span>'+U.icon('clock',14)+' '+BIZ.hours+'</span>'
      + '</div></div>'
      + '<div class="footer__col"><h4>Shop</h4><ul>'+catLinks+'</ul></div>'
      + '<div class="footer__col"><h4>Company</h4><ul><li><a href="/index.html#story">Our story</a></li><li><a href="/index.html#lookbook">Lookbook</a></li><li><a href="/index.html#reviews">Reviews</a></li><li><a href="/contact.html">Contact</a></li><li><a href="/admin.html">Staff portal</a></li></ul></div>'
      + '<div class="footer__col"><h4>Support</h4><ul><li><a href="/index.html#faq">Shipping and delivery</a></li><li><a href="/index.html#faq">Returns and exchanges</a></li><li><a href="/index.html#faq">Size guide</a></li><li><a href="/account.html">Track your order</a></li><li><a href="'+WA+'" target="_blank" rel="noopener">WhatsApp us</a></li></ul></div>'
      + '</div><div class="footer__bottom"><span>&copy; '+new Date().getFullYear()+' Star Gold Limited. All rights reserved.</span>'
      + '<div class="footer__pay"><span>Paystack</span><span>Visa</span><span>Mastercard</span><span>Bank transfer</span></div></div>'
      + '</div></footer>';
  }
  function overlaysHtml(){
    return '<div class="toast-stack" id="toastStack" aria-live="polite"></div>'
      + '<div class="drawer" id="cartDrawer" aria-hidden="true"><div class="drawer__scrim" data-close-all></div>'
      + '<aside class="drawer__panel" role="dialog" aria-label="Your bag"><div class="drawer__head">'
      + '<span class="drawer__title" id="cartDrawerTitle">Your bag</span>'
      + '<button class="icon-btn" type="button" data-close-all aria-label="Close bag">'+U.icon('x',18)+'</button></div>'
      + '<div class="drawer__body" id="cartDrawerBody"></div>'
      + '<div class="drawer__foot" id="cartDrawerFoot"></div></aside></div>'
      + '<div class="search-overlay" id="searchOverlay" aria-hidden="true"><div class="search-overlay__inner">'
      + '<form class="search-overlay__bar" id="searchForm" role="search"><span class="search-overlay__icon">'+U.icon('search',20)+'</span>'
      + '<input id="searchInput" type="search" placeholder="Search denim, gowns, bags..." autocomplete="off" aria-label="Search products">'
      + '<button class="icon-btn" type="button" data-search-close aria-label="Close search">'+U.icon('x',20)+'</button></form>'
      + '<div class="search-trends"><span class="eyebrow">Trending</span>'
      + ['Selvedge denim','Satin gown','Poplin shirt','Leather tote','Chelsea boots','Monogram cap'].map(function(t){ return '<a class="chip" href="/shop.html?q='+encodeURIComponent(t)+'">'+t+'</a>'; }).join('')
      + '</div><div class="search-overlay__results" id="searchResults"></div>'
      + '<p class="search-note">Press Enter to see every result, or Esc to close.</p>'
      + '</div></div>'
      + '<div class="modal" id="quickView" aria-hidden="true"><div class="modal__scrim" data-close-all></div>'
      + '<div class="modal__panel" role="dialog" aria-label="Product quick view"><button class="modal__close icon-btn" type="button" data-close-all aria-label="Close">'+U.icon('x',18)+'</button>'
      + '<div id="quickViewBody"></div></div></div>';
  }
  SGChrome.footerHtml = footerHtml;
  SGChrome.overlaysHtml = overlaysHtml;
  SGChrome.WA = WA;
})();

(function(){
  const U = SG.UI;
  const $ = function(s,r){ return (r||document).querySelector(s); };
  const $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  function toast(msg,type){
    const stack = $('#toastStack');
    if(!stack) return;
    const el = document.createElement('div');
    el.className = 'toast' + (type==='error' ? ' toast--error' : '');
    el.innerHTML = U.icon(type==='error' ? 'alert' : 'check',16) + '<span>'+msg+'</span>';
    stack.appendChild(el);
    setTimeout(function(){ el.style.opacity='0'; el.style.transform='translateY(8px)'; }, 3200);
    setTimeout(function(){ el.remove(); }, 3700);
  }
  function badges(){
    const n = SG.cart.count();
    const c = $('#cartCount');
    if(c){ c.textContent = n; c.hidden = n === 0; }
    const w = SG.wish.all().length;
    const wc = $('#wishCount');
    if(wc){ wc.textContent = w; wc.hidden = w === 0; }
  }
  function openCart(){
    const d = $('#cartDrawer');
    if(!d) return;
    renderCart();
    d.classList.add('is-open');
    d.setAttribute('aria-hidden','false');
    document.body.classList.add('is-locked');
  }
  function closeAll(){
    $$('.drawer.is-open, .modal.is-open, .search-overlay.is-open, .mobile-nav.is-open').forEach(function(el){
      el.classList.remove('is-open');
      el.setAttribute('aria-hidden','true');
    });
    document.body.classList.remove('is-locked');
    document.documentElement.classList.remove('is-locked');
  }
  function renderCart(){
    const items = SG.cart.all();
    const body = $('#cartDrawerBody');
    const foot = $('#cartDrawerFoot');
    const title = $('#cartDrawerTitle');
    const count = SG.cart.count();
    if(title) title.textContent = count ? 'Your bag (' + count + ')' : 'Your bag';
    if(!body) return;
    if(!items.length){
      body.innerHTML = '<div class="cart-empty">'+U.icon('bag',34)+'<h3>Your bag is empty</h3><p>Start with the new denim drop or a piece from the evening edit.</p><a class="btn btn--dark" href="/shop.html">Shop new in</a></div>';
      if(foot) foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map(function(it){
      return '<div class="line-item">'
        + '<a class="line-item__media" href="/product.html?p='+it.slug+'"><img src="'+it.image+'" alt="'+it.name+'" loading="lazy" decoding="async"></a>'
        + '<div class="line-item__mid"><p class="line-item__name">'+it.name+'</p>'
        + '<p class="line-item__meta">'+[it.size,it.color].filter(Boolean).join(' / ')+'</p>'
        + '<div class="qty" data-line="'+it.variantId+'"><button type="button" data-qty="-1" aria-label="Decrease">'+U.icon('minus',13)+'</button><span>'+it.qty+'</span><button type="button" data-qty="1" aria-label="Increase">'+U.icon('plus',13)+'</button></div></div>'
        + '<div class="line-item__right"><span class="line-item__price">'+U.money(it.price*it.qty)+'</span><button class="remove-btn" type="button" data-remove="'+it.variantId+'" aria-label="Remove">'+U.icon('trash',15)+'</button></div>'
        + '</div>';
    }).join('');
    const sub = SG.cart.subtotal();
    const left = Math.max(0, 150000 - sub);
    if(foot){
      foot.innerHTML = '<div class="sum-row"><span>Subtotal</span><strong>'+U.money(sub)+'</strong></div>'
        + '<p class="sum-note">'+(left>0 ? 'Add '+U.money(left)+' more for complimentary delivery.' : 'Complimentary delivery unlocked.')+'</p>'
        + '<a class="btn btn--dark btn--block" href="/checkout.html">Checkout</a>'
        + '<a class="btn btn--outline btn--block" href="/cart.html">View bag</a>'
        + '<p class="secure-note">'+U.icon('lock',13)+' Secure checkout with Paystack</p>';
    }
  }
  const Chr = SGChrome;
  Chr.toast = toast;
  Chr.badges = badges;
  Chr.openCart = openCart;
  Chr.openMenu = function(){ const mn = $('#mobileNav'); if(!mn) return; mn.classList.add('is-open'); mn.setAttribute('aria-hidden','false'); document.body.classList.add('is-locked'); document.documentElement.classList.add('is-locked'); };
  Chr.closeAll = closeAll;
  Chr.renderCart = renderCart;
  Chr.$ = $;
  Chr.$$ = $$;
})();

(function(){
  const U = SG.UI;
  const C = SGChrome;
  const $ = C.$;
  let timer = null;
  function openSearch(){
    const o = $('#searchOverlay');
    if(!o) return;
    o.classList.add('is-open');
    o.setAttribute('aria-hidden','false');
    document.body.classList.add('is-locked');
    setTimeout(function(){ const i = $('#searchInput'); if(i) i.focus(); }, 80);
  }
  function runSearch(q){
    const box = $('#searchResults');
    if(!box) return;
    if(!q.trim()){ box.innerHTML = ''; return; }
    box.innerHTML = '<p class="sum-note">Searching the collection</p>';
    SG.api.get('/products?limit=6&q=' + encodeURIComponent(q)).then(function(data){
      const list = data.products || [];
      if(!list.length){ box.innerHTML = '<p class="search-empty">No pieces matched that search. Try denim, gowns or bags.</p>'; return; }
      box.innerHTML = list.map(function(p){
        return '<a class="search-hit" href="/product.html?p='+p.slug+'">'
          + '<span class="search-hit__img"><img src="'+p.images[0]+'" alt="'+p.name+'" loading="lazy" decoding="async"></span>'
          + '<span class="search-hit__body"><span class="search-hit__name">'+p.name+'</span><span class="search-hit__meta">'+p.categoryLabel+' / '+p.origin+'</span></span>'
          + '<span class="search-hit__price">'+U.money(p.price)+'</span></a>';
      }).join('');
    }).catch(function(){ box.innerHTML = '<p class="search-empty">Search is unavailable right now.</p>'; });
  }
  function quickView(slug){
    const modal = $('#quickView');
    const body = $('#quickViewBody');
    if(!modal || !body) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('is-locked');
    body.innerHTML = '<div style="padding:60px 24px;text-align:center"><div class="skeleton" style="width:52px;height:52px;border-radius:50%;margin:0 auto 16px"></div><p class="sum-note" style="margin:0;font-size:14px">Loading piece details...</p></div>';
    
    const cleanSlug = decodeURIComponent(String(slug || '')).trim();
    SG.api.get('/products/' + encodeURIComponent(cleanSlug)).then(function(data){
      const p = data.product;
      if(!p){
        body.innerHTML = '<div class="empty-state"><p>That piece is currently unavailable.</p><a class="btn btn--outline" href="/shop.html">Browse Collection</a></div>';
        return;
      }
      const variants = Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants
        : [{ id: 'v-default', size: 'Standard', color: 'Standard', stock: (p.stock !== undefined ? p.stock : 10) }];
      
      const sizes = [];
      variants.forEach(function(v){ if(v.size && sizes.indexOf(v.size) < 0) sizes.push(v.size); });
      const colors = [];
      variants.forEach(function(v){ if(v.color && colors.indexOf(v.color) < 0) colors.push(v.color); });
      let size = sizes[0] || 'Standard';
      let color = colors[0] || 'Standard';

      function variant(){
        return variants.find(function(v){ return v.size === size && v.color === color; })
          || variants.find(function(v){ return v.size === size; })
          || variants[0];
      }

      function paint(){
        const v = variant();
        const stock = v ? (v.stock !== undefined ? v.stock : 1) : 0;
        const stockEl = body.querySelector('#qvStock') || $('#qvStock');
        if(stockEl){
          stockEl.textContent = stock > 4 ? 'In stock, ready to ship' : stock > 0 ? 'Only ' + stock + ' left in this option' : 'Currently sold out in this option';
        }
        const addBtn = body.querySelector('#qvAdd') || $('#qvAdd');
        if(addBtn){
          addBtn.disabled = !stock;
          addBtn.textContent = stock ? 'Add to bag' : 'Sold out';
        }
        body.querySelectorAll('[data-size]').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-size') === size); });
        body.querySelectorAll('[data-color]').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-color') === color); });
      }

      const images = (Array.isArray(p.images) && p.images.length > 0) ? p.images : ['/assets/placeholder.svg'];
      const catLabel = p.categoryLabel || p.category || 'Collection';
      const desc = p.description || 'Exclusive Star Gold design crafted with signature tailoring and fine materials.';
      const showSizes = sizes.length > 0 && !(sizes.length === 1 && sizes[0] === 'Standard');
      const showColors = colors.length > 0 && !(colors.length === 1 && colors[0] === 'Standard');

      const sizeHtml = showSizes
        ? '<div class="field"><span class="field__label">Size</span><div class="size-row">' + sizes.map(function(s){ return '<button type="button" class="size-chip" data-size="'+s+'">'+s+'</button>'; }).join('') + '</div></div>'
        : '';
      const colorHtml = showColors
        ? '<div class="field"><span class="field__label">Colour</span><div class="swatch-row">' + colors.map(function(c){ return '<button type="button" class="swatch" data-color="'+c+'" title="'+c+'" style="--sw:'+U.colorHex(c)+'"></button>'; }).join('') + '</div></div>'
        : '';
      const thumbsHtml = images.length > 1
        ? '<div class="qv__thumbs">' + images.map(function(src, idx){
            return '<button type="button" class="qv__thumb'+(idx===0?' is-active':'')+'" data-qv-thumb="'+idx+'" aria-label="View photo '+(idx+1)+'"><img src="'+src+'" alt="" loading="lazy" decoding="async"></button>';
          }).join('') + '</div>'
        : '';

      body.innerHTML = '<div class="quickview">'
        + '<div class="qv__media">'
        + '<div class="qv__main-wrap"><img id="qvMainImg" src="'+images[0]+'" alt="'+p.name+'" loading="lazy" decoding="async"></div>'
        + thumbsHtml
        + '</div>'
        + '<div class="qv__body">'
        + '<p class="eyebrow">'+catLabel+'</p>'
        + '<h2>'+p.name+'</h2>'
        + '<p class="qv__price">'+U.money(p.price)+(p.compareAt && p.compareAt > p.price ?' <s>'+U.money(p.compareAt)+'</s>':'')+'</p>'
        + '<p class="qv__desc">'+desc+'</p>'
        + sizeHtml
        + colorHtml
        + '<p class="stock-note" id="qvStock"></p>'
        + '<div class="qv__actions">'
        + '<button class="btn btn--gold" id="qvAdd" type="button">Add to bag</button>'
        + '<a class="btn btn--outline" href="/product.html?p='+encodeURIComponent(p.slug || p.id)+'">Full details</a>'
        + '</div>'
        + '<p class="secure-note">'+U.icon('truck',14)+' Delivery in 1 to 4 working days across Nigeria</p>'
        + '</div></div>';

      body.querySelectorAll('[data-size]').forEach(function(b){
        b.addEventListener('click', function(){ size = b.getAttribute('data-size'); paint(); });
      });
      body.querySelectorAll('[data-color]').forEach(function(b){
        b.addEventListener('click', function(){ color = b.getAttribute('data-color'); paint(); });
      });
      body.querySelectorAll('[data-qv-thumb]').forEach(function(tb){
        tb.addEventListener('click', function(){
          const idx = parseInt(tb.getAttribute('data-qv-thumb'), 10);
          const mainImg = body.querySelector('#qvMainImg');
          if(mainImg && images[idx]) mainImg.src = images[idx];
          body.querySelectorAll('[data-qv-thumb]').forEach(function(t){ t.classList.toggle('is-active', t === tb); });
        });
      });

      paint();

      const qvAdd = body.querySelector('#qvAdd') || $('#qvAdd');
      if(qvAdd && typeof qvAdd.addEventListener === 'function'){
        qvAdd.addEventListener('click', function(){
          const v = variant();
          if(!v || (v.stock !== undefined && v.stock <= 0)) return;
          SG.cart.add(p, v, 1);
          C.toast('Added ' + p.name + ' to your bag');
          C.badges();
          C.renderCart();
          C.closeAll();
          C.openCart();
        });
      }
    }).catch(function(err){
      console.error('Quick view error:', err);
      body.innerHTML = '<div class="empty-state"><p>We could not load that piece right now.</p><button type="button" class="btn btn--sm btn--outline" data-close-all>Close</button></div>';
    });
  }

  function handleCardAddToCart(pid, btn){
    if(!pid) return;
    const cleanId = decodeURIComponent(String(pid)).trim();
    if(btn) {
      btn.disabled = true;
      btn.classList.add('is-loading');
    }
    SG.api.get('/products/' + encodeURIComponent(cleanId)).then(function(data){
      const prod = data.product;
      if(!prod){
        C.toast('This piece is unavailable', 'error');
        if(btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
        return;
      }
      const variants = Array.isArray(prod.variants) && prod.variants.length > 0
        ? prod.variants
        : [{ id: 'v-default', size: 'Standard', color: 'Standard', stock: (prod.stock !== undefined ? prod.stock : 10) }];
      
      const inStock = variants.find(function(v){ return (v.stock || 0) > 0; }) || variants[0];
      if(inStock && (inStock.stock === undefined || inStock.stock > 0)){
        SG.cart.add(prod, inStock, 1);
        C.toast('Added ' + prod.name + ' to your bag');
        C.badges();
        C.renderCart();
        C.openCart();
      } else {
        C.toast(prod.name + ' is currently sold out', 'error');
        C.quickView(cleanId);
      }
      if(btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
    }).catch(function(err){
      console.error('Quick add error:', err);
      if(btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
      C.quickView(cleanId);
    });
  }

  C.openSearch = openSearch;
  C.runSearch = runSearch;
  C.quickView = quickView;
  C.handleCardAddToCart = handleCardAddToCart;
})();

(function(){
  const U = SG.UI;
  const C = SGChrome;
  const $ = C.$;
  const $$ = C.$$;
  let mounted = false;
  function refreshWish(){
    $$('[data-wish]').forEach(function(b){
      const on = SG.wish.has(b.getAttribute('data-wish'));
      b.classList.toggle('is-active', on);
    });
  }
  function mount(opt){
    opt = opt || {};
    const header = $('#siteHeader');
    const footer = $('#siteFooter');
    if(header) header.innerHTML = C.headerHtml();
    if(footer) footer.innerHTML = C.footerHtml();
    if(!$('#mobileNav')) document.body.insertAdjacentHTML('beforeend', C.mobileNavHtml(opt.page));
    if(!$('#cartDrawer')) document.body.insertAdjacentHTML('beforeend', C.overlaysHtml());
    if(mounted) return;
    mounted = true;
    const path = location.pathname;
    $$('.nav a, .mobile-nav__link[data-nav]').forEach(function(a){
      const href = a.getAttribute('href');
      const here = path === '/' ? '/' : path.replace(/\/index\.html$/, '/');
      if(href === here || (opt.page && a.getAttribute('data-page') === opt.page)) a.setAttribute('aria-current','page');
    });
    const items = $$('.announce__item');
    if(items.length > 1){
      let idx = 0;
      setInterval(function(){
        items[idx].classList.remove('is-active');
        idx = (idx + 1) % items.length;
        items[idx].classList.add('is-active');
      }, 4600);
    }
    document.addEventListener('click', function(e){
      const openCartBtn = e.target.closest('[data-cart-open]');
      const openSearchBtn = e.target.closest('[data-search-open]');
      const openMobile = e.target.closest('[data-mobile-open]');
      const closer = e.target.closest('[data-close-all]');
      const wishBtn = e.target.closest('[data-wish]');
      const quickBtn = e.target.closest('[data-quick]');
      const addCartBtn = e.target.closest('[data-add-cart]');
      const qtyBtn = e.target.closest('[data-qty]');
      const rmBtn = e.target.closest('[data-remove]');
      if(openCartBtn){ e.preventDefault(); C.openCart(); return; }
      if(openSearchBtn){ e.preventDefault(); C.openSearch(); return; }
      if(openMobile){ e.preventDefault(); C.openMenu(); return; }
      if(e.target.closest('[data-mobile-close]')){ e.preventDefault(); C.closeAll(); return; }
      if(e.target.closest('.mobile-nav a')){ C.closeAll(); return; }
      if(closer){ e.preventDefault(); C.closeAll(); return; }
      if(quickBtn){
        e.preventDefault();
        e.stopPropagation();
        C.quickView(quickBtn.getAttribute('data-quick'));
        return;
      }
      if(addCartBtn){
        e.preventDefault();
        e.stopPropagation();
        C.handleCardAddToCart(addCartBtn.getAttribute('data-add-cart'), addCartBtn);
        return;
      }
      if(wishBtn){
        e.preventDefault();
        const id = wishBtn.getAttribute('data-wish');
        const added = SG.wish.toggle(id);
        C.toast(added ? 'Saved to your wishlist' : 'Removed from wishlist');
        refreshWish();
        return;
      }
      if(qtyBtn){
        const line = qtyBtn.closest('[data-line]');
        if(!line) return;
        e.preventDefault();
        SG.cart.setQty(line.getAttribute('data-line'), parseInt(qtyBtn.getAttribute('data-qty'), 10));
        C.renderCart();
        C.badges();
        return;
      }
      if(rmBtn){
        e.preventDefault();
        SG.cart.remove(rmBtn.getAttribute('data-remove'));
        C.renderCart();
        C.badges();
        return;
      }
    });
    const input = $('#searchInput');
    if(input){
      input.addEventListener('input', function(){
        const q = input.value;
        clearTimeout(window.__sgSearch);
        window.__sgSearch = setTimeout(function(){ C.runSearch(q); }, 260);
      });
    }
    const searchForm = $('#searchForm');
    if(searchForm){
      searchForm.addEventListener('submit', function(e){
        e.preventDefault();
        const q = $('#searchInput').value.trim();
        window.location.href = '/shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    window.addEventListener('resize', function(){ if(window.innerWidth > 1080) C.closeAll(); });
      });
    }
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') C.closeAll();
    });
    window.addEventListener('sg:cart', function(){ C.badges(); C.renderCart(); refreshWish(); });
    window.addEventListener('sg:wish', function(){ C.badges(); refreshWish(); });
    C.badges();
    refreshWish();
    $$('.scrim, .modal__scrim, .drawer__scrim').forEach(function(s){ s.addEventListener('click', C.closeAll); });
    $$('[data-year]').forEach(function(n){ n.textContent = new Date().getFullYear(); });
  }
  SG.UI.mount = mount;
  SG.UI.toast = C.toast;
  SG.UI.openCart = C.openCart;
  SG.UI.refreshWish = refreshWish;
  window.alert = function(msg) { C.toast(String(msg || ''), 'info'); };
})();
