(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const api = SG.api;

  const CATS = [["jeans", "Jeans"], ["gowns", "Gowns"], ["shirts", "Shirts"], ["up-and-down", "Up & Down"], ["trousers", "Trousers"], ["caps", "Caps"], ["shoes", "Shoes"], ["bags", "Bags"]];
  function cats(){ return (SG.CATS && SG.CATS.length) ? SG.CATS : CATS; }
  const ORIGINS = ["Turkey", "China"];
  const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "40", "41", "42", "43", "44", "45", "One Size"];

  const state = { category: [], origin: [], size: "", min: "", max: "", sort: "new", q: "", feature: "", page: 1 };

  function readUrl() {
    const p = new URLSearchParams(location.search);
    state.category = (p.get("category") || "").split(",").filter(Boolean);
    state.origin = (p.get("origin") || "").split(",").filter(Boolean);
    state.size = p.get("size") || "";
    state.min = p.get("min") || "";
    state.max = p.get("max") || "";
    state.sort = p.get("sort") || "new";
    state.q = p.get("q") || "";
    state.feature = p.get("feature") || "";
    state.page = Number(p.get("page") || 1);
  }

  function writeUrl() {
    const p = new URLSearchParams();
    if (state.category.length) p.set("category", state.category.join(","));
    if (state.origin.length) p.set("origin", state.origin.join(","));
    if (state.size) p.set("size", state.size);
    if (state.min) p.set("min", state.min);
    if (state.max) p.set("max", state.max);
    if (state.sort && state.sort !== "new") p.set("sort", state.sort);
    if (state.q) p.set("q", state.q);
    if (state.feature) p.set("feature", state.feature);
    if (state.page > 1) p.set("page", state.page);
    history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
  }

  function renderFilters() {
    $("#filterCategories").innerHTML = cats().map(([slug, label]) =>
      `<label class="check"><input type="checkbox" value="${slug}" data-cat ${state.category.includes(slug) ? "checked" : ""}><span>${label}</span></label>`
    ).join("");
    $("#filterOrigins").innerHTML = ORIGINS.map((o) =>
      `<label class="check"><input type="checkbox" value="${o}" data-origin ${state.origin.includes(o) ? "checked" : ""}><span>${o}</span></label>`
    ).join("");
    $("#filterSizes").innerHTML = SIZES.map((s) =>
      `<button type="button" class="size-chip ${state.size === s ? "is-active" : ""}" data-size="${s}">${s}</button>`
    ).join("");
    if (state.min) $("#minPrice").value = state.min;
    if (state.max) $("#maxPrice").value = state.max;
    if (state.q) $("#shopTitle").textContent = '"' + state.q + '"';
    else if (state.feature === "new") $("#shopTitle").textContent = "New in";
    else if (state.category.length === 1) {
      const found = cats().find((c) => c[0] === state.category[0]);
      if (found) $("#shopTitle").textContent = found[1];
    }
    $("#sortSelect").value = state.sort;
  }

  async function load() {
    const grid = $("#shopGrid");
    grid.innerHTML = SG.UI.skeletonGrid(8);
    const p = new URLSearchParams({ page: state.page, limit: 12, sort: state.sort });
    if (state.category.length) p.set("category", state.category.join(","));
    if (state.origin.length) p.set("origin", state.origin.join(","));
    if (state.size) p.set("size", state.size);
    if (state.min) p.set("minPrice", state.min);
    if (state.max) p.set("maxPrice", state.max);
    if (state.q) p.set("q", state.q);
    if (state.feature) p.set("feature", state.feature);
    try {
      const data = await api.get("/products?" + p.toString());
      render(data);
    } catch (err) {
      grid.innerHTML = '<div class="empty-state">We could not load the collection just now.</div>';
    }
  }

  function render(data) {
    const grid = $("#shopGrid");
    $("#shopCount").textContent = data.total + (data.total === 1 ? " piece" : " pieces");
    $("#shopEmpty").hidden = data.total !== 0;
    grid.innerHTML = data.products.map(SG.UI.card).join("");
    let pagHtml = "";
    if (data.pages > 1) {
      if (data.page > 1) pagHtml += `<button type="button" class="page-btn" data-page="${data.page - 1}">&larr; Prev</button>`;
      for (let i = 1; i <= data.pages; i++) {
        pagHtml += `<button type="button" class="page-btn ${i === data.page ? "is-active" : ""}" data-page="${i}">${i}</button>`;
      }
      if (data.page < data.pages) pagHtml += `<button type="button" class="page-btn" data-page="${data.page + 1}">Next &rarr;</button>`;
    }
    $("#pagination").innerHTML = pagHtml;
    renderActive();
  }

  function renderActive() {
    const chips = [];
    state.category.forEach((c) => chips.push({ key: "category", value: c, label: (cats().find((x) => x[0] === c) || [c, c])[1] }));
    state.origin.forEach((o) => chips.push({ key: "origin", value: o, label: o }));
    if (state.size) chips.push({ key: "size", value: state.size, label: "Size " + state.size });
    if (state.min || state.max) chips.push({ key: "price", value: "", label: "Price filter" });
    if (state.q) chips.push({ key: "q", value: "", label: '"' + state.q + '"' });
    $("#activeFilters").innerHTML = chips.map((c) =>
      `<button type="button" class="chip" data-remove="${c.key}">${c.label} ${SG.UI.icon("x", 12)}</button>`
    ).join("");
  }

  function refresh() {
    state.page = 1;
    writeUrl();
    load();
  }

  document.addEventListener("change", (e) => {
    const cat = e.target.closest("[data-cat]");
    const org = e.target.closest("[data-origin]");
    if (cat) {
      state.category = cat.checked ? state.category.concat(cat.value) : state.category.filter((c) => c !== cat.value);
      refresh();
    }
    if (org) {
      state.origin = org.checked ? state.origin.concat(org.value) : state.origin.filter((o) => o !== org.value);
      refresh();
    }
    if (e.target.id === "sortSelect") {
      state.sort = e.target.value;
      refresh();
    }
  });

  document.addEventListener("click", (e) => {
    const size = e.target.closest("[data-size]");
    const clear = e.target.closest("[data-clear]");
    const chip = e.target.closest("[data-remove]");
    const page = e.target.closest("[data-page]");
    if (size) {
      state.size = state.size === size.dataset.size ? "" : size.dataset.size;
      renderFilters();
      refresh();
    }
    if (clear) {
      const k = clear.dataset.clear;
      if (k === "category") state.category = [];
      if (k === "origin") state.origin = [];
      if (k === "price") { state.min = ""; state.max = ""; $("#minPrice").value = ""; $("#maxPrice").value = ""; }
      if (k === "size") state.size = "";
      renderFilters();
      refresh();
    }
    if (chip) {
      const k = chip.dataset.remove;
      if (k === "category" || k === "origin") state[k] = [];
      if (k === "size") state.size = "";
      if (k === "price") { state.min = ""; state.max = ""; }
      if (k === "q") { state.q = ""; $("#shopTitle").textContent = "Shop all"; }
      renderFilters();
      refresh();
    }
    if (page) {
      state.page = Number(page.dataset.page);
      writeUrl();
      load();
      window.scrollTo({ top: 240, behavior: "smooth" });
    }
    if (e.target.id === "applyPrice") {
      const min = $("#minPrice").value.trim();
      const max = $("#maxPrice").value.trim();
      state.min = min;
      state.max = max;
      refresh();
    }
    if (e.target.id === "clearAll" || e.target.id === "emptyReset") {
      Object.assign(state, { category: [], origin: [], size: "", min: "", max: "", q: "", page: 1 });
      renderFilters();
      refresh();
    }
    if (e.target.closest("#filterToggle")) $("#filters").classList.toggle("is-open");
  });

  SG.UI.mount({ page: "shop" });
  readUrl();
  renderFilters();
  load();
})();
