/* ============================================================
   Calamytryx — client-side partial includes
   Any element with [data-include="/path.html"] is replaced by the
   fetched markup. Shared header/footer + per-section body partials.
   Paths are site-absolute ("/...") so they work from any page depth.
   NOTE: requires being served over http(s) — file:// blocks fetch.
   ============================================================ */
(function () {
  'use strict';

  async function inject_all() {
    /* section order/visibility is driven by /assets/data/layout.json.
       a <main data-sections> element gets its body partials (re)built from it;
       the markup already in the shell stays as a fallback if the fetch fails. */
    await expand_sections();

    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
    await Promise.all(nodes.map(async function (node) {
      var url = node.getAttribute('data-include');
      try {
        var res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        node.outerHTML = await res.text();
      } catch (err) {
        console.error('[include] failed:', url, err);
        node.outerHTML = '<!-- include failed: ' + url + ' -->';
      }
    }));
    window.__includesDone = true;
    document.dispatchEvent(new CustomEvent('includes:done'));
    init_chrome();
  }

  /* build the <main data-sections> body from layout.json for this page.
     leaves the shell's fallback markup untouched if anything goes wrong. */
  async function expand_sections() {
    var host = document.querySelector('[data-sections]');
    if (!host) return;
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    try {
      var res = await fetch('/assets/data/layout.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      var layout = await res.json();
      var conf = layout && layout[page];
      if (!conf || !Array.isArray(conf.sections)) return;
      var on = conf.sections.filter(function (s) { return s.enabled !== false && s.include; });
      if (!on.length) return;
      host.innerHTML = on.map(function (s, i) {
        var div = '<div data-include="' + s.include + '"></div>';
        if (i === 0) return div;
        var flip = (i % 2 === 0) ? ' flip' : '';
        return '<hr class="divider' + flip + '">\n' + div;
      }).join('\n');
    } catch (err) {
      console.error('[layout] keeping fallback sections:', err);
    }
  }

  /* wire up nav + footer behaviour once the shared chrome is in the DOM */
  function init_chrome() {
    var toggle = document.querySelector('.nav_toggle');
    var links = document.getElementById('nav_links');
    if (toggle && links) {
      toggle.addEventListener('click', function () { links.classList.toggle('open'); });
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) links.classList.remove('open');
      });
    }

    /* highlight the link for the current page (set <body data-page="..."> ) */
    var page = document.body.getAttribute('data-page');
    if (page) {
      var active = document.querySelector('.nav_links a[data-nav="' + page + '"]');
      if (active) active.classList.add('active');
    }

    /* current year, if a [data-year] slot exists */
    var y = document.querySelector('[data-year]');
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject_all);
  } else {
    inject_all();
  }
})();
