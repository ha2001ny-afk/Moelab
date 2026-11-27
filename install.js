/* install.js — شريط «ثبّت المنصة كتطبيق» (أندرويد وكروم/إيدج على اللابتوب).
   يظهر مرة وحدة عند فتح الرابط، وبالضغط على «تثبيت» تنزل المنصة كتطبيق على الشاشة.
   ما يظهر إذا المنصة مثبتة ومفتوحة كتطبيق. */
(function () {
  try {
    var ua = navigator.userAgent || '';
    var standalone = (window.matchMedia && (matchMedia('(display-mode: standalone)').matches ||
      matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: minimal-ui)').matches)) ||
      navigator.standalone || /MoeLabApp/.test(ua);
    if (standalone || location.protocol === 'file:') return;
    var deferred = null, bar = null;
    function build() {
      if (bar) return bar;
      bar = document.createElement('div');
      bar.setAttribute('dir', 'rtl');
      bar.style.cssText = 'display:none;position:fixed;z-index:99999;left:14px;bottom:14px;max-width:calc(100vw - 28px);' +
        'align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;background:#0b1526;color:#fff;' +
        'border:1px solid #FF9A00;box-shadow:0 8px 26px rgba(0,0,0,.35);font:600 14px Tahoma,Arial,sans-serif';
      var m = document.createElement('span');
      m.textContent = '📲 ثبّت منصة Moelab كتطبيق على جهازك';
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = 'تثبيت';
      b.style.cssText = 'border:0;border-radius:10px;padding:8px 16px;background:#FF9A00;color:#fff;font:inherit;font-weight:800;cursor:pointer;min-height:38px';
      var x = document.createElement('button');
      x.type = 'button'; x.setAttribute('aria-label', 'إغلاق'); x.textContent = '×';
      x.style.cssText = 'border:0;background:transparent;color:#fff;font-size:20px;cursor:pointer;padding:0 4px';
      x.onclick = function () { bar.style.display = 'none'; };
      b.onclick = function () {
        if (!deferred) return;
        bar.style.display = 'none';
        var d = deferred; deferred = null;
        try { d.prompt(); } catch (e) {}
      };
      bar.appendChild(m); bar.appendChild(b); bar.appendChild(x);
      document.body.appendChild(bar);
      return bar;
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferred = e;
      if (document.body) build().style.display = 'flex';
      else document.addEventListener('DOMContentLoaded', function () { build().style.display = 'flex'; });
    });
    window.addEventListener('appinstalled', function () { if (bar) bar.style.display = 'none'; });
  } catch (e) {}
})();
