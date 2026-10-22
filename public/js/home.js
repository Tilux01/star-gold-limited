(function () {
  const U = SG.UI;
  const go = function (url) { window.location.href = url; };

  document.addEventListener('DOMContentLoaded', function () {
    U.mount();

    const slides = Array.from(document.querySelectorAll('.hero__slide'));
    const dots = Array.from(document.querySelectorAll('.hero__dot'));
    const counter = document.getElementById('heroCount');
    let index = 0;
    let timer = null;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === index); });
      if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () { show(index + 1); }, 6500);
    }

    if (slides.length) {
      show(0);
      play();
      dots.forEach(function (d, n) {
        d.addEventListener('click', function () { show(n); play(); });
      });
      const next = document.getElementById('heroNext');
      const prev = document.getElementById('heroPrev');
      if (next) next.addEventListener('click', function () { show(index + 1); play(); });
      if (prev) prev.addEventListener('click', function () { show(index - 1); play(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(index + 1);
        if (e.key === 'ArrowLeft') show(index - 1);
      });
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      clearInterval(timer);
    }
  });
})();

(function () {
  const U = SG.UI;

  function fill(el, items) {
    if (!el) return;
    if (!items.length) {
      el.innerHTML = '<p class="empty-state">Nothing here yet. Check back shortly.</p>';
      return;
    }
    el.innerHTML = items.map(U.card).join('');
  }

  function loadGrid(el, query) {
    if (!el) return;
    el.innerHTML = U.skeletonGrid(4);
    SG.api.get('/products?' + query)
      .then(function (data) { fill(el, data.products || []); })
      .catch(function () {
        el.innerHTML = '<p class="empty-state">We could not load these pieces. Please refresh.</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const newGrid = document.getElementById('newGrid');
    loadGrid(newGrid, 'feature=new&limit=8&sort=new');

    document.querySelectorAll('[data-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('[data-tab]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        const cat = btn.getAttribute('data-tab');
        const q = 'feature=new&limit=8&sort=new' + (cat && cat !== 'all' ? '&category=' + cat : '');
        loadGrid(newGrid, q);
      });
    });

    const bestGrid = document.getElementById('bestGrid');
    loadGrid(bestGrid, 'feature=best&limit=8&sort=popular');

    const rail = document.getElementById('bestRail');
    const left = document.getElementById('railPrev');
    const right = document.getElementById('railNext');
    if (rail && left && right) {
      left.addEventListener('click', function () { rail.scrollBy({ left: -420, behavior: 'smooth' }); });
      right.addEventListener('click', function () { rail.scrollBy({ left: 420, behavior: 'smooth' }); });
    }

    SG.api.get('/products?limit=1').then(function (data) {
      const facets = (data.facets && data.facets.categories) || [];
      facets.forEach(function (f) {
        const label = document.querySelector('[data-count="' + f.slug + '"]');
        if (label) label.textContent = f.count + ' pieces';
      });
    }).catch(function () {});
  });
})();

(function () {
  const U = SG.UI;

  document.addEventListener('DOMContentLoaded', function () {
    const faqHeads = document.querySelectorAll('.accordion__head');
    faqHeads.forEach(function (head) {
      head.addEventListener('click', function () {
        const item = head.closest('.accordion__item');
        const open = item.classList.contains('is-open');
        document.querySelectorAll('.accordion__item').forEach(function (i) { i.classList.remove('is-open'); });
        if (!open) item.classList.add('is-open');
      });
    });

    const quotes = Array.from(document.querySelectorAll('.quote'));
    const qdots = Array.from(document.querySelectorAll('.quotes__dots button'));
    let qi = 0;
    function qshow(n) {
      qi = (n + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) { q.classList.toggle('is-active', i === qi); });
      qdots.forEach(function (d, i) { d.classList.toggle('is-active', i === qi); });
    }
    if (quotes.length) {
      qshow(0);
      qdots.forEach(function (d, i) { d.addEventListener('click', function () { qshow(i); }); });
      setInterval(function () { qshow(qi + 1); }, 7000);
    }

    const lookGrid = document.getElementById('lookGrid');
    if (lookGrid) {
      const box = document.createElement('div');
      box.className = 'lightbox';
      box.innerHTML = '<button class="lightbox__close" aria-label="Close">' + U.icon('x', 22) + '</button><img alt="Lookbook image">';
      document.body.appendChild(box);
      const img = box.querySelector('img');
      lookGrid.addEventListener('click', function (e) {
        const look = e.target.closest('.look');
        if (!look) return;
        const source = look.querySelector('img');
        if (!source) return;
        img.src = source.src;
        img.alt = source.alt;
        box.classList.add('is-open');
      });
      box.addEventListener('click', function () { box.classList.remove('is-open'); });
    }

    const metrics = document.querySelectorAll('[data-count-to]');
    if (metrics.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.getAttribute('data-count-to')) || 0;
          const suffix = el.getAttribute('data-suffix') || '';
          let start = 0;
          const step = Math.max(1, Math.round(target / 40));
          const tick = setInterval(function () {
            start += step;
            if (start >= target) { start = target; clearInterval(tick); }
            el.textContent = start.toLocaleString('en-NG') + suffix;
          }, 28);
          io.unobserve(el);
        });
      }, { threshold: 0.6 });
      metrics.forEach(function (m) { io.observe(m); });
    }

    const news = document.getElementById('newsForm');
    if (news) {
      news.addEventListener('submit', function (e) {
        e.preventDefault();
        const email = news.querySelector('input[name="email"]').value.trim();
        const btn = news.querySelector('button');
        if (!email) return;
        btn.disabled = true;
        SG.api.post('/newsletter', { email: email })
          .then(function () { U.toast('You are on the list. Watch your inbox.'); news.reset(); })
          .catch(function (err) { U.toast(err.message || 'Could not sign you up right now.', 'error'); })
          .then(function () { btn.disabled = false; });
      });
    }
  });
})();
