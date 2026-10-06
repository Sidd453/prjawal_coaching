// Light / dark theme. Classic script (loaded in <head>) so the theme is applied before first paint - no flash.
(function () {
  var KEY = 'pucc-admin-theme', root = document.documentElement, mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');
  var saved = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  var initial = function () { var s = saved(); return s === 'dark' || s === 'light' ? s : (mq && mq.matches ? 'dark' : 'light'); };

  var apply = function (t) {
    root.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0C241A' : '#054228');
    var dark = t === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(dark));
      b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      b.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
      var l = b.querySelector('.tt-label'), txt = dark ? 'Dark mode' : 'Light mode'; if (l && l.textContent !== txt) l.textContent = txt;
    });
  };
  var set = function (t, persist) {
    apply(t);
    if (persist) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  };

  apply(initial());

  // one delegated listener: any <button data-theme-toggle> works, even if rendered later
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (b) set(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });
  // buttons are rendered after load (login -> shell), so re-sync labels when DOM changes
  new MutationObserver(function () { apply(root.getAttribute('data-theme')); }).observe(document.documentElement, { childList: true, subtree: true });
  // follow the OS setting until the user picks one manually
  if (mq && mq.addEventListener) mq.addEventListener('change', function (e) { if (!saved()) set(e.matches ? 'dark' : 'light', false); });
  // receipts / printouts are always light
  var prev; window.addEventListener('beforeprint', function () { prev = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'light'); });
  window.addEventListener('afterprint', function () { if (prev) root.setAttribute('data-theme', prev); });
})();
