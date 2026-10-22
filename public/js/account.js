(function () {
  const U = SG.UI;
  const el = (s) => document.querySelector(s);
  let authTab = 'login';

  function setAuthTab(tab) {
    authTab = tab;
    el('#nameField').hidden = tab === 'login';
    el('#phoneField').hidden = tab === 'login';
    el('#authSubmit').textContent = tab === 'login' ? 'Sign in' : 'Create account';
    el('#authMsg').textContent = '';
    document.querySelectorAll('[data-auth-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === tab));
  }

  async function doAuth(e) {
    e.preventDefault();
    const f = e.target;
    const body = { email: f.email.value.trim(), password: f.password.value };
    if (authTab === 'register') { body.name = f.name.value.trim(); body.phone = f.phone.value.trim(); }
    if (!body.email || body.password.length < 6) return U.toast('Check your email and password.');
    const btn = el('#authSubmit');
    btn.disabled = true;
    try {
      const out = await SG.api.post(authTab === 'login' ? '/auth/login' : '/auth/register', body);
      SG.auth.save(out.token, out.user);
      U.toast('Welcome, ' + (out.user.name || 'friend') + '.');
      render();
    } catch (err) {
      el('#authMsg').textContent = err.message;
    } finally { btn.disabled = false; }
  }

  function navHtml(user) {
    const items = [['orders', 'Orders'], ['wishlist', 'Saved pieces'], ['profile', 'Profile'], ['addresses', 'Addresses']];
    return '<div class="account-nav__user"><strong>' + (user.name || 'Account') + '</strong><span>' + user.email + '</span></div>'
      + items.map((i) => '<button data-panel="' + i[0] + '">' + U.icon(i[0] === 'orders' ? 'package' : i[0] === 'wishlist' ? 'heart' : i[0] === 'profile' ? 'user' : 'map-pin', 16) + ' ' + i[1] + '</button>').join('')
      + '<button data-signout>' + U.icon('logout', 16) + ' Sign out</button>';
  }

  async function panel(tab) {
    const p = el('#accountPanel');
    p.innerHTML = '<div class="skeleton skeleton-line" style="width:60%"></div><div class="skeleton skeleton-line" style="width:90%;margin-top:14px"></div>';
    if (tab === 'profile') return paintProfile(p);
    if (tab === 'addresses') return paintAddresses(p);
    if (tab === 'wishlist') return paintWishlist(p);
    return paintOrders(p);
  }

  async function paintOrders(p) {
    const res = await SG.api.get('/orders/mine');
    const orders = res.orders || [];
    if (!orders.length) {
      p.innerHTML = '<div class="empty-state">' + U.icon('package', 30) + '<p>No orders yet. When you place an order it will appear here with live status.</p><a class="btn" href="/shop.html">Start shopping</a></div>';
      return;
    }
    p.innerHTML = orders.map((o) =>
      '<div class="order-card"><div class="order-card__head"><div><strong>' + o.orderNumber + '</strong><span>' + new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + '</span></div><span class="status status--' + o.status + '">' + o.status + '</span></div>'
      + '<div class="order-card__items">' + o.items.map((i) => '<img src="' + i.image + '" alt="' + i.name + '" title="' + i.name + '">').join('') + '</div>'
      + '<div class="order-card__foot"><span>' + o.items.length + ' item' + (o.items.length > 1 ? 's' : '') + ' &middot; ' + SG.money(o.total) + '</span><a class="link-arrow" href="/order.html?ref=' + encodeURIComponent(o.payment.reference) + '">View order</a></div></div>'
    ).join('');
  }

  function paintProfile(p) {
    const u = SG.auth.user() || {};
    p.innerHTML = '<div class="panel-box"><div class="panel-box__head"><h2>Profile details</h2></div><div class="panel-box__body">'
      + '<form id="profileForm" class="form-grid"><label class="field"><span>Full name</span><input class="input" name="name" value="' + (u.name || '') + '" required></label>'
      + '<label class="field"><span>Phone</span><input class="input" name="phone" value="' + (u.phone || '') + '"></label>'
      + '<label class="field field--full"><span>Email</span><input class="input" name="email" value="' + (u.email || '') + '" readonly></label>'
      + '<div class="field field--full"><button class="btn" type="submit">Save changes</button></div></form></div></div>';
    el('#profileForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const out = await SG.api.patch('/auth/me', { name: f.name.value.trim(), phone: f.phone.value.trim() });
        SG.auth.save(SG.auth.token(), out.user);
        U.toast('Profile updated.');
        render();
      } catch (err) { U.toast(err.message); }
    });
  }

  function paintAddresses(p) {
    const u = SG.auth.user() || {};
    const list = u.addresses || [];
    p.innerHTML = '<div class="panel-box"><div class="panel-box__head"><h2>Saved addresses</h2></div><div class="panel-box__body">'
      + (list.length ? list.map((a) => '<div class="addr"><div><strong>' + (a.label || 'Address') + '</strong><span>' + a.line + ', ' + a.city + ', ' + a.state + '</span><span>' + (a.phone || '') + '</span></div><button class="remove-btn" data-del-addr="' + a.id + '">' + U.icon('trash', 16) + '</button></div>').join('') : '<p class="muted">No saved addresses yet.</p>')
      + '</div></div><div class="panel-box" style="margin-top:18px"><div class="panel-box__head"><h2>Add an address</h2></div><div class="panel-box__body">'
      + '<form id="addrForm" class="form-grid"><label class="field"><span>Label</span><input class="input" name="label" placeholder="Home, office" required></label>'
      + '<label class="field"><span>Phone</span><input class="input" name="phone" placeholder="0806 000 0000"></label>'
      + '<label class="field field--full"><span>Street address</span><input class="input" name="line" required></label>'
      + '<label class="field"><span>City</span><input class="input" name="city" required></label>'
      + '<label class="field"><span>State</span><input class="input" name="state" required></label>'
      + '<div class="field field--full"><button class="btn" type="submit">Save address</button></div></form></div></div>';
    el('#addrForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const next = list.concat([{ id: 'a' + Date.now(), label: f.label.value.trim(), line: f.line.value.trim(), city: f.city.value.trim(), state: f.state.value.trim(), phone: f.phone.value.trim() }]);
      try {
        const out = await SG.api.patch('/auth/me', { addresses: next });
        SG.auth.save(SG.auth.token(), out.user);
        U.toast('Address saved.');
        panel('addresses');
      } catch (err) { U.toast(err.message); }
    });
    p.querySelectorAll('[data-del-addr]').forEach((b) => b.addEventListener('click', async () => {
      const next = list.filter((a) => a.id !== b.dataset.delAddr);
      const out = await SG.api.patch('/auth/me', { addresses: next });
      SG.auth.save(SG.auth.token(), out.user);
      panel('addresses');
    }));
  }

  async function paintWishlist(p) {
    const ids = SG.wish.all();
    if (!ids.length) {
      p.innerHTML = '<div class="empty-state">' + U.icon('heart', 30) + '<p>Nothing saved yet. Tap the heart on any piece to keep it here.</p><a class="btn" href="/shop.html">Browse the collection</a></div>';
      return;
    }
    const out = await Promise.all(ids.map((id) => SG.api.get('/products/' + id).then((r) => r.product).catch(() => null)));
    p.innerHTML = '<div class="products products--3">' + out.filter(Boolean).map((x) => U.card(x)).join('') + '</div>';
  }

  async function render() {
    const token = SG.auth.token();
    const user = SG.auth.user();
    const authed = !!(token && user);
    el('#authWrap').hidden = authed;
    el('#dashWrap').hidden = !authed;
    if (!authed) return;
    el('#accountNav').innerHTML = navHtml(user);
    const tab = (location.hash || '#orders').replace('#', '');
    el('#accountNav').querySelectorAll('[data-panel]').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.panel === tab);
      b.addEventListener('click', () => { location.hash = b.dataset.panel; panel(b.dataset.panel); el('#accountNav').querySelectorAll('[data-panel]').forEach((x) => x.classList.toggle('is-active', x === b)); });
    });
    el('#accountNav').querySelector('[data-signout]').addEventListener('click', () => { SG.auth.clear(); location.href = '/'; });
    panel(tab);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    SG.UI.mount();
    if (document.body.dataset.page !== 'account') return;
    if (el('#authTabs')) {
      el('#authTabs').addEventListener('click', (e) => {
        const b = e.target.closest('[data-auth-tab]');
        if (!b) return;
        setAuthTab(b.dataset.authTab);
      });
    }
    if (el('#authForm')) el('#authForm').addEventListener('submit', doAuth);
    render();
  });
})();
