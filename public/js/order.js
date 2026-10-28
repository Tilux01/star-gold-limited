(function () {
  const U = SG.UI, el = (id) => document.getElementById(id), money = SG.money;
  const params = new URLSearchParams(location.search);
  const saved = JSON.parse(localStorage.getItem('sg.lastOrder') || '{}');
  const ref = params.get('ref') || saved.ref || '';
  const statusText = { pending: 'Awaiting payment', paid: 'Payment received', processing: 'In preparation', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };
  function row(label, value, strong) {
    return '<div class="sum-row' + (strong ? ' sum-row--total' : '') + '"><span>' + label + '</span><span>' + value + '</span></div>';
  }
  function load() {
    if (!ref) {
      el('orderBody').innerHTML = '<div class="empty-state">' + U.icon('bag', 26) + '<p>No order reference found.<br>Open your account to see past orders.</p><a class="btn btn--outline" href="/account.html">Go to account</a></div>';
      return;
    }
    SG.api.get('/orders/lookup?ref=' + encodeURIComponent(ref)).then(function (data) {
      SG.__order = data;
      render(data);
    }).catch(function (err) {
      el('orderBody').innerHTML = '<div class="empty-state">' + U.icon('alert', 26) + '<p>' + err.message + '</p></div>';
    });
  }
  function render(data) {
    const o = data.order, cust = o.customer || {};
    const items = (o.items || []).map((it) => '<div class="line-item">'
      + '<a class="line-item__media" href="/product.html?p=' + it.productId + '"><img src="' + it.image + '" alt="' + it.name + '"></a>'
      + '<div class="line-item__mid"><p class="line-item__name">' + it.name + '</p>'
      + '<p class="line-item__meta">' + (it.size || 'One size') + ' / ' + (it.color || 'Default') + ' / Qty ' + it.quantity + '</p></div>'
      + '<div class="line-item__right"><span class="line-item__price">' + SG.money(it.lineTotal) + '</span></div></div>').join('');
    const wa = SGChrome.WA + '?text=' + encodeURIComponent(data.whatsapp || '');
    const address = [cust.address, cust.city, cust.state].filter(Boolean).join(', ');
    el('orderTitle').textContent = 'Thank you, ' + (cust.name || 'friend').split(' ')[0];
    el('orderSub').textContent = 'Order ' + o.orderNumber + ' - ' + (statusText[o.status] || o.status) + '.';
    el('orderBody').innerHTML = '<div class="panel-box"><div class="panel-box__head"><h2>Summary</h2><span class="status status--' + o.status + '">' + (statusText[o.status] || o.status) + '</span></div>'
      + '<div class="panel-box__body"><div class="order-meta">'
      + '<div><span>Order number</span><strong>' + o.orderNumber + '</strong></div>'
      + '<div><span>Placed</span><strong>' + new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) + '</strong></div>'
      + '<div><span>Payment</span><strong>' + (o.payment && o.payment.status === 'paid' ? 'Paid' : 'Pending') + '</strong></div></div>'
      + '<div class="order-items">' + items + '</div>'
      + row('Subtotal', SG.money(o.subtotal))
      + (o.discount ? row('Discount', '-' + SG.money(o.discount)) : '')
      + row('Delivery', o.shipping ? SG.money(o.shipping) : 'Complimentary')
      + row('Total', SG.money(o.total), true)
      + row('Deliver to', address || 'To be confirmed') + '</div></div>'
      + '<div class="order-actions"><a class="btn" target="_blank" rel="noopener" href="' + wa + '">' + U.icon('whatsapp', 18) + ' Send order on WhatsApp</a>'
      + '<a class="btn btn--outline" href="/shop.html">Continue shopping</a>'
      + (o.status === 'pending' && o.payment && o.payment.provider === 'test' ? '<button class="btn btn--gold" id="payNow">Complete test payment</button>' : '')
      + '</div>';
    const btn = el('payNow');
    if (btn) btn.addEventListener('click', function () {
      btn.disabled = true; btn.textContent = 'Processing...';
      SG.api.post('/payments/mark-paid', { reference: ref }).then(function () { U.toast('Payment confirmed'); load(); }).catch(function (e) { U.toast(e.message); btn.disabled = false; btn.textContent = 'Complete test payment'; });
    });
  }
  document.addEventListener('DOMContentLoaded', function () { SG.UI.mount(); load(); });
})();
