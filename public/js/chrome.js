(function(){
  const U = SG.UI;
  const NAV = [
    ['/shop.html?feature=new','New In','new'],
    ['/shop.html','Shop All','shop'],
    ['/shop.html?category=jeans','Denim','jeans'],
    ['/shop.html?category=gowns','Gowns','gowns'],
    ['/shop.html?category=up-and-down','Up & Down','updown'],
    ['/index.html#lookbook','Lookbook','lookbook'],
    ['/contact.html','Contact','contact']
  ];
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
    const links = NAV.map(function(n){
      const key = n[2];
      return '<a href="'+n[0]+'"'+(page===key?' aria-current="page"':'')+'>'+n[1]+'</a>';
    }).join('');
    return announceHtml()
      + '<header class="site-header" id="siteHeader"><div class="container header__inner">'
      + '<button class="icon-btn burger" type="button" data-mobile-open aria-label="Open menu">'+U.icon('menu',20)+'</button>'
      + '<a class="brand" href="/" aria-label="Star Gold Limited home">'+U.brandMark()+'</a>'
      + '<nav class="nav" aria-label="Primary">'+links+'</nav>'
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
      + '<div class="mobile-nav__foot">'
      + '<a class="btn btn--dark btn--block" href="/account.html">'+U.icon('user',16)+' My account</a>'
      + '<a class="btn btn--outline btn--block" href="https://wa.me/2348063494273" target="_blank" rel="noopener">'+U.icon('whatsapp',16)+' Chat with us</a>'
      + '</div></div></div>';
  }
  window.SGChrome = { headerHtml: headerHtml, mobileNavHtml: mobileNavHtml };
})();

(function(){
  const U = SG.UI;
  const WA = 'https://wa.me/2348063494273';
  const CATS = [['jeans','Denim'],['gowns','Gowns'],['shirts','Shirts'],['up-and-down','Up and Down'],['trousers','Trousers'],['caps','Caps'],['shoes','Shoes'],['bags','Bags']];
  function footerHtml(){
    const catLinks = CATS.map(function(c){ return '<li><a href="/shop.html?category='+c[0]+'">'+c[1]+'</a></li>'; }).join('');
    return '<footer class="site-footer"><div class="container"><div class="footer__grid">'
      + '<div class="footer__brand"><a class="brand" href="/">'+U.brandMark()+'</a>'
      + '<p>Luxury essentials curated in Lagos, sourced directly from Turkey and China. Clean lines, honest fabrics, delivered nationwide.</p>'
      + '<div class="footer__social">'
      + '<a href="https://wa.me/2348063494273" target="_blank" rel="noopener" aria-label="WhatsApp">'+U.icon('whatsapp',16)+'</a>'
      + '<a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">'+U.icon('instagram',16)+'</a>'
      + '<a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">'+U.icon('facebook',16)+'</a>'
      + '<a href="https://tiktok.com" target="_blank" rel="noopener" aria-label="TikTok">'+U.icon('tiktok',16)+'</a>'
      + '</div>'
      + '<div class="footer__contact">'
      + '<a href="tel:+2348063494273">'+U.icon('phone',14)+' +234 806 349 4273</a>'
      + '<a href="mailto:hello@stargoldlimited.com">'+U.icon('mail',14)+' hello@stargoldlimited.com</a>'
      + '<span>'+U.icon('map-pin',14)+' 14 Adeola Odeku Street, Victoria Island, Lagos</span>'
      + '<span>'+U.icon('clock',14)+' Mon to Sat, 9:00 to 18:00 WAT</span>'
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
        + '<a class="line-item__media" href="/product.html?p='+it.slug+'"><img src="'+it.image+'" alt="'+it.name+'"></a>'
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
          + '<span class="search-hit__img"><img src="'+p.images[0]+'" alt="'+p.name+'"></span>'
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
    body.innerHTML = '<p class="sum-note">Loading piece</p>';
    SG.api.get('/products/' + encodeURIComponent(slug)).then(function(data){
      const p = data.product;
      if(!p){ body.innerHTML = '<p class="sum-note">That piece is unavailable.</p>'; return; }
      const sizes = [];
      p.variants.forEach(function(v){ if(sizes.indexOf(v.size) < 0) sizes.push(v.size); });
      const colors = [];
      p.variants.forEach(function(v){ if(colors.indexOf(v.color) < 0) colors.push(v.color); });
      let size = sizes[0], color = colors[0];
      function variant(){
        return p.variants.find(function(v){ return v.size === size && v.color === color; }) || p.variants.find(function(v){ return v.size === size; }) || p.variants[0];
      }
      function paint(){
        const v = variant();
        const stock = v ? v.stock : 0;
        $('#qvStock').textContent = stock > 4 ? 'In stock, ready to ship' : stock > 0 ? 'Only ' + stock + ' left in this option' : 'Currently sold out in this option';
        $('#qvAdd').disabled = !stock;
        $('#qvAdd').textContent = stock ? 'Add to bag' : 'Sold out';
        body.querySelectorAll('[data-size]').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-size') === size); });
        body.querySelectorAll('[data-color]').forEach(function(b){ b.classList.toggle('is-active', b.getAttribute('data-color') === color); });
      }
      body.innerHTML = '<div class="quickview">'
        + '<div class="qv__media"><img src="'+p.images[0]+'" alt="'+p.name+'">'+(p.images[1]?'<img src="'+p.images[1]+'" alt="'+p.name+'">':'')+'</div>'
        + '<div class="qv__body"><p class="eyebrow">'+p.categoryLabel+'</p><h2>'+p.name+'</h2>'
        + '<p class="qv__price">'+U.money(p.price)+(p.compareAt?' <s>'+U.money(p.compareAt)+'</s>':'')+'</p>'
        + '<p class="qv__desc">'+p.description+'</p>'
        + '<div class="field"><span class="field__label">Size</span><div class="size-row">'+sizes.map(function(s){ return '<button type="button" class="size-chip" data-size="'+s+'">'+s+'</button>'; }).join('')+'</div></div>'
        + '<div class="field"><span class="field__label">Colour</span><div class="swatch-row">'+colors.map(function(c){ return '<button type="button" class="swatch" data-color="'+c+'" title="'+c+'" style="--sw:'+U.colorHex(c)+'"></button>'; }).join('')+'</div></div>'
        + '<p class="stock-note" id="qvStock"></p>'
        + '<div class="qv__actions"><button class="btn btn--dark" id="qvAdd" type="button">Add to bag</button><a class="btn btn--outline" href="/product.html?p='+p.slug+'">Full details</a></div>'
        + '<p class="secure-note">'+U.icon('truck',14)+' Delivery in 1 to 4 working days</p>'
        + '</div></div>';
      body.querySelectorAll('[data-size]').forEach(function(b){ b.addEventListener('click', function(){ size = b.getAttribute('data-size'); paint(); }); });
      body.querySelectorAll('[data-color]').forEach(function(b){ b.addEventListener('click', function(){ color = b.getAttribute('data-color'); paint(); }); });
      paint();
      $('#qvAdd').addEventListener('click', function(){
        const v = variant();
        if(!v || !v.stock) return;
        SG.cart.add(p, v, 1);
        C.toast('Added to your bag');
        C.badges();
        C.renderCart();
        C.openCart();
      });
    }).catch(function(){ body.innerHTML = '<p class="sum-note">We could not load that piece.</p>'; });
  }
  C.openSearch = openSearch;
  C.runSearch = runSearch;
  C.quickView = quickView;
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
      const qtyBtn = e.target.closest('[data-qty]');
      const rmBtn = e.target.closest('[data-remove]');
      if(openCartBtn){ e.preventDefault(); C.openCart(); return; }
      if(openSearchBtn){ e.preventDefault(); C.openSearch(); return; }
      if(openMobile){ e.preventDefault(); $('#mobileNav').classList.add('is-open'); document.body.classList.add('is-locked'); return; }
      if(closer){ e.preventDefault(); C.closeAll(); return; }
      if(quickBtn){ e.preventDefault(); C.quickView(quickBtn.getAttribute('data-quick')); return; }
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
})();
