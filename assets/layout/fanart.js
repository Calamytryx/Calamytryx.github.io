/* ============================================================
   Calamytryx — fanart gallery (used by the home #fanart section AND
   /pages/fanart.html — both have a #fanart_gallery element).

   ONE gallery UI for every source. The committed manifest (cfg.art[]) is the default
   render (the "good backup"); if cfg.apiKey is set we then refresh LIVE from the Drive
   API (true createdTime order) and re-render with the SAME look. No Google embed — if
   there's genuinely no data we show a styled empty state, never a different UI.
   Regenerate the manifest with: node scripts/fetch_fanart.mjs

   Credited gallery: each file is named by creator + optional number
   ("Alice.png", "Alice 2.png"); we parse that into a credit + piece number,
   group by creator, render a masonry grid + lightbox. Public images render
   via drive.google.com/thumbnail (no key needed at view time).
   ============================================================ */
(function () {
  'use strict';

  var ITEMS = [], SORTED = [], GRID = null, STATUS = null;

  function thumb(id, w) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 600); }

  /* naming convention: "<creator>[ number].<ext>"  ->  "Edel 2.jpg" = Edel, #2.
     a missing number is always treated as the first. */
  function parseName(name) {
    var base = String(name || '').replace(/\.[a-z0-9]+$/i, '').trim();
    var m = base.match(/^(.*?)[\s._-]*(\d+)\s*$/);
    if (m && m[1].trim()) return { creator: m[1].trim(), n: parseInt(m[2], 10) || 1, hasNum: true };
    return { creator: base || 'anon', n: 1, hasNum: false };
  }

  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function possSuffix(name) { return /s$/i.test(name) ? "'" : "'s"; }      // "Chris'" vs "Edel's"
  /* personality lives here: "Edel's 2nd fanart", "Calista Dela Cruz's fanart" */
  function captionText(it) { var head = it.creator + possSuffix(it.creator); return it.count > 1 ? (head + ' ' + ord(it.n) + ' fanart') : (head + ' fanart'); }
  function captionHTML(it) { var head = '<b>' + esc(it.creator) + '</b>' + possSuffix(it.creator); return it.count > 1 ? (head + ' ' + ord(it.n) + ' fanart') : (head + ' fanart'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function buildLightbox() {
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
      idx = (i + SORTED.length) % SORTED.length;     // always follows the current sort order
      var it = SORTED[idx];
      img.src = thumb(it.id, 1600);
      cap.innerHTML = '✦ ' + captionHTML(it);
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

  /* attach creator / piece-number / per-creator count to every file */
  function prep(art) {
    var groups = {};
    art.forEach(function (a) {
      var p = parseName(a.name), key = p.creator.toLowerCase();
      if (!groups[key]) groups[key] = { display: p.creator, count: 0 };
      if (!p.hasNum) groups[key].display = p.creator;     // a no-number file sets the canonical casing
      groups[key].count++;
    });
    return art.map(function (a) {
      var p = parseName(a.name), g = groups[p.creator.toLowerCase()];
      return { id: a.id, name: a.name, pub: a.pub || 0, creator: g.display, key: p.creator.toLowerCase(), n: p.n, count: g.count };
    });
  }

  /* Always grouped by creator. Creator groups are ordered by their newest *published* piece
     (frozen at first-seen, so edits don't reorder); pieces inside a creator go by number. */
  function sortItems(items) {
    var groups = {};
    items.forEach(function (it) {
      var g = groups[it.key] || (groups[it.key] = { display: it.creator, items: [], newest: 0 });
      g.items.push(it); if (it.pub > g.newest) g.newest = it.pub;
    });
    var keys = Object.keys(groups);
    keys.sort(function (a, b) { return (groups[b].newest - groups[a].newest) || (groups[a].display.toLowerCase() < groups[b].display.toLowerCase() ? -1 : 1); });
    var out = [];
    keys.forEach(function (k) {
      groups[k].items.sort(function (a, b) { return (a.n - b.n) || a.name.localeCompare(b.name, undefined, { numeric: true }); });
      groups[k].items.forEach(function (it) { out.push(it); });
    });
    return out;
  }

  function draw() {
    SORTED = sortItems(ITEMS);
    var lb = buildLightbox();
    GRID.removeAttribute('aria-busy');
    var html = '', cur = null;
    SORTED.forEach(function (it, i) {
      if (it.key !== cur) {                                // new creator -> a full-width section header (always grouped)
        cur = it.key;
        html += '<h3 class="fa_ghead">' + esc(it.creator)
          + (it.count > 1 ? '<span class="fa_gcount">' + it.count + ' pieces</span>' : '') + '</h3>';
      }
      var rot = ((i * 41) % 5) - 2;                        // deterministic -2..2° scrapbook tilt
      var chip = it.count > 1 ? ('<span class="fa_num">' + it.n + '</span>') : '';
      var capInner = it.count > 1 ? (ord(it.n) + ' fanart') : '';
      html += '<figure class="fa_tile" data-i="' + i + '" style="--rot:' + rot + 'deg">' + chip
        + '<img loading="lazy" src="' + thumb(it.id, 600) + '" alt="' + esc(captionText(it)) + '">'
        + (capInner ? ('<figcaption class="fa_credit">' + capInner + '</figcaption>') : '') + '</figure>';
    });
    GRID.innerHTML = html;
    Array.prototype.forEach.call(GRID.querySelectorAll('.fa_tile'), function (t) {
      t.addEventListener('click', function () { lb._open(+t.dataset.i); });
    });
    if (STATUS) {
      var artists = {}; ITEMS.forEach(function (it) { artists[it.key] = 1; }); var na = Object.keys(artists).length;
      STATUS.innerHTML = '<b>' + ITEMS.length + '</b> piece' + (ITEMS.length === 1 ? '' : 's')
        + ' from <b>' + na + '</b> artist' + (na === 1 ? '' : 's') + ' · newest first · tap one to enlarge ✦';
    }
  }

  function render(grid, status, art) {
    GRID = grid; STATUS = status; ITEMS = prep(art); draw();
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
        var manifest = (Array.isArray(cfg.art) ? cfg.art : []).filter(function (a) { return a && a.id && a.name; });
        /* PRIMARY = live Drive (true publish order); manifest is only the fallback. */
        if (cfg.apiKey && folderId) {
          if (status) status.innerHTML = 'loading live from Drive…';
          driveList(folderId, cfg.apiKey)
            .then(function (art) { done(grid, status, (art && art.length) ? art : manifest, folderId); })
            .catch(function () { done(grid, status, manifest, folderId); });   // Drive failed -> backup
          return;
        }
        done(grid, status, manifest, folderId);
      })
      .catch(function () { done(grid, status, [], '1f8kTp0c46v4yJGJ3DantXlsPQZusCo2N'); });
  }

  function done(grid, status, art, folderId) {
    if (art && art.length) { render(grid, status, art); return; }
    /* no data yet — same gallery look, just an empty state (never the Google embed) */
    grid.removeAttribute('aria-busy');
    grid.innerHTML = '<p class="fa_empty">no fan art loaded yet — check back soon ✦</p>';
    if (status) status.innerHTML = '';
  }

  /* LIVE list of a public folder via the Drive API (needs an API key in fanart.json).
     This is the only browser-callable path — the embed view is CORS-blocked. We pull
     createdTime so order is by true publish date (edits don't change it). Paginated. */
  function driveList(folderId, key) {
    var q = "'" + folderId + "' in parents and mimeType contains 'image/' and trashed = false";
    var base = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q)
      + '&fields=' + encodeURIComponent('nextPageToken,files(id,name,createdTime)')
      + '&pageSize=1000&key=' + encodeURIComponent(key);
    var all = [];
    function page(tok) {
      return fetch(base + (tok ? '&pageToken=' + tok : '')).then(function (r) { return r.json(); }).then(function (j) {
        if (j.error) throw j.error;
        (j.files || []).forEach(function (f) { all.push({ id: f.id, name: f.name, pub: Date.parse(f.createdTime) || 0 }); });
        return j.nextPageToken ? page(j.nextPageToken) : all;
      });
    }
    return page('');
  }


  if (window.__includesDone) init();
  else document.addEventListener('includes:done', init);
})();
