/* ============================================================
   Calamytryx — full-screen panel chrome
   Only runs on pages with <html data-snap>. Builds the side section
   nav (dots + labels), the NN counter, and the scroll-down hint, then
   uses IntersectionObserver to track the active panel, fire entrance
   animations, and drive click-to-scroll. Labels come from layout.json
   (same order as the rendered sections); falls back to the section id.
   ============================================================ */
(function () {
  'use strict';
  if (!document.documentElement.hasAttribute('data-snap')) return;

  var pad = function (n) { return String(n).padStart(2, '0'); };
  function esc(s) {
    return (s == null ? '' : String(s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function init() {
    var main = document.querySelector('main[data-sections]') || document.querySelector('main');
    if (!main) return;
    var panels = Array.prototype.slice.call(main.querySelectorAll(':scope > .section'));
    if (!panels.length) return;

    var page = document.body.getAttribute('data-page');
    fetch('/assets/data/layout.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (layout) {
        var secs = (layout && layout[page] && layout[page].sections || [])
          .filter(function (s) { return s.enabled !== false; });
        build(panels, secs);
      })
      .catch(function () { build(panels, []); });
  }

  function build(panels, secs) {
    var total = panels.length;

    var nav = document.createElement('nav');
    nav.className = 'panel_nav';
    nav.setAttribute('aria-label', 'Sections');
    panels.forEach(function (p, i) {
      var label = (secs[i] && secs[i].label) || p.id || pad(i + 1);
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.innerHTML = '<span class="lbl">' + esc(label) + '</span><span class="dot"></span>';
      b.addEventListener('click', function () {
        panels[i].scrollIntoView({ behavior: 'smooth' });
      });
      nav.appendChild(b);
    });
    document.body.appendChild(nav);
    var buttons = nav.querySelectorAll('button');

    var counter = document.createElement('div');
    counter.className = 'panel_counter';
    counter.innerHTML = '<b>01</b> / ' + pad(total);
    document.body.appendChild(counter);

    var hint = document.createElement('button');
    hint.className = 'scroll_hint';
    hint.type = 'button';
    hint.setAttribute('aria-label', 'Next section');
    hint.textContent = '▼';
    hint.addEventListener('click', function () {
      panels[Math.min(total - 1, activeIndex() + 1)].scrollIntoView({ behavior: 'smooth' });
    });
    document.body.appendChild(hint);

    function activeIndex() {
      for (var i = 0; i < buttons.length; i++) if (buttons[i].classList.contains('active')) return i;
      return 0;
    }
    function setActive(i) {
      buttons.forEach(function (b, j) { b.classList.toggle('active', j === i); });
      counter.innerHTML = '<b>' + pad(i + 1) + '</b> / ' + pad(total);
      hint.style.display = (i >= total - 1) ? 'none' : '';
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in_view');
          var idx = panels.indexOf(en.target);
          if (idx >= 0) setActive(idx);
        }
      });
    }, { threshold: 0.5 });
    panels.forEach(function (p) { io.observe(p); });

    panels[0].classList.add('in_view');
    setActive(0);
  }

  if (window.__includesDone) init();
  else document.addEventListener('includes:done', init);
})();
