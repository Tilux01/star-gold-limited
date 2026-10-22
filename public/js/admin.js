(function () {
  const U = SG.UI, el = (s) => document.querySelector(s);
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function money(v) { return SG.money(v); }
  function when(iso) { return new Date(iso).toLocaleDateString('en-NG', {day:'2-digit', month:'short', year:'numeric'}); }
  async function init() {
    const user = SG.auth.user();
    if (!user || user.role !== 'admin') {
      el('#adminGate').hidden = false;
      el('#adminWrap').hidden = true;
      return;
    }
    el('#adminGate').hidden = true;
    el('#adminWrap').hidden = false;
    el('#adminWho').textContent = user.name + ' / ' + user.email;
    await Promise.all([loadSummary(), loadProducts(), loadOrders(), loadCustomers()]);
  }
  async function loadSummary() {
    try {
      const s = await SG.api.get('/admin/summary');
      const top = s.topProducts || [];
      const max = Math.max.apply(null, s.series.map((d) => d.total).concat([1]));
      el('#adminDash').innerHTML = '<div class="stat-grid">'
        + card('Revenue', money(s.revenue), s.paidOrders + ' paid orders')
        + card('Orders', String(s.orders), s.pending + ' awaiting action')
        + card('Customers', String(s.customers), 'registered accounts')
        + card('Products', String(s.products), (s.lowStock || []).length + ' low stock')
        + '</div>'
        + '<div class="panel-box"><div class="panel-box__head"><h2>Last 7 days</h2><span class="muted tiny">Paid revenue</span></div><div class="chart">'
        + s.series.map((d) => '<div class="chart__col"><div class="chart__bar" style="height:' + Math.max(4, Math.round(d.total / max * 100)) + '%"></div><span>' + d.date.slice(5) + '</span></div>').join('')
        + '</div></div>'
        + '<div class="panel-box"><div class="panel-box__head"><h2>Top products</h2></div><div class="panel-box__body">'
        + (top.length ? top.map((p) => '<div class="sum-row"><span>' + esc(p.name) + '</span><strong>' + p.units + ' sold</strong></div>').join('') : '<p class="muted">No sales yet.</p>')
        + '</div></div>';
    } catch (err) {
      U.toast(err.message, 'error');
    }
  }
  function card(label, value, delta) {
    return '<div class="stat-card"><span class="stat-card__label">' + label + '</span><strong class="stat-card__value">' + value + '</strong><span class="stat-card__delta">' + delta + '</span></div>';
  }
  async function loadProducts() {
    const res = await SG.api.get('/products?limit=100&sort=new');
    const rows = res.products.map((p) => '<tr><td><div class="cell-product"><img src="' + p.images[0] + '" alt=""><span>' + esc(p.name) + '</span></div></td><td>' + esc(p.categoryLabel) + '</td><td>' + esc(p.origin) + '</td><td>' + money(p.price) + '</td><td>' + p.stock + '</td><td>' + (p.active ? 'Live' : 'Hidden') + '</td><td class="cell-actions"><button class="btn btn--sm btn--ghost" data-edit="' + p.id + '">Edit</button><button class="btn btn--sm btn--ghost" data-del="' + p.id + '">Delete</button></td></tr>').join('');
    el('#prodTable').innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Product</th><th>Category</th><th>Origin</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    window.__products = res.products;
    bindProductActions();
  }
  function bindProductActions() {
    document.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => openForm(b.dataset.edit); });
    document.querySelectorAll('[data-del]').forEach((b) => { b.onclick = async () => {
      if (!confirm('Delete this product permanently?')) return;
      try { await SG.api.del('/admin/products/' + b.dataset.del); U.toast('Product deleted'); loadProducts(); loadSummary(); }
      catch (err) { U.toast(err.message, 'error'); }
    }; });
  }
  function openForm(id) {
    const p = (window.__products || []).find((x) => x.id === id) || null;
    const opts = (list, cur) => list.map((v) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + v + '</option>').join('');
    const cats = [['jeans','Jeans'],['gowns','Gowns'],['shirts','Shirts'],['up-and-down','Up and Down'],['trousers','Trousers'],['caps','Caps'],['shoes','Shoes'],['bags','Bags']];
    el('#prodModal').classList.add('is-open');
    el('#prodModal').innerHTML = '<div class="modal__scrim" data-close></div><div class="modal__panel"><div class="modal__head"><h2 class="h4">' + (p ? 'Edit product' : 'New product') + '</h2><button class="icon-btn" data-close aria-label="Close">' + U.icon('x', 18) + '</button></div><div class="modal__body"><form id="prodForm" class="form-grid">'
      + field('Product name', 'name', p ? p.name : '', 'field--full')
      + '<label class="field"><span>Category</span><select class="input" name="category">' + cats.map((c) => '<option value="' + c[0] + '"' + (p && p.category === c[0] ? ' selected' : '') + '>' + c[1] + '</option>').join('') + '</select></label>'
      + '<label class="field"><span>Origin</span><select class="input" name="origin">' + opts(['Turkey', 'China'], p ? p.origin : 'Turkey') + '</select></label>'
      + field('Price', 'price', p ? p.price : '', '', 'number')
      + field('Compare at price', 'compareAt', p && p.compareAt ? p.compareAt : '', '', 'number')
      + field('Stock per option', 'stock', p ? 6 : 6, '', 'number')
      + field('Sizes (comma separated)', 'sizes', p ? p.variants.map((v) => v.size).filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'S, M, L, XL')
      + field('Colours (comma separated)', 'colors', p ? p.variants.map((v) => v.color).filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'Black, Ivory')
      + '<label class="field"><span>Badge</span><select class="input" name="badge">' + opts(['', 'New in', 'Best seller', 'Sale', 'Limited'], p ? (p.badge || '') : '') + '</select></label>'
      + '<label class="field field--full"><span>Image URLs (one per line or upload below)</span><textarea class="input" name="images" rows="3">' + (p ? p.images.join('\n') : '') + '</textarea></label>'
      + '<div class="field field--full"><span>Upload image</span><input type="file" id="prodUpload" accept="image/*" class="input"></div>'
      + '<label class="field field--full"><span>Description</span><textarea class="input" name="description" rows="3">' + (p ? p.description : '') + '</textarea></label>'
      + '<label class="field field--full"><span>Details (one per line)</span><textarea class="input" name="details" rows="3">' + (p ? p.details.join('\n') : '') + '</textarea></label>'
      + '<label class="check field--full"><input type="checkbox" name="newArrival"' + (p && p.newArrival ? ' checked' : '') + '><span>Show in new arrivals</span></label>'
      + '<label class="check field--full"><input type="checkbox" name="bestSeller"' + (p && p.bestSeller ? ' checked' : '') + '><span>Show in best sellers</span></label>'
      + '<div class="field field--full"><button class="btn btn--gold btn--block" type="submit">' + (p ? 'Save changes' : 'Create product') + '</button></div>'
      + '</form></div></div>';
    el('#prodModal').querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => el('#prodModal').classList.remove('is-open'); });
    el('#prodUpload').onchange = upload;
    el('#prodForm').onsubmit = (e) => saveProduct(e, p);
  }
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', headers: { Authorization: 'Bearer ' + SG.auth.token() }, body: fd }).then((r) => r.json());
      if (!res.url) throw new Error(res.error || 'Upload failed');
      const ta = el('#prodForm').elements.images;
      ta.value = (ta.value ? ta.value + '\n' : '') + res.url;
      U.toast('Image uploaded');
    } catch (err) { U.toast(err.message, 'error'); }
  }
  async function saveProduct(e, p) {
    e.preventDefault();
    const f = e.target;
    const v = (n) => (f.elements[n] ? String(f.elements[n].value).trim() : '');
    const images = v('images').split('\n').map((s) => s.trim()).filter(Boolean);
    const sizes = v('sizes').split(',').map((s) => s.trim()).filter(Boolean);
    const colors = v('colors').split(',').map((s) => s.trim()).filter(Boolean);
    const stock = parseInt(v('stock'), 10) || 5;
    const variants = [];
    sizes.forEach((size, si) => { (colors.length ? colors : ['']).forEach((color, ci) => { variants.push({ id: 'v-' + si + '-' + ci, size: size, color: color, stock: stock }); }); });
    const body = { name: v('name'), category: v('category'), origin: v('origin'), price: parseInt(v('price'), 10), compareAt: parseInt(v('compareAt'), 10) || 0, description: v('description'), details: v('details').split('\n').map((s) => s.trim()).filter(Boolean), images: images, variants: variants, badge: v('badge'), newArrival: f.elements.newArrival.checked, bestSeller: f.elements.bestSeller.checked };
    if (!body.name || !body.price || !images.length) return U.toast('Name, price and at least one image are required', 'error');
    try {
      if (p) await SG.api.patch('/admin/products/' + p.id, body); else await SG.api.post('/admin/products', body);
      U.toast(p ? 'Product updated' : 'Product created');
      el('#prodModal').classList.remove('is-open');
      loadProducts(); loadSummary();
    } catch (err) { U.toast(err.message, 'error'); }
  }
  function field(label, name, value, cls, type) {
    return '<label class="field ' + (cls || '') + '"><span>' + label + '</span><input class="input" type="' + (type || 'text') + '" name="' + name + '" value="' + esc(value) + '"></label>';
  }
  async function loadOrders() {
    const res = await SG.api.get('/admin/orders');
    const statuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    const rows = res.orders.map((o) => '<tr><td><strong>' + esc(o.orderNumber) + '</strong><br><span class="muted tiny">' + when(o.createdAt) + '</span></td><td>' + esc((o.customer && o.customer.name) || '-') + '<br><span class="muted tiny">' + esc((o.customer && o.customer.phone) || '') + '</span></td><td>' + money(o.total) + '</td><td><span class="status status--' + o.status + '">' + o.status + '</span></td><td><select class="input" data-status="' + o.id + '">' + statuses.map((s) => '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></td><td><button class="btn btn--sm btn--ghost" data-view="' + o.id + '">View</button></td></tr>').join('');
    el('#orderTable').innerHTML = rows ? '<div class="table-wrap"><table class="data"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Update</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">No orders yet.</p>';
    document.querySelectorAll('[data-status]').forEach((s) => { s.onchange = async () => { try { await SG.api.patch('/admin/orders/' + s.dataset.status, { status: s.value }); U.toast('Order updated'); loadSummary(); } catch (e) { U.toast(e.message, 'error'); } }; });
    document.querySelectorAll('[data-view]').forEach((b) => { b.onclick = () => viewOrder(res.orders.find((o) => o.id === b.dataset.view)); });
  }
  function viewOrder(o) {
    if (!o) return;
    el('#prodModal').classList.add('is-open');
    el('#prodModal').innerHTML = '<div class="modal__scrim" data-close></div><div class="modal__panel"><div class="modal__head"><h2 class="h4">' + esc(o.orderNumber) + '</h2><button class="icon-btn" data-close aria-label="Close">' + U.icon('x', 18) + '</button></div><div class="modal__body">'
      + '<p class="muted tiny">' + when(o.createdAt) + ' / ' + o.items.length + ' items / ' + o.status + '</p>'
      + o.items.map((i) => '<div class="sum-row"><span>' + esc(i.name) + ' x' + i.quantity + '<br><span class="muted tiny">' + esc(i.size || '') + ' ' + esc(i.color || '') + '</span></span><strong>' + money(i.lineTotal) + '</strong></div>').join('')
      + '<div class="sum-row"><span>Subtotal</span><strong>' + money(o.subtotal) + '</strong></div>'
      + '<div class="sum-row"><span>Shipping</span><strong>' + money(o.shipping) + '</strong></div>'
      + '<div class="sum-row sum-row--total"><span>Total</span><strong>' + money(o.total) + '</strong></div>'
      + '<p class="muted tiny">' + esc((o.customer && o.customer.address) || '') + ', ' + esc((o.customer && o.customer.city) || '') + ', ' + esc((o.customer && o.customer.state) || '') + '</p>'
      + '</div></div>';
    el('#prodModal').querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => el('#prodModal').classList.remove('is-open'); });
  }
  async function loadCustomers() {
    const res = await SG.api.get('/admin/customers');
    const rows = res.customers.map((u) => '<tr><td>' + esc(u.name) + '</td><td>' + esc(u.email) + '</td><td>' + esc(u.phone || '-') + '</td><td>' + when(u.createdAt) + '</td></tr>').join('');
    el('#customerTable').innerHTML = rows ? '<div class="table-wrap"><table class="data"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">No customers yet.</p>';
  }
  document.addEventListener('DOMContentLoaded', () => {
    SG.UI.mount();
    document.querySelectorAll('[data-admin-tab]').forEach((b) => { b.onclick = () => { document.querySelectorAll('[data-admin-tab]').forEach((x) => x.classList.toggle('is-active', x === b)); document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.adminTab; }); }; });
    const np = el('#newProduct'); if (np) np.onclick = () => openForm(null);
    const out = el('#adminOut'); if (out) out.onclick = () => { SG.auth.clear(); location.href = '/account.html'; };
    init().catch((e) => U.toast(e.message, 'error'));
  });
})();
