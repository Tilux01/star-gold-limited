(function () {
  const API = "/api";
  const CART_KEY = "sg.cart.v1";
  const WISH_KEY = "sg.wish.v1";
  const AUTH_KEY = "sg.auth.v1";
  const PROMO_KEY = "sg.promo.v1";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const auth = {
    get() {
      return read(AUTH_KEY, null);
    },
    token() {
      const a = read(AUTH_KEY, null);
      return a && a.token ? a.token : null;
    },
    user() {
      const a = read(AUTH_KEY, null);
      return a && a.user ? a.user : null;
    },
    isAdmin() {
      const u = auth.user();
      return !!(u && u.role === "admin");
    },
    save(token, user) {
      write(AUTH_KEY, { token: token, user: user });
      emit("auth");
    },
    updateUser(user) {
      const a = auth.get() || {};
      write(AUTH_KEY, { token: a.token, user: user });
      emit("auth");
    },
    clear() {
      localStorage.removeItem(AUTH_KEY);
      emit("auth");
    }
  };

  const queryCache = new Map();
  const productCache = new Map();
  const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

  function clearCache(prefix) {
    if (!prefix) {
      queryCache.clear();
      productCache.clear();
      return;
    }
    for (const key of queryCache.keys()) {
      if (key.startsWith(prefix)) queryCache.delete(key);
    }
  }

  function saveProductToCache(p) {
    if (!p) return;
    if (p.id) {
      productCache.set(p.id, p);
      try { sessionStorage.setItem("sg.p." + p.id, JSON.stringify(p)); } catch (e) {}
    }
    if (p.slug) {
      productCache.set(p.slug, p);
      try { sessionStorage.setItem("sg.p." + p.slug, JSON.stringify(p)); } catch (e) {}
    }
  }

  function indexProducts(data) {
    if (!data) return;
    if (Array.isArray(data.products)) {
      data.products.forEach(saveProductToCache);
    } else if (data.product) {
      saveProductToCache(data.product);
    }
  }

  async function request(path, options) {
    const opts = options || {};
    const method = (opts.method || "GET").toUpperCase();
    const isGet = method === "GET";
    const useCache = isGet && !opts.noCache && !path.startsWith("/admin/");

    // Fast-path: single product lookup if already loaded in productCache
    if (useCache && path.startsWith("/products/") && !path.includes("?") && !path.includes("/lookbook")) {
      const pid = path.replace("/products/", "").trim();
      if (productCache.has(pid)) {
        return { product: productCache.get(pid) };
      }
    }

    // Check query cache
    if (useCache && queryCache.has(path)) {
      const entry = queryCache.get(path);
      if (Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.data;
      }
      queryCache.delete(path);
    }

    const headers = Object.assign({}, opts.headers || {});
    if (opts.body && !(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";
    const token = auth.token();
    if (token) headers.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch(API + path, {
        method: method,
        headers: headers,
        body: opts.body && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body
      });
    } catch (e) {
      throw new Error("Network error. Check your connection and try again.");
    }
    let data = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text };
      }
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || "Request failed.");
      err.status = res.status;
      err.details = data;
      if (res.status === 401 && auth.token()) auth.clear();
      throw err;
    }

    // Cache response and index entities
    if (useCache) {
      queryCache.set(path, { timestamp: Date.now(), data: data });
      indexProducts(data);
    } else if (!isGet) {
      // Invalidate cache on mutations (create, update, delete)
      clearCache();
    }

    return data;
  }

  const api = {
    get: (p, opts) => request(p, Object.assign({}, opts, { method: "GET" })),
    post: (p, b, opts) => request(p, Object.assign({}, opts, { method: "POST", body: b })),
    patch: (p, b, opts) => request(p, Object.assign({}, opts, { method: "PATCH", body: b })),
    del: (p, opts) => request(p, Object.assign({}, opts, { method: "DELETE" })),
    clearCache: clearCache,
    getCachedProduct: (idOrSlug) => {
      if (!idOrSlug) return null;
      const key = String(idOrSlug).trim();
      if (productCache.has(key)) return productCache.get(key);
      try {
        const raw = sessionStorage.getItem("sg.p." + key);
        if (raw) {
          const p = JSON.parse(raw);
          if (p && (p.id || p.slug)) {
            productCache.set(key, p);
            return p;
          }
        }
      } catch (e) {}
      return null;
    },
    setCachedProduct: saveProductToCache
  };

  function money(value) {
    const n = Number(value) || 0;
    return "\u20A6" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
  }
  function shortMoney(value) {
    const n = Number(value) || 0;
    if (n >= 1000000) return "\u20A6" + (n / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
    if (n >= 1000) return "\u20A6" + Math.round(n / 1000) + "k";
    return money(n);
  }
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent("sg:" + name, { detail: detail }));
  }
  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  const cart = {
    all() {
      return read(CART_KEY, []);
    },
    save(items) {
      write(CART_KEY, items);
      emit("cart");
    },
    key(item) {
      return item.productId + "::" + (item.variantId || "default");
    },
    add(product, variant, qty) {
      const items = cart.all();
      const entry = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: (product.images && product.images[0]) || "",
        variantId: variant ? variant.id : null,
        size: variant ? variant.size : product.size || "One Size",
        color: variant ? variant.color : product.color || "",
        qty: qty || 1
      };
      const idx = items.findIndex((i) => cart.key(i) === cart.key(entry));
      if (idx > -1) {
        items[idx].qty = Math.min(99, items[idx].qty + entry.qty);
        items[idx].price = entry.price;
        items[idx].image = entry.image;
      } else {
        items.push(entry);
      }
      cart.save(items);
      return items;
    },
    setQty(key, qty) {
      const items = cart.all();
      const idx = items.findIndex((i) => cart.key(i) === key);
      if (idx > -1) {
        if (qty <= 0) items.splice(idx, 1);
        else items[idx].qty = Math.min(99, qty);
        cart.save(items);
      }
    },
    remove(key) {
      cart.save(cart.all().filter((i) => cart.key(i) !== key));
    },
    clear() {
      cart.save([]);
      localStorage.removeItem(PROMO_KEY);
    },
    count() {
      return cart.all().reduce((n, i) => n + i.qty, 0);
    },
    subtotal() {
      return cart.all().reduce((n, i) => n + i.price * i.qty, 0);
    },
    promo() {
      return read(PROMO_KEY, null);
    },
    setPromo(code) {
      write(PROMO_KEY, code);
      emit("cart");
    }
  };

  const wish = {
    all() {
      return read(WISH_KEY, []);
    },
    has(id) {
      return wish.all().indexOf(id) > -1;
    },
    toggle(id) {
      const list = wish.all();
      const idx = list.indexOf(id);
      if (idx > -1) list.splice(idx, 1);
      else list.push(id);
      write(WISH_KEY, list);
      emit("wish");
      return idx === -1;
    },
    count() {
      return wish.all().length;
    }
  };


  const BIZ = {
    name: "Star Gold Limited",
    slogan: "Dealers In All Kinds Of Luxury Wears, Shoes and Bags",
    address: "Shop GF09/FF27, 11 Breadfruit Street, Ajao Plaza, Balogun, Lagos Island, Lagos",
    addressLine: "11 Breadfruit Street, Ajao Plaza, Balogun, Lagos Island",
    shop: "Shop GF09/FF27",
    phone: "08063494273",
    phone2: "08033876440",
    phonePretty: "0806 349 4273",
    phone2Pretty: "0803 387 6440",
    phonePrimary: "0806 349 4273",
    phoneSecondary: "0803 387 6440",
    whatsapp: "2348063494273",
    email: "igbokweify390@yahoo.com",
    instagram: "https://instagram.com/stargold_collection",
    instagramHandle: "@star gold_collection",
    hours: "Monday to Saturday, 10:00 to 19:00 WAT"
  };
  window.SG = { BIZ, api, auth, cart, wish, money, shortMoney, formatDate, formatDateTime, emit, debounce, escapeHtml, qs };
})();
SG.CATS = null;
SG.config = function () {
  if (SG._cfg) return SG._cfg;
  SG._cfg = fetch("/api/config").then(function (r) { return r.json(); }).then(function (d) {
    if (d.categories && d.categories.length) { SG.CATS = d.categories.map(function (c) { return [c.slug, c.label]; }); }
    SG.CONFIG = d;
    if (SG.UI && SG.UI.mount) { SG.UI.mount(); }
    document.dispatchEvent(new Event("sg:config"));
    return d;
  }).catch(function () { return null; });
  return SG._cfg;
};
document.addEventListener("DOMContentLoaded", function () { SG.config(); });
