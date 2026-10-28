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
  const S = { tab: "overview", prod: [], cats: [], ord: [], cust: [], media: [], promos: [], subs: [], msgs: [], cfg: {}, sum: null, imgs: [], vid: "", vars: [], edit: null, cur: null, q: { p: "", cat: "", st: "", o: "", c: "" } };
  const stLabel = (k) => (STATUS.find((x) => x[0] === k) || [k, k])[1];
  const stSel = (v, act, id) => '<select class="mini" data-act="' + act + '" data-id="' + (id || "") + '">' + STATUS.map((o) => '<option value="' + o[0] + '"' + (o[0] === v ? " selected" : "") + ">" + o[1] + "</option>").join("") + "</select>";
  const img = (f) => (!f ? "" : /^(https?:|\/|data:)/.test(f) ? f : "/assets/catalog/" + f);
  const CTH = '<thead><tr><th>Customer</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last order</th></tr></thead><tbody>';
  const when = (v) => { if (!v) return "n/a"; try { return SG.formatDateTime(v); } catch (e) { return String(v).slice(0, 10); } };
  function toast(msg, bad) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.toggle("is-bad", !!bad);
    t.classList.add("is-on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("is-on"), 2800);
  }
  function fail(err) { toast(err && err.message ? err.message : "Something went wrong", true); }
  async function run(fn) {
    try { return await fn(); } catch (err) { fail(err); return null; }
  }
  function openDrawer(name) { const el = $("[id='" + name.replace(/^#/, "") + "Drawer']"); if (el) el.hidden = false; }
  function closeDrawers() { $$(".adm-drawer").forEach((d) => { d.hidden = true; }); }
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
    $("#productTable").innerHTML = '<thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>State</th><th></th></tr></thead>'
      + '<tbody>' + (rows.length ? rows.map((row) => {
        return '<tr><td><div class="cell-prod"><span class="thumb">' + (row.images && row.images[0] ? '<img src="' + esc(row.images[0]) + '" alt="">' : '') + '</span><span><strong>' + esc(row.name) + '</strong><small>' + esc(row.id) + '</small></span></div></td><td>' + esc(row.category || "") + '</td><td>' + money(row.price) + '</td><td>' + Number(row.stock || 0) + '</td><td><button class="pill' + (row.active === false ? '' : ' pill-live') + '" data-act="toggle" data-id="' + esc(row.id) + '">' + (row.active === false ? 'Hidden' : 'Live') + '</button></td><td class="row-actions"><button class="icon-btn" data-act="edit" data-id="' + esc(row.id) + '">' + icon("edit") + '</button><button class="icon-btn" data-act="dup" data-id="' + esc(row.id) + '">' + icon("copy") + '</button><button class="icon-btn" data-act="del" data-id="' + esc(row.id) + '">' + icon("trash") + '</button></td></tr>';
      }).join("") : '<tr><td colspan="6"><div class="empty">No products match this filter.</div></td></tr>') + '</tbody>';
  }
  function fillProdCats() {
    const sel = $("#prodCatFilter");
    sel.innerHTML = '<option value="">All categories</option>' + S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
    const form = $("#productCat");
    form.innerHTML = S.cats.map((c) => '<option value="' + esc(c.slug) + '">' + esc(c.label) + '</option>').join("");
  }

  function prodById(id) {
    return S.prod.find((row) => row.id === id) || null;
  }

  function openProduct(row) {
    const form = $("#productForm");
    form.reset();
    S.edit = row ? row.id : null;
    S.imgs = row && row.images ? row.images.slice() : [];
    S.vid = row && row.video ? row.video : "";
    S.vars = row && row.variants ? row.variants.map((v) => ({ size: v.size || "One Size", color: v.color || "", stock: Number(v.stock || 0) })) : [];
    $("#drawerTitle").textContent = row ? "Edit product" : "New product";
    $("#drawerSub").textContent = row ? row.id : "Fill the details, upload media and publish";
    form.elements.name.value = row ? row.name || "" : "";
    form.elements.category.value = row ? row.category || "" : (S.cats[0] ? S.cats[0].slug : "");
    form.elements.price.value = row ? row.price || 0 : "";
    form.elements.compareAt.value = row ? row.compareAt || "" : "";
    form.elements.stock.value = row ? row.stock || 0 : 0;
    form.elements.badge.value = row ? row.badge || "" : "";
    form.elements.description.value = row ? row.description || "" : "";
    form.elements.details.value = row && row.details ? row.details.join("\n") : "";
    form.elements.material.value = row ? row.material || "" : "";
    form.elements.origin.value = row ? row.origin || "" : "";
    form.elements.rating.value = row ? row.rating || 4.8 : 4.8;
    form.elements.featured.checked = row ? !!row.featured : false;
    form.elements.active.checked = row ? row.active !== false : true;
    if (!S.cats.length) loadCats().then(() => { form.elements.category.value = row ? row.category || "" : (S.cats[0] ? S.cats[0].slug : ""); });
    renderImgs();
    renderVars();
    renderVid();
    openDrawer("#productDrawer");
  }
  function renderImgs() {
    $("#imageThumbs").innerHTML = S.imgs.length ? S.imgs.map((src, i) => '<figure class="thumb-item"><img src="' + esc(src) + '" alt=""><button type="button" data-act="img-del" data-i="' + i + '">' + icon("x", 14) + '</button></figure>').join("") : '<p class="muted small">No images yet. Upload files or paste a URL below.</p>';
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
    S.edit = null;
    S.imgs = [];
    S.vid = "";
    S.vars = [];
    $("#productForm").reset();
    $("#drawerTitle").textContent = "New product";
    $("#drawerSub").textContent = "Add a piece to the catalogue";
    renderImgs();
    renderVid();
    renderVars();
    openDrawer("product");
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
      variants: S.vars.filter((v) => v.size || v.color)
    };
    if (!body.name || !body.price) return toast("Name and price are required", true);
    btn.disabled = true;
    try {
      if (S.edit) await pa("/admin/products/" + encodeURIComponent(S.edit), body);
      else await po("/admin/products", body);
      closeDrawers();
      await loadProducts();
      await loadSummary();
      toast("Product saved");
    } catch (err) { fail(err); }
    btn.disabled = false;
  }
  async function dupProduct(id) {
    try {
      await po("/admin/products/" + encodeURIComponent(id) + "/duplicate", {});
      await loadProducts();
      toast("Product duplicated");
    } catch (err) { fail(err); }
  }

  async function delProduct(id) {
    if (!confirm("Delete this product permanently?")) return;
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
      + '<td><div class="row-actions"><button class="icon-btn" data-act="catUp" data-id="' + esc(c.id) + '">' + icon("up") + '</button><button class="icon-btn" data-act="catDown" data-id="' + esc(c.id) + '">' + icon("down") + '</button></div></td>'
      + '<td><div class="cell-prod"><span class="thumb">' + (c.image ? '<img src="' + esc(c.image) + '" alt="">' : '') + '</span><span><strong>' + esc(c.label) + '</strong><small>/' + esc(c.slug) + '</small></span></div></td>'
      + '<td>' + Number(c.count || 0) + '</td>'
      + '<td><span class="pill' + (c.active === false ? '' : ' pill-live') + '">' + (c.active === false ? 'Hidden' : 'Live') + '</span></td>'
      + '<td class="row-actions"><button class="icon-btn" data-act="catEdit" data-id="' + esc(c.id) + '">' + icon("edit") + '</button><button class="icon-btn bad" data-act="catDel" data-id="' + esc(c.id) + '">' + icon("trash") + '</button></td>'
      + '</tr>').join("") + '</tbody>';
  }

  function editCat(id) {
    const c = S.cats.find((x) => x.id === id) || null;
    const f = $("#categoryForm");
    f.elements.original.value = c ? c.id : "";
    f.elements.label.value = c ? c.label : "";
    f.elements.slug.value = c ? c.slug : "";
    f.elements.blurb.value = c ? c.blurb || "" : "";
    f.elements.image.value = c ? c.image || "" : "";
    f.elements.sortOrder.value = c ? c.sortOrder || 0 : S.cats.length + 1;
    f.elements.active.checked = c ? c.active !== false : true;
    f.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveCat(event) {
    event.preventDefault();
    const f = event.currentTarget;
    const original = f.elements.original.value;
    const body = {
      label: f.elements.label.value.trim(),
      slug: f.elements.slug.value.trim(),
      blurb: f.elements.blurb.value.trim(),
      image: f.elements.image.value.trim(),
      sortOrder: Number(f.elements.sortOrder.value || 0),
      active: f.elements.active.checked
    };
    if (!body.label) return toast("Category name is required", true);
    try {
      if (original) await pa("/admin/categories/" + encodeURIComponent(original), body);
      else await po("/admin/categories", body);
      toast("Category saved");
      f.reset();
      f.elements.original.value = "";
      await loadCats();
    } catch (err) { fail(err); }
  }

  async function moveCat(id, dir) {
    const ids = S.cats.map((c) => c.id);
    const from = ids.indexOf(id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    try { await po("/admin/categories/reorder", { ids: ids }); await loadCats(); }
    catch (err) { fail(err); }
  }

  async function catAction(act, id) {
    if (act === "catEdit") return editCat(id);
    if (act === "catUp") return moveCat(id, -1);
    if (act === "catDown") return moveCat(id, 1);
    if (act === "catDel") {
      if (!confirm("Delete this category? Products keep their tag.")) return;
      try { await de("/admin/categories/" + encodeURIComponent(id)); toast("Category deleted"); await loadCats(); }
      catch (err) { fail(err); }
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
    $("#orderTable").innerHTML = OHEAD + (rows.length ? rows.map((r) => '<tr><td><strong>' + esc(r.number || r.id) + '</strong><small>' + when(r.createdAt) + '</small></td>'
      + '<td>' + esc((r.customer || {}).name || "Guest") + '<small>' + esc((r.customer || {}).phone || "") + '</small></td>'
      + '<td>' + money(r.total || 0) + '</td><td>' + ((r.items || []).length) + '</td>'
      + '<td>' + stSel(r.status, "order-status", r.id) + '</td>'
      + '<td><button class="icon-btn" data-act="order-open" data-id="' + esc(r.id) + '">' + icon("eye") + '</button></td></tr>').join("") : '<tr><td colspan="6"><div class="empty">No orders yet.</div></td></tr>') + '</tbody>';
  }

  async function loadCustomers() {
    S.cust = (await g("/admin/customers")).customers || [];
    renderCustomers();
  }
  function renderCustomers() {
    const q = S.q.c.toLowerCase();
    const rows = S.cust.filter((r) => (!q || ((r.name || "") + " " + (r.email || "") + " " + (r.phone || "")).toLowerCase().includes(q)));
    $("#customerTable").innerHTML = CTH + (rows.length ? rows.map((r) => '<tr><td><strong>' + esc(r.name || "") + '</strong><small>' + esc(r.email || "") + '</small></td><td>' + esc(r.phone || "") + '</td><td>' + esc(r.orders || 0) + '</td><td>' + money(r.spent || 0) + '</td><td>' + when(r.lastOrderAt) + '</td></tr>').join("") : '<tr><td colspan="5"><div class="empty">No customers yet.</div></td></tr>') + '</tbody>';
  }
  const MHEAD = '<thead><tr><th>Media</th><th>Type</th><th>Size</th><th></th></tr></thead><tbody>';

  async function loadMedia() {
    S.media = (await g("/admin/media")).media || [];
    renderMedia();
  }

  function renderMedia() {
    $("#mediaGrid").innerHTML = S.media.length ? S.media.map((m) => '<figure class="media-tile">' + (m.kind === "video" ? '<video src="' + esc(m.url) + '" muted playsinline></video>' : '<img src="' + esc(m.url) + '" alt="' + esc(m.name || "") + '">') + '<figcaption><button class="link" data-act="media-copy" data-url="' + esc(m.url) + '">Copy URL</button><button class="icon-btn" data-act="media-del" data-id="' + esc(m.id) + '">' + icon("trash") + '</button></figcaption></figure>').join("") : '<div class="empty">Nothing uploaded yet.</div>';
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
    const original = f.elements.original.value;
    const body = { code: f.elements.code.value, type: f.elements.type.value, value: f.elements.value.value, label: f.elements.label.value, minSpend: f.elements.minSpend.value, active: f.elements.active.checked };
    const res = original ? await pa("/admin/promos/" + original, body) : await po("/admin/promos", body);
    toast("Promo " + (res.promo ? res.promo.code : "saved") + " is live");
    f.reset();
    f.elements.original.value = "";
    await loadPromos();
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
      if (el) el.value = cfg[key] == null ? "" : cfg[key];
    });
  }

  async function saveSettings(event) {
    event.preventDefault();
    const f = $("#settingsForm");
    const body = {};
    Array.from(f.elements).forEach((el) => {
      if (el.name) body[el.name] = el.type === "checkbox" ? el.checked : el.value;
    });
    const res = await po("/admin/settings", body);
    S.cfg = res.settings || S.cfg;
    toast("Store settings saved");
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

  async function saveOrder() {
    if (!currentOrder) return;
    const sel = $("#orderDetail select");
    const track = $("#orderTracking");
    await pa("/admin/orders/" + currentOrder.id, { status: sel ? sel.value : currentOrder.status, tracking: track ? track.value : "" });
    toast("Order updated");
    closeDrawers();
    await loadOrders();
  }

  function boot() {
    const t = $("#toast");
    if (t) t.hidden = false;
    $("#adminLogin").addEventListener("submit", async (event) => {
      event.preventDefault();
      const f = event.target;
      const err = $("#gateError");
      err.hidden = true;
      try {
        const data = await po("/auth/login", { email: f.elements.email.value.trim(), password: f.elements.password.value });
        SG.auth.save(data.token, data.user);
        if (!isAdmin(data.user)) throw new Error("This account does not have admin access.");
        showShell();
      } catch (error) {
        err.textContent = error.message || "Login failed.";
        err.hidden = false;
      }
    });
    $("#logoutBtn").addEventListener("click", () => {
      SG.auth.clear();
      showGate();
    });
    $("#burgerBtn").addEventListener("click", () => $("#adminShell").classList.toggle("nav-open"));
    $("#sideNav").addEventListener("click", (event) => {
      const link = event.target.closest("[data-tab]");
      if (link) { setTab(link.dataset.tab); $("#adminShell").classList.remove("nav-open"); }
    });
    $$("[data-open]").forEach((btn) => btn.addEventListener("click", () => {
      const kind = btn.dataset.open;
      if (kind === "product") openNew();
      if (kind === "category") catAction(null);
      if (kind === "refresh") run(LOADERS[S.tab] || loadSummary);
    }));
    $$("[data-close]").forEach((btn) => btn.addEventListener("click", closeDrawers));
    document.addEventListener("click", delegate);
    document.addEventListener("submit", (event) => {
      const formId = event.target.getAttribute("id");
      if (formId === "productForm") saveProduct(event);
      if (formId === "categoryForm") saveCat(event);
      if (formId === "promoForm") savePromo(event);
      if (formId === "settingsForm") saveSettings(event);
    });
    document.addEventListener("change", changeHandler);
    document.addEventListener("input", inputHandler);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDrawers(); });
    if ($("#addVariant")) $("#addVariant").addEventListener("click", () => { S.vars.push({ size: "", color: "", stock: 0 }); renderVars(); });
    if ($("#catReset")) $("#catReset").addEventListener("click", () => catAction(null));
    if ($("#promoReset")) $("#promoReset").addEventListener("click", () => { $("#promoForm").reset(); $("#promoForm").elements.original.value = ""; });
    if ($("#exportSubs")) $("#exportSubs").addEventListener("click", exportSubs);
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
    if (isAdmin()) showShell(); else showGate();
  }

  function delegate(event) {
    const btn = event.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;
    if (act === "edit") openProduct(id);
    if (act === "dup") run(() => dupProduct(id));
    if (act === "del") run(() => delProduct(id));
    if (act === "toggle") run(() => toggleProduct(id));
    if (act === "cat-edit") editCat(id);
    if (act === "cat-del") run(() => catAction(id, true));
    if (act === "cat-up") run(() => moveCat(id, -1));
    if (act === "cat-down") run(() => moveCat(id, 1));
    if (act === "order-open") run(() => openOrder(id));
    if (act === "order-save") run(saveOrder);
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
    if (!confirm("Delete this file from storage?")) return;
    await de("/admin/media/" + id);
    toast("File deleted");
    await loadMedia();
  }

  function copyText(text) {
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    toast("URL copied");
  }

  async function deleteRow(kind, id, reload) {
    if (!confirm("Delete this record?")) return;
    await de("/admin/" + kind + "/" + id);
    toast("Deleted");
    await reload();
  }

  async function deletePromo(code) {
    if (!confirm("Delete promo " + code + "?")) return;
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
    if (el.id === "prodCatFilter") { S.q.cat = el.value; renderProducts(); }
    if (el.id === "prodStateFilter") { S.q.st = el.value; renderProducts(); }
    if (el.id === "orderStatusFilter") { S.q.st = el.value; renderOrders(); }
    if (el.dataset.act === "order-status") run(async () => {
      await pa("/admin/orders/" + el.dataset.id, { status: el.value });
      toast("Order updated");
      await loadOrders();
    });
    if (el.dataset.act === "var-stock") { const v = S.vars[Number(el.dataset.id)]; if (v) v.stock = Number(el.value || 0); }
  }

  function inputHandler(event) {
    const el = event.target;
    if (el.id === "prodSearch") { S.q.p = el.value; renderProducts(); }
    if (el.id === "orderSearch") { S.q.o = el.value; renderOrders(); }
    if (el.id === "custSearch") { S.q.c = el.value; renderCustomers(); }
    if (el.dataset.act === "var-size") { const v = S.vars[Number(el.dataset.id)]; if (v) v.size = el.value; }
    if (el.dataset.act === "var-color") { const v = S.vars[Number(el.dataset.id)]; if (v) v.color = el.value; }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();

