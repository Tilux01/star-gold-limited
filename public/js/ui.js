(function(){
  const U = {};
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<path d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="12" cy="7" r="4"/>',
    heart: '<path d="M20.8 5.6a5.4 5.4 0 0 0-7.7 0L12 6.7l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7l8.8 8.8 8.8-8.8a5.4 5.4 0 0 0 0-7.7z"/>',
    bag: '<path d="M6 7h12l1.2 13H4.8L6 7z"/><path d="M9 7V5.5a3 3 0 0 1 6 0V7"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    star: '<path d="m12 3.5 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.8l6-.8z"/>',
    truck: '<path d="M2 7h11v10H2zM13 10h5l3 3v4h-8"/><circle cx="6" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8"/><path d="M20 4v4h-4"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16"/><path d="M4 20v-4h4"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
    package: '<path d="M12 3 4 7v10l8 4 8-4V7l-8-4z"/><path d="M4 7l8 4 8-4M12 21V11"/>',
    users: '<path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="7" r="3.5"/><path d="M17 4.5a3.5 3.5 0 0 1 0 7M21 20v-1a4 4 0 0 0-3-3.8"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    tag: '<path d="M3 12V4h8l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    logout: '<path d="M10 20H5V4h5M15 8l4 4-4 4M9 12h10"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4z"/><path d="m14 6 4 4"/>',
    upload: '<path d="M12 17V5M7 10l5-5 5 5"/><path d="M4 19h16"/>',
    trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M21 7h-5v5"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone: '<path d="M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2A2 2 0 0 1 6 3z"/>',
    pin: '<path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    'map-pin': '<path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8.5 11h5M11 8.5v5"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>'
  };
  const F = {
    whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.3 14c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1a11 11 0 0 1-4.4-2.9 10 10 0 0 1-2-3.2c-.2-.7 0-1.3.3-1.7l.6-.7c.2-.2.4-.2.6-.2h.4c.2 0 .3 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4-.3.3c-.1.1-.1.3 0 .4.4.7 1 1.4 1.6 1.9.6.4 1.1.7 1.4.8.2.1.3 0 .4-.1l.5-.6c.1-.2.3-.2.4-.1l1.6.8c.2.1.3.2.3.3 0 .2 0 .7-.3 1.2z"/>',
    instagram: '<path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5zm0 7.3A2.8 2.8 0 1 1 14.8 12 2.8 2.8 0 0 1 12 14.8zM17.8 5a1.2 1.2 0 1 0 1.2 1.2A1.2 1.2 0 0 0 17.8 5z"/>',
    facebook: '<path d="M14 9h3V5.5h-3A4.5 4.5 0 0 0 9.5 10v2H7v3.5h2.5V22H13v-6.5h3l.5-3.5H13v-1.6c0-.6.4-.9 1-.9z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
    play: '<path d="M7 4l12 8-12 8z"/>',
    tiktok: '<path d="M16.5 3h-3v11.2a2.6 2.6 0 1 1-2.2-2.6V8.5a6 6 0 1 0 5.2 5.9V9.1a6.6 6.6 0 0 0 3.5 1V7a3.6 3.6 0 0 1-3.5-4z"/>'
  };
  U.icon = function(name, size, cls){
    const s = size || 20;
    if (F[name]) return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"'+(cls?' class="'+cls+'"':'')+'>'+F[name]+'</svg>';
    return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(cls?' class="'+cls+'"':'')+'>'+(P[name]||'')+'</svg>';
  };
  const star = U.icon('star', 13, '');
  U.stars = function(rating){
    const r = Math.round(Number(rating) || 0);
    return '<span class="quote__stars">' + Array.from({length:5},(_,i)=>'<span style="opacity:'+(i<r?1:.25)+'">'+star+'</span>').join('') + '</span>';
  };
  U.swatchColor = function(name){
    const map = {
      Black:'#111111',Charcoal:'#33343A',Grey:'#9A9A96',Silver:'#C9C9C9',White:'#FAFAF8',
      Ivory:'#EFE7D6',Cream:'#F2E9D8',Ecru:'#DCD0BB',Stone:'#CDC5B6',Sand:'#D8C3A5',
      Camel:'#B08A5A',Tan:'#C29A6B',Chocolate:'#4A3626',Espresso:'#2B2118',Burgundy:'#5C2230',
      Navy:'#1C2A44',Blue:'#3A5A86',Indigo:'#33445F',Denim:'#4C6383',Olive:'#5A5B45',
      Green:'#3F5B4E',Gold:'#C6A15B',Rose:'#C99C9C',Pink:'#E2B4B8',Red:'#A5302F'
    };
    return map[name] || '#1B4DE4';
  };
  U.colorHex = U.swatchColor;
  U.money = function(v){
    return '\u20A6' + Number(v || 0).toLocaleString('en-NG', {maximumFractionDigits:0});
  };
  U.badges = function(p){
    const out = [];
    if (p.compareAt && p.compareAt > p.price) out.push('<span class="badge badge--sale">Sale</span>');
    if (p.isNew) out.push('<span class="badge badge--gold">New</span>');
    if (p.bestSeller) out.push('<span class="badge">Best seller</span>');
    if (p.badge) out.push('<span class="badge badge--soft">'+p.badge+'</span>');
    return out.join('');
  };
  U.card = function(p){
    const pid = String(p.slug || p.id || '');
    const img = (Array.isArray(p.images) && p.images[0]) || '/assets/placeholder.svg';
    const alt = (Array.isArray(p.images) && p.images[1]) || img;
    const inWish = SG.wish.has(p.id);
    const low = (p.stock || 0) <= 6 && (p.stock || 0) > 0;
    const hasStock = (p.stock === undefined || p.stock > 0) || (Array.isArray(p.variants) && p.variants.some(function(v){ return (v.stock || 0) > 0; }));
    const colors = (p.colors || []).slice(0,5).map(function(c){
      return '<span class="swatch" style="background:'+U.swatchColor(c)+'" title="'+c+'"></span>';
    }).join('');
    const catLabel = p.categoryLabel || p.category || 'Collection';
    const originLabel = p.origin ? ' &middot; ' + p.origin : '';
    return '<article class="card" data-card-id="'+p.id+'">'
      + '<div class="card__visual">'
      + '<a class="card__media" href="/product.html?p='+encodeURIComponent(pid)+'" aria-label="'+p.name+'">'
      + '<img src="'+img+'" alt="'+p.name+'" loading="lazy" decoding="async">'
      + '<img class="card__img--alt" src="'+alt+'" alt="" loading="lazy" decoding="async">'
      + '</a>'
      + '<div class="card__badges">'+U.badges(p)+'</div>'
      + '<button class="card__wish'+(inWish?' is-active':'')+'" data-wish="'+p.id+'" aria-label="Save '+p.name+'">'+U.icon('heart',15)+'</button>'
      + (low ? '<span class="card__stock">Only '+p.stock+' left</span>' : '')
      + '<div class="card__actions">'
      + '<button type="button" class="card__btn card__btn--quick" data-quick="'+pid+'" aria-label="Quick view '+p.name+'">'+U.icon('eye',13)+'<span>Quick view</span></button>'
      + '<button type="button" class="card__btn card__btn--add" data-add-cart="'+pid+'" aria-label="Add '+p.name+' to cart"'+(hasStock?'':' disabled')+'>'+U.icon('bag',13)+'<span>'+(hasStock?'Add to cart':'Sold out')+'</span></button>'
      + '</div>'
      + '</div>'
      + '<div class="card__body">'
      + '<span class="card__cat">'+catLabel+originLabel+'</span>'
      + '<h3 class="card__name"><a href="/product.html?p='+encodeURIComponent(pid)+'">'+p.name+'</a></h3>'
      + '<div class="card__meta"><span class="card__price">'+U.money(p.price)+'</span>'
      + (p.compareAt && p.compareAt > p.price ? '<span class="card__was">'+U.money(p.compareAt)+'</span>' : '')
      + '<span class="card__rating">'+star+(p.rating || 5).toFixed(1)+'</span></div>'
      + (colors ? '<div class="card__swatches">'+colors+'</div>' : '')
      + '</div></article>';
  };
  U.skeletonGrid = function(n){
    return Array.from({length:n||4}, function(){ return '<div class="card"><div class="card__media skeleton"></div><div class="card__body"><span class="skeleton skeleton--line"></span><span class="skeleton skeleton--line skeleton--short"></span></div></div>'; }).join('');
  };
  U.brandMark = function(){
    return '<span class="brand__mark"><img class="brand__logo-img" src="/assets/logo.png" alt="Star Gold Limited" width="36" height="32"></span><span class="brand__text"><span class="brand__name">Star Gold</span><span class="brand__sub">Limited</span></span>';
  };
  U.status = function(s){ return ({ pending: 'Awaiting payment', paid: 'Paid', processing: 'Processing', shipped: 'Dispatched', delivered: 'Delivered', cancelled: 'Cancelled' })[s] || String(s || ''); };
  window.SG = window.SG || {};
  SG.UI = U;
})();
