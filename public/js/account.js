(function () {
  const U = SG.UI;
  const el = (s) => document.querySelector(s);
  let authTab = 'login';
  let hashListenerAttached = false;

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
    const nameField = el('#nameField');
    const phoneField = el('#phoneField');
    if (nameField) nameField.hidden = tab === 'login';
    if (phoneField) phoneField.hidden = tab === 'login';
    const authTabs = el('#authTabs');
    if (authTabs) authTabs.dataset.tab = tab;
    const eyebrow = el('#authEyebrow');
    if (eyebrow) eyebrow.textContent = copy.eyebrow;
    const title = el('#authTitle');
    if (title) title.textContent = copy.title;
    const sub = el('#authSub');
    if (sub) sub.textContent = copy.sub;
    const submitLabel = el('#authSubmitLabel');
    if (submitLabel) submitLabel.textContent = copy.submit;
    const passInput = el('#authPassword');
    if (passInput) {
      passInput.placeholder = copy.pass;
      passInput.setAttribute('autocomplete', tab === 'login' ? 'current-password' : 'new-password');
    }
    const msg = el('#authMsg');
    if (msg) {
      msg.textContent = '';
      msg.className = 'auth-alt';
    }
    document.querySelectorAll('[data-auth-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.authTab === tab));
  }

  function paintReveal(btn) {
    const shown = btn.getAttribute('aria-pressed') === 'true';
    btn.innerHTML = shown
      ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 002.8 2.8"/><path d="M9.4 5.3A9.4 9.4 0 0121 12a9.9 9.9 0 01-2.2 2.9"/><path d="M6.2 6.6A9.9 9.9 0 003 12a9.4 9.4 0 006.3 5.6"/></svg>'
      : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';
    btn.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
  }

  async function doAuth(e) {
    e.preventDefault();
    const f = e.target;
    const body = { email: f.email.value.trim(), password: f.password.value };
    if (authTab === 'register') {
      body.name = f.name.value.trim();
      body.phone = f.phone.value.trim();
    }
    if (!body.email || body.password.length < 6) return U.toast('Check your email and password.');
    const btn = el('#authSubmit');
    if (btn) btn.disabled = true;
    try {
      const out = await SG.api.post(authTab === 'login' ? '/auth/login' : '/auth/register', body);
      SG.auth.save(out.token, out.user);
      U.toast('Welcome, ' + (out.user.name || 'friend') + '.');
      render();
    } catch (err) {
      const msg = el('#authMsg');
      if (msg) {
        msg.textContent = err.message || 'Authentication failed.';
        msg.className = 'auth-alt is-error';
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function navHtml(user) {
    const items = [
      ['orders', 'Orders'],
      ['wishlist', 'Saved pieces'],
      ['profile', 'Profile'],
      ['addresses', 'Addresses'],
      ['settings', 'Settings']
    ];
    return '<div class="account-nav__user"><strong id="dashUserName">' + SG.escapeHtml(user.name || 'Account') + '</strong><span>' + SG.escapeHtml(user.email || '') + '</span></div>'
      + items.map((i) => '<button type="button" data-panel="' + i[0] + '">' + U.icon(i[0] === 'orders' ? 'package' : i[0] === 'wishlist' ? 'heart' : i[0] === 'profile' ? 'user' : i[0] === 'settings' ? 'sliders' : 'map-pin', 16) + ' ' + i[1] + '</button>').join('')
      + '<button type="button" data-signout>' + U.icon('logout', 16) + ' Sign out</button>';
  }

  function switchTab(tab) {
    const valid = ['orders', 'wishlist', 'profile', 'addresses', 'settings'];
    const active = valid.includes(tab) ? tab : 'orders';
    const nav = el('#accountNav');
    if (nav) {
      nav.querySelectorAll('[data-panel]').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.panel === active);
      });
    }
    panel(active);
  }

  async function panel(tab) {
    const p = el('#accountPanel');
    if (!p) return;
    p.classList.add('is-active');
    p.innerHTML = '<div class="skeleton skeleton-line" style="width:50%;height:22px;border-radius:6px"></div><div class="skeleton skeleton-line" style="width:85%;height:16px;margin-top:14px;border-radius:6px"></div><div class="skeleton skeleton-line" style="width:70%;height:16px;margin-top:10px;border-radius:6px"></div>';
    try {
      if (tab === 'profile') return await paintProfile(p);
      if (tab === 'settings') return await paintSettings(p);
      if (tab === 'addresses') return await paintAddresses(p);
      if (tab === 'wishlist') return await paintWishlist(p);
      return await paintOrders(p);
    } catch (err) {
      console.error('Error rendering dashboard tab:', tab, err);
      p.innerHTML = '<div class="panel-box"><div class="panel-box__head"><h2>Unable to load section</h2></div><div class="panel-box__body"><p class="muted">' + SG.escapeHtml(err.message || 'An error occurred while loading this view.') + '</p><button class="btn btn--gold" type="button" style="margin-top:14px" onclick="location.reload()">Reload page</button></div></div>';
    }
  }

  let orderPage = 1;
  const ORDER_PAGE_SIZE = 5;
  let wishPage = 1;
  const WISH_PAGE_SIZE = 6;

  function buildAccountPaging(total, pageSize, currentPage, attrName) {
    const totalPages = Math.ceil(total / pageSize) || 1;
    if (totalPages <= 1) return '';
    let html = '<div class="pagination" style="margin-top:20px;display:flex;align-items:center;justify-content:center;gap:6px">';
    if (currentPage > 1) html += '<button type="button" class="page-btn" ' + attrName + '="' + (currentPage - 1) + '">&larr; Prev</button>';
    for (let i = 1; i <= totalPages; i++) {
      html += '<button type="button" class="page-btn' + (i === currentPage ? ' is-active' : '') + '" ' + attrName + '="' + i + '">' + i + '</button>';
    }
    if (currentPage < totalPages) html += '<button type="button" class="page-btn" ' + attrName + '="' + (currentPage + 1) + '">Next &rarr;</button>';
    html += '</div>';
    return html;
  }

  async function paintOrders(p) {
    let orders = [];
    try {
      const res = await SG.api.get('/orders/mine');
      orders = (res && res.orders) || [];
    } catch (err) {
      console.warn('Orders fetch error:', err);
      orders = [];
    }

    if (!orders.length) {
      p.innerHTML = '<div class="empty-state">' + U.icon('package', 32)
        + '<h3>No orders placed yet</h3>'
        + '<p>When you place an order with Star Gold Limited, it will appear here with live tracking, delivery updates and digital receipts.</p>'
        + '<a class="btn btn--gold" href="/shop.html" style="margin-top:14px">Explore the collection</a></div>';
      return;
    }

    const totalPages = Math.ceil(orders.length / ORDER_PAGE_SIZE) || 1;
    if (orderPage > totalPages) orderPage = totalPages;
    const paged = orders.slice((orderPage - 1) * ORDER_PAGE_SIZE, orderPage * ORDER_PAGE_SIZE);

    p.innerHTML = '<div class="order-cards">' + paged.map((o) => {
      const items = o.items || [];
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
      const orderRef = (o.payment && o.payment.reference) || o.reference || o.orderNumber || o.id;
      const statusText = (U.status && U.status(o.status)) || o.status || 'Pending';
      const orderTotal = SG.money(o.total || 0);

      return '<div class="order-card-item">'
        + '<div class="order-card-item__head">'
        + '<div><strong>#' + SG.escapeHtml(o.orderNumber || o.id) + '</strong><span class="muted" style="margin-left:10px;font-size:12px">' + dateStr + '</span></div>'
        + '<span class="pill ' + SG.escapeHtml(o.status || 'pending') + '">' + SG.escapeHtml(statusText) + '</span>'
        + '</div>'
        + '<div class="order-card-item__body">'
        + '<div class="order-card-item__thumbs">'
        + items.map((i) => {
          const raw = i.image || '/assets/placeholder.svg';
          const src = SG.UI && SG.UI.thumb ? SG.UI.thumb(raw, 96) : raw;
          return '<img src="' + src + '" alt="' + SG.escapeHtml(i.name || '') + '" title="' + SG.escapeHtml(i.name || '') + '" loading="lazy" decoding="async">';
        }).join('')
        + '</div>'
        + '<div class="order-card-item__meta">'
        + '<span>' + items.length + ' item' + (items.length > 1 ? 's' : '') + ' &middot; <strong>' + orderTotal + '</strong></span>'
        + '<a class="btn btn--sm btn--gold" href="/order.html?ref=' + encodeURIComponent(orderRef) + '">View order &rarr;</a>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join('') + '</div>' + buildAccountPaging(orders.length, ORDER_PAGE_SIZE, orderPage, 'data-order-pg');

    p.querySelectorAll('[data-order-pg]').forEach((b) => {
      b.addEventListener('click', () => {
        orderPage = Number(b.getAttribute('data-order-pg'));
        paintOrders(p);
        p.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function bindSettings(p, prefs, u) {
    const f = el('#passwordForm');
    if (f) {
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = f.current.value;
        const next = f.next.value;
        const confirm = f.confirm.value;
        if (!current) return U.toast('Enter your current password.');
        if (next.length < 6) return U.toast('Use at least 6 characters for the new password.');
        if (next !== confirm) return U.toast('New passwords do not match.');
        const btn = f.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          await SG.api.post('/auth/password', { currentPassword: current, newPassword: next });
          f.reset();
          U.toast('Password updated successfully.');
        } catch (err) {
          U.toast(err.message || 'Could not update password.');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    p.querySelectorAll('.toggle-row input').forEach((input) => {
      input.addEventListener('change', () => {
        const next = Object.assign({}, prefs);
        next[input.name] = input.checked;
        localStorage.setItem('sg.prefs', JSON.stringify(next));
        U.toast('Preference updated.');
      });
    });
  }

  function prefsHtml(u, prefs) {
    const row = (name, on, t, d) => '<label class="toggle-row"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span><strong>' + t + '</strong><em>' + d + '</em></span></label>';
    return row('wa', prefs.wa !== false, 'WhatsApp notifications', 'Order dispatch and delivery notes sent to ' + (u.phone || 'your phone'))
      + row('news', !!prefs.news, 'New arrivals & private previews', 'Occasional announcements and VIP sale invitations by email')
      + row('stock', prefs.stock !== false, 'Restock alerts', 'Notify me when an out-of-stock saved piece returns');
  }

  function paintSettings(p) {
    const u = SG.auth.user() || {};
    const prefs = JSON.parse(localStorage.getItem('sg.prefs') || '{}');
    const biz = SG.BIZ || {};
    const primaryPhone = biz.phonePretty || biz.phonePrimary || biz.phone || '0806 349 4273';
    const secondaryPhone = biz.phone2Pretty || biz.phoneSecondary || biz.phone2 || '0803 387 6440';
    const email = biz.email || 'igbokweify390@yahoo.com';
    const address = biz.address || 'Shop GF09/FF27, 11 Breadfruit Street, Ajao Plaza, Balogun, Lagos Island, Lagos';

    const box = (t, d, b) => '<div class="panel-box"><div class="panel-box__head"><h2>' + t + '</h2><p class="muted">' + d + '</p></div><div class="panel-box__body">' + b + '</div></div>';

    p.innerHTML = box('Security & Password', 'Update the password used to sign in to your Star Gold account.',
      '<form id="passwordForm" class="form-grid" novalidate>'
      + '<label class="field field--full"><span>Current password</span><input class="input" type="password" name="current" required autocomplete="current-password" placeholder="Enter current password"></label>'
      + '<label class="field"><span>New password</span><input class="input" type="password" name="next" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters"></label>'
      + '<label class="field"><span>Confirm new password</span><input class="input" type="password" name="confirm" required minlength="6" autocomplete="new-password" placeholder="Re-type new password"></label>'
      + '<div class="field field--full"><button class="btn btn--gold" type="submit">Update password</button></div></form>')
      + box('Order & Notification updates', 'Choose how you would like our concierge desk to communicate with you.', prefsHtml(u, prefs))
      + box('Atelier & Concierge support', 'Reach our physical boutique or concierge desk directly.',
        '<p class="muted-note" style="margin-bottom:8px"><strong>Boutique Address:</strong> ' + SG.escapeHtml(address) + '</p>'
        + '<p class="muted-note" style="margin-bottom:8px"><strong>Phone:</strong> <a href="tel:' + primaryPhone.replace(/\s+/g, '') + '">' + primaryPhone + '</a> &middot; <a href="tel:' + secondaryPhone.replace(/\s+/g, '') + '">' + secondaryPhone + '</a></p>'
        + '<p class="muted-note" style="margin-bottom:8px"><strong>Email:</strong> <a href="mailto:' + email + '">' + email + '</a></p>'
        + '<p class="muted-note"><strong>WhatsApp:</strong> <a href="https://wa.me/2348063494273" target="_blank" rel="noopener">Message Concierge on WhatsApp &rarr;</a></p>');

    bindSettings(p, prefs, u);
  }

  function paintProfile(p) {
    const u = SG.auth.user() || {};
    p.innerHTML = '<div class="panel-box">'
      + '<div class="panel-box__head"><h2>Profile details</h2><p class="muted">Manage your personal information for orders and communications.</p></div>'
      + '<div class="panel-box__body">'
      + '<form id="profileForm" class="form-grid">'
      + '<label class="field"><span>Full name</span><input class="input" name="name" value="' + SG.escapeHtml(u.name || '') + '" required placeholder="Your full name"></label>'
      + '<label class="field"><span>Phone number</span><input class="input" name="phone" value="' + SG.escapeHtml(u.phone || '') + '" placeholder="0806 000 0000"></label>'
      + '<label class="field field--full"><span>Email address</span><input class="input" name="email" value="' + SG.escapeHtml(u.email || '') + '" readonly style="background:var(--bone);cursor:not-allowed" title="Email cannot be changed directly"></label>'
      + '<div class="field field--full"><button class="btn btn--gold" type="submit">Save changes</button></div>'
      + '</form></div></div>';

    const form = el('#profileForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          const out = await SG.api.patch('/auth/me', { name: f.name.value.trim(), phone: f.phone.value.trim() });
          SG.auth.save(SG.auth.token(), out.user);
          const userNameEl = el('#dashUserName');
          if (userNameEl) userNameEl.textContent = out.user.name || 'Account';
          U.toast('Profile updated successfully.');
        } catch (err) {
          U.toast(err.message || 'Could not update profile.');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }
  }

  function paintAddresses(p) {
    const u = SG.auth.user() || {};
    const list = u.addresses || [];

    p.innerHTML = '<div class="panel-box">'
      + '<div class="panel-box__head"><h2>Saved delivery addresses</h2><p class="muted">Keep up to 6 addresses on file for effortless checkout.</p></div>'
      + '<div class="panel-box__body">'
      + (list.length
        ? '<div class="addr-grid">' + list.map((a) =>
            '<div class="addr-card">'
            + '<strong>' + SG.escapeHtml(a.label || 'Address') + '</strong>'
            + '<span>' + SG.escapeHtml(a.address || a.line1 || '') + '</span>'
            + '<span>' + SG.escapeHtml([a.city, a.state].filter(Boolean).join(', ')) + '</span>'
            + (a.phone ? '<span class="muted">' + SG.escapeHtml(a.phone) + '</span>' : '')
            + '<div class="addr-card__actions">'
            + '<button type="button" data-del-addr="' + SG.escapeHtml(a.id) + '">' + U.icon('trash', 14) + ' Delete address</button>'
            + '</div>'
            + '</div>'
          ).join('') + '</div>'
        : '<p class="muted">No saved addresses yet. Add your primary delivery address below.</p>')
      + '</div></div>'
      + '<div class="panel-box" style="margin-top:20px">'
      + '<div class="panel-box__head"><h2>Add new address</h2><p class="muted">Enter your preferred Nigerian delivery location.</p></div>'
      + '<div class="panel-box__body">'
      + '<form id="addrForm" class="form-grid">'
      + '<label class="field"><span>Address label</span><input class="input" name="label" placeholder="e.g. Home, Office, Lagos Studio" required></label>'
      + '<label class="field"><span>Contact phone</span><input class="input" name="phone" placeholder="0806 349 4273" required></label>'
      + '<label class="field field--full"><span>Street address</span><input class="input" name="address" placeholder="e.g. 11 Breadfruit Street, Ajao Plaza" required></label>'
      + '<label class="field"><span>City / Area</span><input class="input" name="city" placeholder="e.g. Lagos Island" required></label>'
      + '<label class="field"><span>State</span><input class="input" name="state" placeholder="e.g. Lagos" required></label>'
      + '<div class="field field--full"><button class="btn btn--gold" type="submit">Save address</button></div>'
      + '</form></div></div>';

    const addrForm = el('#addrForm');
    if (addrForm) {
      addrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const btn = f.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        const newAddr = {
          id: 'a' + Date.now(),
          label: f.label.value.trim(),
          address: f.address.value.trim(),
          line1: f.address.value.trim(),
          city: f.city.value.trim(),
          state: f.state.value.trim(),
          phone: f.phone.value.trim()
        };
        const next = list.concat([newAddr]);

        try {
          const out = await SG.api.patch('/auth/me', { addresses: next });
          SG.auth.save(SG.auth.token(), out.user);
          U.toast('Address saved successfully.');
          paintAddresses(p);
        } catch (err) {
          U.toast(err.message || 'Could not save address.');
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }

    p.querySelectorAll('[data-del-addr]').forEach((b) => {
      b.addEventListener('click', async () => {
        const addrId = b.dataset.delAddr;
        const next = list.filter((a) => a.id !== addrId);
        b.disabled = true;
        try {
          const out = await SG.api.patch('/auth/me', { addresses: next });
          SG.auth.save(SG.auth.token(), out.user);
          U.toast('Address removed.');
          paintAddresses(p);
        } catch (err) {
          U.toast(err.message || 'Could not remove address.');
          b.disabled = false;
        }
      });
    });
  }

  async function paintWishlist(p) {
    const ids = SG.wish ? SG.wish.all() : [];
    if (!ids || !ids.length) {
      p.innerHTML = '<div class="empty-state">' + U.icon('heart', 32)
        + '<h3>No saved pieces yet</h3>'
        + '<p>Tap the heart icon on any piece while browsing to curate your private wishlist here.</p>'
        + '<a class="btn btn--gold" href="/shop.html" style="margin-top:14px">Browse collection</a></div>';
      return;
    }

    p.innerHTML = '<div class="skeleton skeleton-line" style="width:40%;height:20px;border-radius:6px"></div><div class="skeleton skeleton-line" style="width:70%;height:16px;margin-top:12px;border-radius:6px"></div>';

    try {
      const items = await Promise.all(
        ids.map((id) => SG.api.get('/products/' + id).then((r) => r.product).catch(() => null))
      );
      const valid = items.filter(Boolean);

      if (!valid.length) {
        p.innerHTML = '<div class="empty-state">' + U.icon('heart', 32)
          + '<h3>No saved pieces yet</h3>'
          + '<p>The pieces you saved are no longer available. Explore our newest arrivals to find your next piece.</p>'
          + '<a class="btn btn--gold" href="/shop.html" style="margin-top:14px">Explore shop</a></div>';
        return;
      }

      const totalPages = Math.ceil(valid.length / WISH_PAGE_SIZE) || 1;
      if (wishPage > totalPages) wishPage = totalPages;
      const paged = valid.slice((wishPage - 1) * WISH_PAGE_SIZE, wishPage * WISH_PAGE_SIZE);

      p.innerHTML = '<div class="panel-box">'
        + '<div class="panel-box__head"><h2>Saved pieces (' + valid.length + ')</h2><p class="muted">Your privately curated selection of luxury pieces.</p></div>'
        + '<div class="panel-box__body"><div class="products products--3">'
        + paged.map((x) => U.card(x)).join('')
        + '</div>'
        + buildAccountPaging(valid.length, WISH_PAGE_SIZE, wishPage, 'data-wish-pg')
        + '</div></div>';

      p.querySelectorAll('[data-wish-pg]').forEach((b) => {
        b.addEventListener('click', () => {
          wishPage = Number(b.getAttribute('data-wish-pg'));
          paintWishlist(p);
          p.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } catch (err) {
      console.warn('Wishlist error:', err);
      p.innerHTML = '<div class="empty-state"><p class="muted">Unable to load your saved pieces right now.</p><button class="btn btn--gold" type="button" onclick="location.reload()">Retry</button></div>';
    }
  }

  async function render() {
    const token = SG.auth.token();
    const user = SG.auth.user();
    const authed = !!(token && user);

    const authWrap = el('#authWrap');
    const dashWrap = el('#dashWrap');
    if (authWrap) authWrap.hidden = authed;
    if (dashWrap) dashWrap.hidden = !authed;

    if (!authed) return;

    const nav = el('#accountNav');
    if (nav) {
      nav.innerHTML = navHtml(user);
      nav.querySelectorAll('[data-panel]').forEach((b) => {
        b.addEventListener('click', () => {
          const target = b.dataset.panel;
          if (location.hash === '#' + target) {
            switchTab(target);
          } else {
            location.hash = target;
          }
        });
      });

      const signoutBtn = nav.querySelector('[data-signout]');
      if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
          SG.auth.clear();
          location.href = '/';
        });
      }
    }

    if (!hashListenerAttached) {
      window.addEventListener('hashchange', () => {
        const hash = (location.hash || '#orders').replace('#', '') || 'orders';
        switchTab(hash);
      });
      hashListenerAttached = true;
    }

    const currentTab = (location.hash || '#orders').replace('#', '') || 'orders';
    switchTab(currentTab);
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { SG.UI.mount(); } catch (e) {}
    if (document.body.dataset.page && document.body.dataset.page !== 'account') return;

    const revealBtn = el('#authReveal');
    if (revealBtn) {
      paintReveal(revealBtn);
      revealBtn.addEventListener('click', () => {
        const input = el('#authPassword');
        if (!input) return;
        const shown = revealBtn.getAttribute('aria-pressed') === 'true';
        revealBtn.setAttribute('aria-pressed', shown ? 'false' : 'true');
        input.type = shown ? 'password' : 'text';
        paintReveal(revealBtn);
        input.focus();
      });
    }

    const authTabs = el('#authTabs');
    if (authTabs) {
      authTabs.addEventListener('click', (e) => {
        const b = e.target.closest('[data-auth-tab]');
        if (!b) return;
        setAuthTab(b.dataset.authTab);
      });
    }

    const authForm = el('#authForm');
    if (authForm) authForm.addEventListener('submit', doAuth);

    render().catch((err) => {
      console.error('Account render error:', err);
      const authWrap = el('#authWrap');
      if (authWrap) authWrap.hidden = false;
      const dashWrap = el('#dashWrap');
      if (dashWrap) dashWrap.hidden = true;
    });
  });
})();
