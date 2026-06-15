/* ============================================================
   Calamytryx — fanart gallery (used by the home #fanart section AND
   /pages/fanart.html — both have a #fanart_gallery element).

   Data source, in priority order (config = /assets/data/fanart.json):
     1. cfg.apiKey set  -> live Drive API list -> credited masonry gallery
     2. cfg.art[] set   -> committed manifest  -> credited masonry gallery
                           (generate with: DRIVE_API_KEY=… node scripts/fetch_fanart.mjs)
     3. otherwise       -> embed the public Drive folder live (zero setup;
                           the folder just has to be "anyone with link → viewer")

   Credited gallery: each file is named by creator + optional number
   ("Alice.png", "Alice 2.png"); we parse that into a credit + piece number,
   group by creator, render a masonry grid + lightbox. Public images render
   via drive.google.com/thumbnail (no key needed at view time).
   ============================================================ */
(function () {
  'use strict';

  function thumb(id, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 600); }

  /* "Alice 2.png" -> {creator:'Alice', n:2}; "Bob.jpg" -> {creator:'Bob', n:1} */
  function parseName(name) {
    var base = String(name || '').replace(/\.[a-z0-9]+$/i, '').trim();
    var m = base.match(/^(.*?)[\s._-]*(\d+)\s*$/);
    if (m && m[1].trim()) return { creator: m[1].trim(), n: parseInt(m[2], 10) || 1 };
    return { creator: base || 'anon', n: 1 };
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildLightbox(items) {
    var lb = document.getElementById('fa_lb');
    if (lb) return lb;
    lb = document.createElement('div');
    lb.id = 'fa_lb';
    lb.innerHTML = '<button class="fa_x" type="button" aria-label="close">✕</button>'
      + '<button class="fa_nav p" type="button" aria-label="previous">◀</button>'
      + '<img alt=""><button class="fa_nav n" type="button" aria-label="next">▶</button>'
      + '<div class="fa_cap"></div>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), cap = lb.querySelector('.fa_cap'), idx = 0;
    function show(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = thumb(it.id, 1600);
      cap.innerHTML = 'by <b>' + esc(it.creator) + '</b>' + (it.count > 1 ? ' · #' + it.n + ' of ' + it.count : '');
    }
    lb._open = function (i) { show(i); lb.classList.add('on'); };
    function close() { lb.classList.remove('on'); img.src = ''; }
    lb.querySelector('.fa_x').onclick = close;
    lb.querySelector('.fa_nav.p').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('.fa_nav.n').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
    });
    return lb;
  }

  function render(grid, status, art) {
    /* parse + count per creator */
    var counts = {};
    var items = art.map(function (a) {
      var p = parseName(a.name);
      counts[p.creator] = (counts[p.creator] || 0) + 1;
      return { id: a.id, name: a.name, creator: p.creator, n: p.n };
    });
    items.forEach(function (it) { it.count = counts[it.creator]; });
    /* group by creator (creators alphabetical, pieces by number) */
    items.sort(function (a, b) {
      return a.creator.toLowerCase() < b.creator.toLowerCase() ? -1
        : a.creator.toLowerCase() > b.creator.toLowerCase() ? 1 : (a.n - b.n);
    });

    var lb = buildLightbox(items);
    grid.removeAttribute('aria-busy');
    grid.innerHTML = items.map(function (it, i) {
      var sub = it.count > 1 ? ('<span class="n">#' + it.n + '/' + it.count + '</span>') : '';
      return '<figure class="fa_tile" data-i="' + i + '">'
        + '<img loading="lazy" src="' + thumb(it.id, 600) + '" alt="fan art by ' + esc(it.creator) + '">'
        + '<figcaption class="fa_credit"><b>' + esc(it.creator) + '</b>' + sub + '</figcaption></figure>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('.fa_tile'), function (t) {
      t.addEventListener('click', function () { lb._open(+t.dataset.i); });
    });

    var artists = Object.keys(counts).length;
    if (status) status.innerHTML = '<b>' + items.length + '</b> piece' + (items.length === 1 ? '' : 's') + ' from <b>' + artists + '</b> artist' + (artists === 1 ? '' : 's') + ' · click to enlarge';
  }

  function init() {
    var grid = document.getElementById('fanart_gallery');
    if (!grid) return;
    var status = document.getElementById('fanart_status');
    fetch('/assets/data/fanart.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        cfg = cfg || {};
        var folderId = cfg.folderId || '';
        /* 1) live Drive API (if an API key is configured) -> credited gallery */
        if (cfg.apiKey && folderId) {
          driveList(folderId, cfg.apiKey)
            .then(function (art) { done(grid, status, art, folderId); })
            .catch(function () { done(grid, status, [], folderId); });
          return;
        }
        /* 2) committed manifest art[] -> credited gallery */
        var art = (Array.isArray(cfg.art) ? cfg.art : []).filter(function (a) { return a && a.id && a.name; });
        done(grid, status, art, folderId);
      })
      .catch(function () { done(grid, status, [], '1f8kTp0c46v4yJGJ3DantXlsPQZusCo2N'); });
  }

  function done(grid, status, art, folderId) {
    if (art && art.length) { render(grid, status, art); }
    else if (folderId) {
      /* 3) no manifest/key -> embed the public Drive folder so it still shows live */
      embedDrive(grid, folderId);
      if (status) status.innerHTML = 'live from the <b>#CalArts</b> Drive folder';
    } else if (status) { status.innerHTML = 'gallery coming soon'; }
  }

  /* live list a public folder via the Drive API (needs an API key in fanart.json) */
  function driveList(folderId, key) {
    var q = "'" + folderId + "' in parents and mimeType contains 'image/' and trashed = false";
    var url = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q)
      + '&fields=' + encodeURIComponent('files(id,name)') + '&orderBy=name_natural&pageSize=1000&key=' + encodeURIComponent(key);
    return fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) throw j.error;
      return (j.files || []).map(function (f) { return { id: f.id, name: f.name }; });
    });
  }

  /* zero-setup fallback: Google's own grid view of the public folder */
  function embedDrive(grid, folderId) {
    grid.removeAttribute('aria-busy');
    grid.classList.add('fa_embedwrap');
    grid.innerHTML = '<iframe class="fa_embed" src="https://drive.google.com/embeddedfolderview?id='
      + encodeURIComponent(folderId) + '#grid" loading="lazy" title="Calamyty fan art (Google Drive)"></iframe>';
  }

  if (window.__includesDone) init();
  else document.addEventListener('includes:done', init);
})();
