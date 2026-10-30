(function () {
  const esc = SG.escapeHtml;
  const money = SG.money;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const icon = (n, s) => (SG.UI && SG.UI.icon ? SG.UI.icon(n, s || 16) : "");
  const g = (p) => SG.api.get(p);
  const po = (p, b) => SG.api.post(p, b);
  const pa = (p, b) => SG.api.patch(p, b);
  const de = (p) => SG.api.del(p);
  const STATUS = [["pending", "Pending"], ["paid", "Paid"], ["processing", "Processing"], ["shipped", "Shipped"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
  const S = {
    tab: "overview",
    prod: [],
    cats: [],
    ord: [],
    cust: [],
    media: [],
    promos: [],
    subs: [],
    msgs: [],
    cfg: {},
    sum: null,
    imgs: [],
    vid: "",
    vars: [],
    edit: null,
    cur: null,
    q: { p: "", cat: "", st: "", o: "", c: "" },
    page: { p: 1, o: 1, c: 1, m: 1 },
    pageSize: { p: 12, o: 12, c: 15, m: 18 }
  };
  const stLabel = (k) => (STATUS.find((x) => x[0] === k) || [k, k])[1];
  const stSel = (v, act, id) => '<select class="mini" data-act="' + act + '" data-id="' + (id || "") + '">' + STATUS.map((o) => '<option value="' + o[0] + '"' + (o[0] === v ? " selected" : "") + ">" + o[1] + "</option>").join("") + "</select>";
  const img = (f) => (!f ? "" : /^(https?:|\/|data:)/.test(f) ? f : "/assets/catalog/" + f);
  const thumbUrl = (url, size) => {
    if (!url || typeof url !== "string") return "";
    if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
      const s = size || 100;
      if (!/\/upload\/[^/]*[wq]_[^/]+\//.test(url)) {
        return url.replace("/upload/", "/upload/f_auto,q_auto,w_" + s + ",h_" + s + ",c_fill/");
      }
    }
    return url;
  };
  const CTH = '<thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last order</th></tr></thead><tbody>';
  const when = (v) => { if (!v) return "n/a"; try { return SG.formatDateTime(v); } catch (e) { return String(v).slice(0, 10); } };
  function toast(msg, bad) {
    let t = $("#toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.removeAttribute("hidden");
    t.hidden = false;
    t.textContent = msg;
    t.classList.toggle("is-bad", !!bad);
    t.classList.add("is-on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      t.classList.remove("is-on");
    }, 3500);
  }
  function fail(err) {
    console.error("Admin error:", err);
    const msg = (err && (err.message || (err.details && err.details.error))) || "Something went wrong. Please try again.";
    toast(msg, true);
  }

  function confirmDialog(message, options) {
    const opts = options || {};
    return new Promise((resolve) => {
      const modal = $("#confirmModal");
      const msgEl = $("#confirmMessage");
      const titleEl = $("#confirmTitle");
      const okBtn = $("#confirmOkBtn");
      const cancelBtn = $("#confirmCancelBtn");
      const backEl = $("#confirmBack");

      if (!modal || !okBtn || !cancelBtn) {
        resolve(true);
        return;
      }

      if (msgEl) msgEl.textContent = message || "Are you sure you want to proceed?";
      if (titleEl) titleEl.textContent = opts.title || "Confirm action";
      if (okBtn) {
        okBtn.textContent = opts.confirmText || "Confirm";
        okBtn.className = opts.danger !== false ? "btn btn-danger" : "btn btn-gold";
      }

      modal.hidden = false;

      function done(val) {
        modal.hidden = true;
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        if (backEl) backEl.removeEventListener("click", onCancel);
        resolve(val);
      }
      function onOk() { done(true); }
      function onCancel() { done(false); }

      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      if (backEl) backEl.addEventListener("click", onCancel);
    });
  }

  window.alert = (msg) => toast(String(msg || ""), true);
  window.confirm = (msg) => { console.warn("Native confirm blocked; use confirmDialog:", msg); return false; };
  function renderPaging(navId, countId, totalItems, pageSize, currentPage, onPage) {
    const nav = $(navId);
    const count = $(countId);
    if (!nav) return;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    if (count) {
      count.textContent = totalItems > 0 ? 'Showing ' + start + '–' + end + ' of ' + totalItems : '0 items';
    }

    if (totalPages <= 1) {
      nav.innerHTML = '';
      return;
    }

    let html = '';
    html += '<button type="button" class="page-btn"' + (currentPage === 1 ? ' disabled' : '') + ' data-pg="' + (currentPage - 1) + '">&larr; Prev</button>';
    for (let i = 1; i <= totalPages; i++) {
      if (totalPages <= 7 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        html += '<button type="button" class="page-btn' + (i === currentPage ? ' is-active' : '') + '" data-pg="' + i + '">' + i + '</button>';
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += '<span class="muted" style="padding:0 4px">&hellip;</span>';
      }
    }
    html += '<button type="button" class="page-btn"' + (currentPage === totalPages ? ' disabled' : '') + ' data-pg="' + (currentPage + 1) + '">Next &rarr;</button>';
    nav.innerHTML = html;
    nav.querySelectorAll('[data-pg]').forEach((b) => {
      b.addEventListener('click', () => {
        const next = Number(b.dataset.pg);
        if (next >= 1 && next <= totalPages && next !== currentPage) {
          onPage(next);
        }
      });
    });
  }
  async function run(fn) {
    try { return await fn(); } catch (err) { fail(err); return null; }
  }
  function openDrawer(name) {
    const clean = String(name || "").replace(/^#/, "").replace(/Drawer$/, "");
    const el = $("#" + clean + "Drawer");
    if (el) {
      el.hidden = false;
      el.removeAttribute("hidden");
      el.style.display = "flex";
      document.body.classList.add("adm-locked");
    }
  }
  function closeDrawer(name) {
    const clean = String(name || "").replace(/^#/, "").replace(/Drawer$/, "");
    const el = $("#" + clean + "Drawer");
    if (el) {
      el.hidden = true;
      el.setAttribute("hidden", "");
      el.style.display = "none";
    }
    if (!$$(".adm-drawer:not([hidden])").some((d) => d.style.display !== "none")) {
      document.body.classList.remove("adm-locked");
    }
  }
  function closeDrawers() {
    $$(".adm-drawer").forEach((d) => {
      d.hidden = true;
      d.setAttribute("hidden", "");
      d.style.display = "none";
    });
    document.body.classList.remove("adm-locked");
  }
  function drawerFor(el) { return el.closest(".adm-drawer"); }
  function isAdmin(user) { return !!user && (user.role === "admin" || user.isAdmin === true); }
  function showGate(message) {
    $("#adminGate").hidden = false;
    $("#adminShell").hidden = true;
    $("#gateError").textContent = message || "";
  }
  function showShell() {
    $("#adminGate").hidden = true;
    $("#adminShell").hidden = false;
    if (!S.cats.length) loadCats();
    setTab(S.tab || "overview");
  }
  const LOADERS = {overview:()=>loadSummary(),products:()=>{if(!S.cats.length)loadCats();loadProducts()},categories:()=>loadCats(),orders:()=>loadOrders(),customers:()=>loadCustomers(),media:()=>loadMedia(),promos:()=>loadPromos(),messages:()=>loadMessages(),subscribers:()=>loadSubs(),settings:()=>loadSettings()};
  function setTab(name) {
    S.tab = name;
    $$("[data-tab]").forEach((a) => a.classList.toggle("is-active", a.dataset.tab === name));
    $$("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== name; });
    $("#adminShell").classList.remove("nav-open");
    const tt = $("#tabTitle"); if (tt) tt.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    if (LOADERS[name]) run(LOADERS[name]);
    $("#adminScroll").scrollTop = 0;
    const side = $("#adminSide"); if (side) side.scrollTop = 0;
    const sNav = $("#sideNav"); if (sNav) sNav.scrollTop = 0;
  }
  async function loadSummary() {
    const data = await g("/admin/summary");
    S.sum = data;
    drawSummary(data);
  }
  function stat(label, value, note) {
    return '<div class="stat"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong><em>' + esc(note || "") + '</em></div>';
  }
  function drawSummary(d) {
    const cards = [
      stat("Revenue", money(d.revenue || 0), (d.paidOrders || 0) + " paid orders"),
      stat("Orders", String(d.totalOrders || 0), (d.pending || 0) + " awaiting payment"),
      stat("Customers", String(d.customers || 0), (d.subscribers || 0) + " subscribers"),
      stat("Products", String(d.products || 0), (d.hidden || 0) + " hidden")
    ];
    $("#statGrid").innerHTML = cards.join("");
    const series = d.series || [];
    const top = Math.max(1, ...series.map((row) => Number(row.revenue || 0)));
    $("#revenueChart").innerHTML = series.map((row) => {
      const height = Math.round((Number(row.revenue || 0) / top) * 100);
      return '<div class="bar"><div class="bar-fill" style="height:' + Math.max(4, height) + '%"></div><small>' + esc(row.label) + '</small></div>';
    }).join("");
    const low = d.low || [];
    $("#lowStockList").innerHTML = low.length ? low.map((row) => (
      '<div class="list-row"><span class="grow"><strong>' + esc(row.name) + '</strong><small>' + esc(row.category) + '</small></span><b>' + esc(row.stock) + ' left</b></div>'
    )).join("") : '<div class="empty">Stock levels are healthy.</div>';
    const recent = d.recent || [];
    $("#recentOrders").innerHTML = '<thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody>' + (recent.length ? recent.map((row) => (
      '<tr><td><strong>' + esc(row.number || row.id) + '</strong></td><td>' + esc((row.customer && row.customer.name) || "Guest") + '</td><td><span class="pill ' + esc(row.status) + '">' + esc(stLabel(row.status)) + '</span></td><td>' + money(row.total || 0) + '</td></tr>'
    )).join("") : '<tr><td colspan="4"><div class="empty">No orders yet.</div></td></tr>') + '</tbody>';
    const topRows = d.top || [];
    $("#bestList").innerHTML = topRows.length ? topRows.map((row) => (
      '<div class="list-row"><span class="grow"><strong>' + esc(row.name) + '</strong><small>' + esc(row.units) + ' sold</small></span><b>' + money(row.revenue || 0) + '</b></div>'
    )).join("") : '<div class="empty">Sales will appear here.</div>';
  }

  async function loadProducts() {
    const data = await g("/admin/products");
    S.prod = data.products || [];
    fillCategorySelects();
    renderProducts();
  }

  function fillCategorySelects() {
    const opts = S.cats.filter((c) => c.active !== false).map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
    const filter = $("#prodCatFilter");
    const picker = $("#productCat");
    if (filter) filter.innerHTML = '<option value="">All categories</option>' + opts;
    if (picker) picker.innerHTML = opts;
  }

  function renderProducts() {
    const q = S.q.p.toLowerCase(), cat = S.q.cat, state = S.q.st;
    const rows = S.prod.filter((row) => {
      const hay = (row.name + " " + row.category + " " + row.badge + " " + row.id).toLowerCase();
      if (q && hay.indexOf(q) < 0) return false;
      if (cat && row.category !== cat) return false;
      if (state === "live" && row.active === false) return false;
      if (state === "hidden" && row.active !== false) return false;
      if (state === "low" && Number(row.stock || 0) > 4) return false;
      return true;
    });
    const page = S.page.p || 1;
    const size = S.pageSize.p || 12;
    const paged = rows.slice((page - 1) * size, page * size);

    $("#productTable").innerHTML = '<thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th><th></th></tr></thead>'
      + '<tbody>' + (paged.length ? paged.map((row) => {
        return '<tr><td><div class="cell-prod"><span class="thumb">' + (row.images && row.images[0] ? '<img src="' + esc(thumbUrl(row.images[0], 96)) + '" alt="" loading="lazy" decoding="async">' : '') + '</span><span class="grow"><strong>' + esc(row.name) + '</strong><small>' + esc(row.id) + '</small></span></div></td><td>' + esc(row.category || "") + '</td><td><strong>' + money(row.price) + '</strong></td><td>' + Number(row.stock || 0) + '</td><td><button class="pill' + (row.active === false ? '' : ' pill-live') + '" data-act="toggle" data-id="' + esc(row.id) + '">' + (row.active === false ? 'Hidden' : 'Live') + '</button></td><td class="row-actions"><button class="icon-btn" data-act="edit" data-id="' + esc(row.id) + '">' + icon("edit") + '</button><button class="icon-btn" data-act="dup" data-id="' + esc(row.id) + '">' + icon("copy") + '</button><button class="icon-btn" data-act="del" data-id="' + esc(row.id) + '">' + icon("trash") + '</button></td></tr>';
      }).join("") : '<tr><td colspan="6"><div class="empty">No products match this filter.</div></td></tr>') + '</tbody>';

    renderPaging("#prodPagination", "#prodCount", rows.length, size, page, (nextPage) => {
      S.page.p = nextPage;
      renderProducts();
    });
  }
  function fillProdCats() {
    const sel = $("#prodCatFilter");
    sel.innerHTML = '<option value="">All categories</option>' + S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
    const form = $("#productCat");
    form.innerHTML = S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
  }

  function prodById(id) {
    if (!id) return null;
    const s = String(id).trim();
    return S.prod.find((row) => String(row.id).trim() === s || String(row.slug || "").trim() === s) || null;
  }

  async function openProduct(rowOrId) {
    let row = (typeof rowOrId === "object" && rowOrId !== null)
      ? rowOrId
      : prodById(rowOrId);
    if (!row && rowOrId) {
      try {
        const cleanId = String(rowOrId).trim();
        const data = await g("/admin/products");
        if (data && Array.isArray(data.products)) {
          S.prod = data.products;
          row = prodById(cleanId);
        }
      } catch (e) {
        console.warn("Fallback product fetch failed:", e);
      }
    }
    if (!row && rowOrId) {
      toast("Product not found", true);
      return;
    }
    const form = $("#productForm");
    form.reset();
    S.edit = row ? row.id : null;
    if (form.elements.id) form.elements.id.value = row ? row.id : "";
    S.imgs = row && Array.isArray(row.images) ? row.images.slice() : [];
    S.vid = row && row.video ? row.video : "";
    S.vars = row && Array.isArray(row.variants) ? row.variants.map((v) => ({ size: v.size || "One Size", color: v.color || "", stock: Number(v.stock || 0) })) : [];
    $("#drawerTitle").textContent = row ? "Edit product" : "New product";
    $("#drawerSub").textContent = row ? (row.name || row.id) : "Fill the details, upload media and publish";
    const btn = $("#saveProduct");
    if (btn) btn.textContent = row ? "Update product" : "Save product";
    form.elements.name.value = row ? row.name || "" : "";

    if (row && row.category) {
      const picker = $("#productCat");
      if (picker && !picker.querySelector('option[value="' + esc(row.category) + '"]')) {
        const opt = document.createElement("option");
        opt.value = row.category;
        opt.textContent = row.categoryLabel || row.category;
        picker.appendChild(opt);
      }
    }
    form.elements.category.value = row ? row.category || "" : (S.cats[0] ? S.cats[0].slug : "");
    form.elements.price.value = row ? row.price || 0 : "";
    form.elements.compareAt.value = row && row.compareAt ? row.compareAt : "";
    form.elements.stock.value = row ? row.stock || 0 : 0;
    form.elements.badge.value = row ? row.badge || "" : "";
    form.elements.description.value = row ? row.description || "" : "";
    form.elements.details.value = row && Array.isArray(row.details) ? row.details.join("\n") : (row && row.details ? String(row.details) : "");
    form.elements.material.value = row ? row.material || "" : "";
    form.elements.origin.value = row ? row.origin || "" : "";
    form.elements.rating.value = row ? row.rating || 4.8 : 4.8;
    form.elements.featured.checked = row ? !!row.featured : false;
    form.elements.active.checked = row ? row.active !== false : true;
    if (form.elements.mediaUrl) form.elements.mediaUrl.value = "";
    if (!S.cats.length) loadCats().then(() => {
      if (row && row.category) form.elements.category.value = row.category;
    });
    renderImgs();
    renderVars();
    renderVid();
    openDrawer("product");
  }
  function renderImgs() {
    $("#imageThumbs").innerHTML = S.imgs.length ? S.imgs.map((src, i) => '<figure class="thumb-item"><img src="' + esc(thumbUrl(src, 120)) + '" alt=""><button type="button" data-act="img-del" data-i="' + i + '">' + icon("x", 14) + '</button></figure>').join("") : '<p class="muted small">No images yet. Upload files or paste a URL below.</p>';
    $("#productForm").elements.images.value = JSON.stringify(S.imgs);
  }

  function renderVid() {
    $("#videoPreview").innerHTML = S.vid ? '<video src="' + esc(S.vid) + '" controls playsinline></video><button type="button" class="btn btn-ghost btn-sm" data-act="vid-del">Remove video</button>' : '<p class="muted small">No product video. Upload an MP4 or paste a link.</p>';
    $("#productForm").elements.video.value = S.vid;
  }

  function renderVars() {
    $("#variantRows").innerHTML = S.vars.map((v, i) => '<div class="var-row"><input data-var="size" data-i="' + i + '" value="' + esc(v.size) + '" placeholder="Size"><input data-var="color" data-i="' + i + '" value="' + esc(v.color) + '" placeholder="Colour"><input data-var="stock" data-i="' + i + '" type="number" min="0" value="' + Number(v.stock || 0) + '"><button type="button" class="icon-btn" data-act="var-del" data-i="' + i + '">' + icon("x", 14) + '</button></div>').join("") || '<p class="muted small">No variants. Stock will be used as the single total.</p>';
    if (!$("#productForm").elements.stock.value) $("#productForm").elements.stock.value = S.vars.reduce((n, v) => n + Number(v.stock || 0), 0);
  }
  function openNew() {
    openProduct(null);
  }
  function addImgs(list) {
    list.forEach((src) => {
      if (src && S.imgs.indexOf(src) < 0) S.imgs.push(src);
    });
    $("#productForm").elements.images.value = JSON.stringify(S.imgs);
    renderImgs();
  }
  function dropImg(i) {
    S.imgs.splice(i, 1);
    $("#productForm").elements.images.value = JSON.stringify(S.imgs);
    renderImgs();
  }
  async function uploadFiles(files, kind) {
    const list = Array.from(files || []);
    if (!list.length) return [];
    const fd = new FormData();
    list.forEach((file) => fd.append("files", file));
    fd.append("kind", kind || "image");
    toast("Uploading " + list.length + " file" + (list.length > 1 ? "s" : "") + "...");
    const data = await po("/admin/upload", fd);
    return data.assets || [];
  }
  async function pickImages(files) {
    try {
      const assets = await uploadFiles(files, "image");
      addImgs(assets.map((a) => a.url));
      toast(assets.length + " image" + (assets.length > 1 ? "s" : "") + " added");
    } catch (err) { fail(err); }
  }
  async function pickVideo(files) {
    try {
      const assets = await uploadFiles(files, "video");
      const hit = assets.find((a) => a.kind === "video") || assets[0];
      if (!hit) return;
      S.vid = hit.url;
      renderVid();
      toast("Video attached");
    } catch (err) { fail(err); }
  }
  async function saveProduct(event) {
    if (event) event.preventDefault();
    const form = $("#productForm");
    const btn = $("#saveProduct");

    // Read variants directly from live DOM inputs
    const varRows = $$("#variantRows .var-row");
    const domVars = Array.from(varRows).map((row) => {
      const sizeInput = row.querySelector("[data-var='size']");
      const colorInput = row.querySelector("[data-var='color']");
      const stockInput = row.querySelector("[data-var='stock']");
      return {
        size: sizeInput ? sizeInput.value.trim() : "",
        color: colorInput ? colorInput.value.trim() : "",
        stock: stockInput ? Number(stockInput.value || 0) : 0
      };
    }).filter((v) => v.size || v.color);

    // Check if user entered a media URL
    const mediaUrl = form.elements.mediaUrl ? form.elements.mediaUrl.value.trim() : "";
    if (mediaUrl) {
      if (/\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl)) {
        if (!S.vid) S.vid = mediaUrl;
      } else if (!S.imgs.includes(mediaUrl)) {
        S.imgs.push(mediaUrl);
      }
    }

    const body = {
      name: form.elements.name.value.trim(),
      category: form.elements.category.value,
      price: Number(form.elements.price.value || 0),
      compareAt: Number(form.elements.compareAt.value || 0),
      stock: Number(form.elements.stock.value || 0),
      badge: form.elements.badge.value.trim(),
      description: form.elements.description.value.trim(),
      details: form.elements.details.value,
      material: form.elements.material.value.trim(),
      origin: form.elements.origin.value.trim(),
      rating: Number(form.elements.rating.value || 0),
      featured: form.elements.featured.checked,
      active: form.elements.active.checked,
      images: S.imgs.slice(),
      video: S.vid,
      variants: domVars.length ? domVars : S.vars.filter((v) => v.size || v.color)
    };
    const editId = S.edit || (form.elements.id ? form.elements.id.value.trim() : null);
    if (!body.name || !body.price) return toast("Name and price are required", true);
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    }
    try {
      if (editId) {
        await pa("/admin/products/" + encodeURIComponent(editId), body);
        toast("Product updated successfully");
      } else {
        await po("/admin/products", body);
        toast("Product created successfully");
      }
      closeDrawers();
      await loadProducts();
      await loadSummary();
    } catch (err) { fail(err); }
    finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn.innerHTML = editId ? "Update product" : "Save product";
      }
    }
  }
  async function dupProduct(id) {
    try {
      await po("/admin/products/" + encodeURIComponent(id) + "/duplicate", {});
      await loadProducts();
      toast("Product duplicated");
    } catch (err) { fail(err); }
  }

  async function delProduct(id) {
    if (!(await confirmDialog("Delete this product permanently? This action cannot be undone.", { title: "Delete Product", confirmText: "Delete" }))) return;
    try {
      await de("/admin/products/" + encodeURIComponent(id));
      await loadProducts();
      await loadSummary();
      toast("Product deleted");
    } catch (err) { fail(err); }
  }

  async function toggleProduct(id) {
    try {
      await pa("/admin/products/" + encodeURIComponent(id) + "/toggle", {});
      await loadProducts();
      toast("Visibility updated");
    } catch (err) { fail(err); }
  }

  async function loadCats() {
    try {
      S.cats = (await g("/admin/categories")).categories || [];
    } catch (err) { fail(err); return; }
    renderCats();
    renderProdCats();
  }

  function renderProdCats() {
    const sel = $("#productCat");
    if (sel) sel.innerHTML = S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
    const filter = $("#prodCatFilter");
    if (filter) filter.innerHTML = '<option value="">All categories</option>' + S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
  }

  function renderCats() {
    const table = $("#categoryTable");
    if (!table) return;
    if (!S.cats.length) {
      table.innerHTML = '<tbody><tr><td class="muted">No categories yet. Add your first one on the left.</td></tr></tbody>';
      return;
    }
    table.innerHTML = '<thead><tr><th>Order</th><th>Category</th><th>Products</th><th>Status</th><th></th></tr></thead><tbody>'
      + S.cats.map((c) => '<tr>'
      + '<td><div class="row-actions"><button class="icon-btn" data-act="cat-up" data-id="' + esc(c.id) + '">' + icon("up") + '</button><button class="icon-btn" data-act="cat-down" data-id="' + esc(c.id) + '">' + icon("down") + '</button></div></td>'
      + '<td><div class="cell-prod"><span class="thumb">' + (c.image ? '<img src="' + esc(thumbUrl(c.image, 96)) + '" alt="" loading="lazy" decoding="async">' : '') + '</span><span><strong>' + esc(c.label) + '</strong><small>/' + esc(c.slug) + '</small></span></div></td>'
      + '<td>' + Number(c.count || 0) + '</td>'
      + '<td><span class="pill' + (c.active === false ? '' : ' pill-live') + '">' + (c.active === false ? 'Hidden' : 'Live') + '</span></td>'
      + '<td class="row-actions"><button class="icon-btn" data-act="cat-edit" data-id="' + esc(c.id) + '">' + icon("edit") + '</button><button class="icon-btn bad" data-act="cat-del" data-id="' + esc(c.id) + '">' + icon("trash") + '</button></td>'
      + '</tr>').join("") + '</tbody>';
  }

  function setCatImage(url) {
    const src = String(url || "").trim();
    const hiddenInput = $("#catImageUrl");
    const textInput = $("#catImageUrlInput");
    const preview = $("#catImgPreview");
    const thumb = $("#catImgThumb");
    const uploader = $("#catUploader");
    const prompt = $("#catUploadPrompt");
    const progress = $("#catUploadProgress");

    if (hiddenInput) hiddenInput.value = src;
    if (textInput && textInput.value !== src) textInput.value = src;

    if (src) {
      if (thumb) thumb.src = src;
      if (preview) preview.hidden = false;
      if (uploader) uploader.hidden = true;
    } else {
      if (thumb) thumb.src = "";
      if (preview) preview.hidden = true;
      if (uploader) uploader.hidden = false;
      if (progress) progress.hidden = true;
      if (prompt) prompt.hidden = false;
    }
  }

  function bindCatUploader() {
    const uploader = $("#catUploader");
    const fileInput = $("#catFileInput");
    const changeBtn = $("#catChangeImgBtn");
    const removeBtn = $("#catRemoveImgBtn");
    const urlInput = $("#catImageUrlInput");
    const prompt = $("#catUploadPrompt");
    const progress = $("#catUploadProgress");

    if (!uploader || !fileInput) return;

    async function handleFile(file) {
      if (!file) return;
      if (prompt) prompt.hidden = true;
      if (progress) progress.hidden = false;
      const submitBtn = $("#catSubmitBtn");
      if (submitBtn) submitBtn.disabled = true;
      try {
        const assets = await uploadFiles([file], "image");
        if (assets.length && assets[0].url) {
          setCatImage(assets[0].url);
          toast("Cover image uploaded");
        } else {
          toast("Upload failed, please try again", true);
          setCatImage("");
        }
      } catch (err) {
        fail(err);
        setCatImage("");
      } finally {
        if (progress) progress.hidden = true;
        if (prompt) prompt.hidden = false;
        if (submitBtn) submitBtn.disabled = false;
        fileInput.value = "";
      }
    }

    uploader.addEventListener("click", (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });

    ["dragenter", "dragover"].forEach((t) => {
      uploader.addEventListener(t, (e) => {
        e.preventDefault();
        uploader.classList.add("is-over");
      });
    });

    ["dragleave", "drop"].forEach((t) => {
      uploader.addEventListener(t, (e) => {
        e.preventDefault();
        uploader.classList.remove("is-over");
      });
    });

    uploader.addEventListener("drop", (e) => {
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) handleFile(files[0]);
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length) {
        handleFile(fileInput.files[0]);
      }
    });

    if (changeBtn) {
      changeBtn.addEventListener("click", () => fileInput.click());
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", () => setCatImage(""));
    }

    if (urlInput) {
      urlInput.addEventListener("input", () => {
        setCatImage(urlInput.value.trim());
      });
    }
  }

  function editCat(id) {
    const c = S.cats.find((x) => x.id === id || x.slug === id) || null;
    const f = $("#categoryForm");
    if (!f) return;
    f.elements.original.value = c ? (c.id || c.slug) : "";
    const title = $("#catFormTitle");
    if (title) title.textContent = c ? "Edit category" : "Category editor";
    const mode = $("#catFormMode");
    if (mode) mode.textContent = c ? "Editing: " + c.label : "New category";
    f.elements.label.value = c ? c.label : "";
    f.elements.slug.value = c ? c.slug : "";
    f.elements.blurb.value = c ? c.blurb || "" : "";
    setCatImage(c && c.image ? c.image : "");
    f.elements.sortOrder.value = c ? c.sortOrder || 0 : S.cats.length + 1;
    f.elements.active.checked = c ? c.active !== false : true;
    const btn = $("#catSubmitBtn");
    if (btn) btn.innerHTML = "Update category";
    f.scrollIntoView({ behavior: "smooth", block: "center" });
    f.elements.label.focus();
  }

  function openNewCat() {
    const f = $("#categoryForm");
    if (!f) return;
    f.reset();
    f.elements.original.value = "";
    const title = $("#catFormTitle");
    if (title) title.textContent = "Category editor";
    const mode = $("#catFormMode");
    if (mode) mode.textContent = "New category";
    setCatImage("");
    f.elements.active.checked = true;
    f.elements.sortOrder.value = S.cats.length + 1;
    const btn = $("#catSubmitBtn");
    if (btn) btn.innerHTML = "Save category";
    f.scrollIntoView({ behavior: "smooth", block: "center" });
    f.elements.label.focus();
  }

  async function saveCat(event) {
    if (event) event.preventDefault();
    const f = $("#categoryForm");
    if (!f) return;
    const btn = $("#catSubmitBtn") || f.querySelector("button[type='submit']");
    const original = f.elements.original.value.trim();
    const label = f.elements.label.value.trim();
    if (!label) return toast("Category name is required", true);

    let slug = (f.elements.slug.value.trim() || label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70);

    const imgUrl = ($("#catImageUrl") ? $("#catImageUrl").value : f.elements.image.value) || "";
    const body = {
      label: label,
      slug: slug,
      blurb: f.elements.blurb.value.trim(),
      image: imgUrl.trim(),
      sortOrder: Number(f.elements.sortOrder.value || 0),
      active: f.elements.active.checked
    };

    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    }

    try {
      if (original) {
        await pa("/admin/categories/" + encodeURIComponent(original), body);
        toast("Category updated successfully");
      } else {
        await po("/admin/categories", body);
        toast("Category added successfully");
      }
      openNewCat();
      await loadCats();
    } catch (err) {
      fail(err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn.innerHTML = original ? "Update category" : "Save category";
      }
    }
  }

  async function moveCat(id, dir) {
    const ids = S.cats.map((c) => c.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    try {
      await po("/admin/categories/reorder", { ids: ids });
      await loadCats();
    } catch (err) { fail(err); }
  }

  async function catAction(act, id) {
    if (act === "catEdit" || act === "cat-edit") return editCat(id);
    if (act === "catUp" || act === "cat-up") return moveCat(id, -1);
    if (act === "catDown" || act === "cat-down") return moveCat(id, 1);
    if (act === "catDel" || act === "cat-del") {
      if (!(await confirmDialog("Delete this category? Products will keep their tag.", { title: "Delete Category", confirmText: "Delete" }))) return;
      try {
        await de("/admin/categories/" + encodeURIComponent(id));
        toast("Category deleted");
        await loadCats();
      } catch (err) { fail(err); }
    }
  }

  async function loadOrders() {
    S.ord = (await g("/admin/orders")).orders || [];
    renderOrders();
  }
  const OHEAD = '<thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Items</th><th>Status</th><th></th></tr></thead><tbody>';
  function renderOrders() {
    const q = S.q.o.toLowerCase(), st = S.q.st;
    const rows = S.ord.filter((r) => (!st || r.status === st) && (!q || [r.number, r.id, (r.customer || {}).name, (r.customer || {}).phone].join(" ").toLowerCase().includes(q)));
    const page = S.page.o || 1;
    const size = S.pageSize.o || 12;
    const paged = rows.slice((page - 1) * size, page * size);

    $("#orderTable").innerHTML = OHEAD + (paged.length ? paged.map((r) => '<tr><td><strong>' + esc(r.number || r.id) + '</strong><small>' + when(r.createdAt) + '</small></td>'
      + '<td>' + esc((r.customer || {}).name || "Guest") + '<small>' + esc((r.customer || {}).phone || "") + '</small></td>'
      + '<td>' + money(r.total || 0) + '</td><td>' + ((r.items || []).length) + '</td>'
      + '<td>' + stSel(r.status, "order-status", r.id) + '</td>'
      + '<td><button class="icon-btn" data-act="order-open" data-id="' + esc(r.id) + '">' + icon("eye") + '</button></td></tr>').join("") : '<tr><td colspan="6"><div class="empty">No orders yet.</div></td></tr>') + '</tbody>';

    renderPaging("#orderPagination", "#orderCount", rows.length, size, page, (nextPage) => {
      S.page.o = nextPage;
      renderOrders();
    });
  }

  async function loadCustomers() {
    S.cust = (await g("/admin/customers")).customers || [];
    renderCustomers();
  }
  function renderCustomers() {
    const q = S.q.c.toLowerCase();
    const rows = S.cust.filter((r) => (!q || ((r.name || "") + " " + (r.email || "") + " " + (r.phone || "")).toLowerCase().includes(q)));
    const page = S.page.c || 1;
    const size = S.pageSize.c || 15;
    const paged = rows.slice((page - 1) * size, page * size);

    $("#customerTable").innerHTML = CTH + (paged.length ? paged.map((r) => '<tr><td><strong>' + esc(r.name || "") + '</strong><small>' + esc(r.email || "") + '</small></td><td>' + esc(r.phone || "") + '</td><td>' + esc(r.orders || 0) + '</td><td>' + money(r.spent || 0) + '</td><td>' + when(r.lastOrderAt) + '</td></tr>').join("") : '<tr><td colspan="5"><div class="empty">No customers yet.</div></td></tr>') + '</tbody>';

    renderPaging("#custPagination", "#custCount", rows.length, size, page, (nextPage) => {
      S.page.c = nextPage;
      renderCustomers();
    });
  }
  const MHEAD = '<thead><tr><th>Media</th><th>Type</th><th>Size</th><th></th></tr></thead><tbody>';

  async function loadMedia() {
    S.media = (await g("/admin/media")).media || [];
    renderMedia();
  }

  function renderMedia() {
    const list = S.media || [];
    const page = S.page.m || 1;
    const size = S.pageSize.m || 18;
    const paged = list.slice((page - 1) * size, page * size);

    $("#mediaGrid").innerHTML = paged.length ? paged.map((m) => '<figure class="media-tile">' + (m.kind === "video" ? '<video src="' + esc(m.url) + '" muted playsinline preload="metadata"></video>' : '<img src="' + esc(thumbUrl(m.url, 320)) + '" alt="' + esc(m.name || "") + '" loading="lazy" decoding="async">') + '<figcaption><button class="link" data-act="media-copy" data-url="' + esc(m.url) + '">Copy URL</button><button class="icon-btn" data-act="media-del" data-id="' + esc(m.id) + '">' + icon("trash") + '</button></figcaption></figure>').join("") : '<div class="empty">Nothing uploaded yet.</div>';

    renderPaging("#mediaPagination", "#mediaCount", list.length, size, page, (nextPage) => {
      S.page.m = nextPage;
      renderMedia();
    });
  }

  const PHEAD = '<thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min spend</th><th>State</th><th></th></tr></thead><tbody>';

  async function loadPromos() {
    S.promos = (await g("/admin/promos")).promos || [];
    renderPromos();
  }

  function renderPromos() {
    $("#promoTable").innerHTML = PHEAD + (S.promos.length ? S.promos.map((r) => '<tr><td><strong>' + esc(r.code) + '</strong><small>' + esc(r.label || "") + '</small></td><td>' + esc(r.type) + '</td><td>' + esc(String(r.value)) + '</td><td>' + money(r.minSpend || 0) + '</td><td>' + (r.active === false ? "Off" : "On") + '</td><td class="row-actions"><button class="icon-btn" data-act="promo-edit" data-code="' + esc(r.code) + '">' + icon("edit") + '</button><button class="icon-btn" data-act="promo-del" data-id="' + esc(r.code) + '">' + icon("trash") + '</button></td></tr>').join("") : '<tr><td colspan="6"><div class="empty">No promo codes yet.</div></td></tr>') + '</tbody>';
  }

  function editPromo(code) {
    const f = $("#promoForm");
    const r = S.promos.find((x) => x.code === code);
    f.reset();
    if (!r) return;
    f.elements.original.value = r.code;
    f.elements.code.value = r.code;
    f.elements.type.value = r.type || "percent";
    f.elements.value.value = r.value;
    f.elements.label.value = r.label || "";
    f.elements.minSpend.value = r.minSpend || 0;
    f.elements.active.checked = r.active !== false;
    f.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  async function savePromo(event) {
    event.preventDefault();
    const f = $("#promoForm");
    const btn = f.querySelector("button[type='submit']");
    const original = f.elements.original.value;
    const body = { code: f.elements.code.value, type: f.elements.type.value, value: f.elements.value.value, label: f.elements.label.value, minSpend: f.elements.minSpend.value, active: f.elements.active.checked };
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    }
    try {
      const res = original ? await pa("/admin/promos/" + original, body) : await po("/admin/promos", body);
      toast("Promo " + (res.promo ? res.promo.code : "saved") + " is live");
      f.reset();
      f.elements.original.value = "";
      await loadPromos();
    } catch (err) {
      fail(err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn.innerHTML = original ? "Update promo" : "Save promo";
      }
    }
  }

  const MSHEAD = '<thead><tr><th>From</th><th>Message</th><th>Received</th><th></th></tr></thead><tbody>';

  async function loadMessages() {
    S.msgs = (await g("/admin/messages")).messages || [];
    renderMessages();
  }

  function renderMessages() {
    $("#messageTable").innerHTML = MSHEAD + (S.msgs.length ? S.msgs.map((r) => '<tr><td><strong>' + esc(r.name || "") + '</strong><small>' + esc(r.email || r.phone || "") + '</small></td><td>' + esc((r.message || "").slice(0, 120)) + '</td><td>' + when(r.createdAt) + '</td><td class="row-actions"><button class="icon-btn" data-act="msg-del" data-id="' + esc(r.id) + '">' + icon("trash") + '</button></td></tr>').join("") : '<tr><td colspan="4"><div class="empty">Inbox is empty.</div></td></tr>') + '</tbody>';
  }

  const SHEAD = '<thead><tr><th>Email</th><th>Joined</th><th></th></tr></thead><tbody>';

  async function loadSubs() {
    S.subs = (await g("/admin/subscribers")).subscribers || [];
    renderSubs();
  }

  function renderSubs() {
    $("#subTable").innerHTML = SHEAD + (S.subs.length ? S.subs.map((r) => '<tr><td>' + esc(r.email || "") + '</td><td>' + when(r.createdAt) + '</td><td class="row-actions"><button class="icon-btn" data-act="sub-del" data-id="' + esc(r.id) + '">' + icon("trash") + '</button></td></tr>').join("") : '<tr><td colspan="3"><div class="empty">No subscribers yet.</div></td></tr>') + '</tbody>';
  }

  async function loadSettings() {
    const data = await g("/admin/settings");
    const cfg = data.settings || {};
    S.cfg = cfg;
    const f = $("#settingsForm");
    Object.keys(cfg).forEach((key) => {
      const el = f.elements[key];
      if (el) {
        if (key === "searchSuggestions" && Array.isArray(cfg[key])) {
          el.value = cfg[key].join(", ");
        } else {
          el.value = cfg[key] == null ? "" : cfg[key];
        }
      }
    });
  }

  async function saveSettings(event) {
    event.preventDefault();
    const f = $("#settingsForm");
    const btn = f.querySelector("button[type='submit']");
    const body = {};
    Array.from(f.elements).forEach((el) => {
      if (el.name) body[el.name] = el.type === "checkbox" ? el.checked : el.value;
    });
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    }
    try {
      const res = await po("/admin/settings", body);
      S.cfg = res.settings || S.cfg;
      toast("Store settings saved");
    } catch (err) {
      fail(err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn.innerHTML = "Save store settings";
      }
    }
  }

  let currentOrder = null;

  async function openOrder(id) {
    const data = await g("/admin/orders/" + id);
    const o = data.order;
    currentOrder = o;
    const c = o.customer || {};
    $("#orderTitle").textContent = o.number || o.id;
    $("#orderSub").textContent = when(o.createdAt) + " | " + (o.items || []).length + " items";
    const rows = (o.items || []).map((it) => '<div class="list-row"><span class="grow"><strong>' + esc(it.name) + '</strong><small>' + esc((it.size || "") + " " + (it.color || "")) + ' x ' + it.quantity + '</small></span><span>' + money(it.lineTotal) + '</span></div>').join("");
    $("#orderDetail").innerHTML = '<div class="order-block">' + rows + '</div>'
      + '<div class="order-block"><div class="kv"><span>Subtotal</span><strong>' + money(o.subtotal) + '</strong></div><div class="kv"><span>Shipping</span><strong>' + money(o.shipping) + '</strong></div><div class="kv"><span>Discount</span><strong>' + money(o.discount || 0) + '</strong></div><div class="kv"><span>Total</span><strong>' + money(o.total) + '</strong></div></div>'
      + '<div class="order-block"><div class="kv"><span>Customer</span><strong>' + esc(c.name || "") + '</strong></div><div class="kv"><span>Phone</span><strong>' + esc(c.phone || "") + '</strong></div><div class="kv"><span>Email</span><strong>' + esc(c.email || "") + '</strong></div><div class="kv"><span>Address</span><strong>' + esc([c.address, c.city, c.state].filter(Boolean).join(", ")) + '</strong></div><div class="kv"><span>Payment</span><strong>' + esc(o.payment || o.paymentMethod || "n/a") + '</strong></div></div>'
      + '<label class="field">Status' + stSel(o.status, "order-status", o.id) + '</label><label class="field">Tracking<input id="orderTracking" value="' + esc(o.tracking || "") + '" placeholder="DHL-123456"></label><button class="btn btn-gold btn-block" data-act="order-save">Save changes</button>';
    openDrawer("order");
  }

  async function saveOrder(event) {
    if (!currentOrder) return;
    const btn = event && event.target ? event.target.closest("button") : $("[data-act='order-save']");
    const sel = $("#orderDetail select");
    const track = $("#orderTracking");
    if (btn) {
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.innerHTML = '<span class="btn-spinner"></span> Saving...';
    }
    try {
      await pa("/admin/orders/" + currentOrder.id, { status: sel ? sel.value : currentOrder.status, tracking: track ? track.value : "" });
      toast("Order updated");
      closeDrawers();
      await loadOrders();
    } catch (err) {
      fail(err);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
        btn.innerHTML = "Save changes";
      }
    }
  }

  function boot() {
    const t = $("#toast");
    if (t) t.hidden = false;
    $("#adminLogin").addEventListener("submit", async (event) => {
      event.preventDefault();
      const f = event.target;
      const btn = f.querySelector("button[type='submit']");
      const err = $("#gateError");
      err.hidden = true;
      if (btn) {
        btn.disabled = true;
        btn.classList.add("is-loading");
        btn.innerHTML = '<span class="btn-spinner"></span> Signing in...';
      }
      try {
        const data = await po("/auth/login", { email: f.elements.email.value.trim(), password: f.elements.password.value });
        SG.auth.save(data.token, data.user);
        if (!isAdmin(data.user)) throw new Error("This account does not have admin access.");
        showShell();
      } catch (error) {
        err.textContent = error.message || "Login failed.";
        err.hidden = false;
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.classList.remove("is-loading");
          btn.innerHTML = "Enter Console";
        }
      }
    });
    $("#logoutBtn").addEventListener("click", () => {
      SG.auth.clear();
      showGate();
    });
    $("#burgerBtn").addEventListener("click", () => $("#adminShell").classList.toggle("nav-open"));
    const backdrop = $("#adminBackdrop");
    if (backdrop) backdrop.addEventListener("click", () => $("#adminShell").classList.remove("nav-open"));
    const sideClose = $("#sideCloseBtn");
    if (sideClose) sideClose.addEventListener("click", () => $("#adminShell").classList.remove("nav-open"));
    $("#sideNav").addEventListener("click", (event) => {
      const link = event.target.closest("[data-tab]");
      if (link) { setTab(link.dataset.tab); $("#adminShell").classList.remove("nav-open"); }
    });
    $$("[data-open]").forEach((btn) => btn.addEventListener("click", () => {
      const kind = btn.dataset.open;
      if (kind === "product") openNew();
      if (kind === "category") openNewCat();
      if (kind === "refresh") run(LOADERS[S.tab] || loadSummary);
    }));
    $$("[data-close]").forEach((btn) => btn.addEventListener("click", closeDrawers));
    document.addEventListener("click", delegate);
    const prodForm = $("#productForm");
    if (prodForm) prodForm.addEventListener("submit", saveProduct);
    document.addEventListener("submit", (event) => {
      const formId = event.target && event.target.getAttribute ? event.target.getAttribute("id") : null;
      if (formId === "productForm") saveProduct(event);
      if (formId === "categoryForm") saveCat(event);
      if (formId === "promoForm") savePromo(event);
      if (formId === "settingsForm") saveSettings(event);
    });
    document.addEventListener("change", changeHandler);
    document.addEventListener("input", inputHandler);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawers(); });
    if ($("#addVariant")) $("#addVariant").addEventListener("click", () => { S.vars.push({ size: "", color: "", stock: 0 }); renderVars(); });
    if ($("#catReset")) $("#catReset").addEventListener("click", () => openNewCat());
    if ($("#promoReset")) $("#promoReset").addEventListener("click", () => { $("#promoForm").reset(); $("#promoForm").elements.original.value = ""; });
    if ($("#exportSubs")) $("#exportSubs").addEventListener("click", exportSubs);

    const catLabelInput = $("#categoryForm [name='label']");
    const catSlugInput = $("#categoryForm [name='slug']");
    if (catLabelInput && catSlugInput) {
      catLabelInput.addEventListener("input", () => {
        const orig = $("#categoryForm [name='original']");
        if (!orig || !orig.value) {
          catSlugInput.value = catLabelInput.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
      });
    }

    bindCatUploader();
    bindMedia();
    $$("#productDrawer .uploader").forEach((box) => {
      const input = box.querySelector('input[type="file"]');
      if (!input) return;
      const kind = box.dataset.kind === "video" ? "video" : "images";
      box.addEventListener("click", (event) => { if (event.target === input) return; input.click(); });
      ["dragenter", "dragover"].forEach((t) => box.addEventListener(t, (event) => { event.preventDefault(); box.classList.add("is-over"); }));
      ["dragleave", "drop"].forEach((t) => box.addEventListener(t, (event) => { event.preventDefault(); box.classList.remove("is-over"); }));
      box.addEventListener("drop", (event) => {
        const files = Array.from(event.dataTransfer.files || []);
        if (!files.length) return;
        if (kind === "video") pickVideo(files); else pickImages(files);
      });
      input.addEventListener("change", () => {
        if (!input.files.length) return;
        const files = Array.from(input.files);
        input.value = "";
        if (kind === "video") pickVideo(files); else pickImages(files);
      });
    });
    const loggedUser = SG.auth.user();
    if (isAdmin(loggedUser)) showShell(); else showGate();
  }

  function delegate(event) {
    const btn = event.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "edit") run(() => openProduct(id));
    if (act === "dup") run(() => dupProduct(id));
    if (act === "del") run(() => delProduct(id));
    if (act === "toggle") run(() => toggleProduct(id));
    if (act === "cat-edit" || act === "catEdit") editCat(id);
    if (act === "cat-del" || act === "catDel") run(() => catAction("catDel", id));
    if (act === "cat-up" || act === "catUp") run(() => moveCat(id, -1));
    if (act === "cat-down" || act === "catDown") run(() => moveCat(id, 1));
    if (act === "order-open") run(() => openOrder(id));
    if (act === "order-save") run(() => saveOrder(event));
    if (act === "media-del") run(() => removeMedia(id));
    if (act === "media-copy") run(() => copyText(btn.dataset.url));
    if (act === "promo-edit") editPromo(btn.dataset.code);
    if (act === "promo-del") run(() => deletePromo(btn.dataset.code));
    if (act === "msg-del") run(() => deleteRow("messages", id, loadMessages));
    if (act === "sub-del") run(() => deleteRow("subscribers", id, loadSubs));
    if (act === "img-del") { S.imgs.splice(Number(id), 1); renderImgs(); }
    if (act === "vid-del") { S.vid = ""; renderVid(); }
    if (act === "var-del") { S.vars.splice(Number(id), 1); renderVars(); }
  }

  function bindMedia() {
    const input = $("#mediaInput");
    const drop = $("#mediaDrop");
    if (!input || !drop) return;
    $("#mediaBrowse").addEventListener("click", () => input.click());
    input.addEventListener("change", async () => {
      if (!input.files.length) return;
      const assets = await uploadFiles(Array.from(input.files), "media");
      input.value = "";
      if (assets.length) { toast(assets.length + " file(s) uploaded"); await loadMedia(); }
    });
    ["dragenter", "dragover"].forEach((type) => drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.add("is-over"); }));
    ["dragleave", "drop"].forEach((type) => drop.addEventListener(type, (event) => { event.preventDefault(); drop.classList.remove("is-over"); }));
    drop.addEventListener("drop", async (event) => {
      const files = Array.from(event.dataTransfer.files || []);
      if (!files.length) return;
      const assets = await uploadFiles(files, "media");
      if (assets.length) { toast(assets.length + " file(s) uploaded"); await loadMedia(); }
    });
  }

  async function removeMedia(id) {
    if (!(await confirmDialog("Delete this file permanently from storage?", { title: "Delete File", confirmText: "Delete" }))) return;
    await de("/admin/media/" + id);
    toast("File deleted");
    await loadMedia();
  }

  function copyText(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    toast("URL copied");
  }

  async function deleteRow(kind, id, reload) {
    if (!(await confirmDialog("Delete this record permanently?", { title: "Delete Record", confirmText: "Delete" }))) return;
    await de("/admin/" + kind + "/" + id);
    toast("Deleted");
    await reload();
  }

  async function deletePromo(code) {
    if (!(await confirmDialog("Delete promo code " + code + "?", { title: "Delete Promo", confirmText: "Delete" }))) return;
    await de("/admin/promos/" + code);
    toast("Promo deleted");
    await loadPromos();
  }

  function exportSubs() {
    const rows = [["Email", "Joined"], ...S.subs.map((r) => [r.email, r.createdAt || ""])];
    const csv = rows.map((r) => r.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "star-gold-subscribers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function changeHandler(event) {
    const el = event.target;
    if (el.id === "prodCatFilter") { S.q.cat = el.value; S.page.p = 1; renderProducts(); }
    if (el.id === "prodStateFilter") { S.q.st = el.value; S.page.p = 1; renderProducts(); }
    if (el.id === "orderStatusFilter") { S.q.st = el.value; S.page.o = 1; renderOrders(); }
    if (el.dataset.act === "order-status") run(async () => {
      await pa("/admin/orders/" + el.dataset.id, { status: el.value });
      toast("Order updated");
      await loadOrders();
    });
    if (el.dataset.act === "var-stock") { const v = S.vars[Number(el.dataset.id)]; if (v) v.stock = Number(el.value || 0); }
  }

  function inputHandler(event) {
    const el = event.target;
    if (el.id === "prodSearch") { S.q.p = el.value; S.page.p = 1; renderProducts(); }
    if (el.id === "orderSearch") { S.q.o = el.value; S.page.o = 1; renderOrders(); }
    if (el.id === "custSearch") { S.q.c = el.value; S.page.c = 1; renderCustomers(); }
    if (el.dataset.act === "var-size") { const v = S.vars[Number(el.dataset.id)]; if (v) v.size = el.value; }
    if (el.dataset.act === "var-color") { const v = S.vars[Number(el.dataset.id)]; if (v) v.color = el.value; }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();

