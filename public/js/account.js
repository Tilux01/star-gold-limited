(function () {
  const U = SG.UI;
  const el = (s) => document.querySelector(s);
  let authTab = 'login';

  const AUTH_COPY = {
    login: {
      eyebrow: 'Client access',
      title: 'Welcome back',
      sub: 'Sign in to follow your orders, revisit saved pieces and keep your delivery details on file.',
      submit: 'Sign in',
      pass: 'Your password'
    },
    register: {
      eyebrow: 'Become a client',
      title: 'Open your account',
      sub: 'Create an account for faster checkout, private client pricing and a record of every order.',
      submit: 'Create account',
      pass: 'At least 6 characters'
    }
  };

  function setAuthTab(tab) {
    authTab = tab;
    const copy = AUTH_COPY[tab];
    el('#nameField').hidden = tab === 'login';
    el('#phoneField').hidden = tab === 'login';
    el('#authTabs').dataset.tab = tab;
    el('#authEyebrow').textContent = copy.eyebrow;
    el('#authTitle').textContent = copy.title;
    el('#authSub').textContent = copy.sub;
    el('#authSubmitLabel').textContent = copy.submit;
    el('#authPassword').placeholder = copy.pass;
    el('#authPassword').setAttribute('autocomplete', tab === 'login' ? 'current-password' : 'new-password');
    const msg = el('#authMsg');
    msg.textContent = '';
    msg.className = 'auth-alt';
    document.querySelectorAll('[data-auth-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === tab));
  }

  document.querySelectorAll('[data-auth-tab]').forEach((b) => {
    b.addEventListener('click', () => setAuthTab(b.dataset.authTab));
  });

  function paintReveal(btn) {
    const shown = btn.getAttribute('aria-pressed') === 'true';
    btn.innerHTML = shown
      ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.4 5.3A9.4 9.4 0 0121 12a9.9 9.9 0 01-2.2 2.9"/><path d="M6.2 6.6A9.9 9.9 0 003 12a9.4 9.4 0 006.3 5.6"/></svg>'
      : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';
    btn.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
  }

  const revealBtn = el('#authReveal');
  if (revealBtn) {
    paintReveal(revealBtn);
    revealBtn.addEventListener('click', () => {
      const input = el('#authPassword');
      const shown = revealBtn.getAttribute('aria-pressed') === 'true';
      revealBtn.setAttribute('aria-pressed', shown ? 'false' : 'true');
      input.type = shown ? 'password' : 'text';
      paintReveal(revealBtn);
      input.focus();
    });
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
      const msg = el('#authMsg');
      msg.textContent = err.message;
      msg.className = 'auth-alt is-error';
    } finally { btn.disabled = false; }
  }

  function navHtml(user) {
    const items = [['orders', 'Orders'], ['wishlist', 'Saved pieces'], ['profile', 'Profile'], ['addresses', 'Addresses'], ['settings', 'Settings']];
    return '<div class="account-nav__user"><strong>' + (user.name || 'Account') + '</strong><span>' + user.email + '</span></div>'
      + items.map((i) => '<button data-panel="' + i[0] + '">' + U.icon(i[0] === 'orders' ? 'package' : i[0] === 'wishlist' ? 'heart' : i[0] === 'profile' ? 'user' : i[0] === 'settings' ? 'sliders' : 'map-pin', 16) + ' ' + i[1] + '</button>').join('')
      + '<button data-signout>' + U.icon('logout', 16) + ' Sign out</button>';
  }

  async function panel(tab) {
    const p = el('#accountPanel');
    p.innerHTML = '<div class="skeleton skeleton-line" style="width:60%"></div><div class="skeleton skeleton-line" style="width:90%;margin-top:14px"></div>';
    if (tab === 'profile') return paintProfile(p);
    if (tab === 'settings') return paintSettings(p);
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
      '<div class="order-card"><div class="order-card__head"><div><strong>' + o.orderNumber + '</strong><span>' + new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + '</span></div><span class="status status--' + o.status + '">' + U.status(o.status) + '</span></div>'
      + '<div class="order-card__items">' + o.items.map((i) => '<img src="' + i.image + '" alt="' + i.name + '" title="' + i.name + '">').join('') + '</div>'
      + '<div class="order-card__foot"><span>' + o.items.length + ' item' + (o.items.length > 1 ? 's' : '') + ' &middot; ' + SG.money(o.total) + '</span><a class="link-arrow" href="/order.html?ref=' + encodeURIComponent(o.payment.reference) + '">View order</a></div></div>'
    ).join('');
  }

  function bindSettings(p, prefs, u) {
    const f = el('#passwordForm');
    if (f) f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (f.next.value.length < 6) return U.toast('Use at least 6 characters.');
      if (f.next.value !== f.confirm.value) return U.toast('New passwords do not match.');
      try {
        await SG.api.post('/auth/password', { currentPassword: f.current.value, newPassword: f.next.value });
        f.reset();
        U.toast('Password updated.');
      } catch (err) { U.toast(err.message || 'Could not update password.'); }
    });
    p.querySelectorAll('.toggle-row input').forEach((input) => input.addEventListener('change', () => {
      const next = Object.assign({}, prefs);
      next[input.name] = input.checked;
      localStorage.setItem('sg.prefs', JSON.stringify(next));
      U.toast('Preference saved.');
    }));
  }
  function prefsHtml(u, prefs) {
    const row = (name, on, t, d) => '<label class="toggle-row"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span><strong>' + t + '</strong><em>' + d + '</em></span></label>';
    return row('wa', prefs.wa !== false, 'WhatsApp updates', 'Dispatch and delivery notes on ' + (u.phone || 'your phone'))
      + row('news', !!prefs.news, 'New arrivals', 'Occasional drops and private sales by email')
      + row('stock', prefs.stock !== false, 'Back in stock', 'Tell me when a saved piece returns');
  }
  function paintSettings(p) {
    const u = SG.auth.user() || {};
    const prefs = JSON.parse(localStorage.getItem('sg.prefs') || '{}');
    const box = (t, d, b) => '<div class="panel-box"><div class="panel-box__head"><h2>' + t + '</h2><p>' + d + '</p></div><div class="panel-box__body">' + b + '</div></div>';
    p.innerHTML = box('Security', 'Update the password used to sign in to your account.',
      '<form id="passwordForm" class="form-grid" novalidate>'
      + '<label class="field field--full"><span>Current password</span><input class="input" type="password" name="current" required autocomplete="current-password"></label>'
      + '<label class="field"><span>New password</span><input class="input" type="password" name="next" required minlength="6" autocomplete="new-password"></label>'
      + '<label class="field"><span>Confirm new password</span><input class="input" type="password" name="confirm" required minlength="6" autocomplete="new-password"></label>'
      + '<div class="field field--full"><button class="btn btn--gold" type="submit">Update password</button></div></form>')
      + box('Order updates', 'Choose how we reach you about deliveries.', prefsHtml(u, prefs))
      + box('Store & support', 'Reach the shop directly.', '<p class="muted-note">' + SG.BIZ.address + '</p><p class="muted-note"><a href="tel:' + SG.BIZ.phonePrimary + '">' + SG.BIZ.phonePrimary + '</a> · <a href="tel:' + SG.BIZ.phoneSecondary + '">' + SG.BIZ.phoneSecondary + '</a></p><p class="muted-note"><a href="mailto:' + SG.BIZ.email + '">' + SG.BIZ.email + '</a></p>');
    bindSettings(p, prefs, u);
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
      + (list.length ? list.map((a) => '<div class="addr"><div><strong>' + (a.label || 'Address') + '</strong><span>' + (a.address || a.line) + (a.city ? ', ' + a.city : '') + ', ' + a.state + '</span><span>' + (a.phone || '') + '</span></div><button class="remove-btn" data-del-addr="' + a.id + '">' + U.icon('trash', 16) + '</button></div>').join('') : '<p class="muted">No saved addresses yet.</p>')
      + '</div></div><div class="panel-box" style="margin-top:18px"><div class="panel-box__head"><h2>Add an address</h2></div><div class="panel-box__body">'
      + '<form id="addrForm" class="form-grid"><label class="field"><span>Label</span><input class="input" name="label" placeholder="Home, office" required></label>'
      + '<label class="field"><span>Phone</span><input class="input" name="phone" placeholder="0806 000 0000"></label>'
      + '<label class="field field--full"><span>Street address</span><input class="input" name="address" required></label>'
      + '<label class="field"><span>City</span><input class="input" name="city" required></label>'
      + '<label class="field"><span>State</span><input class="input" name="state" required></label>'
      + '<div class="field field--full"><button class="btn" type="submit">Save address</button></div></form></div></div>';
    el('#addrForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const next = list.concat([{ id: 'a' + Date.now(), label: f.label.value.trim(), address: f.address.value.trim(), city: f.city.value.trim(), state: f.state.value.trim(), phone: f.phone.value.trim() }]);
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

  document.addEventListener('DOMContentLoaded', () => {
    const boot = () => {
      const authWrap = el('#authWrap');
      if (authWrap) authWrap.hidden = false;
      render().catch(() => { if (authWrap) authWrap.hidden = false; const d = el('#dashWrap'); if (d) d.hidden = true; });
    };
    try { SG.UI.mount(); } catch (e) {}
    if (document.body.dataset.page && document.body.dataset.page !== 'account') return;
    if (el('#authTabs')) {
      el('#authTabs').addEventListener('click', (e) => {
        const b = e.target.closest('[data-auth-tab]');
        if (!b) return;
        setAuthTab(b.dataset.authTab);
      });
    }
    if (el('#authForm')) el('#authForm').addEventListener('submit', doAuth);
    boot();
  });
})();
