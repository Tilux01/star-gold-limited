(function () {
  const U = SG.UI;
  document.addEventListener('DOMContentLoaded', () => {
    SG.UI.mount();
    const f = document.getElementById('contactForm');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = f.querySelector('button[type=submit]');
      const data = Object.fromEntries(new FormData(f).entries());
      btn.disabled = true; btn.textContent = 'Sending...';
      try {
        await SG.api.post('/contact', data);
        U.toast('Message sent. We will reply shortly.');
        f.reset();
        document.getElementById('contactNote').textContent = 'Your message is with the concierge team.';
      } catch (err) {
        U.toast(err.message, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Send message';
      }
    });
  });
})();
